// Error messages
export const ERROR_MESSAGES = {
  NOTION_API_KEY_NOT_SET: 'NOTION_API_KEY environment variable not set',
  NOTION_DATABASE_NOT_FOUND:
    'Failed to retrieve database. Check database ID and permissions.',
  NOTION_PAGE_UNEXPECTED_SHAPE: 'NOTION_PAGE_UNEXPECTED_SHAPE',
  NOTION_STATUS_PROPERTY_NOT_FOUND: 'NOTION_STATUS_PROPERTY_NOT_FOUND',
  NOTION_STATUS_PROPERTY_UNSUPPORTED: 'NOTION_STATUS_PROPERTY_UNSUPPORTED',
  NOTION_UPDATE_FAILED: 'Failed to update page status',
  MONGODB_URI_NOT_SET: 'MONGODB_URI not set',
  ENCRYPTION_SECRET_NOT_SET: 'ENCRYPTION_SECRET not set',
  STUDIO_ID_REQUIRED: 'Studio ID required',
  CONFIG_LOAD_FAILED: 'Failed to load configuration',
  CONFIG_SAVE_FAILED: 'Failed to save configuration',
  CONNECTION_TEST_FAILED: 'Connection test failed',
} as const;

// Default values
export const NOTION_DEFAULTS = {
  STATUS_PROPERTY: 'Status',
  UNTITLED_PAGE: 'Untitled Page',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  CONFIG: '/api/config',
  NOTION_TABLE: '/api/notion/table',
  NOTION_STATUS: '/api/notion/status',
  NOTION_TEST: '/api/notion/test',
  CRON_GENERATE_CONTENT: '/api/cron/generate-content',
} as const;

// Database collections
export const COLLECTIONS = {
  CONFIGS: 'configs',
  GENERATIONS: 'generations',
} as const;

// Status values
export const STATUS_VALUES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;
