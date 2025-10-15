import { NextResponse } from 'next/server';
import { createNotionService } from '@/lib/notion';

export async function GET() {
  const notionService = createNotionService();

  if (!notionService) {
    return NextResponse.json(
      { error: 'Notion API key not configured' },
      { status: 500 }
    );
  }

  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!databaseId) {
    return NextResponse.json(
      { error: 'Database ID not configured' },
      { status: 400 }
    );
  }

  // Get database and pages
  const database = await notionService.getDatabase(databaseId);
  const pages = await notionService.queryDatabase(databaseId, 10);

  if (!database || !pages) {
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }

  // Transform pages to readable format
  const transformedPages = pages.results.map((page: any) => ({
    id: page.id,
    url: page.url,
    title: notionService.extractTextFromProperty(
      page.properties?.Name || page.properties?.Title
    ),
    properties: Object.keys(page.properties).reduce((acc: any, key: string) => {
      acc[key] = notionService.extractPropertyValue(page.properties[key]);
      return acc;
    }, {}),
  }));

  return NextResponse.json({
    database: {
      id: database.id,
      title: (database as any).title || 'Untitled',
      properties: Object.keys((database as any).properties || {}),
    },
    pages: transformedPages,
  });
}
