import { NextRequest } from 'next/server';
import { loadStudioContext } from '@/lib/services';
import { createCorsResponse, createCorsPreflightResponse } from '@/lib/cors';
import { getDraftMetadataService } from '@/lib/database/draftMetadata';

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

    // Query drafts with metadata
    const draftMetadataService = await getDraftMetadataService();
    const metadataList = await draftMetadataService.findByStudioId(studioId);
    // Get Sanity drafts
    const sanityDrafts = await context.sanity.service.queryDrafts({
      type: context.config.selectedSchema || 'article',
    });

    // Combine Sanity drafts with metadata
    const draftsWithMetadata = sanityDrafts.map((draft: any) => {
      const metadata = metadataList.find((m) => m.sanityDraftId === draft._id);
      return {
        _id: draft._id,
        _type: draft._type,
        title: draft.title || 'Untitled',
        status: metadata?.status || 'generated',
        plannedPublishDate: metadata?.plannedPublishDate || '',
        generatedAt:
          metadata?.generatedAt?.toISOString() || new Date().toISOString(),
        approvedAt: metadata?.approvedAt?.toISOString(),
        publishedAt: metadata?.publishedAt?.toISOString(),
        notionPageId: metadata?.notionPageId || '',
        sanityDraftId: draft._id,
        studioId: studioId,
      };
    });

    return createCorsResponse(
      { success: true, drafts: draftsWithMetadata },
      200
    );
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
