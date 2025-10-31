/**
 * Date utility functions for week filtering and date formatting
 */

export type WeekFilterOption = 'all' | 'this_week' | 'next_week' | 'past_week';

export interface WeekRange {
  start: Date;
  end: Date;
}

/**
 * Gets the start of the week (Monday) for a given date
 */
export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const startOfWeek = new Date(d);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

/**
 * Sets time to start of day (00:00:00)
 */
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Sets time to end of day (23:59:59.999)
 */
function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Calculates the date range for a given week filter option
 */
export function getWeekRange(weekOption: WeekFilterOption): WeekRange | null {
  const today = new Date();
  const currentDay = today.getDay();
  const currentMonday = getStartOfWeek(today);

  switch (weekOption) {
    case 'this_week': {
      const start = startOfDay(currentMonday);
      const end = endOfDay(
        new Date(currentMonday.getTime() + 6 * 24 * 60 * 60 * 1000)
      );
      return { start, end };
    }
    case 'next_week': {
      const nextMonday = new Date(
        currentMonday.getTime() + 7 * 24 * 60 * 60 * 1000
      );
      const start = startOfDay(nextMonday);
      const end = endOfDay(
        new Date(nextMonday.getTime() + 6 * 24 * 60 * 60 * 1000)
      );
      return { start, end };
    }
    case 'past_week': {
      const pastMonday = new Date(
        currentMonday.getTime() - 7 * 24 * 60 * 60 * 1000
      );
      const start = startOfDay(pastMonday);
      const end = endOfDay(
        new Date(pastMonday.getTime() + 6 * 24 * 60 * 60 * 1000)
      );
      return { start, end };
    }
    case 'all':
      return null;
    default:
      return null;
  }
}

/**
 * Checks if a date falls within a week range
 */
export function isDateInWeekRange(date: Date, start: Date, end: Date): boolean {
  const dateToCheck = new Date(date);
  dateToCheck.setHours(12, 0, 0, 0); // Set to midday to avoid timezone issues
  const rangeStart = new Date(start);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(end);
  rangeEnd.setHours(23, 59, 59, 999);

  return dateToCheck >= rangeStart && dateToCheck <= rangeEnd;
}

/**
 * Checks if a date is in the future
 */
export function isFutureDate(date: Date | string): boolean {
  // Always create a new Date object to avoid mutating the input
  const dateToCheck = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dateToCheck.setHours(0, 0, 0, 0);
  return dateToCheck > today;
}

/**
 * Formats a date as "Month Day" (e.g., "January 15" or "Jan 15")
 */
export function formatMonthAndDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const month = dateObj.toLocaleString('default', { month: 'long' });
  const day = dateObj.getDate();

  return `${month} ${day}`;
}

/**
 * Gets the current week start (Monday) date
 */
export function getCurrentWeekStart(): Date {
  return getStartOfWeek(new Date());
}

/**
 * Calculates the week range (Monday to Sunday) for a given week start date
 */
export function getWeekRangeForDate(weekStart: Date): WeekRange {
  const start = startOfDay(weekStart);
  const end = endOfDay(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000));
  return { start, end };
}

/**
 * Formats a week range for display (e.g., "Mon, Jan 15 - Sun, Jan 21, 2024")
 */
export function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

  const startDay = weekStart.toLocaleString('default', { weekday: 'short' });
  const startMonth = weekStart.toLocaleString('default', { month: 'short' });
  const startDate = weekStart.getDate();

  const endDay = weekEnd.toLocaleString('default', { weekday: 'short' });
  const endMonth = weekEnd.toLocaleString('default', { month: 'short' });
  const endDate = weekEnd.getDate();
  const endYear = weekEnd.getFullYear();

  // If same month, don't repeat month name
  if (startMonth === endMonth) {
    return `${startDay}, ${startMonth} ${startDate} - ${endDay}, ${endDate}, ${endYear}`;
  }

  // Different months, include both month names
  return `${startDay}, ${startMonth} ${startDate} - ${endDay}, ${endMonth} ${endDate}, ${endYear}`;
}

/**
 * Gets the previous week start date
 */
export function getPreviousWeek(weekStart: Date): Date {
  return new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
}

/**
 * Gets the next week start date
 */
export function getNextWeek(weekStart: Date): Date {
  return new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
}

/**
 * Gets the start of the month for a given date
 */
export function getMonthStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Gets the next month start date
 */
export function getNextMonth(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Gets the previous month start date
 */
export function getPreviousMonth(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() - 1);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Gets all dates in a week starting from weekStart (Monday to Sunday)
 */
export function getWeekDates(weekStart: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000);
    dates.push(date);
  }
  return dates;
}

/**
 * Gets all weeks in a month for calendar display
 */
export function getWeeksInMonth(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Get the Monday of the week containing the first day of the month
  const monthStart = getStartOfWeek(firstDay);

  // Get the Monday of the week containing the last day of the month
  const monthEnd = getStartOfWeek(lastDay);

  const weeks: Date[][] = [];
  let currentWeekStart = monthStart;

  // If monthStart is before the actual first day, we might need to go back one week
  if (currentWeekStart < firstDay) {
    // Check if we should include this week
    const weekEnd = new Date(
      currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000
    );
    if (weekEnd >= firstDay) {
      weeks.push(getWeekDates(currentWeekStart));
    }
    currentWeekStart = getNextWeek(currentWeekStart);
  }

  // Add all weeks that contain days from this month
  while (currentWeekStart <= monthEnd) {
    weeks.push(getWeekDates(currentWeekStart));
    currentWeekStart = getNextWeek(currentWeekStart);
  }

  return weeks;
}

/**
 * Checks if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Checks if a date is in the current week
 */
export function isInCurrentWeek(date: Date): boolean {
  const currentWeekStart = getCurrentWeekStart();
  const weekRange = getWeekRangeForDate(currentWeekStart);
  return isDateInWeekRange(date, weekRange.start, weekRange.end);
}
