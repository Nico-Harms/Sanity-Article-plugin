import { createClient, SanityClient } from '@sanity/client';
import type { SchemaField, SchemaType } from '@sanity-notion-llm/shared';

interface TraverseContext {
  path: string;
  titleParts: string[];
  parentPath?: string;
  moduleType?: string;
  isArrayItem?: boolean;
}

export class SchemaService {
  private client: SanityClient;

  constructor(
    projectId: string,
    token: string,
    dataset: string = 'production'
  ) {
    this.client = createClient({
      projectId,
      dataset,
      apiVersion: '2023-03-01',
      token,
      useCdn: false,
    });
  }

  async getSchemaTypes(): Promise<SchemaType[]> {
    try {
      const documents = await this.client.fetch(
        `*[!(_id in path("_.**")) && !(_id in path("drafts.**"))] {
          _type,
          ...
        }`
      );

      if (!documents || documents.length === 0) {
        return [];
      }

      return this.inferSchemaFromDocuments(documents);
    } catch (error) {
      console.error('[schema-service] Failed to fetch schemas:', error);
      return [];
    }
  }

  async getSchemaFields(typeName: string): Promise<SchemaField[]> {
    try {
      const schemaTypes = await this.getSchemaTypes();
      const schemaType = schemaTypes.find((type) => type.name === typeName);
      if (schemaType) {
        return schemaType.fields;
      }

      const documents = await this.client.fetch(
        `*[_type == "${typeName}" && !(_id in path("drafts.**"))] [0...5] {
          ...
        }`
      );

      if (documents && documents.length > 0) {
        return this.inferFieldsFromMultipleDocuments(documents);
      }

      return [];
    } catch (error) {
      console.error(
        `[schema-service] Failed to fetch fields for ${typeName}:`,
        error
      );
      return [];
    }
  }

  private inferSchemaFromDocuments(documents: any[]): SchemaType[] {
    const typeMap = new Map<string, SchemaField[]>();

    documents.forEach((doc) => {
      if (!doc._type) return;
      const existing = typeMap.get(doc._type) ?? [];
      const inferred = this.inferFieldsFromDocument(doc);
      typeMap.set(doc._type, this.mergeFields(existing, inferred));
    });

    return Array.from(typeMap.entries()).map(([typeName, fields]) => ({
      name: typeName,
      title: this.formatSegmentTitle(typeName),
      fields: [...fields].sort((a, b) => a.path.localeCompare(b.path)),
    }));
  }

  private inferFieldsFromMultipleDocuments(documents: any[]): SchemaField[] {
    let merged: SchemaField[] = [];
    documents.forEach((doc) => {
      merged = this.mergeFields(merged, this.inferFieldsFromDocument(doc));
    });
    return merged;
  }

  private mergeFields(
    existing: SchemaField[],
    incoming: SchemaField[]
  ): SchemaField[] {
    const map = new Map<string, SchemaField>();
    existing.forEach((field) => map.set(field.name, field));
    incoming.forEach((field) => {
      if (!map.has(field.name)) {
        map.set(field.name, field);
      }
    });
    return Array.from(map.values());
  }

  private inferFieldsFromDocument(doc: any): SchemaField[] {
    const fieldMap = new Map<string, SchemaField>();

    Object.keys(doc).forEach((key) => {
      if (key.startsWith('_')) return;
      this.traverseValue(
        doc[key],
        {
          path: key,
          titleParts: [this.formatSegmentTitle(key)],
          parentPath: undefined,
          moduleType: undefined,
          isArrayItem: false,
        },
        fieldMap
      );
    });

    return Array.from(fieldMap.values());
  }

  private traverseValue(
    value: any,
    context: TraverseContext,
    fieldMap: Map<string, SchemaField>
  ) {
    const { path, titleParts, parentPath, moduleType, isArrayItem } = context;

    const isBlockArray =
      Array.isArray(value) && this.isBlockContentArray(value);
    const type = isBlockArray ? 'blockContent' : this.inferValueType(value);

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
      this.handleArrayValue(value, context, fieldMap);
      return;
    }

