import React from 'react';
import {
  Card,
  Text,
  Dialog,
  Stack,
  Box,
  Spinner,
  Button,
  Flex,
} from '@sanity/ui';
import { useClient } from 'sanity';
import { useState, useEffect } from 'react';
import type { DraftWithMetadata } from '@sanity-notion-llm/shared';
import { DraftMetadataCard } from './DraftMetadataCard';
import { MinimalContentFormatter } from '../common/MinimalContentFormatter';

interface DraftModalProps {
  draft: DraftWithMetadata;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  studioId: string;
}

export function DraftModal({
  draft,
  isOpen,
  onClose,
  onApprove,
  onReject,
  studioId,
}: DraftModalProps) {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const client = useClient({ apiVersion: '2023-03-01' });

  // Fetch document content using Sanity Studio client
  useEffect(() => {
    if (isOpen && draft.sanityDraftId) {
      const fetchContent = async () => {
        try {
          setLoading(true);
          setError(null);
          const documentData = await client.getDocument(draft.sanityDraftId);
          setContent(documentData);
        } catch (err) {
          console.error('Failed to fetch document:', err);
          setError(
            err instanceof Error ? err.message : 'Failed to fetch document'
          );
        } finally {
          setLoading(false);
        }
      };

      fetchContent();
    }
  }, [isOpen, draft.sanityDraftId, client]);

  const handleApprove = () => {
    onApprove?.();
    onClose();
  };

  const handleReject = () => {
    onReject?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog id="draft-modal" onClose={onClose} width={1}>
      <Card
        padding={[4, 5, 6]}
        style={{ width: '80%', maxWidth: '900px', margin: '0 auto' }}
      >
        <Stack space={5}>
          {/* Header */}
          <Box>
            <Text size={3} weight="bold">
              Draft Review
            </Text>
          </Box>

          {/* Draft Metadata */}
          <DraftMetadataCard draft={draft} />

          {/* Document Content */}
          <Card padding={4} border radius={2}>
            <Stack space={3}>
              <Box>
                <Text
                  size={1}
                  weight="semibold"
                  muted
                  style={{ marginBottom: '8px' }}
                >
                  Content
                </Text>
              </Box>

              {loading && (
                <Box padding={5} style={{ textAlign: 'center' }}>
                  <Spinner />
                  <Text size={1} muted style={{ marginTop: '12px' }}>
                    Loading content...
                  </Text>
                </Box>
              )}

              {error && (
                <Card padding={3} border radius={2} tone="critical">
                  <Text size={1}>Error: {error}</Text>
                </Card>
              )}

              {content && (
                <Box style={{ marginTop: '4px' }}>
                  <MinimalContentFormatter
                    content={content}
                    documentType={draft._type}
                  />
                </Box>
              )}
            </Stack>
          </Card>

          {/* Action Buttons */}
          <Flex gap={2} justify="flex-end" style={{ marginTop: '8px' }}>
            {draft.status === 'pending_review' && (
              <>
                <Button tone="positive" onClick={handleApprove}>
                  Approve
                </Button>
                <Button tone="critical" onClick={handleReject}>
                  Reject
                </Button>
              </>
            )}
            <Button mode="ghost" onClick={onClose}>
              Close
            </Button>
          </Flex>
        </Stack>
      </Card>
    </Dialog>
  );
}
