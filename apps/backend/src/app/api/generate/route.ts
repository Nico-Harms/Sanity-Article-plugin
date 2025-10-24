import { NextRequest } from 'next/server';
import { Client } from '@notionhq/client';
import {
  getConfigByStudioId,
  createLLMService,
  createSanityService,
  createSchemaService,
  decryptSecret,
  extractContentFromProperties,
  extractSubjectFromProperties,
} from '@/lib/services';
import { createCorsResponse, createCorsPreflightResponse } from '@/lib/cors';
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

    // Extract content from Notion page properties
    const notionPageData: NotionPageData = {
      id: notionPage.id,
      properties: notionPage.properties,
      content: extractContentFromProperties(notionPage.properties),
      subject: extractSubjectFromProperties(notionPage.properties),
    };

    // Create LLM service and generate article
    const llmService = createLLMService(llmApiKey, config.llmModel);

    const draft = await llmService.generateArticle(
      notionPageData,
      config.detectedFields,
      config.selectedSchema || 'article'
    );

    // Create Sanity draft document
    let sanityDocId: string | null = null;
    try {
      // Decrypt Sanity credentials
      const sanityProjectId = decryptSecret(config.sanityProjectId);
      const sanityToken = decryptSecret(config.sanityToken);

      // Create services
      const sanityService = createSanityService(
        sanityProjectId,
        sanityToken,
        config.sanityDataset
      );
      const schemaService = createSchemaService(
        sanityProjectId,
        sanityToken,
        config.sanityDataset
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
      const sanityDoc = await sanityService.createDraft(
        schemaType,
        preparedContent
      );

      sanityDocId = sanityDoc._id;
    } catch (sanityError) {
      console.error(
        '[generate-api] Failed to create Sanity draft:',
        sanityError
      );
      // Continue without failing the entire request
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
