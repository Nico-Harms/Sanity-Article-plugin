import { Client } from '@notionhq/client';
import type {
  PluginConfig,
  NotionPageData,
  NotionPage,
} from '@sanity-notion-llm/shared';
import {
  getActiveConfigs,
  createLLMService,
  createSchemaService,
  createSanityContextFromConfig,
  createNotionClient,
  decryptSecret,
  extractSubjectFromProperties,
} from '@/lib/services';
import { getDraftMetadataService } from '@/lib/database/draftMetadata';
import {
  getCurrentWeekRange,
  isDateInRange,
  extractPlannedDateFromNotion,
  extractPlannedDateFromNotionPage,
} from './helpers';

/*===============================================
|=          Week Generation Task          =
===============================================*/

export interface WeekGenerationResult {
  studiosProcessed: number;
  pagesGenerated: number;
  errors: string[];
}

/**
 * Generate draft for a single Notion page
 */
async function generateDraftForPage(
  studioId: string,
  notionPageId: string,
  config: PluginConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate LLM configuration
    if (!config.llmApiKey || !config.llmModel) {
      return {
        success: false,
        error: 'LLM API key and model must be configured',
      };
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
      return { success: false, error: 'Page not found or not accessible' };
    }

    // Fetch the actual page content (notes/content tab)
    const notionService = createNotionClient(notionClientSecret);
    const pageContent = await notionService.getPageContent(notionPageId);

    // Extract content from Notion page properties
    const notionPageData: NotionPageData = {
      id: notionPage.id,
      properties: notionPage.properties,
      content: pageContent,
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
    if (config.sanityProjectId && config.sanityToken) {
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
        publishDate: notionPageData.properties.Date,
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

      // Create draft metadata for tracking
      const draftMetadataService = await getDraftMetadataService();
      const plannedDate = extractPlannedDateFromNotion(notionPageData);

      await draftMetadataService.createDraftMetadata({
        notionPageId,
        sanityDraftId: sanityDoc._id,
        sanityDocumentType: schemaType,
        studioId,
        status: 'pending_review',
        plannedPublishDate:
          plannedDate || new Date().toISOString().split('T')[0],
        generatedAt: new Date(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error(
      `[cron] Failed to generate draft for page ${notionPageId}:`,
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate drafts for all Notion pages scheduled for the current week
 * Runs on Mondays only
 */
export async function generateWeekContent(): Promise<WeekGenerationResult> {
  const stats: WeekGenerationResult = {
    studiosProcessed: 0,
    pagesGenerated: 0,
    errors: [],
  };

  try {
    const activeConfigs = await getActiveConfigs();

    for (const config of activeConfigs) {
      try {
        // Validate required configuration
        if (!config.notionDatabaseUrl || !config.notionClientSecret) {
          stats.errors.push(
            `[${config.studioId}] Missing Notion configuration`
          );
          continue;
        }

        // Calculate current week's date range (Monday to Sunday)
        const weekRange = getCurrentWeekRange();

        // Decrypt Notion client secret
        const notionClientSecret = decryptSecret(config.notionClientSecret);
        const notionService = createNotionClient(notionClientSecret);

        // Query Notion database (notionDatabaseUrl contains the database ID)
        const notionPages = await notionService.queryDatabase(
          config.notionDatabaseUrl,
          100
        );

        // Filter pages by date range and check if draft already exists
        const draftMetadataService = await getDraftMetadataService();
        const eligiblePages: NotionPage[] = [];

        for (const page of notionPages) {
          // Extract planned date from page
          const plannedDate = extractPlannedDateFromNotionPage(page);

          if (!plannedDate) {
            continue; // Skip pages without a planned date
          }

          // Check if date falls within current week range
          if (!isDateInRange(plannedDate, weekRange.start, weekRange.end)) {
            continue; // Skip pages outside the date range
          }

          // Check if draft already exists for this page
          const existingDraft = await draftMetadataService.findByNotionPageId(
            config.studioId,
            page.id
          );

          if (existingDraft) {
            continue; // Skip pages that already have drafts
          }

          eligiblePages.push(page);
        }

        // Generate drafts for eligible pages
        for (const page of eligiblePages) {
          const result = await generateDraftForPage(
            config.studioId,
            page.id,
            config
          );

          if (result.success) {
            stats.pagesGenerated++;
          } else {
            stats.errors.push(
              `[${config.studioId}] Failed to generate draft for page ${page.id}: ${result.error}`
            );
          }
        }

        stats.studiosProcessed++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        stats.errors.push(`[${config.studioId}] ${errorMessage}`);
        console.error(
          `[cron] Error processing studio ${config.studioId}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error('[cron] Failed to generate week content:', error);
    stats.errors.push(
      `Failed to generate week content: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return stats;
}
