import { Card, Text, TextArea, Box, Stack } from '@sanity/ui';
import type { PluginConfig } from 'sanity-hermes-shared';
import type { ConfigFieldKey } from '../../tool/types';

interface InstructionsSectionProps {
  config: PluginConfig;
  onInstructionChange: (field: ConfigFieldKey, value: string) => void;
}

const INSTRUCTION_FIELDS: Array<{
  key: ConfigFieldKey;
  label: string;
  helper: string;
  placeholder: string;
  rows: number;
}> = [
  {
    key: 'generalInstructions',
    label: 'General Content Instructions',
    helper:
      'Overall guidelines for content generation (e.g., "Write in a professional tone", "Focus on practical examples", "Keep content under 500 words per section")',
    placeholder:
      'e.g., Write in a professional tone and focus on practical examples that readers can implement immediately.',
    rows: 3,
  },
  {
    key: 'toneInstructions',
    label: 'Tone & Style Instructions',
    helper:
      'Specific tone and writing style guidelines (e.g., "Use conversational tone", "Include technical jargon", "Write for beginners")',
    placeholder:
      'e.g., Use a conversational tone that makes complex topics accessible to beginners.',
    rows: 3,
  },
  {
    key: 'fieldInstructions',
    label: 'Field-Specific Instructions',
    helper:
      'Instructions for how to handle specific field types or content (e.g., "Always include a call-to-action in conclusion", "Use bullet points for lists", "Include relevant quotes")',
    placeholder:
      'e.g., Always include a call-to-action in the conclusion and use bullet points for any lists or key takeaways.',
    rows: 3,
  },
];

export function InstructionsSection({
  config,
  onInstructionChange,
}: InstructionsSectionProps) {
  return (
    <Card padding={4} border radius={2} shadow={1}>
      <Stack space={4}>
        <Text size={3} weight="bold">
          Content Generation Instructions
        </Text>

        <Text size={1} muted>
          Customize how the LLM generates content for your specific use case.
          These instructions will be included in the AI prompt to guide content
          generation.
        </Text>

        {INSTRUCTION_FIELDS.map(({ key, label, helper, placeholder, rows }) => (
          <Box key={key}>
            <Text size={2} weight="medium" style={{ marginBottom: 6 }}>
              {label}
            </Text>
            <TextArea
              rows={rows}
              placeholder={placeholder}
              value={config[key] || ''}
              onChange={(event) =>
                onInstructionChange(key, event.currentTarget.value)
              }
            />
            <Text size={1} muted style={{ marginTop: 4 }}>
              {helper}
            </Text>
          </Box>
        ))}
      </Stack>
    </Card>
  );
}
