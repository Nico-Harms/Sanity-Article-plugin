import {
  Card,
  Text,
  Box,
  Stack,
  Button,
  Select,
  Flex,
  Badge,
} from '@sanity/ui';
import { useEffect, useState } from 'react';
import { ApiClient } from '../services/apiClient';
import { DraftModal } from './DraftModal';
import type { DraftWithMetadata } from '@sanity-notion-llm/shared';

interface DraftListProps {
  studioId: string;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_CONFIG = {
  pending_review: { label: 'Pending Review', tone: 'caution' as const },
  approved: { label: 'Approved', tone: 'positive' as const },
  scheduled: { label: 'Scheduled', tone: 'primary' as const },
  published: { label: 'Published', tone: 'positive' as const },
  rejected: { label: 'Rejected', tone: 'critical' as const },
};

export function DraftList({ studioId }: DraftListProps) {
  const [drafts, setDrafts] = useState<DraftWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<DraftWithMetadata | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        setLoading(true);
        const response = await ApiClient.getDrafts(studioId);
        if (response.drafts) {
          setDrafts(response.drafts);
        }
      } catch (err) {
        console.error('[DraftList] Failed to fetch drafts:', err);
        setError('Failed to load drafts');
      } finally {
        setLoading(false);
      }
    };

    fetchDrafts();
  }, [studioId]);

  const filteredDrafts = drafts.filter(
    (draft) => statusFilter === 'all' || draft.status === statusFilter
  );

  const handleAction = async (
    action: 'approve' | 'reject',
    draftId: string
  ) => {
    try {
      setActionLoading(draftId);
      await (action === 'approve'
        ? ApiClient.approveDraft(studioId, draftId)
        : ApiClient.rejectDraft(studioId, draftId));

      const response = await ApiClient.getDrafts(studioId);
      if (response.drafts) setDrafts(response.drafts);

      // Trigger dashboard refresh if available
      if ((window as any).refreshDashboardStats) {
        (window as any).refreshDashboardStats();
      }
    } catch (err) {
      console.error(`[DraftList] Failed to ${action} draft:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDraft = (draft: DraftWithMetadata) => {
    setSelectedDraft(draft);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDraft(null);
  };

  const handleModalApprove = async () => {
    if (selectedDraft) {
      await handleAction('approve', selectedDraft._id);
    }
  };

  const handleModalReject = async () => {
    if (selectedDraft) {
      await handleAction('reject', selectedDraft._id);
    }
  };

  if (loading) {
    return (
      <Card padding={5} border radius={2}>
        <Text>Loading drafts...</Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card padding={5} border radius={2} tone="critical">
        <Text>{error}</Text>
      </Card>
    );
  }

  return (
    <Card padding={5} border radius={2} shadow={1}>
      <Stack>
        <Flex justify="space-between" align="center">
          <Text size={2} weight="semibold">
            Draft Management
          </Text>
          <Box style={{ minWidth: '200px' }}>
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.currentTarget.value)}
            >
              {STATUS_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Box>
        </Flex>

        {filteredDrafts.length === 0 ? (
          <Card padding={5} border radius={2}>
            <Text muted>No drafts found</Text>
          </Card>
        ) : (
          <Stack space={4}>
            {filteredDrafts.map((draft) => (
              <Card key={draft._id} padding={4} border radius={2}>
                <Stack space={4}>
                  <Flex justify="space-between" align="flex-start">
                    <Box flex={1}>
                      <Stack space={3}>
                        <Text size={2} weight="medium">
                          {draft.title}
                        </Text>
                        <Stack space={2}>
                          <Text size={1} muted>
                            {draft._type} • Generated{' '}
                            {new Date(draft.generatedAt).toLocaleDateString()}
                          </Text>
                          {draft.plannedPublishDate && (
                            <Text size={1} muted>
                              Planned:{' '}
                              {new Date(
                                draft.plannedPublishDate
                              ).toLocaleDateString()}
                            </Text>
                          )}
                        </Stack>
                      </Stack>
                    </Box>
                    <Badge
                      tone={STATUS_CONFIG[draft.status]?.tone || 'default'}
                    >
                      {STATUS_CONFIG[draft.status]?.label || draft.status}
                    </Badge>
                  </Flex>

                  <Flex gap={2}>
                    {/* View button for all drafts */}
                    <Button
                      text="View"
                      tone="primary"
                      mode="ghost"
                      size={1}
                      onClick={() => handleViewDraft(draft)}
                    />

                    {draft.status === 'pending_review' && (
                      <>
                        <Button
                          text={
                            actionLoading === draft.sanityDraftId
                              ? 'Processing...'
                              : 'Approve'
                          }
                          tone="positive"
                          mode="ghost"
                          size={1}
                          disabled={actionLoading === draft.sanityDraftId}
                          onClick={() =>
                            handleAction('approve', draft.sanityDraftId)
                          }
                        />
                        <Button
                          text={
                            actionLoading === draft.sanityDraftId
                              ? 'Processing...'
                              : 'Reject'
                          }
                          tone="critical"
                          mode="ghost"
                          size={1}
                          disabled={actionLoading === draft.sanityDraftId}
                          onClick={() =>
                            handleAction('reject', draft.sanityDraftId)
                          }
                        />
                      </>
                    )}
                    {draft.status === 'approved' && (
                      <Button
                        text="View in Sanity"
                        tone="primary"
                        mode="ghost"
                        size={1}
                      />
                    )}
                    {draft.status === 'published' && (
                      <Button
                        text="View Published"
                        tone="positive"
                        mode="ghost"
                        size={1}
                      />
                    )}
                    {draft.status === 'rejected' && (
                      <>
                        <Button
                          text="Re-generate"
                          tone="primary"
                          mode="ghost"
                          size={1}
                        />
                        <Button
                          text="Delete"
                          tone="critical"
                          mode="ghost"
                          size={1}
                        />
                      </>
                    )}
                  </Flex>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>

      {/* Draft Modal */}
      {selectedDraft && (
        <DraftModal
          draft={selectedDraft}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onApprove={handleModalApprove}
          onReject={handleModalReject}
          studioId={studioId}
        />
      )}
    </Card>
  );
}
