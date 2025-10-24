import { NextRequest } from 'next/server';
import {
  getConfigByStudioId,
  createSchemaService,
  decryptSecret,
} from '@/lib/services';
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

    // Load configuration from database
    const config = await getConfigByStudioId(studioId);
    if (!config) {
      return createCorsResponse(
        { error: 'Configuration not found for this Studio' },
        404
      );
    }

    // Validate Sanity configuration
    if (!config.sanityProjectId || !config.sanityToken) {
      return createCorsResponse(
        { error: 'Sanity credentials must be configured' },
        400
      );
    }

    // Decrypt Sanity credentials
    const sanityProjectId = decryptSecret(config.sanityProjectId);
    const sanityToken = decryptSecret(config.sanityToken);

    // Create schema service
    const schemaService = createSchemaService(
      sanityProjectId,
      sanityToken,
      config.sanityDataset
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
