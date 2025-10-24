import { Card, Text, Box, Switch, TextArea, Flex, Stack } from '@sanity/ui';
import type { DetectedField } from '@sanity-notion-llm/shared';

/*===============================================
|=            DetectedFieldCard                 =
===============================================*/

/**
 * DETECTED FIELD CARD COMPONENT
 *
 * Displays a single detected Sanity schema field with toggle and purpose input.
 * Allows users to enable/disable fields and describe what content should be generated.
 *
 * Features:
 * - Field Toggle: Enable/disable field for content generation
 * - Purpose Input: Describe what content should be generated for this field
 * - Visual Feedback: Different styling for enabled/disabled fields
 * - Type Display: Shows the Sanity field type (string, blockContent, etc.)
 *
 * Props:
 * - field: DetectedField object with name, type, title, enabled, purpose
 * - onToggle: Callback when field is enabled/disabled
 * - onPurposeChange: Callback when purpose description changes
 */

interface DetectedFieldCardProps {
  field: DetectedField;
  onToggle: (enabled: boolean) => void;
  onPurposeChange: (purpose: string) => void;
}

export function DetectedFieldCard({
  field,
  onToggle,
  onPurposeChange,
}: DetectedFieldCardProps) {
  return (
    <Card
      padding={4}
      border
      radius={2}
      shadow={1}
      tone={field.enabled ? 'primary' : 'default'}
    >
      <Stack space={3}>
        {/* Header with switch and field info */}
        <Flex align="center" gap={3}>
          <Switch
            checked={field.enabled}
            onChange={(e) => onToggle(e.currentTarget.checked)}
          />
          <Box flex={1}>
            <Text weight="semibold" size={2}>
              {field.title || field.name}
            </Text>
            <Text size={1} muted>
              {field.type}
            </Text>
          </Box>
        </Flex>

        {/* Purpose input section */}
        {field.enabled && (
          <Box>
            <Box marginBottom={2}>
              <Text size={1} weight="medium">
                What should this field contain?
              </Text>
            </Box>
            <TextArea
              rows={2}
              value={field.purpose || ''}
              onChange={(e) => onPurposeChange(e.currentTarget.value)}
              placeholder="e.g., 'A relevant quote from an expert' or 'The main article introduction'"
            />
          </Box>
        )}
      </Stack>
    </Card>
  );
}
