import { Card, Text, Stack, Select, Box, Button, Flex } from '@sanity/ui';
import { SimpleFieldCard } from '../common/SimpleFieldCard';
import type { PluginConfig, SchemaType } from '@sanity-notion-llm/shared';

interface SimpleFieldsTabContentProps {
  config: PluginConfig;
  schemaTypes: SchemaType[];
  onSchemaChange: (schemaName: string) => void;
  onFieldToggle: (fieldName: string, enabled: boolean) => void;
  onFieldPurposeChange: (fieldName: string, purpose: string) => void;
  onRefreshSchema: () => void;
}

/**
 * Simplified fields tab content for configuring detected fields
 *
 * This component provides a clean interface for:
 * - Selecting which Sanity schema to use for content generation
 * - Toggling detected fields on/off
 * - Setting field purposes/descriptions for LLM generation
 *
 * All state management is handled by parent components through callbacks.
 * This separation ensures the component is reusable and testable.
 *
 * @param config - Current plugin configuration
 * @param schemaTypes - Available Sanity schema types
 * @param onSchemaChange - Callback when schema selection changes
 * @param onFieldToggle - Callback when field enabled state changes
 * @param onFieldPurposeChange - Callback when field purpose text changes
 * @param onRefreshSchema - Callback to refresh schema fields
 */
export function SimpleFieldsTabContent({
  config,
  schemaTypes,
  onSchemaChange,
  onFieldToggle,
  onFieldPurposeChange,
  onRefreshSchema,
}: SimpleFieldsTabContentProps) {
  return (
    <Stack space={5}>
      {/* Header */}
      <Text size={3} weight="bold">
        Field Configuration
      </Text>

      {/* Schema Selection Section */}
      <Card padding={4} border radius={2} shadow={1}>
        <Stack space={3}>
          <Text size={2} weight="semibold">
            Select Content Schema
          </Text>
          <Text size={1} muted>
            Choose which Sanity schema to use for content generation
          </Text>
          <Select
            value={config?.selectedSchema || ''}
            onChange={(event) => onSchemaChange(event.currentTarget.value)}
          >
            <option value="">Choose a schema...</option>
            {schemaTypes.map((type) => (
              <option key={type.name} value={type.name}>
                {type.title || type.name}
              </option>
            ))}
          </Select>
        </Stack>
      </Card>

      {/* Detected Fields Section */}
      {config?.selectedSchema && (
        <Card padding={4} border radius={2} shadow={1}>
          <Stack space={4}>
            {/* Section Header */}
            <Flex justify="space-between" align="center">
              <Box>
                <Text size={2} weight="semibold">
                  Detected Fields
                </Text>
                <Box marginTop={1}>
                  <Text size={1} muted>
                    Toggle fields on/off and describe what each should contain.
                    The LLM will generate content for enabled fields.
                  </Text>
                </Box>
              </Box>
              <Button
                text="Refresh Schema"
                mode="ghost"
                tone="primary"
                onClick={onRefreshSchema}
              />
            </Flex>

            {/* Fields List */}
            <Stack space={3}>
              {config?.detectedFields?.map((field) => (
                <SimpleFieldCard
                  key={field.name}
                  field={field}
                  onToggle={(enabled) => onFieldToggle(field.name, enabled)}
                  onPurposeChange={(purpose) =>
                    onFieldPurposeChange(field.name, purpose)
                  }
                />
              ))}
            </Stack>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
