import { Client } from '@notionhq/client';
import type {
  GetPageResponse,
  PageObjectResponse,
  RichTextItemResponse,
} from '@notionhq/client/build/src/api-endpoints';
import type { NotionPage, NotionDatabase } from '@sanity-notion-llm/shared';
import { NOTION_DEFAULTS, ERROR_MESSAGES } from '@sanity-notion-llm/shared';

/*===============================================
|=                NotionService                 =
===============================================*/

/**
 * NOTION API SERVICE
 *
 * Handles all interactions with the Notion API for content retrieval.
 * Provides utilities for database queries, page fetching, and content extraction.
 *
 * Key Features:
 * - Database Management: Query Notion databases and retrieve pages
 * - Content Extraction: Extract structured content from Notion page properties
 * - Status Updates: Update page status for workflow management
 * - Error Handling: Comprehensive error handling with typed responses
 *
 * Content Extraction:
 * - Automatically detects content fields (Title, Content, etc.)
 * - Extracts subject from page title or first property
 * - Handles various Notion property types (text, rich_text, etc.)
 *
 * Security:
 * - Uses Notion API tokens for authentication
 * - Validates API responses and handles errors gracefully
 * - No data persistence - all data fetched on-demand
 */

/*===============================================
=          Is full page response           =
===============================================*/

const isFullPageResponse = (
  response: GetPageResponse
): response is PageObjectResponse => 'properties' in response;

/*===============================================
=          Extract property value           =
===============================================*/

