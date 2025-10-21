export interface NotionPage {
  id: string;
  url: string;
  title: string;
  properties: Record<string, unknown>;
}

export interface NotionDatabase {
  id: string;
  title: string;
  properties: Record<string, unknown>;
}

export interface NotionProperty {
  id: string;
  name: string;
  type: string;
}

export interface NotionStatusUpdate {
  pageId: string;
  status: string;
  propertyName?: string;
}
