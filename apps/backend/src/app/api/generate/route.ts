import { NextRequest } from 'next/server';
import { Client } from '@notionhq/client';
import {
  getConfigByStudioId,
  createLLMService,
  decryptSecret,
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
    console.log('[generate-api] Starting generation request');

    const body: GenerateRequest = await request.json();
    const { studioId, notionPageId } = body;

    // Validate required fields
    if (!studioId) {
      return createCorsResponse({ error: 'studioId is required' }, 400);
    }

    if (!notionPageId) {
      return createCorsResponse({ error: 'notionPageId is required' }, 400);
    }

    console.log(
      `[generate-api] Generating content for studio: ${studioId}, page: ${notionPageId}`
    );

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

    console.log(`[generate-api] Fetching Notion page: ${notionPageId}`);
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

    console.log(
      `[generate-api] Notion page data extracted, content length: ${notionPageData.content.length}`
    );

    // Create LLM service and generate article
    const llmService = createLLMService(llmApiKey, config.llmModel);

    console.log(
      `[generate-api] Generating article with model: ${config.llmModel}`
    );
    const draft = await llmService.generateArticle(
      notionPageData,
      config.fieldMappings,
      config.selectedSchema || 'article'
    );

    console.log(`[generate-api] Article generated successfully`);

    const response: GenerateResponse = {
      success: true,
      draft,
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

/**
 * Extract main content from Notion page properties
 * Looks for common content fields like "Content", "Body", "Description", etc.
 */
function extractContentFromProperties(properties: Record<string, any>): string {
  const contentFields = [
    'Content ',
    'Content',
    'Body',
    'Description',
    'Text',
    'Notes',
  ];

  for (const field of contentFields) {
    const property = properties[field];
    if (property) {
      // Handle different Notion property types
      if (property.type === 'rich_text' && property.rich_text) {
        return property.rich_text.map((text: any) => text.plain_text).join(' ');
      }
      if (property.type === 'title' && property.title) {
        return property.title.map((text: any) => text.plain_text).join(' ');
      }
      if (property.type === 'text' && property.text) {
        return property.text.map((text: any) => text.plain_text).join(' ');
      }
    }
  }

  // Fallback: return first available text content
  for (const [, property] of Object.entries(properties)) {
    if (property && typeof property === 'object') {
      if (property.rich_text && property.rich_text.length > 0) {
        return property.rich_text.map((text: any) => text.plain_text).join(' ');
      }
      if (property.title && property.title.length > 0) {
        return property.title.map((text: any) => text.plain_text).join(' ');
      }
    }
  }

  return 'No content found';
}

/**
 * Extract subject/topic from Notion page properties
 * Looks for common subject fields like "Subject", "Topic", "Title", etc.
 */
function extractSubjectFromProperties(properties: Record<string, any>): string {
  const subjectFields = ['Subject', 'Topic', 'Title', 'Name', 'Headline'];

  for (const field of subjectFields) {
    const property = properties[field];
    if (property) {
      // Handle different Notion property types
      if (property.type === 'title' && property.title) {
        return property.title.map((text: any) => text.plain_text).join(' ');
      }
      if (property.type === 'rich_text' && property.rich_text) {
        return property.rich_text.map((text: any) => text.plain_text).join(' ');
      }
      if (property.type === 'text' && property.text) {
        return property.text.map((text: any) => text.plain_text).join(' ');
      }
    }
  }

  // Fallback: return first available title content
  for (const [, property] of Object.entries(properties)) {
    if (
      property &&
      property.type === 'title' &&
      property.title &&
      property.title.length > 0
    ) {
      return property.title.map((text: any) => text.plain_text).join(' ');
    }
  }

  return 'Untitled';
}
