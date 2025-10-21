import { NextRequest } from 'next/server';
import { ConfigService, EncryptionService } from '@/lib/services';
import { ERROR_MESSAGES } from '@sanity-notion-llm/shared';
import { createCorsResponse } from '@/lib/cors';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studioId = searchParams.get('studioId');

    if (!studioId) {
      return createCorsResponse(
        { error: ERROR_MESSAGES.STUDIO_ID_REQUIRED },
        400
      );
    }

    const config = await ConfigService.getByStudioId(studioId);

    if (!config) {
      return createCorsResponse({ config: null });
    }

    // Decrypt API keys before sending to client
    return createCorsResponse({
      ...config,
      notionClientSecret: EncryptionService.decrypt(config.notionClientSecret),
      llmApiKey: EncryptionService.decrypt(config.llmApiKey),
    });
  } catch (error) {
    console.error('[config-api] GET error:', error);
    return createCorsResponse(
      { error: ERROR_MESSAGES.CONFIG_LOAD_FAILED },
      500
    );
  }
}

export async function OPTIONS() {
  return createCorsResponse({}, 200);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Encrypt API keys before saving
    const encryptedConfig = {
      ...body,
      notionClientSecret: EncryptionService.encrypt(body.notionClientSecret),
      llmApiKey: EncryptionService.encrypt(body.llmApiKey),
    };

    const config = await ConfigService.createOrUpdate(encryptedConfig);
    return createCorsResponse({ success: true, config });
  } catch (error) {
    console.error('[config-api] POST error:', error);
    return createCorsResponse(
      { error: ERROR_MESSAGES.CONFIG_SAVE_FAILED },
      500
    );
  }
}
