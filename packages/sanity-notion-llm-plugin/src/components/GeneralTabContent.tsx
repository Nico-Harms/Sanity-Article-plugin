import { Stack, Text } from '@sanity/ui';
import { DashboardStats } from './DashboardStats';
import { DraftList } from './DraftList';

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
