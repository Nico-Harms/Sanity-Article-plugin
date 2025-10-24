import { useState, useEffect, useCallback } from 'react';
import { Card, Text, Stack } from '@sanity/ui';
import { useSchema, useProjectId } from 'sanity';
import {
  getContentSchemaTypes,
  getSchemaFields,
  autoDetectFieldMappings,
  validateFieldMappings,
} from '../utils/schemaUtils';
import {
  createDefaultFieldMappings,
  type PluginConfig,
  type SchemaType,
} from '@sanity-notion-llm/shared';
import { ApiClient } from '../services/apiClient';
import {
  TabbedInterface,
  FieldsTabContent,
  SettingsTabContent,
  GenerateTabContent,
} from '../components';

// No debounce utility needed - using useEffectEvent instead

/*===============================================
|=        This shows the tool tab in the studio        =
===============================================*/

const createEmptyConfig = (studioId: string): PluginConfig => ({
  studioId,
  selectedSchema: null,
  fieldMappings: createDefaultFieldMappings(),
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

  const saveConfiguration = useCallback(async () => {
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
  }, [config, projectId]);

  // Auto-save field mapping changes (targeted approach)
  useEffect(() => {
    if (!config || !projectId) return;

    // Only auto-save if config has been loaded (not initial empty state)
    const hasLoadedConfig =
      config.notionDatabaseUrl || config.notionClientSecret || config.llmApiKey;
    if (!hasLoadedConfig) return;

    // Only save if we have field mappings or selected schema
    const hasFieldMappings =
      config.fieldMappings && config.fieldMappings.length > 0;
    const hasSelectedSchema = config.selectedSchema;

    if (hasFieldMappings || hasSelectedSchema) {
      saveConfiguration();
    }
  }, [
    // Only watch specific field mapping properties, not entire config
    JSON.stringify(
      config?.fieldMappings?.map((m) => ({
        logicalField: m.logicalField,
        schemaField: m.schemaField,
        enabled: m.enabled,
      }))
    ),
    config?.selectedSchema,
  ]);

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

  // Define tab content components
  const fieldsTabContent = (
    <FieldsTabContent
      config={config}
      schemaTypes={schemaTypes}
      errors={errors}
      onSchemaChange={handleSchemaChange}
      onFieldToggle={handleFieldToggle}
      onFieldMapping={handleFieldMapping}
    />
  );

  const settingsTabContent = (
    <SettingsTabContent
      config={config}
      saving={saving}
      loading={loading}
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
    />
  );

  const generateTabContent = (
    <GenerateTabContent
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
