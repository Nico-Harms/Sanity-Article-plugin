export interface NotionPageData {
  id: string;
  properties: Record<string, unknown>;
  content: string; // Main content field
  subject: string; // Topic/subject field
}

export interface SanityDraftData {
  [fieldName: string]: unknown; // Dynamic based on schema
}

export interface GenerateRequest {
  studioId: string;
  notionPageId: string;
}

export interface GenerateResponse {
  success: boolean;
  draft?: SanityDraftData;
  sanityDocId?: string;
  error?: string;
}
