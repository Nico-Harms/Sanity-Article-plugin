import { NextRequest } from 'next/server';
import { createNotionClient, getConfigByStudioId } from '@/lib/services';
import { createCorsResponse, createCorsPreflightResponse } from '@/lib/cors';

/**
 * NOTION STATUS API
 *
 * Simple endpoint to update Notion page status.
 * Requires clientSecret, pageId, and status in request body.
 */

export async function OPTIONS() {
  return createCorsPreflightResponse();
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studioId = searchParams.get('studioId');

    if (!studioId) {
      return createCorsResponse({ error: 'studioId is required' }, 400);
    }

    const { pageId, status, propertyName = 'Status' } = await request.json();

    if (!pageId || !status) {
      return createCorsResponse(
        { error: 'pageId and status are required' },
        400
      );
    }

    // Load configuration from database
    const config = await getConfigByStudioId(studioId);

    if (!config) {
      return createCorsResponse(
        { error: 'Configuration not found for this Studio' },
        404
      );
    }

    if (!config.notionClientSecret) {
      return createCorsResponse(
        { error: 'Notion client secret not configured' },
        400
      );
    }

    const notionService = createNotionClient(config.notionClientSecret);
    const updatedPage = await notionService.updatePageStatus(
      pageId,
      status,
      propertyName
    );

    return createCorsResponse({ page: updatedPage });
  } catch (error) {
    console.error('[notion-status] API error:', error);
    return createCorsResponse(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
