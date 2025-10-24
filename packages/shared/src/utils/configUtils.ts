import {
  LOGICAL_FIELDS,
  type FieldMapping,
} from '../types/config';

/**
 * Generate a default field-mapping array that covers every logical field.
 * All mappings start disabled with no schema field selected.
 */
export const createDefaultFieldMappings = (): FieldMapping[] =>
  LOGICAL_FIELDS.map((field) => ({
    logicalField: field.key,
    schemaField: null,
    enabled: false,
  }));

/**
 * Ensure incoming field mappings align with the logical field catalogue.
 * Unknown logical fields are discarded and missing ones are backfilled.
 */
export const normalizeFieldMappings = (value: unknown): FieldMapping[] => {
  const provided = Array.isArray(value)
    ? value
        .map((item): FieldMapping | null => {
          const logicalField =
            typeof item?.logicalField === 'string' ? item.logicalField : '';
          if (!logicalField) return null;

          const schemaField =
            typeof item?.schemaField === 'string'
              ? item.schemaField.trim() || null
              : null;

          return {
            logicalField,
            schemaField,
            enabled: Boolean(item?.enabled),
          };
        })
        .filter((item): item is FieldMapping => item !== null)
    : [];

  const byLogicalField = new Map(
    provided.map((item) => [item.logicalField, item])
  );

  return LOGICAL_FIELDS.map((logicalField) => {
    const existing = byLogicalField.get(logicalField.key);
    return (
      existing ?? {
        logicalField: logicalField.key,
        schemaField: null,
        enabled: false,
      }
    );
  });
};

/**
 * Normalize optional string inputs by trimming whitespace and coercing
 * empty strings to null.
 */
export const normalizeOptionalString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};
