import { NextRequest } from 'next/server';
import { NotionService, ConfigService } from '@/lib/services';
import { ERROR_MESSAGES } from '@sanity-notion-llm/shared';
import { createCorsResponse } from '@/lib/cors';

/*===============================================
|=          Notion table API route           =
===============================================*/

export async function OPTIONS() {
  return createCorsResponse({}, 200);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studioId = searchParams.get('studioId');

    if (!studioId) {
      return createCorsResponse(
        { error: ERROR_MESSAGES.STUDIO_ID_REQUIRED },
        400
      );
    }

    // Load configuration from database
    const config = await ConfigService.getByStudioId(studioId);

    if (!config) {
      return createCorsResponse(
        { error: 'Configuration not found for this Studio' },
        404
      );
    }

    if (!config.notionClientSecret || !config.notionDatabaseUrl) {
      return createCorsResponse(
        { error: 'Notion configuration is incomplete' },
        400
      );
    }

    // Extract database ID from URL
    const databaseId = config.notionDatabaseUrl.split('/').pop()?.split('?')[0];

    if (!databaseId) {
      return createCorsResponse({ error: 'Invalid Notion database URL' }, 400);
    }

    const notionService = new NotionService(config.notionClientSecret);

    // Get database info
    const database = await notionService.getDatabase(databaseId);

    if (!database) {
      return createCorsResponse(
        { error: ERROR_MESSAGES.NOTION_DATABASE_NOT_FOUND },
        404
      );
    }

    // Query pages
    const pages = await notionService.queryDatabase(databaseId, 100);

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
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
}
