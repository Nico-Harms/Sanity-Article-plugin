import { NextRequest } from 'next/server';
import { loadStudioContext } from '@/lib/services';
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

    let context;
    try {
      context = await loadStudioContext(studioId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load configuration';
      const status = message.includes('not found') ? 404 : 400;
      return createCorsResponse({ error: message }, status);
    }

    // Approve the document
    await context.sanity.service.approveDocument(documentId);

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
