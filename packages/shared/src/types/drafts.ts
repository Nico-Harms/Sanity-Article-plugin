export type DraftStatus = 'pending_review' | 'approved' | 'published';

export interface DraftWithMetadata {
  _id: string;
  _type: string;
  title: string;
  status: DraftStatus;
  plannedPublishDate: string;
  generatedAt: string;
  approvedAt?: string;
  publishedAt?: string;
  notionPageId: string;
  sanityDraftId: string;
  studioId: string;
}

export interface DraftStats {
  total: number;
  pending: number;
  approved: number;
  published: number;
}

export interface DraftMetadata {
  _id?: string;
  notionPageId: string;
  sanityDraftId: string;
  sanityDocumentType: string;
  studioId: string;
  status: DraftStatus;
  plannedPublishDate: string;
  generatedAt: Date;
  approvedAt?: Date;
  publishedAt?: Date;
  errorMessage?: string;
}
