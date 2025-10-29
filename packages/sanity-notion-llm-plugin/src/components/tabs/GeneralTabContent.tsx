import React from 'react';
import { Stack, Text } from '@sanity/ui';
import { DashboardStats } from '../drafts/DashboardStats';
import { DraftList } from '../drafts/DraftList';

interface GeneralTabContentProps {
  studioId: string;
}

export function GeneralTabContent({ studioId }: GeneralTabContentProps) {
  return (
    <Stack space={6}>
      <Text size={3} weight="bold">
        Overview
      </Text>
      <DashboardStats studioId={studioId} />
      <DraftList studioId={studioId} />
    </Stack>
  );
}
