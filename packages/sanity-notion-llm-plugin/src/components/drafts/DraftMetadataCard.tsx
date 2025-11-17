import React from 'react';
import { Card, Text, Stack, Badge, Flex, Box } from '@sanity/ui';
import type { DraftWithMetadata } from 'sanity-hermes-shared';
import { formatMonthAndDate } from '../../utils/dateUtils';

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
  published: {
    label: 'Published',
    tone: 'positive' as const,
    message: 'This draft has been published successfully.',
    icon: '✨',
  },
};

interface DraftMetadataCardProps {
  draft: DraftWithMetadata;
}

export function DraftMetadataCard({ draft }: DraftMetadataCardProps) {
  const statusConfig =
    STATUS_CONFIG[draft.status as keyof typeof STATUS_CONFIG];

  return (
    <Card padding={4} border radius={2}>
      <Stack space={4}>
        {/* Title */}
        <Box>
          <Text
            size={1}
            weight="semibold"
            muted
            style={{ marginBottom: '8px' }}
          >
            Title
          </Text>
          <Text size={2} weight="semibold">
            {draft.title}
          </Text>
        </Box>

        {/* Status Display */}
        <Stack space={2}>
          <Box>
            <Text
              size={1}
              weight="semibold"
              muted
              style={{ marginBottom: '8px' }}
            >
              Status
            </Text>
            <Flex gap={2} align="center">
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
          </Box>
          {statusConfig && (
            <Text size={1} muted style={{ lineHeight: 1.5 }}>
              {statusConfig.message}
            </Text>
          )}
        </Stack>

        {/* Timestamps */}
        <Stack space={2}>
          <Box>
            <Text
              size={1}
              weight="semibold"
              muted
              style={{ marginBottom: '8px' }}
            >
              Timeline
            </Text>
            <Stack space={2}>
              <Text size={1}>
                Generated: {new Date(draft.generatedAt).toLocaleDateString()}
              </Text>
              {draft.status === 'approved' && draft.plannedPublishDate && (
                <Text
                  size={1}
                  style={{ color: 'var(--sanity-color-positive)' }}
                >
                  Publish Date: {formatMonthAndDate(draft.plannedPublishDate)}
                </Text>
              )}
              {draft.status !== 'approved' && draft.plannedPublishDate && (
                <Text size={1} muted>
                  Planned Publish:{' '}
                  {new Date(draft.plannedPublishDate).toLocaleDateString()}
                </Text>
              )}
              {draft.publishedAt && (
                <Text
                  size={1}
                  style={{ color: 'var(--sanity-color-positive)' }}
                >
                  Published: {new Date(draft.publishedAt).toLocaleDateString()}
                </Text>
              )}
            </Stack>
          </Box>
        </Stack>
      </Stack>
    </Card>
  );
}
