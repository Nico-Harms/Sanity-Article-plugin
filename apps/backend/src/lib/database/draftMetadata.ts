import { MongoClient, Db, Collection } from 'mongodb';

export interface DraftMetadata {
  _id?: string;
  notionPageId: string;
  sanityDraftId: string;
  sanityDocumentType: string;
  studioId: string;
  status:
    | 'generated'
    | 'pending_review'
    | 'approved'
    | 'scheduled'
    | 'published'
    | 'rejected';
  plannedPublishDate: string; // ISO date string from Notion
  generatedAt: Date;
  approvedAt?: Date;
  publishedAt?: Date;
  rejectedAt?: Date;
  errorMessage?: string;
}

/*===============================================
=          DraftMetadataService Class          =
===============================================*/

/**
 * DraftMetadataService Class
 *
 * Manages draft metadata in the database.
 * Handles draft creation, status updates, and statistics.
 *
 * Key Features:
 * - Create draft metadata
 * - Find drafts by studio ID
 * - Find drafts by status
 * - Update draft status
 * - Find drafts for publishing
 * - Delete draft metadata
 */
export class DraftMetadataService {
  private collection: Collection<DraftMetadata>;

  constructor(db: Db) {
    this.collection = db.collection<DraftMetadata>('draft_metadata');
  }

  async createDraftMetadata(
    metadata: Omit<DraftMetadata, '_id'>
  ): Promise<DraftMetadata> {
    const result = await this.collection.insertOne({
      ...metadata,
      generatedAt: new Date(),
    });

    return {
      ...metadata,
      _id: result.insertedId.toString(),
      generatedAt: new Date(),
    };
  }

  async findByStudioId(studioId: string): Promise<DraftMetadata[]> {
    return this.collection
      .find({ studioId })
      .sort({ generatedAt: -1 })
      .toArray();
  }

  async findByStatus(
    studioId: string,
    status: string
  ): Promise<DraftMetadata[]> {
    return this.collection
      .find({ studioId, status: status as DraftMetadata['status'] })
      .sort({ generatedAt: -1 })
      .toArray();
  }

  async updateStatus(
    sanityDraftId: string,
    status: DraftMetadata['status']
  ): Promise<void> {
    const updateData: Partial<DraftMetadata> = { status };

    if (status === 'approved') {
      updateData.approvedAt = new Date();
    } else if (status === 'published') {
      updateData.publishedAt = new Date();
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date();
    }

    await this.collection.updateOne({ sanityDraftId }, { $set: updateData });
  }

  async findDraftsForPublishing(today: string): Promise<DraftMetadata[]> {
    return this.collection
      .find({
        status: 'approved',
        plannedPublishDate: today,
      })
      .toArray();
  }

  async deleteDraftMetadata(sanityDraftId: string): Promise<void> {
    await this.collection.deleteOne({ sanityDraftId });
  }

  async getStats(studioId: string) {
    const pipeline = [
      { $match: { studioId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ];

    const results = await this.collection.aggregate(pipeline).toArray();
    const statusCounts = Object.fromEntries(
      results.map((r) => [r._id, r.count])
    );

    return {
      total: results.reduce((sum, r) => sum + r.count, 0),
      pending:
        (statusCounts.generated || 0) + (statusCounts.pending_review || 0),
      approved: (statusCounts.approved || 0) + (statusCounts.scheduled || 0),
      published: statusCounts.published || 0,
      rejected: statusCounts.rejected || 0,
    };
  }
}

let draftMetadataService: DraftMetadataService | null = null;
let mongoClient: MongoClient | null = null;

export async function getDraftMetadataService(): Promise<DraftMetadataService> {
  if (!draftMetadataService) {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    const db = mongoClient.db();
    draftMetadataService = new DraftMetadataService(db);
  }

  return draftMetadataService;
}
