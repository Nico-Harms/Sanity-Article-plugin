import React, { useState } from 'react';
import { Flex, Text, Button, Dialog } from '@sanity/ui';
import {
  formatWeekRange,
  getCurrentWeekStart,
  getPreviousWeek,
  getNextWeek,
} from '../../utils/dateUtils';
import { CalendarModal } from './CalendarModal';

interface WeekNavigatorProps {
  selectedWeekStart: Date;
  onWeekChange: (weekStart: Date) => void;
}

export function WeekNavigator({
  selectedWeekStart,
  onWeekChange,
}: WeekNavigatorProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handlePreviousWeek = () => {
    onWeekChange(getPreviousWeek(selectedWeekStart));
  };

  const handleNextWeek = () => {
    onWeekChange(getNextWeek(selectedWeekStart));
  };

  const handleToday = () => {
    onWeekChange(getCurrentWeekStart());
  };

  const handleCalendarSelect = (weekStart: Date) => {
    onWeekChange(weekStart);
    setCalendarOpen(false);
  };

  const weekRangeText = formatWeekRange(selectedWeekStart);

  return (
    <>
      <Flex align="center" gap={2}>
        <Button
          mode="ghost"
          tone="default"
          onClick={handlePreviousWeek}
          text="‹"
          fontSize={2}
          padding={2}
        />

        <Button
          mode="ghost"
          tone="default"
          text={weekRangeText}
          onClick={() => setCalendarOpen(true)}
          style={{ cursor: 'pointer', minWidth: '200px' }}
        />

        <Button
          mode="ghost"
          tone="default"
          onClick={handleNextWeek}
          text="›"
          fontSize={2}
          padding={2}
        />

        <Button
          mode="ghost"
          tone="default"
          onClick={handleToday}
          text="Today"
          fontSize={1}
          padding={2}
        />
      </Flex>

      {calendarOpen && (
        <Dialog
          id="week-calendar"
          onClose={() => setCalendarOpen(false)}
          width={0}
        >
          <CalendarModal
            selectedWeekStart={selectedWeekStart}
            onWeekSelect={handleCalendarSelect}
            onClose={() => setCalendarOpen(false)}
          />
        </Dialog>
      )}
    </>
  );
}
