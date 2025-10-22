/**
 * Shared utilities for Notion content extraction
 * Used by both frontend and backend to ensure consistency
 */

/**
 * Extract display text from Notion page properties
 * Looks for common content fields and returns the first available text
 */
export function extractPageDisplayText(
  properties: Record<string, any>
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
      if (property.type === 'rich_text' && property.rich_text) {
        const text = property.rich_text
          .map((text: any) => text.plain_text)
          .join(' ');
        if (text.trim()) return text.substring(0, 100);
      }
      if (property.type === 'title' && property.title) {
        const text = property.title
          .map((text: any) => text.plain_text)
          .join(' ');
        if (text.trim()) return text;
      }
    }
  }

  return 'Untitled page';
}
