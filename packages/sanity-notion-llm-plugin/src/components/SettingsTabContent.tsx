import { Card, Text, Stack } from '@sanity/ui';
import { type PluginConfig } from '@sanity-notion-llm/shared';
import { ApiConfigSection } from './ApiConfigSection';
import { ConnectionStatus } from './ConnectionStatus';

interface SettingsTabContentProps {
  config: PluginConfig;
  saving: boolean;
  loading: boolean;
  onNotionDatabaseUrlChange: (value: string) => void;
  onNotionClientSecretChange: (value: string) => void;
  onLlmApiKeyChange: (value: string) => void;
  onLlmModelChange: (value: string) => void;
  onSanityProjectIdChange: (value: string) => void;
  onSanityTokenChange: (value: string) => void;
  onSanityDatasetChange: (value: string) => void;
  onSaveConfiguration: () => void;
  onTestConnection: () => void;
}

export function SettingsTabContent({
  config,
  saving,
  loading,
  onNotionDatabaseUrlChange,
  onNotionClientSecretChange,
  onLlmApiKeyChange,
  onLlmModelChange,
  onSanityProjectIdChange,
  onSanityTokenChange,
  onSanityDatasetChange,
  onSaveConfiguration,
  onTestConnection,
}: SettingsTabContentProps) {
  return (
    <Stack space={4}>
      <Text size={2} weight="medium">
        API Configuration & Settings
      </Text>

      {/* API Configuration */}
      <ApiConfigSection
        notionDatabaseUrl={config?.notionDatabaseUrl || ''}
        notionClientSecret={config?.notionClientSecret || ''}
        llmApiKey={config?.llmApiKey || ''}
        llmModel={config?.llmModel || 'open-mistral-7b'}
        sanityProjectId={config?.sanityProjectId || ''}
        sanityToken={config?.sanityToken || ''}
        sanityDataset={config?.sanityDataset || 'production'}
        onNotionDatabaseUrlChange={onNotionDatabaseUrlChange}
        onNotionClientSecretChange={onNotionClientSecretChange}
        onLlmApiKeyChange={onLlmApiKeyChange}
        onLlmModelChange={onLlmModelChange}
        onSanityProjectIdChange={onSanityProjectIdChange}
        onSanityTokenChange={onSanityTokenChange}
        onSanityDatasetChange={onSanityDatasetChange}
        onSaveConfiguration={onSaveConfiguration}
        onTestConnection={onTestConnection}
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
}
