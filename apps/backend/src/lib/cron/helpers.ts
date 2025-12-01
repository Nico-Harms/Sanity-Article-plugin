import type {
  NotionPageData,
  NotionPage,
  NotionPropertyValue,
} from '@sanity-notion-llm/shared';

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
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

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

const FALLBACK_DATE_FIELDS = [
  'Publish Date',
  'Planned Date',
  'Date',
  'Scheduled Date',
];

const buildLookupOrder = (preferredField?: string) => {
  const order = [
    ...(preferredField ? [preferredField] : []),
    ...FALLBACK_DATE_FIELDS,
  ];
  return order.filter(
    (field, index) => Boolean(field) && order.indexOf(field) === index
  ) as string[];
};

const extractDateFromProperty = (
  property?: NotionPropertyValue
): string | null => {
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
  return null;
};

/**
 * Extract planned publish date from Notion page properties
 */
export function extractPlannedDateFromNotion(
  notionPageData: NotionPageData,
  preferredField?: string
): string | null {
  const lookupOrder = buildLookupOrder(preferredField);

  for (const fieldName of lookupOrder) {
    const result = extractDateFromProperty(
      notionPageData.properties?.[fieldName] as NotionPropertyValue
    );
    if (result) {
      return result;
    }
  }

  return null;
}

/**
 * Extract planned publish date from NotionPage (used in cron filtering)
 */
export function extractPlannedDateFromNotionPage(
  page: NotionPage,
  preferredField?: string
): string | null {
  const lookupOrder = buildLookupOrder(preferredField);

  for (const fieldName of lookupOrder) {
    const value = page.propertyValues?.[fieldName];
    if (value && typeof value === 'string') {
      return value;
    }
  }

  for (const fieldName of lookupOrder) {
    const result = extractDateFromProperty(page.properties?.[fieldName]);
    if (result) {
      return result;
    }
  }

  return null;
}
