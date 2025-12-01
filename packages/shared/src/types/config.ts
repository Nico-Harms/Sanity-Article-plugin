export interface DetectedField {
  name: string; // unique key (path)
  type: string;
  title: string;
  enabled: boolean;
  purpose?: string;
  path: string;
  parentPath?: string;
  moduleType?: string;
  isArrayItem?: boolean;
  isVirtual?: boolean;
}

export interface PluginConfig {
  studioId: string;
  selectedSchema: string | null;
  detectedFields: DetectedField[]; // NEW - replaces fieldMappings
  notionDatabaseUrl: string;
  notionClientSecret: string;
  /**
   * Name of the Notion date property that should be treated as the planned publish date.
   * Optional to maintain backwards compatibility with legacy configs.
   */
  publishDateProperty?: string;
  llmProvider: 'mistral' | 'openai' | 'gemini' | 'perplexity';
  llmApiKey: string;
  llmModel: string;
  sanityProjectId: string;
  sanityToken: string;
  sanityDataset: string;
  isActive: boolean;
  errorMessage?: string;
  fieldErrors?: Record<string, string>;
  createdAt?: Date;
  updatedAt?: Date;
  // Custom instruction fields for LLM content generation
  generalInstructions?: string;
  toneInstructions?: string;
  fieldInstructions?: string;
}

export interface SchemaField {
  name: string;
  type: string;
  title?: string;
  description?: string;
  path: string;
  parentPath?: string;
  moduleType?: string;
  isArrayItem?: boolean;
  isVirtual?: boolean;
}

export interface SchemaType {
  name: string;
  title: string;
  fields: SchemaField[];
}
