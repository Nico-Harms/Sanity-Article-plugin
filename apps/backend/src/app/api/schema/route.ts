import { NextRequest } from 'next/server';
import { createSchemaService, loadStudioContext } from '@/lib/services';
import { createCorsResponse, createCorsPreflightResponse } from '@/lib/cors';

/**
 * GET /api/schema
 *
 * Fetches schema information for a specific Sanity project
 *
 * Query parameters:
 * - studioId: string (required)
 * - type?: string (optional, specific schema type to fetch)
 *
 * Response:
 * - success: boolean
 * - schemas?: SchemaType[] (if no type specified)
 * - fields?: SchemaField[] (if type specified)
 * - error?: string (if failed)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studioId = searchParams.get('studioId');
    const typeName = searchParams.get('typeName');

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

    const schemaService = createSchemaService(
      context.sanity.projectId,
      context.sanity.token,
      context.sanity.dataset
    );

    if (typeName) {
      // Fetch fields for specific schema type
      const fields = await schemaService.getSchemaFields(typeName);
      return createCorsResponse({ success: true, fields }, 200);
    } else {
      // Fetch all schema types
      const schemas = await schemaService.getSchemaTypes();

      if (schemas.length === 0) {
        return createCorsResponse(
          {
            success: false,
            error:
              'No schema types found in this Sanity project. Please create some documents first.',
          },
          404
        );
      }

      return createCorsResponse({ success: true, schemas }, 200);
    }
  } catch (error) {
    console.error('[schema-api] Failed to fetch schema:', error);

    const response = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return createCorsResponse(response, 500);
  }
}

/**
 * Handle preflight requests
 */
export async function OPTIONS() {
  return createCorsPreflightResponse();
}
