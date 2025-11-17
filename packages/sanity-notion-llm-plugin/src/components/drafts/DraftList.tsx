import React from 'react';
import { Card, Text, Box, Stack, Button, Flex, Badge } from '@sanity/ui';
import { useEffect, useState } from 'react';
import { ApiClient } from '../../services/apiClient';
import { DraftModal } from './DraftModal';
import type { DraftWithMetadata } from 'sanity-hermes-shared';
import type { NotionPage } from 'sanity-hermes-shared';
import {
  getWeekRangeForDate,
  isDateInWeekRange,
  formatMonthAndDate,
} from '../../utils/dateUtils';

interface DraftListProps {
  studioId: string;
  selectedWeekStart: Date;
}

const STATUS_CONFIG = {
  pending_review: { label: 'Pending Review', tone: 'caution' as const },
  approved: { label: 'Approved', tone: 'positive' as const },
  scheduled: { label: 'Scheduled', tone: 'primary' as const },
  published: { label: 'Published', tone: 'positive' as const },
};

/**
 * Extracts planned publish date from Notion page properties
 */
function extractPlannedDateFromNotionPage(page: NotionPage): string | null {
  const dateFields = ['Publish Date', 'Planned Date', 'Date', 'Scheduled Date'];

  // Try propertyValues first (simplified values)
  for (const fieldName of dateFields) {
    const value = page.propertyValues?.[fieldName];
    if (value && typeof value === 'string') {
      return value;
    }
  }

  // Fallback to raw properties
  for (const fieldName of dateFields) {
    const property = page.properties?.[fieldName];
    if (property && property.type === 'date' && property.date) {
      return property.date.start || null;
    }
  }

  return null;
}

/**
 * Extracts content title from Notion page properties
 * Looks for "Content " (with space) or "Content" field first, then falls back to page title
 */
function extractContentTitleFromNotionPage(page: NotionPage): string {
  // Try "Content " with trailing space first (common in Notion)
  const contentWithSpace = page.propertyValues?.['Content '];
  if (
    contentWithSpace &&
    typeof contentWithSpace === 'string' &&
    contentWithSpace.trim()
  ) {
    return contentWithSpace.trim();
  }

  // Try "Content" without space
  const content = page.propertyValues?.['Content'];
  if (content && typeof content === 'string' && content.trim()) {
    return content.trim();
  }

  // Fallback to page title
  return page.title || 'Untitled Page';
}

