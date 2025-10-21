import { NextRequest, NextResponse } from 'next/server';
import { ConfigService } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[cron] CRON_SECRET environment variable not set');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[cron] Invalid authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[cron] Content generation triggered');

    // TODO: Implement content generation logic
    // 1. Get all active configurations from database
    // 2. For each configuration:
    //    - Query Notion database for pages with scheduled dates
    //    - Generate content using LLM
    //    - Create Sanity documents
    //    - Update Notion page status

    const activeConfigs = await ConfigService.getAllActive();
    console.log(`[cron] Found ${activeConfigs.length} active configurations`);

    // Placeholder response
    return NextResponse.json({
      success: true,
      message: 'Content generation scheduled (not implemented yet)',
      activeConfigs: activeConfigs.length,
    });
  } catch (error) {
    console.error('[cron] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
