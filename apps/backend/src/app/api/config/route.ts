import { NextRequest } from 'next/server';
import {
  getConfigByStudioId,
  savePluginConfig,
  encryptSecret,
  decryptSecret,
} from '@/lib/services';
import { createCorsResponse, createCorsPreflightResponse } from '@/lib/cors';
import {
  normalizeFieldMappings,
  normalizeOptionalString,
} from '@sanity-notion-llm/shared';

const safeDecrypt = (value?: string | null): string => {
  if (!value || !value.trim()) return '';
  try {
    return decryptSecret(value);
  } catch (error) {
    console.error('[config-api] Failed to decrypt value:', error);
    return '';
  }
};

const encryptIfPresent = (value: unknown): string =>
  typeof value === 'string' && value.trim().length > 0
    ? encryptSecret(value)
    : '';

const formatConfigForClient = (config: any) => ({
  ...config,
  notionClientSecret: safeDecrypt(config?.notionClientSecret),
  llmApiKey: safeDecrypt(config?.llmApiKey),
  selectedSchema: normalizeOptionalString(config?.selectedSchema),
  fieldMappings: normalizeFieldMappings(config?.fieldMappings),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studioId = searchParams.get('studioId');

    if (!studioId) {
      return createCorsResponse({ error: 'Studio ID required' }, 400);
    }

    const config = await getConfigByStudioId(studioId);

    if (!config) {
      return createCorsResponse({ config: null });
    }

    return createCorsResponse({ config: formatConfigForClient(config) });
  } catch (error) {
    console.error('[config-api] GET error:', error);
    return createCorsResponse({ error: 'Failed to load configuration' }, 500);
  }
}

export async function OPTIONS() {
  return createCorsPreflightResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Encrypt API keys before saving (only if they have values)
    const encryptedConfig = {
      ...body,
      notionClientSecret: encryptIfPresent(body.notionClientSecret),
      llmApiKey: encryptIfPresent(body.llmApiKey),
      fieldMappings: normalizeFieldMappings(body.fieldMappings),
      selectedSchema: normalizeOptionalString(body.selectedSchema),
      notionDatabaseUrl:
        typeof body.notionDatabaseUrl === 'string'
          ? body.notionDatabaseUrl.trim()
          : '',
    };

    const config = await savePluginConfig(encryptedConfig);
    return createCorsResponse({
      success: true,
      config: formatConfigForClient(config),
    });
  } catch (error) {
    console.error('[config-api] POST error:', error);
    return createCorsResponse(
      {
        error: 'Failed to save configuration',
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
}
