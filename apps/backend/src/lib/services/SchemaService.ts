import { createClient, SanityClient } from '@sanity/client';
import type { SchemaField, SchemaType } from '@sanity-notion-llm/shared';

import {
  inferFieldsFromMultipleDocuments,
  inferSchemaFromDocuments,
} from './schema/inference';
import { prepareContentForFields } from './schema/reconstruction';

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

      return inferSchemaFromDocuments(documents);
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
        return inferFieldsFromMultipleDocuments(documents);
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

  async prepareContentForSchema(
    content: Record<string, any>,
    schemaType: string
  ): Promise<Record<string, any>> {
    const fields = await this.getSchemaFields(schemaType);

    // Resolve references before preparing content structure
    const resolvedContent = await this.resolveReferences(content, fields);

    return prepareContentForFields(resolvedContent, fields);
  }

  /**
   * Resolve reference fields by looking up documents by title/name
   */
  private async resolveReferences(
    content: Record<string, any>,
    fields: SchemaField[]
  ): Promise<Record<string, any>> {
    const processedContent = { ...content };

    for (const field of fields) {
      const value = processedContent[field.name];

      // Skip if no value present
      if (value === undefined || value === null) continue;

      // Handle direct references (e.g., author: "John Doe")
      if (field.type === 'reference' && typeof value === 'string') {
        const resolved = await this.findOrCreateReference(field.name, value);
        if (resolved) {
          processedContent[field.name] = resolved;
        } else {
          console.warn(
            `[schema-service] Could not resolve or create reference for field "${field.name}" with value "${value}"`
          );
          delete processedContent[field.name];
        }
      }

      // Handle arrays of references
      if (field.type === 'array' && Array.isArray(value)) {
        await this.resolveArrayReferences(
          processedContent,
          field,
          value,
          fields
        );
      }
    }

    return processedContent;
  }

  /**
   * Smart reference resolver:
   * 1. Search for existing document (case-insensitive)
   * 2. If not found, try to create new document (using field name as type guess)
   * 3. If creation fails, try to find ANY document of that type (fallback)
   */
  private async findOrCreateReference(
    fieldName: string,
    value: string
  ): Promise<any | null> {
    try {
      // 1. Try to find existing document (global search)
      // Case-insensitive matching on name or title
      // Explicitly exclude system docs and drafts
      const existingDocs = await this.client.fetch(
        `*[
          !(_id in path("drafts.**")) && 
          !(_type match "system.**") &&
          (lower(title) == lower($value) || lower(name) == lower($value))
        ] { _id, _type }`,
        { value }
      );

      if (existingDocs.length > 0) {
        // If multiple found, try to prioritize based on field name
        // e.g. if field is 'author', prefer type 'author'
        const typeGuess = this.guessTypeFromFieldName(fieldName);
        const bestMatch =
          existingDocs.find((doc: any) => doc._type === typeGuess) ||
          existingDocs[0];
        return {
          _type: 'reference',
          _ref: bestMatch._id,
        };
      }

      // 2. If not found, try to create
      // We assume the schema type matches the field name (or singularized version)
      const typeToCreate = this.guessTypeFromFieldName(fieldName);

      try {
        console.log(
          `[schema-service] Attempting to create new ${typeToCreate} for "${value}"`
        );
        // We try to set both name and title to cover most schema conventions
        const newDoc = await this.client.create({
          _type: typeToCreate,
          name: value,
          title: value,
        });

        console.log(
          `[schema-service] Created new ${typeToCreate} document: ${newDoc._id}`
        );
        return {
          _type: 'reference',
          _ref: newDoc._id,
        };
      } catch (createError) {
        console.warn(
          `[schema-service] Failed to create ${typeToCreate} for "${value}":`,
          createError
        );

        // 3. Fallback: Try to find ANY document of this type
        // "Hvis ikke den kan oprette nogen, så skal den vælge den mest oplagte."
        try {
          const anyDoc = await this.client.fetch(`*[_type == $type][0]._id`, {
            type: typeToCreate,
          });
          if (anyDoc) {
            console.log(
              `[schema-service] Using fallback document for ${typeToCreate}`
            );
            return { _type: 'reference', _ref: anyDoc };
          }
        } catch (e) {
          /* ignore */
        }

        return null;
      }
    } catch (e) {
      console.error(
        `[schema-service] Error in findOrCreateReference for "${value}":`,
        e
      );
      return null;
    }
  }

  private guessTypeFromFieldName(fieldName: string): string {
    // Simple heuristic: remove trailing 's' if present (authors -> author)
    if (fieldName.endsWith('s') && !fieldName.endsWith('ss')) {
      return fieldName.slice(0, -1);
    }
    return fieldName;
  }

  /**
   * Helper to resolve references within an array
   */
  private async resolveArrayReferences(
    content: Record<string, any>,
    field: SchemaField,
    value: any[],
    allFields: SchemaField[]
  ): Promise<void> {
    // Check if the array should contain references
    // We look for a child field definition that is a reference
    const itemField = allFields.find(
      (f) => f.parentPath === field.path && f.type === 'reference'
    );

    if (itemField) {
      const resolvedItems = [];
      for (const item of value) {
        if (typeof item === 'string') {
          const resolved = await this.findOrCreateReference(field.name, item);
          if (resolved) {
            // For arrays, we also need a _key
            resolvedItems.push({
              ...resolved,
              _key: Math.random().toString(36).substring(2, 15),
            });
          }
        } else if (item && typeof item === 'object' && item._ref) {
          // Already a reference object, keep it
          resolvedItems.push(item);
        }
      }

      if (resolvedItems.length > 0) {
        content[field.name] = resolvedItems;
      }
    }
  }
}

export function createSchemaService(
  projectId: string,
  token: string,
  dataset = 'production'
): SchemaService {
  return new SchemaService(projectId, token, dataset);
}
