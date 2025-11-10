import { NextRequest } from 'next/server';
import { loadStudioContext, decryptSecret } from '@/lib/services';
import { createCorsResponse, createCorsPreflightResponse } from '@/lib/cors';
import { getDraftMetadataService } from '@/lib/database/draftMetadata';
import { updateNotionStatusSafely } from '@/lib/services/NotionService';

/*===============================================
=          Approve Draft API Route          =
===============================================*/

/**
 * Approve Draft API Route
 *
 * Approves a draft document in Sanity and updates the draft metadata status.
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

    // Approve the document in Sanity
    await context.sanity.service.approveDocument(documentId);

    // Update metadata status
    const draftMetadataService = await getDraftMetadataService();
    await draftMetadataService.updateStatus(documentId, 'approved');

    // Get Notion page ID from metadata and update status to "Ready to publish" (best-effort)
    const metadata = await draftMetadataService.findBySanityDraftId(documentId);
    if (metadata?.notionPageId && context.config.notionClientSecret) {
      const notionClientSecret = decryptSecret(context.config.notionClientSecret);
      await updateNotionStatusSafely(
        metadata.notionPageId,
        'Ready to publish',
        notionClientSecret
      );
    }

    return createCorsResponse({ success: true }, 200);
  } catch (error) {
    console.error('[drafts-approve-api] Failed to approve draft:', error);
    return createCorsResponse(
      {
        error:
          error instanceof Error ? error.message : 'Failed to approve draft',
      },
      500
    );
  }
}

export async function OPTIONS() {
  return createCorsPreflightResponse();
}
