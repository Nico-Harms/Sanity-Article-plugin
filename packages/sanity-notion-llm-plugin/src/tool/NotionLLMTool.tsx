import { Card, Text, Stack, Box } from '@sanity/ui';
import { useProjectId } from 'sanity';
import {
  TabbedInterface,
  SimpleFieldsTabContent,
  SettingsTabContent,
  GenerateTabContent,
  GeneralTabContent,
} from '../components';
import { usePluginConfig } from './hooks/usePluginConfig';
import type { PluginConfig, DetectedField } from '@sanity-notion-llm/shared';
import { useNotionData } from './hooks/useNotionData';
import { ApiClient } from '../services/apiClient';

export function NotionLLMTool() {
  const projectId = useProjectId();
  const { state, updateConfig, saveConfig, setSchema } =
    usePluginConfig(projectId);
  const notionData = useNotionData(projectId, state.config);

  if (state.loading && !state.config) {
    return (
      <Card padding={4}>
        <Text>Loading configuration…</Text>
      </Card>
    );
  }

  if (!state.config) {
    return (
      <Card padding={4}>
        <Text>
          Failed to load configuration. Please verify your backend is running.
        </Text>
      </Card>
    );
  }

  const config = state.config;

  const fieldsTabContent = (
    <SimpleFieldsTabContent
      config={config}
      schemaTypes={state.schemaTypes}
      onSchemaChange={(schema) => void setSchema(schema)}
      onFieldToggle={(fieldName, enabled) =>
        updateConfig((current: PluginConfig) => ({
          ...current,
          detectedFields: current.detectedFields.map((field: DetectedField) =>
            field.name === fieldName ? { ...field, enabled } : field
          ),
        }))
      }
      onFieldPurposeChange={(fieldName, purpose) =>
        updateConfig((current: PluginConfig) => ({
          ...current,
          detectedFields: current.detectedFields.map((field: DetectedField) =>
            field.name === fieldName ? { ...field, purpose } : field
          ),
        }))
      }
      onRefreshSchema={() => void setSchema(config.selectedSchema)}
    />
  );

  const settingsTabContent = (
    <SettingsTabContent
      config={config}
      saving={state.saving}
      loading={state.loading}
      onConfigFieldChange={(field, value) =>
        updateConfig((current: PluginConfig) => ({
          ...current,
          [field]: value,
        }))
      }
      onSaveConfiguration={saveConfig}
      onTestConnection={async () => {
        try {
          const response = await ApiClient.getNotionData(config.studioId);
          updateConfig((current: PluginConfig) => ({
            ...current,
            isActive: !response.error,
            errorMessage: response.error ?? undefined,
          }));
        } catch (error) {
          console.error('[NotionLLMTool] Connection test failed:', error);
          updateConfig((current: PluginConfig) => ({
            ...current,
            isActive: false,
            errorMessage:
              'Connection test failed. Please check your credentials.',
          }));
        }
      }}
    />
  );

  const generateTabContent = (
    <GenerateTabContent
      studioId={projectId}
      notionPages={notionData.pages}
      onGenerationComplete={(draft) => {
        console.log('Generated draft:', draft);
      }}
    />
  );

  const generalTabContent = <GeneralTabContent studioId={projectId} />;

  const tabs = [
    { id: 'general', label: 'General', content: generalTabContent },
    { id: 'fields', label: 'Fields', content: fieldsTabContent },
    { id: 'settings', label: 'Settings', content: settingsTabContent },
    { id: 'generate', label: 'Generate', content: generateTabContent },
  ];

  return (
    <Card padding={4}>
      <Stack space={4}>
        <Box>
          <Text size={3} weight="bold">
            Notion LLM Content Generator
          </Text>
          {state.error && <Text size={1}>{state.error}</Text>}
        </Box>

        <TabbedInterface tabs={tabs} defaultTab="general" />
      </Stack>
    </Card>
  );
}
