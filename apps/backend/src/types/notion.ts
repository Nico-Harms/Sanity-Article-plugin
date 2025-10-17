export interface NotionDatabase {
  id: string;
  title: string;
  properties: string[];
}

export interface NotionPage {
  id: string;
  url: string;
  title: string;
  properties: Record<string, unknown>;
}

export interface NotionStatusUpdatePayload {
  pageId: string;
  status: string;
  propertyName?: string;
}
