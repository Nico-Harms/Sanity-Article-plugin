import { NextRequest } from 'next/server';
import { NotionService, ConfigService } from '@/lib/services';
import { ERROR_MESSAGES, NOTION_DEFAULTS } from '@sanity-notion-llm/shared';
import type { NotionStatusUpdate } from '@sanity-notion-llm/shared';
import { createCorsResponse } from '@/lib/cors';

export async function OPTIONS() {
  return createCorsResponse({}, 200);
}

export async function PATCH(request: NextRequest) {
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

    if (!config.notionClientSecret) {
      return createCorsResponse(
        { error: 'Notion client secret not configured' },
        400
      );
    }

    let payload: Partial<NotionStatusUpdate>;

    try {
      payload = await request.json();
    } catch {
      return createCorsResponse({ error: 'Invalid JSON payload' }, 400);
    }

    const pageId = payload?.pageId;
    const status = payload?.status;
    const propertyName =
      payload?.propertyName ?? NOTION_DEFAULTS.STATUS_PROPERTY;

    if (!pageId) {
      return createCorsResponse({ error: 'Page ID is required' }, 400);
    }

    if (!status) {
      return createCorsResponse({ error: 'Status value is required' }, 400);
    }

    const notionService = new NotionService(config.notionClientSecret);

    try {
      const updatedPage = await notionService.updatePageStatus(
        pageId,
        status,
        propertyName
      );

      return createCorsResponse({ page: updatedPage });
    } catch (error) {
      console.error('[notion-status] API error:', error);

      if (error instanceof Error) {
        if (error.message === ERROR_MESSAGES.NOTION_STATUS_PROPERTY_NOT_FOUND) {
          return createCorsResponse(
            { error: 'Status property not found in Notion page' },
            400
          );
        }

        if (
          error.message === ERROR_MESSAGES.NOTION_STATUS_PROPERTY_UNSUPPORTED
        ) {
          return createCorsResponse(
            { error: 'Status property type is not supported' },
            400
          );
        }
      }

      return createCorsResponse(
        {
          error: ERROR_MESSAGES.NOTION_UPDATE_FAILED,
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  } catch (error) {
    console.error('[notion-status] Unexpected error:', error);
    return createCorsResponse({ error: 'Internal server error' }, 500);
  }
}
