import { NextRequest } from 'next/server';
import {
  getConfigByStudioId,
  createSanityService,
  decryptSecret,
} from '@/lib/services';
import { createCorsResponse, createCorsPreflightResponse } from '@/lib/cors';

export async function POST(request: NextRequest) {
  try {
    const { studioId, documentId } = await request.json();

    if (!studioId || !documentId) {
      return createCorsResponse(
        { error: 'studioId and documentId are required' },
        400
      );
    }

    const config = await getConfigByStudioId(studioId);
    if (!config) {
      return createCorsResponse({ error: 'Configuration not found' }, 404);
    }

    // Decrypt Sanity credentials
    const sanityProjectId = decryptSecret(config.sanityProjectId);
    const sanityToken = decryptSecret(config.sanityToken);

    // Create Sanity service
    const sanityService = createSanityService(
      sanityProjectId,
      sanityToken,
      config.sanityDataset
    );

    // Reject the document (mark as rejected)
    await sanityService.client
      .patch(documentId)
      .set({ _approved: false, _rejected: true })
      .commit();

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
