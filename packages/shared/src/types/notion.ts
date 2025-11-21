export type NotionPropertyValue = {
  type?: string;
} & Record<string, unknown>;

export interface NotionPage {
  id: string;
  url: string;
  title: string;
  /**
   * Raw Notion property payload as returned by the API.
   * Consumers that need display text should use helpers that
   * understand Notion property shapes.
   */
  properties: Record<string, NotionPropertyValue>;
  /**
   * Convenience map of simplified property values. These are
   * derived from the raw properties and are useful when callers
   * just need primitive data.
   */
  propertyValues: Record<string, unknown>;
  /**
   * The actual page content/notes as plain text extracted from Notion blocks.
   * This contains the main content area of the page (the "notes" tab).
   */
  content?: string;
}

export interface NotionDatabase {
  id: string;
  title: string;
  properties: Record<string, NotionPropertyValue>;
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
