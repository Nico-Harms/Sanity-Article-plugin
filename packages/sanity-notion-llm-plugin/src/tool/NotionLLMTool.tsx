import { useState, useEffect, useCallback } from 'react';
import { Card, Text, Stack, Box } from '@sanity/ui';
import { useProjectId } from 'sanity';
import { type PluginConfig, type SchemaType } from '@sanity-notion-llm/shared';
import { ApiClient } from '../services/apiClient';
import {
  TabbedInterface,
  FieldsTabContent,
  SettingsTabContent,
  GenerateTabContent,
  DraftReviewSection,
} from '../components';

/*===============================================
|=              NotionLLMTool                    =
===============================================*/

/**
 * NOTION LLM TOOL - MAIN PLUGIN COMPONENT
 *
 * The primary Sanity Studio tool for the Notion LLM plugin.
 * Provides a tabbed interface for configuration, field mapping, and content generation.
 *
 * Key Features:
 * - Multi-tab Interface: Fields, Settings, Generate, and Draft Review tabs
 * - Auto-save Configuration: Automatically saves configuration changes
 * - Dynamic Schema Detection: Fetches and displays actual Sanity schema fields
 * - Real-time Validation: Validates configuration before allowing generation
 * - Draft Management: Reviews and manages generated content drafts
 *
 * Tab Structure:
 * 1. Fields Tab: Schema selection and field mapping configuration
 * 2. Settings Tab: API credentials and connection testing
 * 3. Generate Tab: Content generation from Notion pages
 * 4. Draft Review Tab: Review, approve, and reject generated drafts
 *
 * State Management:
 * - Configuration: Plugin settings and API credentials
 * - Schema Types: Available Sanity schema types
 * - Loading States: UI feedback for async operations
 * - Error Handling: User-friendly error messages
 *
 * Auto-save Logic:
 * - Saves configuration changes automatically
 * - Uses targeted useEffect dependencies to prevent infinite loops
 * - Only saves when actual data changes, not on every render
 */

// Auto-save configuration changes with targeted useEffect dependencies

/*===============================================
|=        This shows the tool tab in the studio        =
===============================================*/

const createEmptyConfig = (studioId: string): PluginConfig => ({
  studioId,
  selectedSchema: null,
  detectedFields: [],
  notionDatabaseUrl: '',
  notionClientSecret: '',
  llmApiKey: '',
  llmModel: 'open-mistral-7b',
  sanityProjectId: '',
  sanityToken: '',
  sanityDataset: 'production',
  isActive: true,
});

