import { Card, Text, Stack, Select, Box } from '@sanity/ui';
import {
  LOGICAL_FIELDS,
  type PluginConfig,
  type SchemaType,
} from '@sanity-notion-llm/shared';
import { getSchemaFields } from '../utils/schemaUtils';
import { FieldMappingCard } from './FieldMappingCard';

interface FieldsTabContentProps {
  config: PluginConfig;
  schemaTypes: SchemaType[];
  errors: string[];
  onSchemaChange: (schemaName: string) => void;
  onFieldToggle: (logicalFieldKey: string, enabled: boolean) => void;
  onFieldMapping: (logicalFieldKey: string, schemaFieldName: string) => void;
}

export function FieldsTabContent({
  config,
  schemaTypes,
  errors,
  onSchemaChange,
  onFieldToggle,
  onFieldMapping,
}: FieldsTabContentProps) {
  const selectedSchemaType = schemaTypes.find(
    (type) => type.name === config?.selectedSchema
  );
  const schemaFields = selectedSchemaType
    ? getSchemaFields(selectedSchemaType)
    : [];

  return (
    <Stack space={4}>
      <Text size={2} weight="medium">
        Field Mapping Configuration
      </Text>

      {/* Schema Selection */}
      <Box>
        <Text size={2} weight="medium">
          Select Content Schema
        </Text>
        <Select
          style={{ marginTop: 6 }}
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
      </Box>

      {/* Field Mapping */}
      {config?.selectedSchema && (
        <Box>
          <Text size={2} weight="medium">
            Field Mapping
          </Text>
          <Stack space={3}>
            {LOGICAL_FIELDS.map((logicalField) => {
              const mapping = config?.fieldMappings?.find(
                (m) => m.logicalField === logicalField.key
              );
              const isEnabled = mapping?.enabled || false;
              const selectedField = mapping?.schemaField || '';

              return (
                <FieldMappingCard
                  key={logicalField.key}
                  logicalField={logicalField}
                  schemaFields={schemaFields}
                  isEnabled={isEnabled}
                  selectedField={selectedField}
                  onToggle={(enabled) =>
                    onFieldToggle(logicalField.key, enabled)
                  }
                  onFieldSelect={(fieldName) =>
                    onFieldMapping(logicalField.key, fieldName)
                  }
                />
              );
            })}
          </Stack>
        </Box>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <Card padding={3} tone="critical" border>
          <Stack space={2}>
            {errors.map((error, index) => (
              <Text key={index} size={1}>
                {error}
              </Text>
            ))}
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
