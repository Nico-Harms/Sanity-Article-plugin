import { NextRequest } from 'next/server';
import { createNotionClient } from '@/lib/services';
import { createCorsResponse, createCorsPreflightResponse } from '@/lib/cors';

/**
 * NOTION TEST API
 *
 * Simple test endpoint that accepts credentials directly.
 * Use this for testing without saving config to database.
 */

export async function OPTIONS() {
  return createCorsPreflightResponse();
}

export async function GET(request: NextRequest) {
  try {
    // Use environment variables directly
    const clientSecret = process.env.NOTION_API_KEY;
    const notionDatabaseId = process.env.NOTION_DATABASE_ID;

    if (!clientSecret || !notionDatabaseId) {
      return createCorsResponse(
        {
          error:
            'NOTION_API_KEY and NOTION_DATABASE_ID environment variables are required',
        },
        400
      );
    }

    // Use database ID directly from env (it's already just the ID)
    const databaseId = notionDatabaseId;
    const notionService = createNotionClient(clientSecret);

    // Test connection and get database info
    const [connectionTest, database, pages] = await Promise.all([
      notionService.testConnection(),
      notionService.getDatabase(databaseId),
      notionService.queryDatabase(databaseId, 10), // Limit to 10 for testing
    ]);

    if (!connectionTest.success) {
      return createCorsResponse({ error: connectionTest.message }, 400);
    }

    if (!database) {
      return createCorsResponse({ error: 'Database not found' }, 404);
    }

    return createCorsResponse({
      success: true,
      connection: connectionTest,
      database: {
        id: database.id,
        title: database.title,
        properties: database.properties,
      },
      pages: pages,
    });
  } catch (error) {
    console.error('[notion-test] API error:', error);
    return createCorsResponse(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
