import { NextRequest } from 'next/server';
import { createCorsResponse, createCorsPreflightResponse } from '@/lib/cors';
import { getDraftMetadataService } from '@/lib/database/draftMetadata';

/*===============================================
=          Drafts Stats API Route          =
===============================================*/

//TODO: Check if the endpoint is working as expected, and clean up the code
/**
 * Drafts Stats API Route
 *
 * Fetches the statistics for the drafts in the database.
 *
 * @param request - The HTTP request containing studioId
 * @returns A CORS response with the statistics
 */

export async function OPTIONS() {
  return createCorsPreflightResponse();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studioId = searchParams.get('studioId');

    if (!studioId) {
      return createCorsResponse({ error: 'Studio ID is required' }, 400);
    }

    const draftMetadataService = await getDraftMetadataService();
    const stats = await draftMetadataService.getStats(studioId);

    return createCorsResponse({ stats });
  } catch (error) {
    console.error('[drafts-stats] Error fetching stats:', error);
    return createCorsResponse(
      { error: 'Failed to fetch draft statistics' },
      500
    );
  }
}
