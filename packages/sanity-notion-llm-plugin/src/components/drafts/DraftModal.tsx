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
import { EditIcon } from '@sanity/icons';
import type { DraftWithMetadata } from '@sanity-notion-llm/shared';
import { DraftMetadataCard } from './DraftMetadataCard';
import { MinimalContentFormatter } from '../common/MinimalContentFormatter';

interface DraftModalProps {
  draft: DraftWithMetadata;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: () => void;
}

export function DraftModal({
  draft,
  isOpen,
  onClose,
  onApprove,
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

          let documentData = null;
          let documentId = draft.sanityDraftId;

          // Smart ID resolution based on status
          if (draft.status === 'published' && documentId.startsWith('drafts.')) {
            documentId = documentId.replace(/^drafts\./, '');
          }

          // Try primary ID
          try {
            documentData = await client.getDocument(documentId);
          } catch (primaryError) {
            // Fallback: try the alternate ID
            const fallbackId = documentId.startsWith('drafts.')
              ? documentId.replace(/^drafts\./, '')
              : `drafts.${documentId}`;
            
            documentData = await client.getDocument(fallbackId);
          }

          setContent(documentData);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch document');
        } finally {
          setLoading(false);
        }
      };

      fetchContent();
    }
  }, [isOpen, draft.sanityDraftId, draft.status, client]);

  const handleApprove = () => {
    onApprove?.();
    onClose();
  };

  const handleOpenInSanity = () => {
    // Construct the URL to open the document in Sanity Studio
    // Remove 'drafts.' prefix if present to get the document ID
    const documentId = draft.sanityDraftId.replace(/^drafts\./, '');
    const documentType = draft._type;

    // Navigate to the document in the Desk structure
    const studioUrl = `/desk/${documentType};${documentId}`;

    // Open in current window (studio navigation)
    window.location.href = studioUrl;
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

              {!loading && !error && !content && (
                <Text size={1} muted>
                  No content available
                </Text>
              )}
            </Stack>
          </Card>

          {/* Action Buttons */}
          <Flex gap={2} justify="space-between" style={{ marginTop: '8px' }}>
            {/* Left side - Edit button */}
            <Button
              icon={EditIcon}
              tone="primary"
              mode="ghost"
              onClick={handleOpenInSanity}
              text="Open in Sanity"
            />

            {/* Right side - Action buttons */}
            <Flex gap={2}>
              {draft.status === 'pending_review' && (
                <Button tone="positive" onClick={handleApprove}>
                  Approve
                </Button>
              )}
              <Button mode="ghost" onClick={onClose}>
                Close
              </Button>
            </Flex>
          </Flex>
        </Stack>
      </Card>
    </Dialog>
  );
}
