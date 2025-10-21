import { Client } from '@notionhq/client';
import type {
  GetPageResponse,
  PageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';
import type { NotionPage, NotionDatabase } from '@sanity-notion-llm/shared';
import { NOTION_DEFAULTS, ERROR_MESSAGES } from '@sanity-notion-llm/shared';

export class NotionService {
  private client: Client;

  private isFullPageResponse(
    response: GetPageResponse
  ): response is PageObjectResponse {
    return 'properties' in response;
  }

  constructor(apiKey: string) {
    this.client = new Client({
      auth: apiKey,
    });
  }

  /**
   * Test connection to Notion API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.client.users.me({});
      return { success: true, message: 'Successfully connected to Notion API' };
    } catch (error) {
      console.error('[notion-service] Connection test failed:', error);
      return {
        success: false,
        message: `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get database information
   */
  async getDatabase(databaseId: string): Promise<NotionDatabase | null> {
    try {
      const response = await this.client.databases.retrieve({
        database_id: databaseId,
      });

      return {
        id: response.id,
        title: (response as any).title || 'Untitled Database',
        properties: Object.keys((response as any).properties || {}),
      };
    } catch (error) {
      console.error('[notion-service] Failed to get database:', error);
      return null;
    }
  }

  /**
   * Query database pages
   */
  async queryDatabase(
    databaseId: string,
    pageSize = 100
  ): Promise<NotionPage[]> {
    try {
      const response = await this.client.databases.query({
        database_id: databaseId,
        page_size: pageSize,
      });

      return response.results.map((page: any) => ({
        id: page.id,
        url: page.url,
        title:
          this.extractPropertyValue(
            page.properties?.Name || page.properties?.Title
          ) || NOTION_DEFAULTS.UNTITLED_PAGE,
        properties: Object.keys(page.properties).reduce(
          (acc: any, key: string) => {
            acc[key] = this.extractPropertyValue(page.properties[key]);
            return acc;
          },
          {}
        ),
      }));
    } catch (error) {
      console.error('[notion-service] Failed to query database:', error);
      return [];
    }
  }

  /**
   * Update the status property of a Notion page
   */
  async updatePageStatus(
    pageId: string,
    status: string,
    propertyName: string = NOTION_DEFAULTS.STATUS_PROPERTY
  ): Promise<NotionPage | null> {
    try {
      const page = await this.client.pages.retrieve({
        page_id: pageId,
      });

      if (!this.isFullPageResponse(page)) {
        throw new Error(ERROR_MESSAGES.NOTION_PAGE_UNEXPECTED_SHAPE);
      }

      const properties = page.properties as Record<string, any>;
      const property = properties[propertyName];

      if (!property) {
        throw new Error(ERROR_MESSAGES.NOTION_STATUS_PROPERTY_NOT_FOUND);
      }

      let propertyUpdate: Record<string, unknown> | null = null;

      if (property.type === 'status') {
        propertyUpdate = {
          status: { name: status },
        };
      } else if (property.type === 'select') {
        propertyUpdate = {
          select: { name: status },
        };
      }

      if (!propertyUpdate) {
        throw new Error(ERROR_MESSAGES.NOTION_STATUS_PROPERTY_UNSUPPORTED);
      }

      await this.client.pages.update({
        page_id: pageId,
        properties: {
          [propertyName]: propertyUpdate,
        } as Record<string, any>,
      });

      const updatedPage = await this.client.pages.retrieve({
        page_id: pageId,
      });

      if (!this.isFullPageResponse(updatedPage)) {
        return null;
      }

      const updatedProperties = updatedPage.properties as Record<string, any>;

      return {
        id: updatedPage.id,
        url: updatedPage.url,
        title:
          this.extractPropertyValue(
            updatedProperties?.Name || updatedProperties?.Title
          ) || NOTION_DEFAULTS.UNTITLED_PAGE,
        properties: Object.keys(updatedProperties).reduce<
          Record<string, unknown>
        >((acc, key) => {
          acc[key] = this.extractPropertyValue(updatedProperties[key]);
          return acc;
        }, {}),
      };
    } catch (error) {
      console.error('[notion-service] Failed to update status:', error);
      throw error;
    }
  }

  /**
   * Extract value from Notion property
   */
  extractPropertyValue(property: any): any {
    if (!property || !property.type) return null;

    switch (property.type) {
      case 'title':
        return property.title?.map((t: any) => t.plain_text).join('') || '';
      case 'rich_text':
        return property.rich_text?.map((t: any) => t.plain_text).join('') || '';
      case 'select':
        return property.select?.name || null;
      case 'multi_select':
        return property.multi_select?.map((item: any) => item.name) || [];
      case 'date':
        return property.date?.start || null;
      case 'number':
        return property.number;
      case 'checkbox':
        return property.checkbox;
      case 'status':
        return property.status?.name || null;
      default:
        return property[property.type] || null;
    }
  }
}
