import { useState, useEffect } from 'react';
import { Card, Text, Stack, Button, Select, Box, Flex } from '@sanity/ui';
import { useSchema } from 'sanity';
import {
  getContentSchemaTypes,
  getSchemaFields,
  autoDetectFieldMappings,
  validateFieldMappings,
} from '../utils/schemaUtils';
import { LOGICAL_FIELDS, type PluginConfig, type SchemaType } from '../types';
import {
  FieldMappingCard,
  ApiConfigSection,
  ConnectionStatus,
  TabbedInterface,
} from '../components';

/*===============================================
=        This shows the tool tab in the studio        =
===============================================*/

export function NotionLLMTool() {
  const schema = useSchema();
  const [config, setConfig] = useState<PluginConfig>({
    selectedSchema: null,
    fieldMappings: [],
    notionDatabaseUrl: '',
    notionClientSecret: '',
    llmApiKey: '',
    isConnected: false,
  });
  const [schemaTypes, setSchemaTypes] = useState<SchemaType[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Load schema types on mount
  useEffect(() => {
    const contentTypes = getContentSchemaTypes(schema);
    setSchemaTypes(contentTypes);

    // Auto-select first schema type if available
    if (contentTypes.length > 0 && !config.selectedSchema) {
      handleSchemaChange(contentTypes[0].name);
    }
  }, [schema]);

  const handleSchemaChange = (schemaName: string) => {
    const schemaType = schemaTypes.find((type) => type.name === schemaName);
    if (!schemaType) return;

    const schemaFields = getSchemaFields(schemaType);
    const autoMappings = autoDetectFieldMappings(schemaFields);

    setConfig((prev) => ({
      ...prev,
      selectedSchema: schemaName,
      fieldMappings: autoMappings,
    }));

    setErrors([]);
  };

  const handleFieldToggle = (logicalFieldKey: string, enabled: boolean) => {
    setConfig((prev) => ({
      ...prev,
      fieldMappings: prev.fieldMappings.map((mapping) =>
        mapping.logicalField === logicalFieldKey
          ? { ...mapping, enabled }
          : mapping
      ),
    }));
  };

  const handleFieldMapping = (
    logicalFieldKey: string,
    schemaFieldName: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      fieldMappings: prev.fieldMappings.map((mapping) =>
        mapping.logicalField === logicalFieldKey
          ? { ...mapping, schemaField: schemaFieldName }
          : mapping
      ),
    }));
  };

  const validateConfig = () => {
    const validation = validateFieldMappings(config.fieldMappings);
    setErrors(validation.errors);
    return validation.valid;
  };

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual connection test
      console.log('Testing connection with:', {
        databaseUrl: config.notionDatabaseUrl,
        clientSecret: config.notionClientSecret,
        llmApiKey: config.llmApiKey,
      });

      // Simulate connection test
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setConfig((prev) => ({
        ...prev,
        isConnected: true,
        lastTested: new Date(),
        errorMessage: undefined,
      }));
    } catch (error) {
      setConfig((prev) => ({
        ...prev,
        isConnected: false,
        lastTested: new Date(),
        errorMessage: 'Connection failed. Please check your credentials.',
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!validateConfig()) return;

    setLoading(true);
    try {
      // TODO: Implement content generation
      console.log('Generating content with config:', config);
    } catch (error) {
      setErrors(['Failed to generate content']);
    } finally {
      setLoading(false);
    }
  };

  const selectedSchemaType = schemaTypes.find(
    (type) => type.name === config.selectedSchema
  );
  const schemaFields = selectedSchemaType
    ? getSchemaFields(selectedSchemaType)
    : [];

  // Define tab content components
  const fieldsTabContent = (
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
          value={config.selectedSchema || ''}
          onChange={(event) => handleSchemaChange(event.currentTarget.value)}
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
      {config.selectedSchema && (
        <Box>
          <Text size={2} weight="medium">
            Field Mapping
          </Text>
          <Stack space={3}>
            {LOGICAL_FIELDS.map((logicalField) => {
              const mapping = config.fieldMappings.find(
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
                    handleFieldToggle(logicalField.key, enabled)
                  }
                  onFieldSelect={(fieldName) =>
                    handleFieldMapping(logicalField.key, fieldName)
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

  const settingsTabContent = (
    <Stack space={4}>
      <Text size={2} weight="medium">
        API Configuration & Settings
      </Text>

      {/* API Configuration */}
      <ApiConfigSection
        notionDatabaseUrl={config.notionDatabaseUrl}
        notionClientSecret={config.notionClientSecret}
        llmApiKey={config.llmApiKey}
        onNotionDatabaseUrlChange={(value) =>
          setConfig((prev) => ({ ...prev, notionDatabaseUrl: value }))
        }
        onNotionClientSecretChange={(value) =>
          setConfig((prev) => ({ ...prev, notionClientSecret: value }))
        }
        onLlmApiKeyChange={(value) =>
          setConfig((prev) => ({ ...prev, llmApiKey: value }))
        }
        onTestConnection={handleTestConnection}
        isTesting={loading}
      />

      {/* Connection Status */}
      <ConnectionStatus
        isConnected={config.isConnected}
        lastTested={config.lastTested}
        errorMessage={config.errorMessage}
      />
    </Stack>
  );

  const generateTabContent = (
    <Stack space={4}>
      <Text size={2} weight="medium">
        Content Generation
      </Text>

      <Text size={1} muted>
        Configure your field mappings and API settings, then generate content
        from your Notion database.
      </Text>

      {/* Generate Button */}
      <Box>
        <Button
          text="Generate Content from Notion"
          tone="primary"
          disabled={!config.selectedSchema || loading}
          loading={loading}
          onClick={handleGenerateContent}
        />
      </Box>

      {/* Debug Info - Development Only */}
      {process.env.NODE_ENV === 'development' && (
        <Card padding={3} tone="transparent" border>
          <Text size={1} weight="medium">
            Debug Info
          </Text>
          <Text size={1} style={{ fontFamily: 'monospace' }}>
            {JSON.stringify(config, null, 2)}
          </Text>
        </Card>
      )}
    </Stack>
  );

  const tabs = [
    {
      id: 'fields',
      label: 'Fields',
      content: fieldsTabContent,
    },
    {
      id: 'settings',
      label: 'Settings',
      content: settingsTabContent,
    },
    {
      id: 'generate',
      label: 'Generate',
      content: generateTabContent,
    },
  ];

  return (
    <Card padding={4}>
      <Stack space={4}>
        <Text size={3} weight="bold">
          Notion LLM Content Generator
        </Text>

        <TabbedInterface tabs={tabs} defaultTab="fields" />
      </Stack>
    </Card>
  );
}