export function DraftList({ studioId, selectedWeekStart }: DraftListProps) {
  const [drafts, setDrafts] = useState<DraftWithMetadata[]>([]);
  const [notionPages, setNotionPages] = useState<NotionPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<DraftWithMetadata | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [draftsResponse, notionResponse] = await Promise.all([
          ApiClient.getDrafts(studioId),
          ApiClient.getNotionData(studioId),
        ]);

        if (draftsResponse.drafts) {
          setDrafts(draftsResponse.drafts);
        }

        if (notionResponse.pages) {
          setNotionPages(notionResponse.pages);
        }
      } catch (err) {
        console.error('[DraftList] Failed to fetch data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studioId, selectedWeekStart]); // Refresh when studioId or week changes

  // Filter drafts by week
  const weekRange = getWeekRangeForDate(selectedWeekStart);
  // Filter drafts to only those in the selected week
  const weekFilteredDrafts = drafts.filter((draft) => {
    if (!draft.plannedPublishDate) {
      return false;
    }
    const plannedDate = new Date(draft.plannedPublishDate);
    return isDateInWeekRange(plannedDate, weekRange.start, weekRange.end);
  });

  // Get Notion page IDs that already have drafts
  const draftedNotionPageIds = new Set(
    drafts.map((draft) => draft.notionPageId).filter(Boolean)
  );

  // Filter Notion pages for scheduled section (not yet generated)
  const scheduledNotionPages = notionPages.filter((page) => {
    // Exclude pages that already have drafts (pending, approved, or published)
    if (draftedNotionPageIds.has(page.id)) {
      return false;
    }

    const plannedDate = extractPlannedDateFromNotionPage(page);
    if (!plannedDate) {
      return false;
    }

    const date = new Date(plannedDate);
    return isDateInWeekRange(date, weekRange.start, weekRange.end);
  });

  /*===============================================
  =          Group drafts into sections           =
  ===============================================*/

  const pendingReview = weekFilteredDrafts.filter(
    (draft) => draft.status === 'pending_review'
  );

  const approved = weekFilteredDrafts.filter(
    (draft) => draft.status === 'approved'
  );

  const published = weekFilteredDrafts.filter(
    (draft) => draft.status === 'published'
  );

  const handleApprove = async (draftId: string) => {
    try {
      setActionLoading(draftId);
      await ApiClient.approveDraft(studioId, draftId);

      const response = await ApiClient.getDrafts(studioId);
      if (response.drafts) setDrafts(response.drafts);

      // Trigger dashboard refresh if available
      if ((window as any).refreshDashboardStats) {
        (window as any).refreshDashboardStats();
      }
    } catch (err) {
      console.error(`[DraftList] Failed to approve draft:`, err);
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
      await handleApprove(selectedDraft.sanityDraftId);
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

  const renderDraftCard = (draft: DraftWithMetadata) => (
    <Card key={draft._id} padding={4} border radius={2}>
      <Stack space={4}>
        <Flex justify="space-between" align="flex-start">
          <Box flex={1}>
            <Stack space={3}>
              <Text size={2} weight="medium">
                {draft.title}
              </Text>
              <Stack space={2}>
                {draft.plannedPublishDate && (
                  <Text
                    size={1}
                    style={
                      draft.status === 'approved' ||
                      draft.status === 'published'
                        ? { color: 'var(--sanity-color-positive)' }
                        : { opacity: 0.7 }
                    }
                  >
                    {draft.status === 'published'
                      ? `Published on: ${formatMonthAndDate(draft.plannedPublishDate)}`
                      : draft.status === 'approved'
                        ? `Scheduled to: ${formatMonthAndDate(draft.plannedPublishDate)}`
                        : `Planned: ${new Date(
                            draft.plannedPublishDate
                          ).toLocaleDateString()}`}
                  </Text>
                )}
              </Stack>
            </Stack>
          </Box>
          <Badge tone={STATUS_CONFIG[draft.status]?.tone || 'default'}>
            {STATUS_CONFIG[draft.status]?.label || draft.status}
          </Badge>
        </Flex>

        <Flex gap={2}>
          <Button
            text="View"
            tone="primary"
            mode="ghost"
            size={1}
            onClick={() => handleViewDraft(draft)}
          />

          {draft.status === 'pending_review' && (
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
              onClick={() => handleApprove(draft.sanityDraftId)}
            />
          )}
          {draft.status === 'approved' && (
            <Button
              text="View in Sanity"
              tone="primary"
              mode="ghost"
              size={1}
            />
          )}
        </Flex>
      </Stack>
    </Card>
  );

  const renderScheduledPageCard = (page: NotionPage) => {
    const plannedDate = extractPlannedDateFromNotionPage(page);
    const contentTitle = extractContentTitleFromNotionPage(page);

    return (
      <Card key={page.id} padding={4} border radius={2}>
        <Stack space={3}>
          <Flex justify="space-between" align="flex-start">
            <Box flex={1}>
              <Stack space={2}>
                <Text size={2} weight="medium">
                  {contentTitle}
                </Text>
                {plannedDate && (
                  <Text size={1} muted>
                    Planned: {new Date(plannedDate).toLocaleDateString()}
                  </Text>
                )}
              </Stack>
            </Box>
            <Badge tone="primary">Scheduled</Badge>
          </Flex>
        </Stack>
      </Card>
    );
  };

  const renderSection = (
    title: string,
    drafts: DraftWithMetadata[],
    tone: 'primary' | 'caution' | 'positive'
  ) => {
    if (drafts.length === 0) {
      return null;
    }

    return (
      <Card padding={4} border radius={2} tone={tone}>
        <Stack space={4}>
          <Flex justify="space-between" align="center">
            <Text size={2} weight="semibold">
              {title}
            </Text>
            <Badge tone={tone}>{drafts.length}</Badge>
          </Flex>
          <Stack space={3}>{drafts.map(renderDraftCard)}</Stack>
        </Stack>
      </Card>
    );
  };

  const renderScheduledSection = () => {
    if (scheduledNotionPages.length === 0) {
      return null;
    }

    return (
      <Card padding={4} border radius={2} tone="primary">
        <Stack space={4}>
          <Flex justify="space-between" align="center">
            <Text size={2} weight="semibold">
              Scheduled (Future)
            </Text>
            <Badge tone="primary">{scheduledNotionPages.length}</Badge>
          </Flex>
          <Stack space={3}>
            {scheduledNotionPages.map(renderScheduledPageCard)}
          </Stack>
        </Stack>
      </Card>
    );
  };

  // Check if there's any content to show
  const hasContent =
    scheduledNotionPages.length > 0 ||
    pendingReview.length > 0 ||
    approved.length > 0 ||
    published.length > 0;

  return (
    <Stack space={4}>
      {/* Scheduled (Future) Section - Notion pages not yet generated */}
      {renderScheduledSection()}

      {/* Pending Review Section - Drafts awaiting review */}
      {renderSection('Pending Review', pendingReview, 'caution')}

      {/* Approved Section - Drafts approved for publishing */}
      {renderSection('Approved', approved, 'positive')}

      {/* Published Section - Successfully published drafts */}
      {renderSection('Published', published, 'positive')}

      {/* Empty State */}
      {!hasContent && (
        <Card padding={5} border radius={2}>
          <Text muted>No content found for the selected week</Text>
        </Card>
      )}

      {/* Draft Modal */}
      {selectedDraft && (
        <DraftModal
          draft={selectedDraft}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onApprove={handleModalApprove}
        />
      )}
    </Stack>
  );
}
