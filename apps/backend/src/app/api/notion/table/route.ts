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
      return createCorsResponse({ error: 'studioId is required' }, 400);
    }

    // Load configuration from database
    const config = await getConfigByStudioId(studioId);

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

    // Use the database ID directly (it's already just the ID, not a URL)
    const databaseId = config.notionDatabaseUrl;

    // Decrypt the API key before using it
    const decryptedApiKey = decryptSecret(config.notionClientSecret);
    const notionService = createNotionClient(decryptedApiKey);

    // Get database info and pages
    const [database, pages] = await Promise.all([
      notionService.getDatabase(databaseId),
      notionService.queryDatabase(databaseId, 100),
    ]);

    if (!database) {
      return createCorsResponse({ error: 'Database not found' }, 404);
    }

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
      { error: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
