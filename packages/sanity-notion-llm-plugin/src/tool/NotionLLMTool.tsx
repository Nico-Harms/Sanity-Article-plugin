import { useState, useEffect, useMemo } from 'react';
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
} from '../components';

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/*===============================================
|=        This shows the tool tab in the studio        =
===============================================*/

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

  const loadConfiguration = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const response = await ApiClient.loadConfig(projectId);
      if (response.config) {
        setConfig(response.config);
      } else {
        // Initialize with default config
        setConfig({
          studioId: projectId,
          selectedSchema: null,
          fieldMappings: [],
          notionDatabaseUrl: '',
          notionClientSecret: '',
          llmApiKey: '',
          isActive: true,
        });
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      setErrors(['Failed to load configuration']);
    } finally {
      setLoading(false);
    }
  };

  const loadSchemaTypes = () => {
    const contentTypes = getContentSchemaTypes(schema);
    setSchemaTypes(contentTypes);
  };

  const saveConfiguration = async () => {
    if (!config || !projectId) return;

    setSaving(true);
    try {
      const response = await ApiClient.saveConfig({
        ...config,
        studioId: projectId,
      });
      if (response.success) {
        console.log('Configuration saved successfully');
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      setErrors(['Failed to save configuration']);
    } finally {
      setSaving(false);
    }
  };

  // Debounced auto-save
  const debouncedSave = useMemo(
    () => debounce(saveConfiguration, 500),
    [config, projectId]
  );

  useEffect(() => {
    if (config && projectId) {
      debouncedSave();
    }
  }, [config, projectId, debouncedSave]);

  const handleSchemaChange = (schemaName: string) => {
    const schemaType = schemaTypes.find((type) => type.name === schemaName);
    if (!schemaType || !config) return;

    const schemaFields = getSchemaFields(schemaType);
    const autoMappings = autoDetectFieldMappings(schemaFields);

    setConfig((prev) => ({
      ...prev!,
      selectedSchema: schemaName,
      fieldMappings: autoMappings,
    }));

    setErrors([]);
  };

  const handleFieldToggle = (logicalFieldKey: string, enabled: boolean) => {
    if (!config) return;

    setConfig((prev) => ({
      ...prev!,
      fieldMappings: prev!.fieldMappings.map((mapping) =>
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
    if (!config) return;

    setConfig((prev) => ({
      ...prev!,
      fieldMappings: prev!.fieldMappings.map((mapping) =>
        mapping.logicalField === logicalFieldKey
          ? { ...mapping, schemaField: schemaFieldName }
          : mapping
      ),
    }));
  };

  const validateConfig = () => {
    if (!config) return false;

    const validation = validateFieldMappings(config.fieldMappings);
    setErrors(validation.errors);
    return validation.valid;
  };

  const handleTestConnection = async () => {
    if (!config) return;

    setLoading(true);
    try {
      // Test connection by trying to load Notion data
      const response = await ApiClient.getNotionData(config.studioId);

      setConfig((prev) => ({
        ...prev!,
        isActive: !response.error,
        errorMessage: response.error || undefined,
      }));
    } catch (error) {
      setConfig((prev) => ({
        ...prev!,
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
      console.log('Generating content with config:', config);
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
          setConfig((prev) => ({ ...prev!, notionDatabaseUrl: value }))
        }
        onNotionClientSecretChange={(value) =>
          setConfig((prev) => ({ ...prev!, notionClientSecret: value }))
        }
        onLlmApiKeyChange={(value) =>
          setConfig((prev) => ({ ...prev!, llmApiKey: value }))
        }
        onTestConnection={handleTestConnection}
        isTesting={loading}
      />

      {/* Connection Status */}
      <ConnectionStatus
        isConnected={config.isActive}
        lastTested={new Date()}
        errorMessage={config.errorMessage}
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
    <Stack space={4}>
      <Text size={2} weight="medium">
        Content Generation
      </Text>

      <Text size={1} muted>
        Configure your field mappings and API settings, then generate content
        from your Notion database.
      </Text>

      {/* Load Notion Data Button */}
      <Box>
        <Button
          text="Load Notion Data"
          tone="default"
          mode="ghost"
          onClick={handleLoadNotionData}
          loading={loading}
          disabled={!config.notionDatabaseUrl || !config.notionClientSecret}
        />
      </Box>

      {/* Notion Data Display */}
      {notionData && (
        <Card padding={3} border>
          <Stack space={3}>
            <Text size={2} weight="medium">
              Notion Database: {notionData.database.title}
            </Text>
            <Text size={1} muted>
              Found {notionData.pages.length} pages
            </Text>
            {notionData.pages.slice(0, 3).map((page: any, index: number) => (
              <Card key={index} padding={2} tone="transparent" border>
                <Text size={1} weight="medium">
                  {page.title}
                </Text>
              </Card>
            ))}
          </Stack>
        </Card>
      )}

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
