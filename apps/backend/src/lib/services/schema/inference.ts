import type { SchemaField, SchemaType } from '@sanity-notion-llm/shared';

import {
  TraverseContext,
  formatSegmentTitle,
  inferValueType,
  isBlockContentArray,
  isRichTextBlockArray,
  mergeFields,
} from './utils';

type SanityDocument = Record<string, unknown> & { _type?: unknown };

export function inferSchemaFromDocuments(
  documents: SanityDocument[]
): SchemaType[] {
  const typeMap = new Map<string, SchemaField[]>();

  documents.forEach((doc) => {
    const docType =
      typeof doc._type === 'string' && doc._type.trim().length > 0
        ? doc._type
        : null;
    if (!docType) return;
    const existing = typeMap.get(docType) ?? [];
    const inferred = inferFieldsFromDocument(doc);
    typeMap.set(docType, mergeFields(existing, inferred));
  });

  return Array.from(typeMap.entries()).map(([typeName, fields]) => ({
    name: typeName,
    title: formatSegmentTitle(typeName),
    fields: [...fields].sort((a, b) => a.path.localeCompare(b.path)),
  }));
}

export function inferFieldsFromMultipleDocuments(
  documents: SanityDocument[]
): SchemaField[] {
  let merged: SchemaField[] = [];
  documents.forEach((doc) => {
    merged = mergeFields(merged, inferFieldsFromDocument(doc));
  });
  return merged;
}

export function inferFieldsFromDocument(doc: SanityDocument): SchemaField[] {
  const fieldMap = new Map<string, SchemaField>();

  Object.keys(doc || {}).forEach((key) => {
    if (key.startsWith('_')) return;
    traverseValue(
      doc[key],
      {
        path: key,
        titleParts: [formatSegmentTitle(key)],
        parentPath: undefined,
        moduleType: undefined,
        isArrayItem: false,
      },
      fieldMap
    );
  });

  return Array.from(fieldMap.values());
}

function traverseValue(
  value: unknown,
  context: TraverseContext,
  fieldMap: Map<string, SchemaField>
) {
  const { path, titleParts, parentPath, moduleType, isArrayItem } = context;

  const isBlockArray = Array.isArray(value) && isBlockContentArray(value);
  const type = isBlockArray ? 'blockContent' : inferValueType(value);

  const field: SchemaField = {
    name: path,
    path,
    type,
    title: titleParts.join(' → '),
    parentPath,
    moduleType,
    isArrayItem,
    isVirtual: isArrayItem || path.includes('[]'),
  };

  if (!fieldMap.has(field.name)) {
    fieldMap.set(field.name, field);
  }

  if (isBlockArray) {
    return;
  }

  if (Array.isArray(value)) {
    handleArrayValue(value, context, fieldMap);
    return;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    Object.keys(record).forEach((childKey) => {
      if (childKey.startsWith('_')) return;
      const childValue = record[childKey];
      traverseValue(
        childValue,
        {
          path: `${path}.${childKey}`,
          titleParts: [...titleParts, formatSegmentTitle(childKey)],
          parentPath: path,
          moduleType,
          isArrayItem,
        },
        fieldMap
      );
    });
  }
}

function handleArrayValue(
  arrayValue: unknown[],
  context: TraverseContext,
  fieldMap: Map<string, SchemaField>
) {
  const { path, titleParts } = context;

  const objectItems = arrayValue.filter(
    (item): item is Record<string, unknown> =>
      item !== null && typeof item === 'object' && !Array.isArray(item)
  );

  if (objectItems.length === 0) {
    return;
  }

  if (isRichTextBlockArray(objectItems)) {
    return;
  }

  const groupedByModule = new Map<
    string | undefined,
    Record<string, unknown>[]
  >();

  objectItems.forEach((item) => {
    const record = item as Record<string, unknown>;
    const rawType = record['_type'];
    const detectedModuleType =
      typeof rawType === 'string' ? rawType : undefined;
    const key = detectedModuleType || '__default__';
    if (!groupedByModule.has(key)) {
      groupedByModule.set(key, []);
    }
    groupedByModule.get(key)!.push(record);
  });

  const ignoredModuleTypes = new Set(['block', 'span', 'markDefs']);
  const ignoredBlockKeys = new Set(['children', 'markDefs']);

  groupedByModule.forEach((items, moduleKey) => {
    const detectedModuleType =
      moduleKey === '__default__' ? undefined : moduleKey;

    if (detectedModuleType && ignoredModuleTypes.has(detectedModuleType)) {
      return;
    }

    const childKeys = new Set<string>();

    items.forEach((item) => {
      Object.keys(item).forEach((childKey) => {
        if (childKey.startsWith('_')) return;
        if (detectedModuleType === 'block' && ignoredBlockKeys.has(childKey))
          return;
        childKeys.add(childKey);
      });
    });

    childKeys.forEach((childKey) => {
      const sampleItem = items.find((item) => item[childKey] !== undefined);
      const sampleValue = sampleItem ? sampleItem[childKey] : null;

      const arrayPath = `${path}[]`;
      const moduleSegment = detectedModuleType ? `.${detectedModuleType}` : '';
      const childPath = `${arrayPath}${moduleSegment}.${childKey}`;

      const childTitleParts = [
        ...titleParts,
        ...(detectedModuleType ? [formatSegmentTitle(detectedModuleType)] : []),
        formatSegmentTitle(childKey),
      ];

      traverseValue(
        sampleValue,
        {
          path: childPath,
          titleParts: childTitleParts,
          parentPath: path,
          moduleType: detectedModuleType,
          isArrayItem: true,
        },
        fieldMap
      );
    });
  });
}
