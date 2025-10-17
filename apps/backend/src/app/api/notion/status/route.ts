import { NextResponse } from 'next/server';
import { NotionService } from '@/lib/notion';
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  NOTION_DEFAULTS,
} from '@/lib/constants';
import type { NotionStatusUpdatePayload } from '@/types/notion';

export async function PATCH(request: Request) {
  const notionApiKey = process.env.NOTION_API_KEY;

  if (!notionApiKey) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.MISSING_API_KEY },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }

  let payload: Partial<NotionStatusUpdatePayload> | undefined;

  try {
    payload = (await request.json()) as Partial<NotionStatusUpdatePayload>;
  } catch {
    return NextResponse.json(
      { error: ERROR_MESSAGES.INVALID_PAYLOAD },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  const pageId = payload?.pageId;
  const status = payload?.status;
  const propertyName =
    payload?.propertyName ?? NOTION_DEFAULTS.STATUS_PROPERTY;

  if (!pageId) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.MISSING_PAGE_ID },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  if (!status) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.MISSING_STATUS_VALUE },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  if (typeof propertyName !== 'string') {
    return NextResponse.json(
      { error: ERROR_MESSAGES.INVALID_PAYLOAD },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  const notionService = new NotionService(notionApiKey);

  try {
    const updatedPage = await notionService.updatePageStatus(
      pageId,
      status,
      propertyName
    );

    return NextResponse.json({ page: updatedPage }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('[notion-status] API error:', error);

    if (error instanceof Error) {
      if (error.message === 'NOTION_STATUS_PROPERTY_NOT_FOUND') {
        return NextResponse.json(
          { error: ERROR_MESSAGES.STATUS_PROPERTY_NOT_FOUND },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }

      if (error.message === 'NOTION_STATUS_PROPERTY_UNSUPPORTED') {
        return NextResponse.json(
          { error: ERROR_MESSAGES.STATUS_PROPERTY_UNSUPPORTED },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
    }

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
