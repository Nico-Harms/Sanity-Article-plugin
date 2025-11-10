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

    // Fetch Sanity documents for each metadata entry (both drafts and published)
    const draftsWithMetadata = await Promise.all(
      metadataList.map(async (metadata) => {
        try {
          // Try to fetch the document (could be draft or published)
          const docId = metadata.sanityDraftId;
          let document = await context.sanity.service.getDocument(docId);

          // If not found as draft, try without the 'drafts.' prefix (published document)
          if (!document && docId.startsWith('drafts.')) {
            const publishedId = docId.replace(/^drafts\./, '');
            document = await context.sanity.service.getDocument(publishedId);
          }

          if (!document) {
            console.warn(
              `[drafts-api] Document not found for ${docId}, skipping`
            );
            return null;
          }

          return {
            _id: document._id,
            _type: document._type,
            title: document.title || 'Untitled',
            status: metadata.status,
            plannedPublishDate: metadata.plannedPublishDate || '',
            generatedAt:
              metadata.generatedAt?.toISOString() || new Date().toISOString(),
            approvedAt: metadata.approvedAt?.toISOString(),
            publishedAt: metadata.publishedAt?.toISOString(),
            notionPageId: metadata.notionPageId || '',
            sanityDraftId: metadata.sanityDraftId,
            studioId: studioId,
          };
        } catch (error) {
          console.warn(
            `[drafts-api] Failed to fetch document ${metadata.sanityDraftId}:`,
            error
          );
          return null;
        }
      })
    );

    // Filter out null entries (documents that couldn't be found)
    const validDrafts = draftsWithMetadata.filter((draft) => draft !== null);

    return createCorsResponse({ success: true, drafts: validDrafts }, 200);
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
