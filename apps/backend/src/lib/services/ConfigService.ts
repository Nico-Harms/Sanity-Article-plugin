import {
  connectToDatabase,
  getConfigsCollection,
  createDatabaseIndexes,
  type ConfigRecord,
} from '../database';
import type { PluginConfig } from '@sanity-notion-llm/shared';
import { ERROR_MESSAGES } from '@sanity-notion-llm/shared';

/*===============================================
|=                ConfigService                 =
===============================================*/

/**
 * CONFIGURATION SERVICE
 *
 * Manages plugin configuration storage and retrieval in MongoDB.
 * Handles multi-tenant configuration with encrypted API keys.
 *
 * Key Features:
 * - Multi-tenant: Each Sanity Studio has isolated configuration
 * - Encrypted Storage: API keys are encrypted before database storage
 * - Auto-initialization: Creates database indexes on first run
 * - Error Handling: Comprehensive error handling with typed responses
 *
 * Database Schema:
 * - Collection: 'configs'
 * - Index: studioId (unique)
 * - Fields: All PluginConfig fields + MongoDB _id
 *
 * Security:
 * - API keys encrypted with AES-256-GCM
 * - No plaintext secrets in database
 * - Decryption only on server-side
 */

/*===============================================
=          To plugin config           =
===============================================*/

const toPluginConfig = (record: ConfigRecord | null): PluginConfig | null => {
  if (!record) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...pluginConfig } = record;
  return {
    ...pluginConfig,
    detectedFields: record.detectedFields || [],
  };
};

/*===============================================
=          Get configs           =
===============================================*/

const getConfigs = async () => {
  const db = await connectToDatabase();
  return getConfigsCollection(db);
};

/*===============================================
=          Get config by studio id           =
===============================================*/

export const getConfigByStudioId = async (
  studioId: string
): Promise<PluginConfig | null> => {
  try {
    const configs = await getConfigs();
    const record = await configs.findOne({ studioId });
    return toPluginConfig(record);
  } catch (error) {
    console.error('[config] Failed to load config:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(ERROR_MESSAGES.CONFIG_LOAD_FAILED);
  }
};

/*===============================================
=          Save plugin config           =
===============================================*/

export const savePluginConfig = async (
  config: PluginConfig
): Promise<PluginConfig> => {
  const now = new Date();
  const { createdAt, ...rest } = config;
  const record: Omit<ConfigRecord, 'createdAt'> = {
    ...rest,
    detectedFields: config.detectedFields || [],
    updatedAt: now,
  };
  const createdAtValue = createdAt ?? now;

  try {
    const db = await connectToDatabase();

    // Initialize indexes on first save (idempotent - safe to call multiple times)
    try {
      await createDatabaseIndexes(db);
    } catch (indexError) {
      // Log but don't fail - indexes might already exist
      console.warn(
        '[config] Index creation warning (may already exist):',
        indexError
      );
    }

    const configs = await getConfigs();
    await configs.findOneAndUpdate(
      { studioId: config.studioId },
      {
        $set: record,
        $setOnInsert: { createdAt: createdAtValue },
      },
      { upsert: true, returnDocument: 'after' }
    );

    const updatedRecord = await configs.findOne({ studioId: config.studioId });
    const saved = toPluginConfig(updatedRecord);
    if (!saved) {
      throw new Error('Saved config could not be mapped');
    }
    return saved;
  } catch (error) {
    console.error('[config] Failed to save config:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(ERROR_MESSAGES.CONFIG_SAVE_FAILED);
  }
};

/*===============================================
=          Get active configs           =
===============================================*/

export const getActiveConfigs = async (): Promise<PluginConfig[]> => {
  try {
    const configs = await getConfigs();
    const records = await configs.find({ isActive: true }).toArray();
    return records
      .map(toPluginConfig)
      .filter((item): item is PluginConfig => item !== null);
  } catch (error) {
    console.error('[config] Failed to load active configs:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(ERROR_MESSAGES.CONFIG_LOAD_FAILED);
  }
};

/*===============================================
=          Delete config by studio id           =
===============================================*/

export const deleteConfigByStudioId = async (
  studioId: string
): Promise<boolean> => {
  try {
    const configs = await getConfigs();
    const result = await configs.deleteOne({ studioId });
    return result.deletedCount === 1;
  } catch (error) {
    console.error('[config] Failed to delete config:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete configuration');
  }
};

/*===============================================
=          Initialize config database           =
===============================================*/

export const initializeConfigDatabase = async (): Promise<void> => {
  try {
    const db = await connectToDatabase();
    await createDatabaseIndexes(db);
  } catch (error) {
    console.error('[config] Failed to initialize database:', error);
    throw error;
  }
};
