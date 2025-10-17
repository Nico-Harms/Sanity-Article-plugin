import { NextResponse } from 'next/server';
import { NotionService } from '@/lib/notion';
import { ERROR_MESSAGES, NOTION_DEFAULTS, HTTP_STATUS } from '@/lib/constants';

/*===============================================
=          Notion table API route           =
===============================================*/

export async function GET() {
  const notionApiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notionApiKey) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.MISSING_API_KEY },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }

  if (!databaseId) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.MISSING_DATABASE_ID },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }

  const notionService = new NotionService(notionApiKey);

  try {
    // Get database info
    const database = await notionService.getDatabase(databaseId);

    if (!database) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.DATABASE_NOT_FOUND },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Query pages
    const pages = await notionService.queryDatabase(
      databaseId,
      NOTION_DEFAULTS.PAGE_SIZE
    );

    return NextResponse.json({
      database: {
        id: database.id,
        title: database.title,
        properties: database.properties,
      },
      pages: pages,
    });
  } catch (error) {
    console.error('[notion-table] API error:', error);

    return NextResponse.json(
      {
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        details:
          error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
