import React, { useState } from 'react';
import { Card, Text, Flex, Button, Grid, Box, Stack } from '@sanity/ui';
import {
  getStartOfWeek,
  getMonthStart,
  getNextMonth,
  getPreviousMonth,
  getWeeksInMonth,
  isToday,
  isInCurrentWeek,
  formatWeekRange,
} from '../../utils/dateUtils';

interface CalendarModalProps {
  selectedWeekStart: Date;
  onWeekSelect: (weekStart: Date) => void;
  onClose: () => void;
}

export function CalendarModal({
  selectedWeekStart,
  onWeekSelect,
  onClose,
}: CalendarModalProps) {
  const [currentMonth, setCurrentMonth] = useState(
    getMonthStart(new Date(selectedWeekStart))
  );

  const monthYear = currentMonth.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const weeks = getWeeksInMonth(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );

  const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const handlePreviousMonth = () => {
    setCurrentMonth(getPreviousMonth(currentMonth));
  };

  const handleNextMonth = () => {
    setCurrentMonth(getNextMonth(currentMonth));
  };

  const handleWeekClick = (weekStart: Date) => {
    // weekStart is already the Monday of the week (from getWeekDates)
    onWeekSelect(weekStart);
  };

  const isWeekSelected = (weekStart: Date): boolean => {
    const selectedStart = getStartOfWeek(selectedWeekStart);
    return weekStart.getTime() === selectedStart.getTime();
  };

  return (
    <Card padding={4} radius={2} style={{ width: '320px' }}>
      <Stack space={4}>
        {/* Month Navigation */}
        <Flex justify="space-between" align="center">
          <Button
            mode="ghost"
            tone="default"
            onClick={handlePreviousMonth}
            text="‹"
            fontSize={2}
            padding={2}
          />
          <Text size={2} weight="semibold">
            {monthYear}
          </Text>
          <Button
            mode="ghost"
            tone="default"
            onClick={handleNextMonth}
            text="›"
            fontSize={2}
            padding={2}
          />
        </Flex>

        {/* Week Day Headers */}
        <Grid columns={7} gap={1}>
          {weekDays.map((day) => (
            <Box key={day} padding={2}>
              <Text size={1} weight="medium" muted align="center">
                {day}
              </Text>
            </Box>
          ))}
        </Grid>

        {/* Calendar Weeks */}
        <Stack space={2}>
          {weeks.map((weekDates, weekIndex) => {
            // weekDates[0] is already the Monday of the week
            const weekStart = weekDates[0];
            const isSelected = isWeekSelected(weekStart);
            const isCurrentWeek = isInCurrentWeek(weekDates[0]);

            return (
              <Card
                key={weekIndex}
                padding={2}
                radius={2}
                tone={isSelected ? 'primary' : 'default'}
                style={{
                  cursor: 'pointer',
                  border: isSelected
                    ? '2px solid var(--sanity-color-primary)'
                    : isCurrentWeek
                      ? '1px solid var(--sanity-color-border)'
                      : '1px solid transparent',
                  backgroundColor: isSelected
                    ? 'var(--sanity-color-primary)'
                    : isCurrentWeek
                      ? 'var(--sanity-color-base-bg)'
                      : 'transparent',
                }}
                onClick={() => handleWeekClick(weekStart)}
              >
                <Grid columns={7} gap={1}>
                  {weekDates.map((date, dayIndex) => {
                    const isCurrentMonth =
                      date.getMonth() === currentMonth.getMonth();
                    const isTodayDate = isToday(date);

                    return (
                      <Box
                        key={dayIndex}
                        padding={1}
                        style={{
                          opacity: isCurrentMonth ? 1 : 0.4,
                        }}
                      >
                        <Text
                          size={1}
                          align="center"
                          weight={isTodayDate ? 'semibold' : 'regular'}
                          style={{
                            color: isTodayDate
                              ? 'var(--sanity-color-primary)'
                              : isSelected
                                ? 'var(--sanity-color-base-bg)'
                                : 'inherit',
                          }}
                        >
                          {date.getDate()}
                        </Text>
                      </Box>
                    );
                  })}
                </Grid>
              </Card>
            );
          })}
        </Stack>

        {/* Selected Week Display */}
        <Box padding={2}>
          <Text size={1} muted>
            Selected: {formatWeekRange(selectedWeekStart)}
          </Text>
        </Box>

        {/* Close Button */}
        <Flex justify="flex-end">
          <Button
            mode="ghost"
            tone="default"
            onClick={onClose}
            text="Done"
            padding={2}
          />
        </Flex>
      </Stack>
    </Card>
  );
}
