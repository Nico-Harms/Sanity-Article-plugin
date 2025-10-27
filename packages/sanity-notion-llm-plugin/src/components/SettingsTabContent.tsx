import { Card, Text, Stack } from '@sanity/ui';
import { type PluginConfig } from '@sanity-notion-llm/shared';
import { ApiConfigSection } from './ApiConfigSection';
import { ConnectionStatus } from './ConnectionStatus';
import type { ConfigFieldKey } from '../tool/types';

interface SettingsTabContentProps {
  config: PluginConfig;
  saving: boolean;
  loading: boolean;
  onConfigFieldChange: (field: ConfigFieldKey, value: string) => void;
  onSaveConfiguration: () => void;
  onTestConnection: () => void;
}

export function SettingsTabContent({
  config,
  saving,
  loading,
  onConfigFieldChange,
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
        config={config}
        onFieldChange={onConfigFieldChange}
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
