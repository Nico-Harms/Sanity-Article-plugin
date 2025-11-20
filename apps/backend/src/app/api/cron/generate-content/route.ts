import { NextRequest } from 'next/server';
import { isMonday } from '@/lib/cron/helpers';
import { generateWeekContent } from '@/lib/cron/weekGeneration';
import { publishScheduledContent } from '@/lib/cron/dailyPublishing';

// Force dynamic rendering - required for cron jobs that use request headers
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
 *
 * Query parameters (for testing):
 * - forceWeekGeneration=true: Force week generation regardless of day
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

    // Allow forcing week generation for manual testing via query parameter
    // Note: Vercel's automatic cron runs don't include query parameters,
    // so forceWeekGeneration will always be false for production cron jobs
    const { searchParams } = new URL(request.url);
    const forceWeekGeneration =
      searchParams.get('forceWeekGeneration') === 'true';

    const isMondayToday = isMonday();
    const shouldGenerateWeek = isMondayToday || forceWeekGeneration;

    const results = {
      timestamp: new Date().toISOString(),
      isMonday: isMondayToday,
      forceWeekGeneration: forceWeekGeneration,
      weekGeneration: null as any,
      dailyPublishing: null as any,
    };

    // Task 1: Generate week content (Monday only, or if forced for testing)
    if (shouldGenerateWeek) {
      results.weekGeneration = await generateWeekContent();
    } else {
      results.weekGeneration = {
        skipped: true,
        reason:
          'Not Monday - week generation only runs on Mondays (use ?forceWeekGeneration=true to test)',
      };
    }

    // Task 2: Publish scheduled content (daily)
    results.dailyPublishing = await publishScheduledContent();

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
