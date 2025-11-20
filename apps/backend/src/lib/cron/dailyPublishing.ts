import {
  getActiveConfigs,
  createSanityContextFromConfig,
  decryptSecret,
} from '@/lib/services';
import {
  getDraftMetadataService,
  type DraftMetadataService,
  type DraftMetadata,
} from '@/lib/database/draftMetadata';
import { updateNotionStatusSafely } from '@/lib/services/NotionService';
import type { PluginConfig } from '@sanity-notion-llm/shared';

/*===============================================
|=          Daily Publishing Task          =
===============================================*/

export interface DailyPublishingResult {
  studiosProcessed: number;
  draftsPublished: number;
  errors: string[];
}

/**
 * Publish all approved drafts scheduled for today
 * Runs daily
 */
export async function publishScheduledContent(): Promise<DailyPublishingResult> {
  const stats: DailyPublishingResult = {
    studiosProcessed: 0,
    draftsPublished: 0,
    errors: [],
  };

  try {
    const activeConfigs = await getActiveConfigs();
    const today = new Date().toISOString().split('T')[0];
    console.log(`[cron] Running daily publishing for date: ${today}`);

    const draftMetadataService = await getDraftMetadataService();

    // Get all approved drafts scheduled for today
    const draftsToPublish =
      await draftMetadataService.findDraftsForPublishing(today);

    console.log(
      `[cron] Found ${draftsToPublish.length} drafts to publish for ${today}`
    );

    // Group drafts by studioId
    const draftsByStudio = new Map<string, typeof draftsToPublish>();
    for (const draft of draftsToPublish) {
      if (!draftsByStudio.has(draft.studioId)) {
        draftsByStudio.set(draft.studioId, []);
      }
      draftsByStudio.get(draft.studioId)!.push(draft);
    }

    // Process each studio
    const activeStudioIds = new Set(activeConfigs.map((c) => c.studioId));

    // Check for orphaned drafts (drafts for studios without active config)
    for (const studioId of draftsByStudio.keys()) {
      if (!activeStudioIds.has(studioId)) {
        console.warn(
          `[cron] Warning: Found drafts for studio ${studioId} but no active configuration found. Skipping publishing for this studio.`
        );
      }
    }

    for (const config of activeConfigs) {
      const studioDrafts = draftsByStudio.get(config.studioId) || [];

      if (studioDrafts.length === 0) {
        continue; // No drafts to publish for this studio
      }

      try {
        const result = await publishDraftsForStudio(
          config,
          studioDrafts,
          draftMetadataService
        );

        stats.draftsPublished += result.publishedCount;
        stats.errors.push(...result.errors);
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
    console.error('[cron] Failed to publish scheduled content:', error);
    stats.errors.push(
      `Failed to publish scheduled content: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return stats;
}

/**
 * Helper to publish drafts for a single studio
 */
async function publishDraftsForStudio(
  config: PluginConfig,
  drafts: DraftMetadata[],
  draftMetadataService: DraftMetadataService
): Promise<{ publishedCount: number; errors: string[] }> {
  const errors: string[] = [];
  let publishedCount = 0;

  // Validate Sanity configuration
  if (!config.sanityProjectId || !config.sanityToken) {
    errors.push(`[${config.studioId}] Missing Sanity configuration`);
    return { publishedCount, errors };
  }

  const sanityContext = createSanityContextFromConfig(config);

  // Publish each draft
  for (const draft of drafts) {
    try {
      await sanityContext.service.publishDraft(draft.sanityDraftId);
      await draftMetadataService.updateStatus(draft.sanityDraftId, 'published');

      // Update Notion page status to "Published" (best-effort)
      if (draft.notionPageId && config.notionClientSecret) {
        const notionClientSecret = decryptSecret(config.notionClientSecret);
        await updateNotionStatusSafely(
          draft.notionPageId,
          'Published',
          notionClientSecret
        );
      }

      publishedCount++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      errors.push(
        `Failed to publish draft ${draft.sanityDraftId}: ${errorMessage}`
      );
      console.error(
        `[cron] Failed to publish draft ${draft.sanityDraftId}:`,
        error
      );
    }
  }

  return { publishedCount, errors };
}
