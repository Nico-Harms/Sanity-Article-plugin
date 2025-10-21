import {
  connectToDatabase,
  getConfigsCollection,
  createDatabaseIndexes,
  type ConfigRecord,
} from '../database';
import type { PluginConfig } from '@sanity-notion-llm/shared';
import { ERROR_MESSAGES } from '@sanity-notion-llm/shared';

export class ConfigService {
  private static async getConfigsCollection() {
    const db = await connectToDatabase();
    return getConfigsCollection(db);
  }

  static async getByStudioId(studioId: string): Promise<PluginConfig | null> {
    try {
      const configs = await this.getConfigsCollection();
      const config = await configs.findOne({ studioId });

      if (!config) {
        return null;
      }

      // Remove MongoDB-specific fields
      const { _id, ...pluginConfig } = config;
      return pluginConfig;
    } catch (error) {
      console.error(
        '[config-service] Failed to get config by studio ID:',
        error
      );
      throw new Error(ERROR_MESSAGES.CONFIG_LOAD_FAILED);
    }
  }

  static async createOrUpdate(config: PluginConfig): Promise<PluginConfig> {
    try {
      const configs = await this.getConfigsCollection();
      const now = new Date();

      const configRecord: ConfigRecord = {
        ...config,
        updatedAt: now,
        createdAt: config.createdAt || now,
      };

      const result = await configs.findOneAndUpdate(
        { studioId: config.studioId },
        {
          $set: configRecord,
          $setOnInsert: { createdAt: now },
        },
        {
          upsert: true,
          returnDocument: 'after',
        }
      );

      if (!result) {
        throw new Error('Failed to create or update config');
      }

      // Remove MongoDB-specific fields
      const { _id, ...pluginConfig } = result;
      return pluginConfig;
    } catch (error) {
      console.error(
        '[config-service] Failed to create or update config:',
        error
      );
      throw new Error(ERROR_MESSAGES.CONFIG_SAVE_FAILED);
    }
  }

  static async getAllActive(): Promise<PluginConfig[]> {
    try {
      const configs = await this.getConfigsCollection();
      const activeConfigs = await configs.find({ isActive: true }).toArray();

      return activeConfigs.map(({ _id, ...config }) => config);
    } catch (error) {
      console.error(
        '[config-service] Failed to get all active configs:',
        error
      );
      throw new Error(ERROR_MESSAGES.CONFIG_LOAD_FAILED);
    }
  }

  static async deleteByStudioId(studioId: string): Promise<boolean> {
    try {
      const configs = await this.getConfigsCollection();
      const result = await configs.deleteOne({ studioId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('[config-service] Failed to delete config:', error);
      throw new Error('Failed to delete configuration');
    }
  }

  static async initializeDatabase(): Promise<void> {
    try {
      const db = await connectToDatabase();
      await createDatabaseIndexes(db);
    } catch (error) {
      console.error('[config-service] Failed to initialize database:', error);
      throw error;
    }
  }
}
