import { useState } from 'react';
import { Card, Text, Box, Stack, Button, Select, Flex } from '@sanity/ui';
import { ApiClient } from '../../services/apiClient';
import type { SanityDraftData } from 'sanity-hermes-shared';
import { extractPageDisplayText } from 'sanity-hermes-shared';

interface GenerationSectionProps {
  studioId: string;
  notionPages?: any[];
  onGenerationComplete?: (draft: SanityDraftData) => void;
}

/*===============================================
|=         Generation Section Component        =
===============================================*/

export function GenerationSection({
  studioId,
  notionPages = [],
  onGenerationComplete,
}: GenerationSectionProps) {
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<SanityDraftData | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!selectedPageId) {
      setError('Please select a Notion page to generate content from');
      return;
    }

    setGenerating(true);
    setError(null);
    setGeneratedDraft(null);

    try {
      const response = await ApiClient.generateDraft(studioId, selectedPageId);

      if (response.success && response.draft) {
        setGeneratedDraft(response.draft);
        onGenerationComplete?.(response.draft);
      } else {
        setError(response.error || 'Failed to generate content');
      }
    } catch (err) {
      console.error('Generation failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setGenerating(false);
    }
  };

  const selectedPage = notionPages.find((page) => page.id === selectedPageId);

  return (
    <Card padding={4} border>
      <Stack space={4}>
        <Text size={3} weight="bold">
          Content Generation
        </Text>

        <Text size={1} muted>
          Select a Notion page from your content plan and generate a Sanity
          article draft using AI.
        </Text>

        {/* Page Selection THIS PAGE WILL BE DELETED IN PHASE 2   */}
        <Box>
          <Text size={2} weight="medium" style={{ marginBottom: 6 }}>
            Select Notion Page
          </Text>
          <Select
            value={selectedPageId}
            onChange={(event) => setSelectedPageId(event.currentTarget.value)}
            disabled={notionPages.length === 0}
          >
            <option value="">
              {notionPages.length === 0
                ? 'No pages available'
                : 'Choose a page...'}
            </option>
            {notionPages.map((page) => (
              <option key={page.id} value={page.id}>
                {extractPageDisplayText(page.properties || {})}
              </option>
            ))}
          </Select>
          {selectedPage && (
            <Text size={1} muted style={{ marginTop: 4 }}>
              Selected: {extractPageDisplayText(selectedPage.properties || {})}
            </Text>
          )}
        </Box>

        {/* Generate Button */}
        <Box>
          <Button
            text="Generate Draft"
            tone="primary"
            disabled={!selectedPageId || generating || notionPages.length === 0}
            loading={generating}
            onClick={handleGenerate}
          />
          <Text size={1} muted style={{ marginTop: 8 }}>
            This will create a complete article draft based on the selected
            Notion page content
          </Text>
        </Box>

        {/* Error Display */}
        {error && (
          <Card padding={3} tone="critical" border>
            <Text size={1} weight="medium">
              Generation Failed
            </Text>
            <Text size={1} style={{ marginTop: 4 }}>
              {error}
            </Text>
          </Card>
        )}

        {/* Generated Content Preview */}
        {generatedDraft && (
          <Card padding={3} tone="positive" border>
            <Text size={1} weight="medium" style={{ marginBottom: 8 }}>
              ✅ Draft Generated Successfully
            </Text>
            <Stack space={2}>
              {Object.entries(generatedDraft).map(([field, value]) => (
                <Box key={field}>
                  <Text size={1} weight="medium">
                    {field}:
                  </Text>
                  <Text size={1} muted style={{ marginTop: 2 }}>
                    {typeof value === 'string'
                      ? value.length > 100
                        ? `${value.substring(0, 100)}...`
                        : value
                      : JSON.stringify(value)}
                  </Text>
                </Box>
              ))}
            </Stack>
          </Card>
        )}
      </Stack>
    </Card>
  );
}