    if (value && typeof value === 'object') {
      Object.keys(value).forEach((childKey) => {
        if (childKey.startsWith('_')) return;
        const childValue = value[childKey];
        this.traverseValue(
          childValue,
          {
            path: `${path}.${childKey}`,
            titleParts: [...titleParts, this.formatSegmentTitle(childKey)],
            parentPath: path,
            moduleType,
            isArrayItem,
          },
          fieldMap
        );
      });
    }
  }

  private handleArrayValue(
    arrayValue: any[],
    context: TraverseContext,
    fieldMap: Map<string, SchemaField>
  ) {
    const { path, titleParts } = context;

    const objectItems = arrayValue.filter(
      (item) => item && typeof item === 'object' && !Array.isArray(item)
    );

    if (objectItems.length === 0) {
      return;
    }

    if (this.isRichTextBlockArray(objectItems)) {
      return;
    }

    const groupedByModule = new Map<string | undefined, any[]>();

    objectItems.forEach((item) => {
      const moduleType =
        typeof item._type === 'string' ? item._type : undefined;
      const key = moduleType || '__default__';
      if (!groupedByModule.has(key)) {
        groupedByModule.set(key, []);
      }
      groupedByModule.get(key)!.push(item);
    });

    const ignoredModuleTypes = new Set(['block', 'span', 'markDefs']);
    const ignoredBlockKeys = new Set(['children', 'markDefs']);

    groupedByModule.forEach((items, moduleKey) => {
      const moduleType = moduleKey === '__default__' ? undefined : moduleKey;

      if (moduleType && ignoredModuleTypes.has(moduleType)) {
        return;
      }

      const childKeys = new Set<string>();

      items.forEach((item) => {
        Object.keys(item).forEach((childKey) => {
          if (childKey.startsWith('_')) return;
          if (moduleType === 'block' && ignoredBlockKeys.has(childKey)) return;
          childKeys.add(childKey);
        });
      });

      childKeys.forEach((childKey) => {
        const sampleItem = items.find((item) => item[childKey] !== undefined);
        const sampleValue = sampleItem ? sampleItem[childKey] : null;

        const arrayPath = `${path}[]`;
        const moduleSegment = moduleType ? `.${moduleType}` : '';
        const childPath = `${arrayPath}${moduleSegment}.${childKey}`;

        const childTitleParts = [
          ...titleParts,
          ...(moduleType ? [this.formatSegmentTitle(moduleType)] : []),
          this.formatSegmentTitle(childKey),
        ];

        this.traverseValue(
          sampleValue,
          {
            path: childPath,
            titleParts: childTitleParts,
            parentPath: path,
            moduleType,
            isArrayItem: true,
          },
          fieldMap
        );
      });
    });
  }

  private isRichTextBlockArray(items: any[]): boolean {
    if (items.length === 0) return false;
    return items.every((item) => item && item._type === 'block');
  }

  private isBlockContentArray(arrayValue: any[]): boolean {
    if (!Array.isArray(arrayValue) || arrayValue.length === 0) {
      return false;
    }

    return arrayValue.every(
      (item) => item && typeof item === 'object' && item._type === 'block'
    );
  }

  private inferValueType(value: any): string {
    if (Array.isArray(value)) {
      return 'array';
    }

    if (value && typeof value === 'object') {
      if (value._type === 'slug') {
        return 'slug';
      }
      if (value._type === 'image') {
        return 'image';
      }
      if (typeof value._type === 'string') {
        return value._type;
      }
      return 'object';
    }

    if (typeof value === 'number') {
      return 'number';
    }

    if (typeof value === 'boolean') {
      return 'boolean';
    }

    return 'string';
  }

  private formatSegmentTitle(value: string): string {
    return value
      .replace(/\[]/g, '')
      .replace(/([A-Z])/g, ' $1')
      .replace(/[-_]/g, ' ')
      .replace(/^./, (match) => match.toUpperCase())
      .trim();
  }

  private convertStringToBlockContent(text: string): any[] {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const cleanText = text.trim();
    if (!cleanText) {
      return [];
    }

    const paragraphs = cleanText.split(/\n\s*\n/).filter((p) => p.trim());

    if (paragraphs.length === 0) {
      paragraphs.push(cleanText);
    }

    return paragraphs
      .map((paragraph) => {
        const cleanParagraph = paragraph.trim();
        if (!cleanParagraph) return null;

        return {
          _type: 'block',
          _key: this.generateKey(),
          style: 'normal',
          children: [
            {
              _type: 'span',
              _key: this.generateKey(),
              text: cleanParagraph,
              marks: [],
            },
          ],
        };
      })
      .filter(Boolean);
  }

  private generateKey(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  async prepareContentForSchema(
    content: Record<string, any>,
    schemaType: string
  ): Promise<Record<string, any>> {
    const fields = await this.getSchemaFields(schemaType);
    const rawValues = new Map<string, any>(Object.entries(content));
    const preparedContent: Record<string, any> = {};

    const topLevelFields = fields.filter((field) => !field.isArrayItem);

    topLevelFields.forEach((field) => {
      if (field.type === 'array') {
        const directValue = this.popRawValue(rawValues, field.path);
        const arrayValue = this.buildArrayFromRawValues(
          rawValues,
          field,
          fields,
          directValue
        );
        if (Array.isArray(arrayValue) && arrayValue.length > 0) {
          preparedContent[field.path] = arrayValue;
        }
        return;
      }

      const rawValue = this.popRawValue(rawValues, field.path);
      if (rawValue !== undefined) {
        preparedContent[field.path] = this.convertContentForField(
          rawValue,
          field.type
        );
      }
    });

    return preparedContent;
  }

  private popRawValue(rawValues: Map<string, any>, key: string): any {
    if (!rawValues.has(key)) return undefined;
    const value = rawValues.get(key);
    rawValues.delete(key);
    return value;
  }

  private extractArrayFieldValue(
    rawValues: Map<string, any>,
    path: string
  ): { value: any; index?: number } | null {
    if (rawValues.has(path)) {
      const value = rawValues.get(path);
      rawValues.delete(path);
      return { value };
    }

    const regex = this.createPathRegex(path);
    for (const key of Array.from(rawValues.keys())) {
      const match = key.match(regex);
      if (match) {
        const value = rawValues.get(key);
        rawValues.delete(key);
        const index = match[1] ? parseInt(match[1], 10) : undefined;
        return { value, index: Number.isNaN(index) ? undefined : index };
      }
    }

    return null;
  }

  private createPathRegex(path: string): RegExp {
    const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = '^' + escaped.replace(/\\\[\\\]/g, '\\[(\\d+)?\\]') + '$';
    return new RegExp(pattern);
  }

  private buildArrayFromRawValues(
    rawValues: Map<string, any>,
    arrayField: SchemaField,
    allFields: SchemaField[],
    directValue: any
  ): any[] | undefined {
    if (Array.isArray(directValue)) {
      return directValue.map((item) => this.ensureArrayItemHasKey(item));
    }

    const nestedFields = allFields.filter(
      (field) => field.parentPath === arrayField.path && field.isArrayItem
    );

    if (nestedFields.length === 0) {
      if (directValue === undefined) return undefined;
      const valueArray = Array.isArray(directValue)
        ? directValue
        : [directValue];
      return valueArray.map((item) => this.ensureArrayItemHasKey(item));
    }

    const items = new Map<number, Record<string, any>>();
    const moduleDefaultIndex = new Map<string | undefined, number>();

    nestedFields.forEach((nestedField) => {
      const resolved = this.extractArrayFieldValue(rawValues, nestedField.path);
      if (!resolved) return;

      const { value, index } = resolved;
      const moduleKey = nestedField.moduleType || '__default__';

      let targetIndex: number;
      if (index !== undefined) {
        targetIndex = index;
      } else if (moduleDefaultIndex.has(moduleKey)) {
        targetIndex = moduleDefaultIndex.get(moduleKey)!;
      } else {
        targetIndex = items.size;
        moduleDefaultIndex.set(moduleKey, targetIndex);
      }

      const item = items.get(targetIndex) ?? {};

      if (
        nestedField.moduleType &&
        (typeof item._type !== 'string' || item._type.length === 0)
      ) {
        item._type = nestedField.moduleType;
      }

      const propertyName = this.getNestedFieldKey(nestedField.path);
      item[propertyName] = this.convertContentForField(value, nestedField.type);

      items.set(targetIndex, item);
    });

    if (items.size === 0) {
      return undefined;
    }

    return Array.from(items.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, item]) => this.ensureArrayItemHasKey(item));
  }

  private ensureArrayItemHasKey(item: any): any {
    if (!item || typeof item !== 'object') {
      return item;
    }
    if (typeof item._key !== 'string' || item._key.length === 0) {
      item._key = this.generateKey();
    }
    return item;
  }

  private getNestedFieldKey(path: string): string {
    const parts = path.split('.');
    return parts[parts.length - 1];
  }

  private convertContentForField(value: any, fieldType: string): any {
    if (value === undefined || value === null) {
      return value;
    }

    if (fieldType === 'blockContent') {
      if (Array.isArray(value)) {
        return value;
      }
      if (typeof value === 'string') {
        return this.convertStringToBlockContent(value);
      }
      return value;
    }

    if (fieldType === 'slug' && typeof value === 'string') {
      return {
        _type: 'slug',
        current: value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
      };
    }

    if (
      (fieldType === 'datetime' || fieldType === 'date') &&
      typeof value === 'string'
    ) {
      return value;
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }

    if (value && typeof value === 'object') {
      return value;
    }

    return value;
  }
}

export function createSchemaService(
  projectId: string,
  token: string,
  dataset = 'production'
): SchemaService {
  return new SchemaService(projectId, token, dataset);
}
