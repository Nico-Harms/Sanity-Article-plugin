import { NextRequest } from 'next/server';
import { loadStudioContext } from '@/lib/services';
import { createCorsResponse, createCorsPreflightResponse } from '@/lib/cors';

export async function GET(request: NextRequest) {
  try {
    const studioId = request.nextUrl.searchParams.get('studioId');

    if (!studioId) {
      return createCorsResponse({ error: 'studioId is required' }, 400);
    }

    let context;
    try {
      context = await loadStudioContext(studioId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load configuration';
      const status = message.includes('not found') ? 404 : 400;
      return createCorsResponse({ error: message }, status);
    }

    // Query drafts
    const drafts = await context.sanity.service.queryDrafts({
      type: context.config.selectedSchema || 'article',
    });

    return createCorsResponse({ success: true, drafts }, 200);
  } catch (error) {
    console.error('[drafts-api] Failed to fetch drafts:', error);
    return createCorsResponse(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch drafts',
      },
      500
    );
  }
}

export async function OPTIONS() {
  return createCorsPreflightResponse();
}
