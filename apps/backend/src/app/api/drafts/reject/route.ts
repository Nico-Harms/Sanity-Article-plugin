import { NextRequest } from 'next/server';
import { loadStudioContext } from '@/lib/services';
import { createCorsResponse, createCorsPreflightResponse } from '@/lib/cors';
import { getDraftMetadataService } from '@/lib/database/draftMetadata';

/*===============================================
=          Reject Draft API Route          =
===============================================*/

/**
 * Reject Draft API Route
 *
 * Rejects a draft document in Sanity and updates the draft metadata status.
 *
 * @param request - The HTTP request containing studioId and documentId
 * @returns A CORS response with success or error status
 */

export async function POST(request: NextRequest) {
  try {
    const { studioId, documentId } = await request.json();

    if (!studioId || !documentId) {
      return createCorsResponse(
        { error: 'studioId and documentId are required' },
        400
      );
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

    // Reject the document in Sanity
    await context.sanity.service.rejectDocument(documentId);

    // Update metadata status
    const draftMetadataService = await getDraftMetadataService();
    await draftMetadataService.updateStatus(documentId, 'rejected');

    return createCorsResponse({ success: true }, 200);
  } catch (error) {
    console.error('[drafts-reject-api] Failed to reject draft:', error);
    return createCorsResponse(
      {
        error:
          error instanceof Error ? error.message : 'Failed to reject draft',
      },
      500
    );
  }
}

export async function OPTIONS() {
  return createCorsPreflightResponse();
}
