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
          const draftInfo = {
            sanityDraftId: draft.sanityDraftId,
            notionPageId: draft.notionPageId || 'N/A',
            plannedPublishDate: draft.plannedPublishDate,
            status: draft.status,
            studioId: draft.studioId,
            generatedAt: draft.generatedAt?.toISOString() || 'N/A',
          };

          try {
            console.log(
              `[cron] Attempting to publish draft:`,
              JSON.stringify(draftInfo, null, 2)
            );

            // Check if draft exists before trying to publish
            const draftDoc = await sanityContext.service.getDocument(
              draft.sanityDraftId
            );

            // If draft doesn't exist, check if it's already published
            if (!draftDoc) {
              const publishedId = draft.sanityDraftId.replace('drafts.', '');
              const publishedDoc =
                await sanityContext.service.getDocument(publishedId);

              if (publishedDoc) {
                // Already published, just update metadata
                console.log(
                  `[cron] ✓ Draft ${draft.sanityDraftId} already published (found published version), updating metadata`
                );
                await draftMetadataService.updateStatus(
                  draft.sanityDraftId,
                  'published'
                );
                stats.draftsPublished++;
                continue;
              } else {
                // Neither draft nor published version exists
                const errorDetails = {
                  message: `Draft not found in Sanity`,
                  draftInfo,
                  checkedIds: {
                    draftId: draft.sanityDraftId,
                    publishedId,
                  },
                };
                console.error(
                  `[cron] ✗ Draft not found:`,
                  JSON.stringify(errorDetails, null, 2)
                );
                stats.errors.push(
                  `[${config.studioId}] Draft ${draft.sanityDraftId} not found in Sanity (Notion: ${draft.notionPageId || 'N/A'}, Planned: ${draft.plannedPublishDate})`
                );
                // Don't throw - continue with next draft
                continue;
              }
            }

            // Draft exists, proceed with publishing
            console.log(`[cron] Publishing draft ${draft.sanityDraftId}...`);
            await sanityContext.service.publishDraft(draft.sanityDraftId);
            await draftMetadataService.updateStatus(
              draft.sanityDraftId,
              'published'
            );

            // Update Notion page status to "Published" (best-effort)
            if (draft.notionPageId && config.notionClientSecret) {
              const notionClientSecret = decryptSecret(
                config.notionClientSecret
              );
              await updateNotionStatusSafely(
                draft.notionPageId,
                'Published',
                notionClientSecret
              );
            }

            console.log(
              `[cron] ✓ Successfully published draft ${draft.sanityDraftId}`
            );
            stats.draftsPublished++;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            const errorDetails = {
              message: errorMessage,
              draftInfo,
              errorStack: error instanceof Error ? error.stack : undefined,
            };

            console.error(
              `[cron] ✗ Failed to publish draft:`,
              JSON.stringify(errorDetails, null, 2)
            );

            stats.errors.push(
              `[${config.studioId}] Failed to publish draft ${draft.sanityDraftId} (Notion: ${draft.notionPageId || 'N/A'}, Planned: ${draft.plannedPublishDate}): ${errorMessage}`
            );
            // Don't throw - continue with next draft
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

  // Log summary
  console.log(
    `[cron] Publishing summary:`,
    JSON.stringify(
      {
        studiosProcessed: stats.studiosProcessed,
        draftsPublished: stats.draftsPublished,
        errorsCount: stats.errors.length,
        errors: stats.errors,
      },
      null,
      2
    )
  );

  return stats;
}
