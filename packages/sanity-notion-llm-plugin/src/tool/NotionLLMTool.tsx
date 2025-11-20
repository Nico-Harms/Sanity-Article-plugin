import { Card, Text, Stack, Box } from '@sanity/ui';
import { useProjectId } from 'sanity';
import { TabbedInterface } from '../components/layout/TabbedInterface';
import { SimpleFieldsTabContent } from '../components/tabs/SimpleFieldsTabContent';
import { SettingsTabContent } from '../components/tabs/SettingsTabContent';
import { GenerateTabContent } from '../components/tabs/GenerateTabContent';
import { GeneralTabContent } from '../components/tabs/GeneralTabContent';
import { usePluginConfig } from './hooks/usePluginConfig';
import type { PluginConfig, DetectedField } from 'sanity-hermes-shared';
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
      <Card padding={4} paddingY={5}>
        <Stack space={3}>
          <Text size={2} weight="semibold">
            Welcome to Hermes!
          </Text>
          <Text size={1} muted>
            No configuration found for this Studio. Please go to the Settings
            tab to configure your Notion, LLM, and Sanity credentials.
          </Text>
          <Box
            padding={2}
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: '4px',
            }}
          >
            <Text size={0} muted>
              Studio ID: {projectId || 'Unknown'}
            </Text>
          </Box>
        </Stack>
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
      onSaveFields={saveConfig}
      saving={state.saving}
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
      onClearFieldError={(field) => {
        updateConfig((current: PluginConfig) => {
          if (!current.fieldErrors) return current;
          const newFieldErrors = { ...current.fieldErrors };
          delete newFieldErrors[field];
          return {
            ...current,
            fieldErrors:
              Object.keys(newFieldErrors).length > 0
                ? newFieldErrors
                : undefined,
          };
        });
      }}
      onTestConnection={async () => {
        try {
          const response = await ApiClient.getNotionData(config.studioId);
          updateConfig((current: PluginConfig) => ({
            ...current,
            isActive: !response.error,
            errorMessage: response.error ?? undefined,
            fieldErrors: response.fieldErrors ?? {},
          }));
        } catch (error) {
          console.error('[NotionLLMTool] Connection test failed:', error);
          const fieldErrors =
            (error as Error & { fieldErrors?: Record<string, string> })
              .fieldErrors || {};
          updateConfig((current: PluginConfig) => ({
            ...current,
            isActive: false,
            errorMessage:
              error instanceof Error
                ? error.message
                : 'Connection test failed. Please check your credentials.',
            fieldErrors,
          }));
        }
      }}
    />
  );

  const generateTabContent = (
    <GenerateTabContent
      studioId={projectId}
      notionPages={notionData.pages}
      onGenerationComplete={() => {
        // Draft generation completed
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
            Hermés Content Manager
          </Text>
          {state.error && <Text size={1}>{state.error}</Text>}
        </Box>

        <TabbedInterface tabs={tabs} defaultTab="general" />
      </Stack>
    </Card>
  );
}
