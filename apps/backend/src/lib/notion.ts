import { Client } from '@notionhq/client';

/**
 * Simple Notion API client wrapper
 */
export class NotionService {
  private client: Client;

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
  async getDatabase(databaseId: string) {
    try {
      const response = await this.client.databases.retrieve({
        database_id: databaseId,
      });
      return response;
    } catch (error) {
      console.error('[notion-service] Failed to get database:', error);
      return null;
    }
  }

  /**
   * Query database pages
   */
  async queryDatabase(databaseId: string, pageSize = 10) {
    try {
      const response = await this.client.databases.query({
        database_id: databaseId,
        page_size: pageSize,
      });
      return response;
    } catch (error) {
      console.error('[notion-service] Failed to query database:', error);
      return null;
    }
  }

  /**
   * Extract all text content from a Notion page
   */
  async getPageContent(pageId: string) {
    try {
      const response = await this.client.blocks.children.list({
        block_id: pageId,
      });
      return response;
    } catch (error) {
      console.error('[notion-service] Failed to get page content:', error);
      return null;
    }
  }

  /**
   * Transform Notion page data into readable format
   */
  transformPageData(page: any) {
    if (!page) return null;

    const transformedPage = {
      id: page.id,
      url: page.url,
      created_time: page.created_time,
      last_edited_time: page.last_edited_time,
      properties: {},
    };

    // Extract properties based on their type
    if (page.properties) {
      Object.entries(page.properties).forEach(
        ([key, property]: [string, any]) => {
          transformedPage.properties[key] = this.extractPropertyValue(property);
        }
      );
    }

    return transformedPage;
  }

  /**
   * Extract text from title or rich_text property
   */
  extractTextFromProperty(property: any): string {
    if (!property) return '';

    if (property.type === 'title' && property.title) {
      return property.title.map((t: any) => t.plain_text).join('');
    }

    if (property.type === 'rich_text' && property.rich_text) {
      return property.rich_text.map((t: any) => t.plain_text).join('');
    }

    return '';
  }

  /**
   * Extract value from Notion property based on type
   */
  extractPropertyValue(property: any) {
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

      case 'url':
        return property.url;

      case 'email':
        return property.email;

      case 'phone_number':
        return property.phone_number;

      default:
        return property[property.type] || null;
    }
  }
}

/**
 * Create Notion service instance
 */
export function createNotionService(): NotionService | null {
  const apiKey = process.env.NOTION_API_KEY;

  if (!apiKey) {
    console.error(
      '[notion-service] NOTION_API_KEY environment variable is not set'
    );
    return null;
  }

  return new NotionService(apiKey);
}
