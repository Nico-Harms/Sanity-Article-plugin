import { Card, Text, Box, Switch, TextArea, Flex, Stack } from '@sanity/ui';
import type { DetectedField } from '@sanity-notion-llm/shared';

interface SimpleFieldCardProps {
  field: DetectedField;
  onToggle: (enabled: boolean) => void;
  onPurposeChange: (purpose: string) => void;
}

/**
 * Simple field card component for displaying and editing detected fields
 *
 * This component handles only UI interactions and delegates all state management
 * to parent components. It provides a clean interface for:
 * - Toggling field enabled/disabled state
 * - Editing field purpose/description text
 *
 * @param field - The detected field data to display
 * @param onToggle - Callback when the enabled switch is toggled
 * @param onPurposeChange - Callback when the purpose text is changed
 */
export function SimpleFieldCard({
  field,
  onToggle,
  onPurposeChange,
}: SimpleFieldCardProps) {
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
