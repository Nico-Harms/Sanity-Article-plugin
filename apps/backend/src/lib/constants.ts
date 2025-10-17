/**
 * Centralized constants for the Notion API backend
 * Single source of truth for error messages, API responses, and default values
 */

export const ERROR_MESSAGES = {
  // Environment variables
  MISSING_API_KEY: 'NOTION_API_KEY environment variable not set',
  MISSING_DATABASE_ID: 'NOTION_DATABASE_ID environment variable not set',

  // Notion API errors
  DATABASE_NOT_FOUND:
    'Failed to retrieve database. Check database ID and permissions.',
  CONNECTION_FAILED: 'Failed to connect to Notion API',
  STATUS_UPDATE_FAILED: 'Failed to update page status',
  STATUS_PROPERTY_NOT_FOUND: 'Status property not found on page',
  STATUS_PROPERTY_UNSUPPORTED:
    'Status property must be a Notion status or select field',

  // Generic errors
  INTERNAL_ERROR: 'Internal server error',
  UNKNOWN_ERROR: 'Unknown error',
  INVALID_PAYLOAD: 'Invalid request payload',
  MISSING_PAGE_ID: 'pageId is required',
  MISSING_STATUS_VALUE: 'status is required',
} as const;

export const NOTION_DEFAULTS = {
  PAGE_SIZE: 10,
  UNTITLED_DATABASE: 'Untitled Database',
  UNTITLED_PAGE: 'Untitled',
  STATUS_PROPERTY: 'Status',
} as const;

export const HTTP_STATUS = {
  BAD_REQUEST: 400,
  OK: 200,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;