const extractPropertyValue = (property: any): any => {
  if (!property || !property.type) return null;

  switch (property.type) {
    case 'title':
      return (
        property.title
          ?.map((t: RichTextItemResponse) => t.plain_text)
          .join('') || ''
      );
    case 'rich_text':
      return (
        property.rich_text
          ?.map((t: RichTextItemResponse) => t.plain_text)
          .join('') || ''
      );
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
};

/*===============================================
=          Format database id           =
===============================================*/

const formatDatabaseId = (databaseId: string): string => {
  if (databaseId.includes('-')) return databaseId;
  if (databaseId.length !== 32) return databaseId;

  return [
    databaseId.substring(0, 8),
    databaseId.substring(8, 12),
    databaseId.substring(12, 16),
    databaseId.substring(16, 20),
    databaseId.substring(20, 32),
  ].join('-');
};

/*===============================================
=          Map notion page           =
===============================================*/

const mapPropertyValues = (
  properties: Record<string, any> | undefined
): Record<string, unknown> => {
  return Object.keys(properties || {}).reduce<Record<string, unknown>>(
    (acc, key) => {
      acc[key] = extractPropertyValue(properties?.[key]);
      return acc;
    },
    {}
  );
};

const mapNotionPage = (
  page: PageObjectResponse,
  content?: string
): NotionPage => {
  const rawProperties = (page.properties || {}) as Record<string, any>;
  const title =
    extractPropertyValue(rawProperties?.Name || rawProperties?.Title) ||
    NOTION_DEFAULTS.UNTITLED_PAGE;

  return {
    id: page.id,
    url: page.url,
    title,
    properties: rawProperties,
    propertyValues: mapPropertyValues(rawProperties),
    content,
  };
};

/*===============================================
=          Create notion client           =
===============================================*/

export interface NotionClient {
  testConnection(): Promise<{ success: boolean; message: string }>;
  getDatabase(databaseId: string): Promise<NotionDatabase | null>;
  queryDatabase(
    databaseId: string,
    options?: { pageSize?: number; fetchContent?: boolean }
  ): Promise<NotionPage[]>;
  updatePageStatus(
    pageId: string,
    status: string,
    propertyName?: string
  ): Promise<NotionPage | null>;
  getPageContent(pageId: string): Promise<string>;
}

export const createNotionClient = (apiKey: string): NotionClient => {
  const client = new Client({ auth: apiKey });

  /*===============================================
  =          Test connection           =
  ===============================================*/

  const testConnection = async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      await client.users.me({});
      return { success: true, message: 'Successfully connected to Notion API' };
    } catch (error) {
      console.error('[notion] Connection test failed:', error);
      return {
        success: false,
        message: `Failed to connect: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  };

  /*===============================================
  =          Get database           =
  ===============================================*/

  const getDatabase = async (
    databaseId: string
  ): Promise<NotionDatabase | null> => {
    try {
      const formattedId = formatDatabaseId(databaseId);
      const response = await client.databases.retrieve({
        database_id: formattedId,
      });

      return {
        id: response.id,
        title: (response as any).title || 'Untitled Database',
        properties: Object.keys((response as any).properties || {}).reduce<
          Record<string, unknown>
        >((acc, key) => {
          acc[key] = (response as any).properties[key];
          return acc;
        }, {}),
      };
    } catch (error) {
      console.error('[notion] Failed to get database:', error);
      return null;
    }
  };

  /*===============================================
  =          Query database           =
  ===============================================*/

  const queryDatabase = async (
    databaseId: string,
    options: { pageSize?: number; fetchContent?: boolean } = {}
  ): Promise<NotionPage[]> => {
    const { pageSize = 100, fetchContent = false } = options;

    try {
      const formattedId = formatDatabaseId(databaseId);
      const response = await client.databases.query({
        database_id: formattedId,
        page_size: pageSize,
      });

      const pages = response.results.filter(
        (page): page is PageObjectResponse => 'properties' in page
      );

      // Only fetch content if explicitly requested (for generation, not for lists)
      if (fetchContent) {
        const pagesWithContent = await Promise.all(
          pages.map(async (page) => {
            try {
              const content = await getPageContent(page.id);
              return mapNotionPage(page, content);
            } catch (error) {
              console.error(
                `[notion] Failed to get content for page ${page.id}:`,
                error
              );
              return mapNotionPage(page); // Return page without content if content fetch fails
            }
          })
        );
        return pagesWithContent;
      }

      // Return pages with just properties (fast, no rate limiting)
      return pages.map((page) => mapNotionPage(page));
    } catch (error) {
      console.error('[notion] Failed to query database:', error);
      return [];
    }
  };

  const updatePageStatus = async (
    pageId: string,
    status: string,
    propertyName: string = NOTION_DEFAULTS.STATUS_PROPERTY
  ): Promise<NotionPage | null> => {
    try {
      const page = await client.pages.retrieve({ page_id: pageId });

      if (!isFullPageResponse(page)) {
        throw new Error(ERROR_MESSAGES.NOTION_PAGE_UNEXPECTED_SHAPE);
      }

      const properties = page.properties as Record<string, any>;
      const property = properties[propertyName];

      if (!property) {
        throw new Error(ERROR_MESSAGES.NOTION_STATUS_PROPERTY_NOT_FOUND);
      }

      let propertyUpdate: Record<string, unknown> | null = null;

      if (property.type === 'status') {
        propertyUpdate = { status: { name: status } };
      } else if (property.type === 'select') {
        propertyUpdate = { select: { name: status } };
      }

      if (!propertyUpdate) {
        throw new Error(ERROR_MESSAGES.NOTION_STATUS_PROPERTY_UNSUPPORTED);
      }

      await client.pages.update({
        page_id: pageId,
        properties: { [propertyName]: propertyUpdate } as Record<string, any>,
      });

      const updatedPage = await client.pages.retrieve({ page_id: pageId });

      if (!isFullPageResponse(updatedPage)) {
        return null;
      }

      const updatedProperties = updatedPage.properties as Record<string, any>;

      return mapNotionPage({
        ...updatedPage,
        properties: updatedProperties,
      } as PageObjectResponse);
    } catch (error) {
      console.error('[notion] Failed to update status:', error);
      throw error;
    }
  };

  /*===============================================
  =          Get page content           =
  ===============================================*/

  const getPageContent = async (pageId: string): Promise<string> => {
    try {
      const response = await client.blocks.children.list({
        block_id: pageId,
        page_size: 100,
      });

      /**
       * Extracts rich text and converts links to markdown format [text](url)
       * This ensures links are preserved exactly as they appear in Notion
       */
      const extractRichTextWithLinks = (
        richText: RichTextItemResponse[] | undefined | null
      ): string => {
        if (!richText || richText.length === 0) return '';

        return richText
          .map((text) => {
            const content = text.plain_text || '';
            const href =
              text.href ??
              (text.type === 'text' ? (text.text.link?.url ?? null) : null);

            // If there's a link, format as markdown link [text](url)
            if (href) {
              // Escape brackets in content to avoid breaking markdown syntax
              const escapedContent = content
                .replace(/\[/g, '\\[')
                .replace(/\]/g, '\\]');
              return `[${escapedContent}](${href})`;
            }

            // Otherwise just return the plain text
            return content;
          })
          .join(''); // Join without spaces to preserve original text flow
      };

      // Extract text content from blocks with links formatted as markdown
      const contentBlocks = response.results
        .filter((block) => 'type' in block)
        .map((block) => {
          if (block.type === 'paragraph' && 'paragraph' in block) {
            return extractRichTextWithLinks(block.paragraph.rich_text);
          }
          if (block.type === 'heading_1' && 'heading_1' in block) {
            return `# ${extractRichTextWithLinks(block.heading_1.rich_text)}`;
          }
          if (block.type === 'heading_2' && 'heading_2' in block) {
            return `## ${extractRichTextWithLinks(block.heading_2.rich_text)}`;
          }
          if (block.type === 'heading_3' && 'heading_3' in block) {
            return `### ${extractRichTextWithLinks(block.heading_3.rich_text)}`;
          }
          if (
            block.type === 'bulleted_list_item' &&
            'bulleted_list_item' in block
          ) {
            return `• ${extractRichTextWithLinks(block.bulleted_list_item.rich_text)}`;
          }
          if (
            block.type === 'numbered_list_item' &&
            'numbered_list_item' in block
          ) {
            return `1. ${extractRichTextWithLinks(block.numbered_list_item.rich_text)}`;
          }
          if (block.type === 'quote' && 'quote' in block) {
            return `> ${extractRichTextWithLinks(block.quote.rich_text)}`;
          }
          return '';
        })
        .filter((text) => text.trim().length > 0);

      return contentBlocks.join('\n\n');
    } catch (error) {
      console.error('[notion] Failed to get page content:', error);
      return '';
    }
  };

  return {
    testConnection,
    getDatabase,
    queryDatabase,
    updatePageStatus,
    getPageContent,
  };
};

