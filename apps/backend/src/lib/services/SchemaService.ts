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
        const resolved = await this.resolveSingleReference(value);
        if (resolved) {
          processedContent[field.name] = resolved;
        } else {
          console.warn(
            `[schema-service] Could not resolve reference for field "${field.name}" with value "${value}"`
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
   * Helper to resolve a single reference string to a Sanity reference object
   */
  private async resolveSingleReference(value: string): Promise<any | null> {
    try {
      // Search for document where title or name matches value
      // We exclude drafts and system documents
      const result = await this.client.fetch(
        `*[!(_id in path("drafts.**")) && (title == $value || name == $value)][0]._id`,
        { value }
      );

      if (result) {
        return {
          _type: 'reference',
          _ref: result,
        };
      }
      return null;
    } catch (e) {
      console.warn(
        `[schema-service] Error resolving reference for "${value}":`,
        e
      );
      return null;
    }
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
          const resolved = await this.resolveSingleReference(item);
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
