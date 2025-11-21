import type { NotionPropertyValue } from '../types/notion';

const mapPlainText = (value: unknown): string => {
  if (!Array.isArray(value)) {
    return '';
  }

  return value
    .map((item) => {
      if (item && typeof item === 'object' && 'plain_text' in item) {
        const textItem = item as { plain_text?: string };
        return textItem.plain_text ?? '';
      }
      return '';
    })
    .join(' ');
};

/**
 * Shared utilities for Notion content extraction
 * Used by both frontend and backend to ensure consistency
 */

/**
 * Extract display text from Notion page properties
 * Looks for common content fields and returns the first available text
 */
export function extractPageDisplayText(
  properties: Record<string, NotionPropertyValue>
): string {
  const contentFields = [
    'Content ',
    'Content',
    'Body',
    'Description',
    'Text',
    'Notes',
    'Name',
    'Title',
    'Subject',
    'Headline',
  ];

  for (const field of contentFields) {
    const property = properties[field];
    if (property) {
      if (property.type === 'rich_text') {
        const text = mapPlainText(property.rich_text);
        if (text.trim()) return text.substring(0, 100);
      }
      if (property.type === 'title') {
        const text = mapPlainText(property.title);
        if (text.trim()) return text;
      }
    }
  }

  return 'Untitled page';
}
