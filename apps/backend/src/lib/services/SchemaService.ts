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
    return prepareContentForFields(content, fields);
  }
}

export function createSchemaService(
  projectId: string,
  token: string,
  dataset = 'production'
): SchemaService {
  return new SchemaService(projectId, token, dataset);
}
