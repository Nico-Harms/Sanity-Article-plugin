import { MongoClient, Db } from 'mongodb';
import { ERROR_MESSAGES } from '@sanity-notion-llm/shared';

/*===============================================
=          MongoDB Connection Singleton       =
===============================================*/

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(ERROR_MESSAGES.MONGODB_URI_NOT_SET);
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('notion-llm-plugin');

    return db;
  } catch (error) {
    console.error('[database] Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
