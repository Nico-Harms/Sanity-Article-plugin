import { Card, Text, Stack, Button, Box } from '@sanity/ui';
import { type PluginConfig } from 'sanity-hermes-shared';
import { ApiConfigSection } from '../config/ApiConfigSection';
import { ConnectionStatus } from '../config/ConnectionStatus';
import { InstructionsSection } from '../config/InstructionsSection';
import type { ConfigFieldKey } from '../../tool/types';

interface SettingsTabContentProps {
  config: PluginConfig;
  saving: boolean;
  loading: boolean;
  onConfigFieldChange: (field: ConfigFieldKey, value: string) => void;
  onSaveConfiguration: () => void;
  onTestConnection: () => void;
  onClearFieldError?: (field: ConfigFieldKey) => void;
}

export function SettingsTabContent({
  config,
  saving,
  loading,
  onConfigFieldChange,
  onSaveConfiguration,
  onTestConnection,
  onClearFieldError,
}: SettingsTabContentProps) {
  return (
    <Stack space={5}>
      <Text size={2} weight="medium">
        API Configuration & Settings
      </Text>

      {/* API Configuration */}
      <ApiConfigSection
        config={config}
        onFieldChange={onConfigFieldChange}
        onTestConnection={onTestConnection}
        isTesting={loading}
        onClearFieldError={onClearFieldError}
      />

      {/* Connection Status */}
      <ConnectionStatus
        isConnected={config?.isActive || false}
        lastTested={new Date()}
        errorMessage={config?.errorMessage}
      />

      {/* Content Generation Instructions */}
      <InstructionsSection
        config={config}
        onInstructionChange={onConfigFieldChange}
      />

      {/* Unified Save Button */}
      <Box>
        <Card padding={3} border radius={2} shadow={1}>
          <Stack space={2}>
            <Text size={2} weight="semibold">
              Save Configuration
            </Text>
            <Text size={1} muted>
              Save all configuration settings including API credentials and
              content generation instructions.
            </Text>
            <Button
              text="Save All Settings"
              style={{ width: '200px' }}
              tone="primary"
              disabled={
                !config.notionDatabaseUrl ||
                !config.notionClientSecret ||
                saving
              }
              loading={saving}
              onClick={onSaveConfiguration}
            />
          </Stack>
        </Card>
      </Box>
    </Stack>
  );
}