export function NotionLLMTool() {
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

  const loadSchemaTypes = async () => {
    if (!projectId) return;

    try {
      const response = await ApiClient.getSchemaTypes(projectId);
      if (response.schemas) {
        setSchemaTypes(response.schemas);
      }
    } catch (error) {
      console.error('Failed to load schema types:', error);
    }
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

  // Auto-save detected field changes (targeted approach)
  useEffect(() => {
    if (!config || !projectId) return;

    // Only auto-save if config has been loaded (not initial empty state)
    const hasLoadedConfig =
      config.notionDatabaseUrl || config.notionClientSecret || config.llmApiKey;
    if (!hasLoadedConfig) return;

    // Only save if we have detected fields or selected schema
    const hasDetectedFields =
      config.detectedFields && config.detectedFields.length > 0;
    const hasSelectedSchema = config.selectedSchema;

    if (hasDetectedFields || hasSelectedSchema) {
      saveConfiguration();
    }
  }, [
    // Only watch specific detected field properties, excluding purpose (debounced separately)
    JSON.stringify(
      config?.detectedFields?.map((f) => ({
        name: f.name,
        enabled: f.enabled,
        // purpose: f.purpose, // Excluded - handled by debounced save
      }))
    ),
    config?.selectedSchema,
  ]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debouncedSaveRef.current) {
        clearTimeout(debouncedSaveRef.current);
      }
    };
  }, []);

  const handleSchemaChange = async (schemaName: string) => {
    if (!projectId) return;

    updateConfig((current) => ({ ...current, selectedSchema: schemaName }));

    try {
      // Fetch fields for selected schema
      const response = await ApiClient.getSchemaFields(projectId, schemaName);
      if (response.fields && Array.isArray(response.fields)) {
        updateConfig((current) => ({
          ...current,
          detectedFields: response.fields!.map((field) => ({
            ...field,
            enabled: false, // Default all fields to disabled
            purpose: '',
          })),
        }));
      }
    } catch (error) {
      console.error('Failed to fetch schema fields:', error);
    }
  };

  const handleFieldToggle = (fieldName: string, enabled: boolean) => {
    updateConfig((current) => ({
      ...current,
      detectedFields: current.detectedFields.map((field) =>
        field.name === fieldName ? { ...field, enabled } : field
      ),
    }));
  };

  const handleFieldPurposeChange = (fieldName: string, purpose: string) => {
    updateConfig((current) => ({
      ...current,
      detectedFields: current.detectedFields.map((field) =>
        field.name === fieldName ? { ...field, purpose } : field
      ),
    }));
  };

  // Debounced save function for field purpose changes
  const debouncedSaveRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedFieldPurposeChange = useCallback(
    (fieldName: string, purpose: string) => {
      // Update UI immediately for responsive feel
      handleFieldPurposeChange(fieldName, purpose);

      // Clear existing timeout
      if (debouncedSaveRef.current) {
        clearTimeout(debouncedSaveRef.current);
      }

      // Set new timeout for saving
      debouncedSaveRef.current = setTimeout(() => {
        saveConfiguration();
      }, 3000); // 3 second delay
    },
    [saveConfiguration]
  );

  const handleRefreshSchema = async () => {
    if (!config?.selectedSchema || !projectId) return;

    try {
      const response = await ApiClient.getSchemaFields(
        projectId,
        config.selectedSchema
      );
      if (response.fields && Array.isArray(response.fields)) {
        updateConfig((current) => ({
          ...current,
          detectedFields: response.fields!.map((field) => ({
            ...field,
            enabled: false, // Reset all fields to disabled
            purpose: '',
          })),
        }));
      }
    } catch (error) {
      console.error('Failed to refresh schema fields:', error);
    }
  };

  const validateConfig = () => {
    if (!config) {
      setErrors(['Please configure the plugin before continuing.']);
      return false;
    }

    // Basic validation - check if we have enabled fields
    const enabledFields =
      config.detectedFields?.filter((field) => field.enabled) || [];
    if (enabledFields.length === 0) {
      setErrors(['Please enable at least one field for content generation.']);
      return false;
    }

    setErrors([]);
    return true;
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
      onSchemaChange={handleSchemaChange}
      onFieldToggle={handleFieldToggle}
      onFieldPurposeChange={debouncedFieldPurposeChange}
      onRefreshSchema={handleRefreshSchema}
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
      onSanityProjectIdChange={(value) =>
        updateConfig((current) => ({
          ...current,
          sanityProjectId: value,
        }))
      }
      onSanityTokenChange={(value) =>
        updateConfig((current) => ({
          ...current,
          sanityToken: value,
        }))
      }
      onSanityDatasetChange={(value) =>
        updateConfig((current) => ({
          ...current,
          sanityDataset: value,
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
        // Draft is automatically created in Sanity via the backend API
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
    {
      id: 'review',
      label: 'Draft Review',
      content: <DraftReviewSection studioId={projectId} />,
    },
  ];

  return (
    <Card padding={4}>
      <Stack space={4}>
        <Box>
          <Text size={3} weight="bold">
            Notion LLM Content Generator
          </Text>
        </Box>

        <TabbedInterface tabs={tabs} defaultTab="fields" />
      </Stack>
    </Card>
  );
}
