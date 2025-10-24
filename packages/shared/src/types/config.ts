export interface DetectedField {
  name: string; // e.g., "bodypart1", "quote", "Author"
  type: string; // e.g., "string", "text", "blockContent"
  title: string; // e.g., "Body Part 1", "Quote"
  enabled: boolean; // User can toggle on/off
  purpose?: string; // User-provided description of what this field should contain
}

export interface PluginConfig {
  studioId: string;
  selectedSchema: string | null;
  detectedFields: DetectedField[]; // NEW - replaces fieldMappings
  notionDatabaseUrl: string;
  notionClientSecret: string;
  llmApiKey: string;
  llmModel: string;
  sanityProjectId: string;
  sanityToken: string;
  sanityDataset: string;
  isActive: boolean;
  errorMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SchemaField {
  name: string;
  type: string;
  title?: string;
  description?: string;
}

export interface SchemaType {
  name: string;
  title: string;
  fields: SchemaField[];
}
