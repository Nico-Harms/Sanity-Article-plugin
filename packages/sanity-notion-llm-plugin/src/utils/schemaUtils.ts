import { Schema, SchemaType as SanitySchemaType } from 'sanity';
import {
  LOGICAL_FIELDS,
  type LogicalField,
  type FieldMapping,
  type SchemaField,
  type SchemaType,
} from '@sanity-notion-llm/shared';

const SYSTEM_TYPES = [
  'document',
  'object',
  'array',
  'string',
  'number',
  'boolean',
  'date',
  'datetime',
  'url',
  'email',
  'slug',
  'text',
  'block',
  'image',
  'file',
  'reference',
  'crossDatasetReference',
  'span',
  'portableText',
];

const FIELD_VARIATIONS: Record<string, string[]> = {
  title: ['name', 'headline', 'heading', 'subject'],
  body: ['content', 'text', 'description', 'bodyText', 'mainContent'],
  slug: ['url', 'permalink', 'path'],
  excerpt: ['summary', 'description', 'intro', 'lead'],
  author: ['writer', 'creator', 'byline'],
  image: ['mainImage', 'coverImage', 'featuredImage', 'heroImage', 'thumbnail'],
  tags: ['categories', 'topics', 'labels', 'keywords'],
  citations: ['references', 'sources', 'links'],
};

const TYPE_COMPATIBILITY: Record<string, string[]> = {
  string: ['string', 'slug', 'url', 'email'],
  text: ['text', 'block', 'portableText', 'string'],
  reference: ['reference', 'crossDatasetReference'],
  image: ['image', 'file'],
  array: ['array'],
};

export function getContentSchemaTypes(schema: Schema): SchemaType[] {
  return schema
    .getTypeNames()
    .map((name) => schema.get(name))
    .filter((type): type is SanitySchemaType => {
      if (!type?.jsonType || SYSTEM_TYPES.includes(type.name)) return false;
      if (type.name.startsWith('sanity.') || type.name.startsWith('system.'))
        return false;
      return (
        type.jsonType === 'object' &&
        'fields' in type &&
        type.fields?.length > 0
      );
    })
    .map((type) => ({
      name: type.name,
      title: type.title || type.name,
      fields:
        (type as any).fields?.map((field: any) => ({
          name: field.name,
          type: field.type.name,
          title: field.title || field.name,
          description: field.description,
        })) || [],
    }));
}

export function getSchemaFields(schemaType: SchemaType): SchemaField[] {
  return (
    schemaType.fields?.map((field) => ({
      name: field.name,
      type: field.type,
      title: field.title || field.name,
      description: field.description,
    })) || []
  );
}

export function autoDetectFieldMappings(
  schemaFields: SchemaField[]
): FieldMapping[] {
  return LOGICAL_FIELDS.map((logicalField) => {
    const detectedField = findBestMatch(logicalField, schemaFields);
    return {
      logicalField: logicalField.key,
      schemaField: detectedField?.name || null,
      enabled: !!detectedField && logicalField.required,
    };
  });
}

function findBestMatch(
  logicalField: LogicalField,
  schemaFields: SchemaField[]
): SchemaField | null {
  const { key, type } = logicalField;

  // Exact match
  let match = schemaFields.find((field) => field.name === key);
  if (match && isTypeCompatible(type, match.type)) return match;

  // Common variations
  const variations = FIELD_VARIATIONS[key] || [];
  for (const variation of variations) {
    match = schemaFields.find(
      (field) =>
        field.name.toLowerCase() === variation.toLowerCase() ||
        field.title?.toLowerCase() === variation.toLowerCase()
    );
    if (match && isTypeCompatible(type, match.type)) return match;
  }

  // Type-based fallback
  return (
    schemaFields.find((field) => isTypeCompatible(type, field.type)) || null
  );
}

function isTypeCompatible(logicalType: string, schemaType: string): boolean {
  return TYPE_COMPATIBILITY[logicalType]?.includes(schemaType) || false;
}

export function validateFieldMappings(mappings: FieldMapping[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required fields are mapped
  for (const logicalField of LOGICAL_FIELDS) {
    if (logicalField.required) {
      const mapping = mappings.find((m) => m.logicalField === logicalField.key);
      if (!mapping?.enabled || !mapping?.schemaField) {
        errors.push(`Required field "${logicalField.label}" must be mapped`);
      }
    }
  }

  // Check for duplicate mappings
  const enabledMappings = mappings.filter((m) => m.enabled && m.schemaField);
  const schemaFields = enabledMappings.map((m) => m.schemaField);
  const duplicates = schemaFields.filter(
    (field, index) => schemaFields.indexOf(field) !== index
  );

  if (duplicates.length > 0) {
    errors.push(`Duplicate field mappings: ${duplicates.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}
