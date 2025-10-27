import type { PluginConfig } from '@sanity-notion-llm/shared';
import { getConfigByStudioId } from './ConfigService';
import { decryptSecret } from './EncryptionService';
import { createSanityService, SanityService } from './SanityService';

export interface SanityContext {
  projectId: string;
  token: string;
  dataset: string;
  service: SanityService;
}

export interface StudioContext {
  config: PluginConfig;
  sanity: SanityContext;
}

export function createSanityContextFromConfig(
  config: PluginConfig
): SanityContext {
  if (!config.sanityProjectId || !config.sanityToken) {
    throw new Error('Sanity credentials must be configured');
  }

  const projectId = decryptSecret(config.sanityProjectId);
  const token = decryptSecret(config.sanityToken);
  const dataset = config.sanityDataset || 'production';

  return {
    projectId,
    token,
    dataset,
    service: createSanityService(projectId, token, dataset),
  };
}

/**
 * Load the stored configuration for a Studio and return decrypted Sanity credentials.
 * Throws on missing configuration or incomplete credential setup.
 */
export async function loadStudioContext(
  studioId: string
): Promise<StudioContext> {
  const config = await getConfigByStudioId(studioId);
  if (!config) {
    throw new Error('Configuration not found for this Studio');
  }

  return {
    config,
    sanity: createSanityContextFromConfig(config),
  };
}
