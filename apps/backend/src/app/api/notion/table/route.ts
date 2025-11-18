import { NextRequest } from 'next/server';
import {
  createNotionClient,
  getConfigByStudioId,
  decryptSecret,
} from '@/lib/services';
import { createCorsResponse, createCorsPreflightResponse } from '@/lib/cors';

/*===============================================
=          NOTION TABLE API           =
===============================================*/

export async function OPTIONS() {
  return createCorsPreflightResponse();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studioId = searchParams.get('studioId');

    if (!studioId) {
      return createCorsResponse(
        {
          error: 'studioId is required',
          fieldErrors: {},
        },
        400
      );
    }

    // Load configuration from database
    const config = await getConfigByStudioId(studioId);

    if (!config) {
      return createCorsResponse(
        {
          error: 'Configuration not found for this Studio',
          fieldErrors: {},
        },
        404
      );
    }

    // Check for missing credentials and provide specific field errors
    const fieldErrors: Record<string, string> = {};
    if (!config.notionDatabaseUrl) {
      fieldErrors.notionDatabaseUrl = 'Notion Database ID is required';
    }
    if (!config.notionClientSecret) {
      fieldErrors.notionClientSecret = 'Notion Client Secret is required';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return createCorsResponse(
        {
          error: 'Notion configuration is incomplete',
          fieldErrors,
        },
        400
      );
    }

    // Use the database ID directly (it's already just the ID, not a URL)
    const databaseId = config.notionDatabaseUrl;

    // Decrypt the API key before using it
    let decryptedApiKey: string;
    try {
      decryptedApiKey = decryptSecret(config.notionClientSecret);
    } catch (error) {
      return createCorsResponse(
        {
          error: 'Failed to decrypt Notion Client Secret',
          fieldErrors: {
            notionClientSecret: 'Invalid or corrupted client secret',
          },
        },
        400
      );
    }

    const notionService = createNotionClient(decryptedApiKey);

    // Test API key first by checking user access
    const connectionTest = await notionService.testConnection();
    if (!connectionTest.success) {
      const errorMessage = connectionTest.message;
      // Check for common Notion API errors
      if (
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('401') ||
        errorMessage.includes('Invalid API key') ||
        errorMessage.includes('API token')
      ) {
        return createCorsResponse(
          {
            error: 'Invalid Notion API credentials',
            fieldErrors: {
              notionClientSecret:
                'The Notion Client Secret is invalid or expired. Please check your integration credentials.',
            },
          },
          401
        );
      }
      return createCorsResponse(
        {
          error: `Notion API error: ${errorMessage}`,
          fieldErrors: {
            notionClientSecret: errorMessage,
          },
        },
        500
      );
    }

    // Get database info and pages (WITHOUT content for fast loading)
    let database;
    try {
      database = await notionService.getDatabase(databaseId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      // Check if it's a database-specific error
      if (
        errorMessage.includes('not found') ||
        errorMessage.includes('404') ||
        errorMessage.includes('object_not_found')
      ) {
        return createCorsResponse(
          {
            error: 'Database not found or inaccessible',
            fieldErrors: {
              notionDatabaseUrl:
                'The Database ID is incorrect, or your integration does not have access to this database. Make sure the database is shared with your Notion integration.',
            },
          },
          404
        );
      }
      return createCorsResponse(
        {
          error: `Database access error: ${errorMessage}`,
          fieldErrors: {
            notionDatabaseUrl: errorMessage,
          },
        },
        500
      );
    }

    if (!database) {
      return createCorsResponse(
        {
          error: 'Database not found',
          fieldErrors: {
            notionDatabaseUrl:
              'Database not found. Check the Database ID and ensure your integration has access.',
          },
        },
        404
      );
    }

    // Try to query the database to ensure we have read access
    try {
      await notionService.queryDatabase(databaseId, {
        pageSize: 1,
        fetchContent: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return createCorsResponse(
        {
          error: `Database query failed: ${errorMessage}`,
          fieldErrors: {
            notionDatabaseUrl:
              'Cannot query database. Ensure your integration has read access.',
          },
        },
        500
      );
    }

    const pages = await notionService.queryDatabase(databaseId, {
      pageSize: 100,
      fetchContent: false,
    });

    return createCorsResponse({
      database: {
        id: database.id,
        title: database.title,
        properties: database.properties,
      },
      pages: pages,
    });
  } catch (error) {
    console.error('[notion-table] API error:', error);
    return createCorsResponse(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        fieldErrors: {},
      },
      500
    );
  }
}
