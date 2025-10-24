import { useState, useEffect } from 'react';
import { Card, Text, Stack, Button, Box, Badge } from '@sanity/ui';
import { ApiClient } from '../services/apiClient';

interface DraftReviewSectionProps {
  studioId: string;
}

/*===============================================
|=         Draft Review Section Component        =
===============================================*/

/**
 * DRAFT REVIEW SECTION COMPONENT
 *
 * Displays the draft review section of the Notion LLM plugin.
 * Allows users to review, approve, and reject generated drafts.
 *
 * Features:
 * - Draft List: Display a list of generated drafts
 * - Approve/Reject Buttons: Approve or reject a draft
 * - Edit in Sanity Button: Edit the draft in Sanity
 */
export function DraftReviewSection({ studioId }: DraftReviewSectionProps) {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const response = await ApiClient.getDrafts(studioId);
      setDrafts(response.drafts || []);
    } catch (error) {
      console.error('Failed to load drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, [studioId]);

  const handleApprove = async (docId: string) => {
    try {
      await ApiClient.approveDraft(studioId, docId);
      loadDrafts(); // Refresh the list
    } catch (error) {
      console.error('Failed to approve draft:', error);
    }
  };

  const handleReject = async (docId: string) => {
    try {
      await ApiClient.rejectDraft(studioId, docId);
      loadDrafts(); // Refresh the list
    } catch (error) {
      console.error('Failed to reject draft:', error);
    }
  };

  if (loading) {
    return (
      <Card padding={4} border>
        <Text>Loading drafts...</Text>
      </Card>
    );
  }

  if (drafts.length === 0) {
    return (
      <Card padding={4} border>
        <Text>No drafts available for review.</Text>
      </Card>
    );
  }

  return (
    <Stack space={4}>
      {drafts.map((draft: any) => (
        <Card key={draft._id} padding={4} border>
          <Stack space={3}>
            <Text weight="bold">{draft.title || 'Untitled'}</Text>
            <Text size={1} muted>
              Scheduled: {draft._scheduledDate || 'No date set'}
            </Text>
            <Text size={1}>
              Status:
              <Badge tone={draft._approved ? 'positive' : 'caution'}>
                {draft._approved ? 'Approved' : 'Pending'}
              </Badge>
            </Text>
            <Box>
              <Button
                text="Approve"
                tone="positive"
                onClick={() => handleApprove(draft._id)}
                disabled={draft._approved}
              />
              <Button
                text="Reject"
                tone="critical"
                onClick={() => handleReject(draft._id)}
                style={{ marginLeft: 8 }}
              />
              <Button
                text="Edit in Sanity"
                mode="ghost"
                onClick={() => window.open(`/desk/${draft._type};${draft._id}`)}
                style={{ marginLeft: 8 }}
              />
            </Box>
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
