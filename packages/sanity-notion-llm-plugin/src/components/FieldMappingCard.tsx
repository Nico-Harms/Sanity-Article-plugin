import { Card, Text, Switch, Box, Flex, Badge, Select } from '@sanity/ui';
import { type LogicalField, type SchemaField } from '@sanity-notion-llm/shared';

interface FieldMappingCardProps {
  logicalField: LogicalField;
  schemaFields: SchemaField[];
  isEnabled: boolean;
  selectedField: string;
  onToggle: (enabled: boolean) => void;
  onFieldSelect: (fieldName: string) => void;
}

/*===============================================
=         Field Mapping Card Component         =
===============================================*/

export function FieldMappingCard({
  logicalField,
  schemaFields,
  isEnabled,
  selectedField,
  onToggle,
  onFieldSelect,
}: FieldMappingCardProps) {
  return (
    <Card padding={3} border>
      <Flex align="center" gap={3}>
        <Switch
          checked={isEnabled}
          onChange={(event) => onToggle(event.currentTarget.checked)}
        />

        <Box flex={1}>
          <Flex align="center" gap={2}>
            <Text weight="medium">{logicalField.label}</Text>
            {logicalField.required && (
              <Badge tone="critical" mode="outline" size={1}>
                Required
              </Badge>
            )}
          </Flex>
          <Text style={{ marginTop: 6 }} size={1} muted>
            {logicalField.description}
          </Text>
        </Box>

        {isEnabled && (
          <Box style={{ minWidth: '200px' }}>
            <Select
              value={selectedField}
              onChange={(event) => onFieldSelect(event.currentTarget.value)}
            >
              <option value="">Select field...</option>
              {schemaFields.map((field) => (
                <option key={field.name} value={field.name}>
                  {field.title} ({field.type})
                </option>
              ))}
            </Select>
          </Box>
        )}
      </Flex>
    </Card>
  );
}
