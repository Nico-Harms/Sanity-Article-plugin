import { NextRequest } from 'next/server';
import {
  getConfigByStudioId,
  createSanityService,
  decryptSecret,
} from '@/lib/services';
import { createCorsResponse, createCorsPreflightResponse } from '@/lib/cors';

export async function GET(request: NextRequest) {
  try {
    const studioId = request.nextUrl.searchParams.get('studioId');

    if (!studioId) {
      return createCorsResponse({ error: 'studioId is required' }, 400);
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

    // Query drafts
    const drafts = await sanityService.queryDrafts({
      type: config.selectedSchema || 'article',
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
