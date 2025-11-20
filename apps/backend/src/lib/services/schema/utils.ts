import type { SchemaField } from '@sanity-notion-llm/shared';

export interface TraverseContext {
  path: string;
  titleParts: string[];
  parentPath?: string;
  moduleType?: string;
  isArrayItem?: boolean;
}

export function formatSegmentTitle(value: string): string {
  return value
    .replace(/\[]/g, '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (match) => match.toUpperCase())
    .trim();
}

export function inferValueType(value: unknown): string {
  if (Array.isArray(value)) {
    return 'array';
  }

  if (value && typeof value === 'object') {
    const typedValue = value as Record<string, unknown> & {
      _type?: string;
    };

    if (typedValue._type === 'slug') {
      return 'slug';
    }

    if (typedValue._type === 'image') {
      return 'image';
    }

    if (typeof typedValue._type === 'string') {
      return typedValue._type;
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

export function isBlockContentArray(value: unknown): value is Array<unknown> {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }

  return value.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      (item as Record<string, unknown>)._type === 'block'
  );
}

export function isRichTextBlockArray(items: unknown[]): boolean {
  if (items.length === 0) return false;
  return items.every(
    (item) => item && (item as Record<string, unknown>)._type === 'block'
  );
}

// Re-export block content converter from dedicated module
export { convertStringToBlockContent } from './blockContentConverter';

export function generateKey(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function ensureArrayItemHasKey<T>(item: T): T {
  if (!item || typeof item !== 'object') {
    return item;
  }

  let record = item as Record<string, unknown>;

  // Auto-fix: LLM sometimes wraps module objects like { "quoteModule": { ... } }
  // instead of { "_type": "quoteModule", ... }
  // This happens often with flexible content arrays
  const keys = Object.keys(record).filter((k) => k !== '_key');
  if (keys.length === 1) {
    const possibleType = keys[0];
    const content = record[possibleType];

    // If the content is an object and seems to be wrapped
    if (content && typeof content === 'object' && !Array.isArray(content)) {
      // Unwrap it and use the key as _type
      const unwrappedContent = content as Record<string, unknown>;

      // Only apply if the unwrapped content doesn't already have a conflicting _type
      // or if it matches
      if (!unwrappedContent._type || unwrappedContent._type === possibleType) {
        record = {
          ...unwrappedContent,
          _type: possibleType,
          // Preserve _key if it existed on the wrapper
          _key: typeof record._key === 'string' ? record._key : undefined,
        };
      }
    }
  }

  if (typeof record._key !== 'string' || record._key.length === 0) {
    record._key = generateKey();
  }

  return record as T;
}

export function mergeFields(
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
