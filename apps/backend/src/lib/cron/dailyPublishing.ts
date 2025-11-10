import {
  getActiveConfigs,
  createSanityContextFromConfig,
  decryptSecret,
} from '@/lib/services';
import { getDraftMetadataService } from '@/lib/database/draftMetadata';
import { updateNotionStatusSafely } from '@/lib/services/NotionService';

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
    const draftMetadataService = await getDraftMetadataService();

    // Get all approved drafts scheduled for today
    const draftsToPublish =
      await draftMetadataService.findDraftsForPublishing(today);

    // Group drafts by studioId
    const draftsByStudio = new Map<string, typeof draftsToPublish>();
    for (const draft of draftsToPublish) {
      if (!draftsByStudio.has(draft.studioId)) {
        draftsByStudio.set(draft.studioId, []);
      }
      draftsByStudio.get(draft.studioId)!.push(draft);
    }

    // Process each studio
    for (const config of activeConfigs) {
      const studioDrafts = draftsByStudio.get(config.studioId) || [];

      if (studioDrafts.length === 0) {
        continue; // No drafts to publish for this studio
      }

      try {
        // Validate Sanity configuration
        if (!config.sanityProjectId || !config.sanityToken) {
          stats.errors.push(
            `[${config.studioId}] Missing Sanity configuration`
          );
          continue;
        }

        const sanityContext = createSanityContextFromConfig(config);

        // Publish each draft
        for (const draft of studioDrafts) {
          try {
            await sanityContext.service.publishDraft(draft.sanityDraftId);
            await draftMetadataService.updateStatus(
              draft.sanityDraftId,
              'published'
            );

            // Update Notion page status to "Published" (best-effort)
            if (draft.notionPageId && config.notionClientSecret) {
              const notionClientSecret = decryptSecret(config.notionClientSecret);
              await updateNotionStatusSafely(
                draft.notionPageId,
                'Published',
                notionClientSecret
              );
            }

            stats.draftsPublished++;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            stats.errors.push(
              `[${config.studioId}] Failed to publish draft ${draft.sanityDraftId}: ${errorMessage}`
            );
            console.error(
              `[cron] Failed to publish draft ${draft.sanityDraftId}:`,
              error
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
    console.error('[cron] Failed to publish scheduled content:', error);
    stats.errors.push(
      `Failed to publish scheduled content: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return stats;
}
