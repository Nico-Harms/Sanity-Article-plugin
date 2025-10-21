export { connectToDatabase, closeDatabaseConnection } from './connection';
export {
  getConfigsCollection,
  getGenerationsCollection,
  createDatabaseIndexes,
} from './models';
export type { ConfigRecord, GenerationRecord } from './models';
