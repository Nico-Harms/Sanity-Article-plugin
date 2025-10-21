import { Collection, Db } from 'mongodb';
import type { PluginConfig } from '@sanity-notion-llm/shared';

export interface GenerationRecord {
  _id?: string;
  configId: string;
  notionPageId: string;
  notionPageTitle: string;
  scheduledDate: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sanityDocumentId?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigRecord extends PluginConfig {
  _id?: string;
}

// Simple collection getters - no need for a class
export const getConfigsCollection = (db: Db): Collection<ConfigRecord> =>
  db.collection<ConfigRecord>('configs');

export const getGenerationsCollection = (
  db: Db
): Collection<GenerationRecord> =>
  db.collection<GenerationRecord>('generations');

// Create indexes for better performance
export async function createDatabaseIndexes(db: Db): Promise<void> {
  try {
    const configs = getConfigsCollection(db);
    const generations = getGenerationsCollection(db);

    // Index for configs collection
    await configs.createIndex({ studioId: 1 }, { unique: true });
    await configs.createIndex({ isActive: 1 });

    // Index for generations collection
    await generations.createIndex({ configId: 1 });
    await generations.createIndex({ status: 1 });
    await generations.createIndex({ scheduledDate: 1 });
    await generations.createIndex({ createdAt: 1 });

    console.log('[database] Indexes created successfully');
  } catch (error) {
    console.error('[database] Failed to create indexes:', error);
    throw error;
  }
}
