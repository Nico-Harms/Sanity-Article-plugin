import { NextRequest } from 'next/server';
import { Client } from '@notionhq/client';
import {
  getConfigByStudioId,
  createLLMService,
  createSchemaService,
  createSanityContextFromConfig,
  createNotionClient,
  decryptSecret,
  extractSubjectFromProperties,
} from '@/lib/services';
import { createCorsResponse, createCorsPreflightResponse } from '@/lib/cors';
import { getDraftMetadataService } from '@/lib/database/draftMetadata';

/*===============================================
=          Helper function to extract planned publish date from Notion page          =
===============================================*/

/**
TODO: Test and add validation for the planned publish date, and clean up the code 
 */
function extractPlannedDateFromNotion(notionPageData: NotionPageData): string {
  // Look for common date field names in Notion properties
  const dateFields = ['Publish Date', 'Planned Date', 'Date', 'Scheduled Date'];

  for (const fieldName of dateFields) {
    const field = notionPageData.properties?.[fieldName];
    if (field && field.type === 'date' && field.date) {
      return field.date.start;
    }
  }

  // Default to today if no date found
  return new Date().toISOString().split('T')[0];
}
import type {
  GenerateRequest,
  GenerateResponse,
  NotionPageData,
} from '@sanity-notion-llm/shared';

/**
 * POST /api/generate
 *
 * Generates Sanity article draft from Notion page content using LLM
 *
 * Request body:
 * - studioId: string (required)
 * - notionPageId: string (required)
 *
 * Response:
 * - success: boolean
 * - draft?: SanityDraftData (if successful)
 * - error?: string (if failed)
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { studioId, notionPageId } = body;

    // Validate required fields
    if (!studioId) {
      return createCorsResponse({ error: 'studioId is required' }, 400);
    }

    if (!notionPageId) {
      return createCorsResponse({ error: 'notionPageId is required' }, 400);
    }

    // Load configuration from database
    const config = await getConfigByStudioId(studioId);
    if (!config) {
      return createCorsResponse(
        { error: 'Configuration not found for this Studio' },
        404
      );
    }

    // Validate LLM configuration
    if (!config.llmApiKey || !config.llmModel) {
      return createCorsResponse(
        { error: 'LLM API key and model must be configured' },
        400
      );
    }

    // Decrypt API keys
    const notionClientSecret = decryptSecret(config.notionClientSecret);
    const llmApiKey = decryptSecret(config.llmApiKey);

    // Create Notion client and fetch page data
    const notionClient = new Client({ auth: notionClientSecret });

    const notionPage = await notionClient.pages.retrieve({
      page_id: notionPageId,
    });

    // Check if it's a full page response with properties
    if (!('properties' in notionPage)) {
      throw new Error('Page not found or not accessible');
    }

    // Fetch the actual page content (notes/content tab)
    const notionService = createNotionClient(notionClientSecret);
    const pageContent = await notionService.getPageContent(notionPageId);

    // Extract content from Notion page properties
    const notionPageData: NotionPageData = {
      id: notionPage.id,
      properties: notionPage.properties,
      content: pageContent, // Use actual page content instead of properties
      subject: extractSubjectFromProperties(notionPage.properties),
    };

    // Create LLM service and generate article
    const llmService = createLLMService(llmApiKey, config.llmModel);

    const draft = await llmService.generateArticle(
      notionPageData,
      config.detectedFields,
      config.selectedSchema || 'article',
      config
    );

    // Create Sanity draft document
    let sanityDocId: string | null = null;
    if (config.sanityProjectId && config.sanityToken) {
      try {
        const sanityContext = createSanityContextFromConfig(config);
        const schemaService = createSchemaService(
          sanityContext.projectId,
          sanityContext.token,
          sanityContext.dataset
        );

        // Prepare content for the specific schema
        const schemaType = config.selectedSchema || 'article';
        const rawContent = {
          ...draft,
          publishDate: notionPageData.properties.Date, // from Notion
        };

        const preparedContent = await schemaService.prepareContentForSchema(
          rawContent,
          schemaType
        );

        // Create draft document
        const sanityDoc = await sanityContext.service.createDraft(
          schemaType,
          preparedContent
        );

        sanityDocId = sanityDoc._id;

        // Create draft metadata for tracking
        try {
          const draftMetadataService = await getDraftMetadataService();
          await draftMetadataService.createDraftMetadata({
            notionPageId,
            sanityDraftId: sanityDoc._id,
            sanityDocumentType: schemaType,
            studioId,
            status: 'pending_review',
            plannedPublishDate: extractPlannedDateFromNotion(notionPageData),
            generatedAt: new Date(),
          });
        } catch (metadataError) {
          console.error(
            '[generate-api] Failed to create draft metadata:',
            metadataError
          );
          // Continue without failing the entire request
        }
      } catch (sanityError) {
        console.error(
          '[generate-api] Failed to create Sanity draft:',
          sanityError
        );
        // Continue without failing the entire request
      }
    }

    const response: GenerateResponse = {
      success: true,
      draft,
      sanityDocId: sanityDocId ?? undefined,
    };

    return createCorsResponse(response, 200);
  } catch (error) {
    console.error('[generate-api] Generation failed:', error);

    const response: GenerateResponse = {
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
