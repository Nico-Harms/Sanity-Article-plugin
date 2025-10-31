import { NextRequest } from 'next/server';
import { isMonday } from '@/lib/cron/helpers';
import { generateWeekContent } from '@/lib/cron/weekGeneration';
import { publishScheduledContent } from '@/lib/cron/dailyPublishing';

/*===============================================
|=          Cron Endpoint          =
===============================================*/

/**
 * GET /api/cron/generate-content
 *
 * Cron job endpoint that:
 * 1. On Monday: Generates drafts for the current week (Monday-Sunday)
 * 2. Daily: Publishes approved drafts scheduled for today
 *
 * Authorization: Requires CRON_SECRET in Authorization header
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[cron] CRON_SECRET environment variable not set');
      return Response.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isMondayToday = isMonday();
    const results = {
      timestamp: new Date().toISOString(),
      isMonday: isMondayToday,
      weekGeneration: null as any,
      dailyPublishing: null as any,
    };

    // Task 1: Generate week content (Monday only)
    if (isMondayToday) {
      console.log('[cron] Starting week generation task (Monday)...');
      results.weekGeneration = await generateWeekContent();
      console.log(
        `[cron] Week generation completed: ${results.weekGeneration.pagesGenerated} pages generated`
      );
    } else {
      results.weekGeneration = {
        skipped: true,
        reason: 'Not Monday - week generation only runs on Mondays',
      };
    }

    // Task 2: Publish scheduled content (daily)
    console.log('[cron] Starting daily publishing task...');
    results.dailyPublishing = await publishScheduledContent();
    console.log(
      `[cron] Daily publishing completed: ${results.dailyPublishing.draftsPublished} drafts published`
    );

    return Response.json(results, { status: 200 });
  } catch (error) {
    console.error('[cron] Cron job failed:', error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
