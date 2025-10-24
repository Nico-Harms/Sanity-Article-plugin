import { createClient, SanityClient } from '@sanity/client';

export interface SchemaField {
  name: string;
  type: string;
  title: string;
  description?: string;
}

export interface SchemaType {
  name: string;
  title: string;
  fields: SchemaField[];
}
/*===============================================
=                  SchemaService                 =
===============================================*/

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

  /**
   * Get all available schema types from Sanity
   * Uses document inference since Management API requires different client
   */
  async getSchemaTypes(): Promise<SchemaType[]> {
    try {
      // Get all unique document types from existing documents
      const documents = await this.client.fetch(`
        *[!(_id in path("_.**"))] {
          _type,
          ...
        }
      `);

      if (!documents || documents.length === 0) {
        // Return empty array - no fallback schemas
        return [];
      }

      // Extract fields from first document of each type
      return this.inferSchemaFromDocuments(documents);
    } catch (error) {
      console.error('[schema-service] Failed to fetch schemas:', error);
      // Return empty array on error - no fallback schemas
      return [];
    }
  }

  /**
   * Get fields for a specific schema type
   */
  async getSchemaFields(typeName: string): Promise<SchemaField[]> {
    try {
      // Try to get fields from schema definition first
      const schemaTypes = await this.getSchemaTypes();
      const schemaType = schemaTypes.find((type) => type.name === typeName);
      if (schemaType) {
        return schemaType.fields;
      }

      // Fallback: infer from existing documents
      const documents = await this.client.fetch(`
        *[_type == "${typeName}"] [0...1] {
          ...
        }
      `);

      if (documents && documents.length > 0) {
        return this.inferFieldsFromDocument(documents[0]);
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

  /**
   * Infer schema types from existing documents
   */
  private inferSchemaFromDocuments(documents: any[]): SchemaType[] {
    const typeMap = new Map<string, any>();

    documents.forEach((doc) => {
      if (doc._type && !typeMap.has(doc._type)) {
        typeMap.set(doc._type, {
          name: doc._type,
          title: doc._type.charAt(0).toUpperCase() + doc._type.slice(1),
          fields: this.inferFieldsFromDocument(doc),
        });
      }
    });

    return Array.from(typeMap.values());
  }

  /**
   * Infer fields from a document
   */
  private inferFieldsFromDocument(doc: any): SchemaField[] {
    const fields: SchemaField[] = [];

    Object.keys(doc).forEach((key) => {
      if (key.startsWith('_')) return; // Skip metadata fields

      const value = doc[key];
      let type = 'string';

      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          // Check if it's block content (array of blocks with _type: 'block')
          if (value.length > 0 && value[0] && value[0]._type === 'block') {
            type = 'blockContent';
          } else {
            type = 'array';
          }
        } else if (value._type) {
          type = value._type;
        } else {
          type = 'object';
        }
      } else if (typeof value === 'number') {
        type = 'number';
      } else if (typeof value === 'boolean') {
        type = 'boolean';
      }

      fields.push({
        name: key,
        type,
        title: key.charAt(0).toUpperCase() + key.slice(1),
      });
    });

    return fields;
  }

  /**
   * Convert content to appropriate Sanity format based on field type
   */
  convertContentForField(content: any, fieldType: string): any {
    switch (fieldType) {
      case 'blockContent':
        // Convert string to Sanity block content
        if (typeof content === 'string') {
          return this.convertStringToBlockContent(content);
        }
        return content;

      case 'slug':
        // Convert to Sanity slug format
        if (typeof content === 'string') {
          return {
            _type: 'slug',
            current: content
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, ''),
          };
        }
        return content;

      case 'datetime':
      case 'date':
        // Convert to ISO date string
        if (content && typeof content === 'object' && content.date) {
          return content.date.start || content.date;
        }
        if (typeof content === 'string') {
          return content;
        }
        return new Date().toISOString();

      case 'string':
      case 'text':
        return typeof content === 'string' ? content : String(content);

      case 'number':
        return typeof content === 'number' ? content : Number(content) || 0;

      case 'boolean':
        return Boolean(content);

      case 'array':
        // Handle arrays (like categories, tags)
        if (Array.isArray(content)) {
          return content;
        }
        if (typeof content === 'string') {
          return content
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        }
        return [];

      case 'image':
      case 'reference':
        // Skip these fields for now - they need special handling
        return undefined;

      default:
        return content;
    }
  }

  /**
   * Convert plain text to Sanity block content format
   */
  private convertStringToBlockContent(text: string): any[] {
    if (!text || typeof text !== 'string') {
      return [];
    }

    // Clean the text - remove extra whitespace and normalize
    const cleanText = text.trim();
    if (!cleanText) {
      return [];
    }

    // Split text into paragraphs (by double newlines or single newlines)
    const paragraphs = cleanText.split(/\n\s*\n/).filter((p) => p.trim());

    // If no paragraphs found, treat the whole text as one paragraph
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
      .filter(Boolean); // Remove any null entries
  }

  /**
   * Generate a unique key for Sanity blocks
   */
  private generateKey(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Filter and convert content to match schema fields
   */
  async prepareContentForSchema(
    content: Record<string, any>,
    schemaType: string
  ): Promise<Record<string, any>> {
    const fields = await this.getSchemaFields(schemaType);
    const preparedContent: Record<string, any> = {};

    // Only include fields that exist in the schema
    for (const field of fields) {
      const fieldName = field.name;
      const fieldType = field.type;

      if (content.hasOwnProperty(fieldName)) {
        const convertedValue = this.convertContentForField(
          content[fieldName],
          fieldType
        );

        // Only include the field if conversion was successful
        if (convertedValue !== undefined) {
          preparedContent[fieldName] = convertedValue;
        }
      }
    }

    return preparedContent;
  }
}

export function createSchemaService(
  projectId: string,
  token: string,
  dataset?: string
): SchemaService {
  return new SchemaService(projectId, token, dataset);
}