/**
 * Extract main content from Notion page properties
 * Looks for common content fields like "Content", "Body", "Description", etc.
 */
export function extractContentFromProperties(
  properties: Record<string, any>
): string {
  const contentFields = [
    'Content ',
    'Content',
    'Body',
    'Description',
    'Text',
    'Notes',
  ];

  for (const field of contentFields) {
    const property = properties[field];
    if (property) {
      if (property.type === 'rich_text' && property.rich_text) {
        return property.rich_text.map((text: any) => text.plain_text).join(' ');
      }
      if (property.type === 'title' && property.title) {
        return property.title.map((text: any) => text.plain_text).join(' ');
      }
      if (property.type === 'text' && property.text) {
        return property.text.map((text: any) => text.plain_text).join(' ');
      }
    }
  }

  // Fallback: return first available text content
  for (const [, property] of Object.entries(properties)) {
    if (property && typeof property === 'object') {
      if (property.rich_text && property.rich_text.length > 0) {
        return property.rich_text.map((text: any) => text.plain_text).join(' ');
      }
      if (property.title && property.title.length > 0) {
        return property.title.map((text: any) => text.plain_text).join(' ');
      }
    }
  }

  return 'No content found';
}

/**
 * Extract subject/topic from Notion page properties
 * Looks for common subject fields like "Subject", "Topic", "Title", etc.
 */
export function extractSubjectFromProperties(
  properties: Record<string, any>
): string {
  const subjectFields = ['Subject', 'Topic', 'Title', 'Name', 'Headline'];

  for (const field of subjectFields) {
    const property = properties[field];
    if (property) {
      if (property.type === 'title' && property.title) {
        return property.title.map((text: any) => text.plain_text).join(' ');
      }
      if (property.type === 'rich_text' && property.rich_text) {
        return property.rich_text.map((text: any) => text.plain_text).join(' ');
      }
      if (property.type === 'text' && property.text) {
        return property.text.map((text: any) => text.plain_text).join(' ');
      }
    }
  }

  return 'Untitled';
}

/**
 * Update Notion page status safely (best-effort)
 *
 * This function attempts to update a Notion page's status field but does not throw errors.
 * It's designed for best-effort status updates that shouldn't block main workflows.
 *
 * @param notionPageId - The Notion page ID to update
 * @param status - The status value to set (e.g., "In progress", "Ready to publish", "Published")
 * @param notionClientSecret - The Notion API key (encrypted)
 * @param propertyName - The name of the status property (defaults to "Status")
 */
export async function updateNotionStatusSafely(
  notionPageId: string,
  status: string,
  notionClientSecret: string,
  propertyName: string = NOTION_DEFAULTS.STATUS_PROPERTY
): Promise<void> {
  try {
    const notionClient = createNotionClient(notionClientSecret);
    await notionClient.updatePageStatus(notionPageId, status, propertyName);
    console.log(`[notion-status] Updated page ${notionPageId} to "${status}"`);
  } catch (error) {
    console.error(
      `[notion-status] Failed to update page ${notionPageId} to "${status}":`,
      error
    );
  }
}
