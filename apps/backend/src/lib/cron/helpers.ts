import type { NotionPageData, NotionPage } from '@sanity-notion-llm/shared';

/*===============================================
|=          Date Helper Functions          =
===============================================*/

/**
 * Check if current date is Monday (day of week === 1)
 */
export function isMonday(): boolean {
  const today = new Date();
  return today.getDay() === 1;
}

/**
 * Calculate the current week's date range (Monday to Sunday)
 * Returns ISO date strings for start and end dates
 * If today is Monday, this returns the week starting today
 */
export function getCurrentWeekRange(): { start: string; end: string } {
  const today = new Date();
  const dayOfWeek = today.getDay();

  // Calculate days since last Monday (1 = Monday, 0 = Sunday)
  let daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() - daysSinceMonday);
  currentMonday.setHours(0, 0, 0, 0);

  const currentSunday = new Date(currentMonday);
  currentSunday.setDate(currentMonday.getDate() + 6);
  currentSunday.setHours(23, 59, 59, 999);

  return {
    start: currentMonday.toISOString().split('T')[0],
    end: currentSunday.toISOString().split('T')[0],
  };
}

/**
 * Check if a date string matches today (date only, ignore time)
 */
export function dateMatchesToday(dateString: string): boolean {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dateStr = dateString.split('T')[0];
  return dateStr === todayStr;
}

/**
 * Check if a date string falls within a date range (inclusive)
 */
export function isDateInRange(
  dateString: string,
  start: string,
  end: string
): boolean {
  const date = dateString.split('T')[0];
  return date >= start && date <= end;
}

/*===============================================
|=          Notion Date Extraction          =
===============================================*/

/**
 * Extract planned publish date from Notion page properties
 */
export function extractPlannedDateFromNotion(
  notionPageData: NotionPageData
): string | null {
  const dateFields = ['Publish Date', 'Planned Date', 'Date', 'Scheduled Date'];

  for (const fieldName of dateFields) {
    const field = notionPageData.properties?.[fieldName];
    if (
      field &&
      typeof field === 'object' &&
      'type' in field &&
      field.type === 'date' &&
      'date' in field &&
      field.date
    ) {
      const start =
        typeof field.date === 'object' &&
        field.date !== null &&
        'start' in field.date &&
        typeof field.date.start === 'string'
          ? field.date.start
          : null;
      if (start) {
        return start;
      }
    }
  }

  return null;
}

/**
 * Extract planned publish date from NotionPage (used in cron filtering)
 */
export function extractPlannedDateFromNotionPage(
  page: NotionPage
): string | null {
  const dateFields = ['Publish Date', 'Planned Date', 'Date', 'Scheduled Date'];

  // Try propertyValues first (simplified values)
  for (const fieldName of dateFields) {
    const value = page.propertyValues?.[fieldName];
    if (value && typeof value === 'string') {
      return value;
    }
  }

  // Fallback to raw properties
  for (const fieldName of dateFields) {
    const property = page.properties?.[fieldName];
    if (
      property &&
      typeof property === 'object' &&
      'type' in property &&
      property.type === 'date' &&
      'date' in property &&
      property.date
    ) {
      const start =
        typeof property.date === 'object' &&
        property.date !== null &&
        'start' in property.date &&
        typeof property.date.start === 'string'
          ? property.date.start
          : null;
      if (start) {
        return start;
      }
    }
  }

  return null;
}
