import { useState, useEffect } from 'react';
import { Card, Text, Stack, Button, Select, Box, Flex } from '@sanity/ui';
import { useSchema, useProjectId } from 'sanity';
import {
  getContentSchemaTypes,
  getSchemaFields,
  autoDetectFieldMappings,
  validateFieldMappings,
} from '../utils/schemaUtils';
import {
  LOGICAL_FIELDS,
  type PluginConfig,
  type SchemaType,
} from '@sanity-notion-llm/shared';
import { ApiClient } from '../services/apiClient';
import {
  FieldMappingCard,
  ApiConfigSection,
  ConnectionStatus,
  TabbedInterface,
  GenerationSection,
} from '../components';

// No debounce utility needed - using useEffectEvent instead

/*===============================================
|=        This shows the tool tab in the studio        =
===============================================*/

const createEmptyConfig = (studioId: string): PluginConfig => ({
  studioId,
  selectedSchema: null,
  fieldMappings: LOGICAL_FIELDS.map((field) => ({
    logicalField: field.key,
    schemaField: null,
    enabled: false,
  })),
  notionDatabaseUrl: '',
  notionClientSecret: '',
  llmApiKey: '',
  llmModel: 'mistral-large-latest',
  isActive: true,
});

export function NotionLLMTool() {
  const schema = useSchema();
  const projectId = useProjectId();

  const [config, setConfig] = useState<PluginConfig | null>(null);
  const [schemaTypes, setSchemaTypes] = useState<SchemaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [notionData, setNotionData] = useState<any>(null);

  // Load configuration and schema types on mount
  useEffect(() => {
    loadConfiguration();
    loadSchemaTypes();
  }, [projectId]);

  // Load Notion data when config is available
  useEffect(() => {
    if (config?.notionDatabaseUrl && config?.notionClientSecret) {
      handleLoadNotionData();
    }
  }, [config?.notionDatabaseUrl, config?.notionClientSecret]);

  const updateConfig = (
    updater: (current: PluginConfig) => PluginConfig
  ): void => {
    if (!projectId) return;
    setConfig((current) => {
      const base = current ?? createEmptyConfig(projectId);
      return updater(base);
    });
  };

  const loadConfiguration = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const response = await ApiClient.loadConfig(projectId);
      if (response.config) {
        setConfig(response.config);
      } else {
        setConfig(createEmptyConfig(projectId));
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      setErrors(['Failed to load configuration']);
      setConfig(createEmptyConfig(projectId));
    } finally {
      setLoading(false);
    }
  };

  const loadSchemaTypes = () => {
    const contentTypes = getContentSchemaTypes(schema);
    setSchemaTypes(contentTypes);
  };

  const saveConfiguration = async () => {
    if (!projectId) return;

    setSaving(true);
    try {
      const configToSave = config ?? createEmptyConfig(projectId);
      const response = await ApiClient.saveConfig({
        ...configToSave,
        studioId: projectId,
      });
      if (response.success && response.config) {
        setConfig(response.config);
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      setErrors(['Failed to save configuration']);
    } finally {
      setSaving(false);
    }
  };

  // No auto-save - only save when user clicks save button

  const handleSchemaChange = (schemaName: string) => {
    const schemaType = schemaTypes.find((type) => type.name === schemaName);
    if (!schemaType || !projectId) return;

    const schemaFields = getSchemaFields(schemaType);
    const autoMappings = autoDetectFieldMappings(schemaFields);

    updateConfig((current) => ({
      ...current,
      selectedSchema: schemaName,
      fieldMappings: autoMappings,
    }));

    setErrors([]);
  };

  const handleFieldToggle = (logicalFieldKey: string, enabled: boolean) => {
    updateConfig((current) => ({
      ...current,
      fieldMappings: current.fieldMappings.map((mapping) =>
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
    updateConfig((current) => ({
      ...current,
      fieldMappings: current.fieldMappings.map((mapping) =>
        mapping.logicalField === logicalFieldKey
          ? { ...mapping, schemaField: schemaFieldName }
          : mapping
      ),
    }));
  };

  const validateConfig = () => {
    if (!config) {
      setErrors(['Please configure the plugin before continuing.']);
      return false;
    }

    const validation = validateFieldMappings(config.fieldMappings || []);
    setErrors(validation.errors);
    return validation.valid;
  };

  const handleTestConnection = async () => {
    if (!config) return;

    setLoading(true);
    try {
      // Test connection by trying to load Notion data
      const response = await ApiClient.getNotionData(config.studioId);

      updateConfig((current) => ({
        ...current,
        isActive: !response.error,
        errorMessage: response.error || undefined,
      }));
    } catch (error) {
      updateConfig((current) => ({
        ...current,
        isActive: false,
        errorMessage: 'Connection test failed. Please check your credentials.',
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleLoadNotionData = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const response = await ApiClient.getNotionData(projectId);
      if (response.database && response.pages) {
        setNotionData({ database: response.database, pages: response.pages });
      }
    } catch (error) {
      console.error('Failed to load Notion data:', error);
      setErrors(['Failed to load Notion data']);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!validateConfig()) return;

    setLoading(true);
    try {
      // TODO: Implement content generation
    } catch (error) {
      setErrors(['Failed to generate content']);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !config) {
    return (
      <Card padding={4}>
        <Text>Loading configuration...</Text>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card padding={4}>
        <Text>Failed to load configuration</Text>
      </Card>
    );
  }

  const selectedSchemaType = schemaTypes.find(
    (type) => type.name === config?.selectedSchema
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
          value={config?.selectedSchema || ''}
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
        notionDatabaseUrl={config?.notionDatabaseUrl || ''}
        notionClientSecret={config?.notionClientSecret || ''}
        llmApiKey={config?.llmApiKey || ''}
        llmModel={config?.llmModel || 'mistral-large-latest'}
        onNotionDatabaseUrlChange={(value) =>
          updateConfig((current) => ({
            ...current,
            notionDatabaseUrl: value,
          }))
        }
        onNotionClientSecretChange={(value) =>
          updateConfig((current) => ({
            ...current,
            notionClientSecret: value,
          }))
        }
        onLlmApiKeyChange={(value) =>
          updateConfig((current) => ({
            ...current,
            llmApiKey: value,
          }))
        }
        onLlmModelChange={(value) =>
          updateConfig((current) => ({
            ...current,
            llmModel: value,
          }))
        }
        onSaveConfiguration={saveConfiguration}
        onTestConnection={handleTestConnection}
        isSaving={saving}
        isTesting={loading}
      />

      {/* Connection Status */}
      <ConnectionStatus
        isConnected={config?.isActive || false}
        lastTested={new Date()}
        errorMessage={config?.errorMessage}
      />

      {/* Save Status */}
      {saving && (
        <Card padding={3} tone="transparent" border>
          <Text size={1}>Saving configuration...</Text>
        </Card>
      )}
    </Stack>
  );

  const generateTabContent = (
    <GenerationSection
      studioId={projectId}
      notionPages={notionData?.pages || []}
      onGenerationComplete={(draft) => {
        console.log('Generated draft:', draft);
        // TODO: Handle the generated draft (e.g., create Sanity document)
      }}
    />
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
