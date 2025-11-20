import type { Schema, SchemaType as SanitySchemaType } from 'sanity';
import type { SchemaType, SchemaField } from 'sanity-hermes-shared';

type SchemaLike = SanitySchemaType & {
  fields?: Array<
    {
      name: string;
      title?: string;
      description?: string;
      type?: unknown;
      of?: unknown[];
    } & Record<string, unknown>
  >;
};

const hasFields = (value: unknown): value is SchemaLike =>
  Boolean(
    value &&
      typeof value === 'object' &&
      Array.isArray((value as SchemaLike).fields)
  );

const getTypeName = (fieldType: unknown): string => {
  if (!fieldType) return 'unknown';
  if (typeof fieldType === 'string') return fieldType;
  if (
    typeof fieldType === 'object' &&
    fieldType !== null &&
    'name' in fieldType &&
    typeof (fieldType as { name?: unknown }).name === 'string'
  ) {
    return (fieldType as { name: string }).name;
  }
  return 'unknown';
};

const isDocumentType = (
  type: SanitySchemaType | undefined
): type is SchemaLike =>
  Boolean(
    type &&
      (type.type?.name === 'document' ||
        (type as { jsonType?: string }).jsonType === 'document') &&
      hasFields(type)
  );

const isObjectType = (type: SanitySchemaType | undefined): type is SchemaLike =>
  Boolean(
    type &&
      (type.type?.name === 'object' ||
        (type as { jsonType?: string }).jsonType === 'object') &&
      hasFields(type)
  );

const addFieldIfMissing = (
  fieldsMap: Map<string, SchemaField>,
  field: SchemaField
) => {
  if (!fieldsMap.has(field.path)) {
    fieldsMap.set(field.path, field);
  }
};

const buildField = (
  path: string,
  typeName: string,
  title?: string,
  description?: string,
  parentPath?: string
): SchemaField => ({
  name: path,
  path,
  type: typeName,
  title: title || path.split('.').slice(-1)[0],
  description,
  parentPath,
});

const extractFieldsFromSchema = (
  schema: Schema,
  typeDef: SchemaLike,
  fieldsMap: Map<string, SchemaField>,
  pathPrefix = '',
  level = 0
) => {
  if (!typeDef.fields || level > 5) return;

  typeDef.fields.forEach((field) => {
    const currentPath = pathPrefix ? `${pathPrefix}.${field.name}` : field.name;
    const typeName = getTypeName(field.type);

    addFieldIfMissing(
      fieldsMap,
      buildField(
        currentPath,
        typeName,
        field.title,
        field.description,
        pathPrefix || undefined
      )
    );

    if (typeName === 'reference') {
      return;
    }

    const resolveSchema = (source: unknown, fallbackName?: string) => {
      if (hasFields(source)) {
        return source as SchemaLike;
      }
      if (fallbackName) {
        const resolved = schema.get(fallbackName);
        if (isObjectType(resolved)) {
          return resolved;
        }
      }
      return null;
    };

    if (typeName === 'array') {
      const arrayField = field as { of?: unknown[] };
      if (!Array.isArray(arrayField.of)) {
        return;
      }
      const arrayBasePath = `${currentPath}[]`;

      arrayField.of.forEach((item) => {
        const itemTypeName = getTypeName(item);
        const itemSchema = resolveSchema(item, itemTypeName);

        if (itemSchema?.fields) {
          const moduleSegment =
            itemTypeName && itemTypeName !== 'object' ? `.${itemTypeName}` : '';
          const itemPath = `${arrayBasePath}${moduleSegment}`;
          const existingPaths = new Set(fieldsMap.keys());

          extractFieldsFromSchema(
            schema,
            itemSchema,
            fieldsMap,
            itemPath,
            level + 1
          );

          Array.from(fieldsMap.entries()).forEach(([path, field]) => {
            if (existingPaths.has(path)) return;
            if (path.startsWith(itemPath)) {
              field.isArrayItem = true;
              field.moduleType =
                itemTypeName && itemTypeName !== 'object'
                  ? itemTypeName
                  : undefined;
            }
          });
        }
      });
    }

    if (typeName === 'object') {
      const nested = resolveSchema(field, typeName);
      if (nested) {
        extractFieldsFromSchema(
          schema,
          nested,
          fieldsMap,
          currentPath,
          level + 1
        );
      }
      return;
    }

    if (typeName === 'array') {
      return;
    }

    const resolved = resolveSchema(null, typeName);
    if (resolved) {
      extractFieldsFromSchema(
        schema,
        resolved,
        fieldsMap,
        currentPath,
        level + 1
      );
    }
  });
};

export function parseStudioSchema(schema: Schema): SchemaType[] {
  const typeMap = new Map<string, SchemaType>();

  schema.getTypeNames().forEach((typeName) => {
    const typeDef = schema.get(typeName);
    if (!isDocumentType(typeDef)) {
      return;
    }

    const fieldsMap = new Map<string, SchemaField>();
    extractFieldsFromSchema(schema, typeDef as SchemaLike, fieldsMap);

    typeMap.set(typeName, {
      name: typeName,
      title: typeDef.title || typeName,
      fields: Array.from(fieldsMap.values()),
    });
  });

  return Array.from(typeMap.values());
}
