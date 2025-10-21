/*===============================================
=         Type Definitions         =
===============================================*/

export interface LogicalField {
  key: string;
  label: string;
  type: 'string' | 'text' | 'reference' | 'image' | 'array';
  required: boolean;
  description?: string;
}

export interface FieldMapping {
  logicalField: string;
  schemaField: string | null;
  enabled: boolean;
}

export interface PluginConfig {
  selectedSchema: string | null;
  fieldMappings: FieldMapping[];
  notionDatabaseUrl: string;
  notionClientSecret: string;
  llmApiKey: string;
  isConnected: boolean;
  lastTested?: Date;
  errorMessage?: string;
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

/*===============================================
=         Logical Fields         =
===============================================*/

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
    type: 'string',
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
    label: 'Cover Image',
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
