export interface LogicalField {
  key: string;
  label: string;
  type: 'string' | 'text' | 'reference' | 'image' | 'array' | 'slug';
  required: boolean;
  description?: string;
}

export interface FieldMapping {
  logicalField: string;
  schemaField: string | null;
  enabled: boolean;
}

export interface PluginConfig {
  studioId: string;
  selectedSchema: string | null;
  fieldMappings: FieldMapping[];
  notionDatabaseUrl: string;
  notionClientSecret: string;
  llmApiKey: string;
  llmModel: string;
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

// Logical fields that the plugin supports
export const LOGICAL_FIELDS: LogicalField[] = [
  {
    key: 'title',
    label: 'Title',
    type: 'string',
    required: true,
    description: 'Main title/headline of the content',
  },
  {
    key: 'body',
    label: 'Body Content',
    type: 'text',
    required: true,
    description: 'Main content/body text',
  },
  {
    key: 'slug',
    label: 'Slug',
    type: 'slug',
    required: false,
    description: 'URL-friendly identifier',
  },
  {
    key: 'excerpt',
    label: 'Excerpt',
    type: 'string',
    required: false,
    description: 'Short description/summary',
  },
  {
    key: 'author',
    label: 'Author',
    type: 'reference',
    required: false,
    description: 'Content author',
  },
  {
    key: 'image',
    label: 'Main Image',
    type: 'image',
    required: false,
    description: 'Main/cover image',
  },
  {
    key: 'tags',
    label: 'Tags',
    type: 'array',
    required: false,
    description: 'Content tags/categories',
  },
  {
    key: 'citations',
    label: 'Citations',
    type: 'array',
    required: false,
    description: 'References and citations',
  },
];
