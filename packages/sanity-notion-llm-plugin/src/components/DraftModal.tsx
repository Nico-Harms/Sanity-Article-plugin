import { Card, Text, Dialog, Stack, Box, Spinner, Button } from '@sanity/ui';
import { useClient } from 'sanity';
import { useState, useEffect } from 'react';
import type { DraftWithMetadata } from '@sanity-notion-llm/shared';
import { DraftMetadataCard } from './DraftMetadataCard';
import { MinimalContentFormatter } from './MinimalContentFormatter';

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
      <Card padding={5} style={{ width: '80%', margin: '0 auto' }}>
        <Stack space={4}>
          <Text size={3} weight="bold">
            Draft Review
          </Text>

          {/* Draft Metadata */}
          <DraftMetadataCard draft={draft} />

          {/* Document Content */}
          <Card padding={3} border radius={1}>
            <Stack space={2}>
              <Text size={2} weight="medium">
                Content
              </Text>

              {loading && (
                <Box padding={4} style={{ textAlign: 'center' }}>
                  <Spinner />
                  <Text size={1} muted>
                    Loading content...
                  </Text>
                </Box>
              )}

              {error && (
                <Card padding={3} border radius={1}>
                  <Text size={1}>Error: {error}</Text>
                </Card>
              )}

              {content && (
                <MinimalContentFormatter
                  content={content}
                  documentType={draft._type}
                />
              )}
            </Stack>
          </Card>

          {/* Action Buttons */}
          <Stack space={2}>
            {draft.status === 'pending_review' && (
              <Stack space={2}>
                <Button tone="positive" onClick={handleApprove}>
                  Approve
                </Button>
                <Button tone="critical" onClick={handleReject}>
                  Reject
                </Button>
              </Stack>
            )}

            <Button mode="ghost" onClick={onClose}>
              Close
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Dialog>
  );
}
