import {
  getActiveConfigs,
  createSanityContextFromConfig,
} from '@/lib/services';
import { getDraftMetadataService } from '@/lib/database/draftMetadata';

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
    console.log(
      `[cron] Daily publishing started - Looking for approved drafts scheduled for: ${today} (UTC)`
    );
    console.log(
      `[cron] Found ${activeConfigs.length} active studio configuration(s)`
    );

    const draftMetadataService = await getDraftMetadataService();

    // Get all approved drafts scheduled for today
    const draftsToPublish =
      await draftMetadataService.findDraftsForPublishing(today);

    console.log(
      `[cron] Found ${draftsToPublish.length} approved draft(s) scheduled for today`
    );
    if (draftsToPublish.length > 0) {
      console.log(
        `[cron] Drafts found:`,
        draftsToPublish.map((d) => ({
          sanityDraftId: d.sanityDraftId,
          status: d.status,
          plannedPublishDate: d.plannedPublishDate,
          studioId: d.studioId,
          notionPageId: d.notionPageId,
        }))
      );
    } else {
      console.log(
        `[cron] No approved drafts found scheduled for ${today} (UTC)`
      );
    }

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

      console.log(
        `[cron] Processing studio: ${config.studioId} - ${studioDrafts.length} draft(s) to publish`
      );

      if (studioDrafts.length === 0) {
        continue; // No drafts to publish for this studio
      }

      try {
        // Validate Sanity configuration
        if (!config.sanityProjectId || !config.sanityToken) {
          const errorMsg = `[${config.studioId}] Missing Sanity configuration`;
          console.error(`[cron] ${errorMsg}`);
          stats.errors.push(errorMsg);
          continue;
        }

        console.log(
          `[cron] Sanity config valid for studio ${config.studioId} (projectId: ${config.sanityProjectId})`
        );
        const sanityContext = createSanityContextFromConfig(config);

        // Publish each draft
        for (const draft of studioDrafts) {
          try {
            console.log(
              `[cron] Attempting to publish draft: ${draft.sanityDraftId} (scheduled for ${draft.plannedPublishDate})`
            );
            await sanityContext.service.publishDraft(draft.sanityDraftId);
            console.log(
              `[cron] ✓ Successfully published draft: ${draft.sanityDraftId}`
            );
            await draftMetadataService.updateStatus(
              draft.sanityDraftId,
              'published'
            );
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

        console.log(
          `[cron] ✓ Completed processing studio ${config.studioId} - ${studioDrafts.length} draft(s) published`
        );
        stats.studiosProcessed++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        stats.errors.push(`[${config.studioId}] ${errorMessage}`);
        console.error(
          `[cron] ✗ Error processing studio ${config.studioId}:`,
          error
        );
      }
    }

    console.log(
      `[cron] Daily publishing completed - Published: ${stats.draftsPublished}, Studios processed: ${stats.studiosProcessed}, Errors: ${stats.errors.length}`
    );
  } catch (error) {
    console.error('[cron] ✗ Failed to publish scheduled content:', error);
    stats.errors.push(
      `Failed to publish scheduled content: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return stats;
}
