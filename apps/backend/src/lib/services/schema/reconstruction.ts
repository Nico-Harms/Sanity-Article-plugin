import type { SchemaField } from '@sanity-notion-llm/shared';

import { convertStringToBlockContent, ensureArrayItemHasKey } from './utils';

export function prepareContentForFields(
  content: Record<string, unknown>,
  fields: SchemaField[]
): Record<string, unknown> {
  const rawValues = new Map<string, unknown>(Object.entries(content));
  const preparedContent: Record<string, unknown> = {};

  const topLevelFields = fields.filter((field) => !field.isArrayItem);

  topLevelFields.forEach((field) => {
    if (field.type === 'array') {
      const directValue = popRawValue(rawValues, field.path);
      const arrayValue = buildArrayFromRawValues(
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

    const rawValue = popRawValue(rawValues, field.path);
    if (rawValue !== undefined) {
      preparedContent[field.path] = convertContentForField(
        rawValue,
        field.type
      );
    }
  });

  return preparedContent;
}

function popRawValue(rawValues: Map<string, unknown>, key: string): unknown {
  if (!rawValues.has(key)) return undefined;
  const value = rawValues.get(key);
  rawValues.delete(key);
  return value;
}

function extractArrayFieldValue(
  rawValues: Map<string, unknown>,
  path: string
): { value: unknown; index?: number } | null {
  if (rawValues.has(path)) {
    const value = rawValues.get(path);
    rawValues.delete(path);
    return { value };
  }

  const regex = createPathRegex(path);
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

function createPathRegex(path: string): RegExp {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = '^' + escaped.replace(/\\\[\\\]/g, '\\[(\\d+)?\\]') + '$';
  return new RegExp(pattern);
}

function buildArrayFromRawValues(
  rawValues: Map<string, unknown>,
  arrayField: SchemaField,
  allFields: SchemaField[],
  directValue: unknown
): unknown[] | undefined {
  if (Array.isArray(directValue)) {
    return directValue.map((item) => ensureArrayItemHasKey(item));
  }

  const nestedFields = allFields.filter(
    (field) => field.parentPath === arrayField.path && field.isArrayItem
  );

  if (nestedFields.length === 0) {
    if (directValue === undefined) return undefined;
    const valueArray = Array.isArray(directValue) ? directValue : [directValue];
    return valueArray.map((item) => ensureArrayItemHasKey(item));
  }

  const items = new Map<number, Record<string, unknown>>();
  const moduleDefaultIndex = new Map<string | undefined, number>();

  nestedFields.forEach((nestedField) => {
    const resolved = extractArrayFieldValue(rawValues, nestedField.path);
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
      (typeof item._type !== 'string' || (item._type as string).length === 0)
    ) {
      item._type = nestedField.moduleType;
    }

    const propertyName = getNestedFieldKey(nestedField.path);
    item[propertyName] = convertContentForField(value, nestedField.type);

    items.set(targetIndex, item);
  });

  if (items.size === 0) {
    return undefined;
  }

  return Array.from(items.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, item]) => ensureArrayItemHasKey(item));
}

function getNestedFieldKey(path: string): string {
  const parts = path.split('.');
  return parts[parts.length - 1];
}

function convertContentForField(value: unknown, fieldType: string): unknown {
  if (value === undefined || value === null) {
    return value;
  }

  if (fieldType === 'blockContent') {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      return convertStringToBlockContent(value);
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
