import { Card, Text, Stack, Badge, Flex } from '@sanity/ui';
import type { DraftWithMetadata } from '@sanity-notion-llm/shared';

// Status configuration with labels, tones, and messages
const STATUS_CONFIG = {
  pending_review: {
    label: 'Pending Review',
    tone: 'caution' as const,
    message: 'This draft is waiting for your review and approval.',
    icon: '⏳',
  },
  approved: {
    label: 'Approved',
    tone: 'positive' as const,
    message: 'This draft has been approved and is ready for publishing.',
    icon: '✅',
  },
  scheduled: {
    label: 'Scheduled',
    tone: 'primary' as const,
    message: 'This draft is scheduled to be published automatically.',
    icon: '📅',
  },
  published: {
    label: 'Published',
    tone: 'positive' as const,
    message: 'This draft has been published successfully.',
    icon: '✨',
  },
  rejected: {
    label: 'Rejected',
    tone: 'critical' as const,
    message: 'This draft has been rejected and needs revision.',
    icon: '❌',
  },
};

interface DraftMetadataCardProps {
  draft: DraftWithMetadata;
}

export function DraftMetadataCard({ draft }: DraftMetadataCardProps) {
  const statusConfig =
    STATUS_CONFIG[draft.status as keyof typeof STATUS_CONFIG];

  return (
    <Card padding={3} border radius={1}>
      <Stack space={3}>
        <Text size={2} weight="medium">
          Title: {draft.title}
        </Text>

        {/* Status Display */}
        <Stack space={2}>
          <Flex gap={2} align="center">
            <Text size={1} weight="medium">
              Status:
            </Text>
            {statusConfig ? (
              <Badge tone={statusConfig.tone} fontSize={1}>
                {statusConfig.icon} {statusConfig.label}
              </Badge>
            ) : (
              <Badge tone="default" fontSize={1}>
                {draft.status}
              </Badge>
            )}
          </Flex>
          {statusConfig && (
            <Text size={1} muted>
              {statusConfig.message}
            </Text>
          )}
        </Stack>

        {/* Timestamps */}
        <Stack space={1}>
          <Text size={1}>
            Generated: {new Date(draft.generatedAt).toLocaleDateString()}
          </Text>
          {draft.approvedAt && (
            <Text size={1} style={{ color: 'var(--sanity-color-positive)' }}>
              Approved: {new Date(draft.approvedAt).toLocaleDateString()}
            </Text>
          )}
          {draft.publishedAt && (
            <Text size={1} style={{ color: 'var(--sanity-color-positive)' }}>
              Published: {new Date(draft.publishedAt).toLocaleDateString()}
            </Text>
          )}
          {draft.plannedPublishDate && (
            <Text size={1}>
              Planned Publish:{' '}
              {new Date(draft.plannedPublishDate).toLocaleDateString()}
            </Text>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}
