import React, { useState } from 'react';
import { Stack, Text, Flex } from '@sanity/ui';
import { DashboardStats } from '../drafts/DashboardStats';
import { DraftList } from '../drafts/DraftList';
import { WeekNavigator } from '../drafts/WeekNavigator';
import { getCurrentWeekStart } from '../../utils/dateUtils';

interface GeneralTabContentProps {
  studioId: string;
  publishDateProperty?: string;
}

export function GeneralTabContent({
  studioId,
  publishDateProperty,
}: GeneralTabContentProps) {
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(
    getCurrentWeekStart()
  );

  return (
    <Stack space={6}>
      <Flex justify="space-between" align="center">
        <Text size={3} weight="bold">
          Overview
        </Text>
        <WeekNavigator
          selectedWeekStart={selectedWeekStart}
          onWeekChange={setSelectedWeekStart}
        />
      </Flex>
      <DashboardStats studioId={studioId} />
      <DraftList
        studioId={studioId}
        selectedWeekStart={selectedWeekStart}
        publishDateProperty={publishDateProperty}
      />
    </Stack>
  );
}
