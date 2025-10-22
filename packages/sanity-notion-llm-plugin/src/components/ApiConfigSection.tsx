import { Card, Text, TextInput, Box, Stack, Button, Select } from '@sanity/ui';

interface ApiConfigSectionProps {
  notionDatabaseUrl: string;
  notionClientSecret: string;
  llmApiKey: string;
  llmModel: string;
  onNotionDatabaseUrlChange: (value: string) => void;
  onNotionClientSecretChange: (value: string) => void;
  onLlmApiKeyChange: (value: string) => void;
  onLlmModelChange: (value: string) => void;
  onSaveConfiguration: () => void;
  onTestConnection: () => void;
  isSaving: boolean;
  isTesting: boolean;
}

/*===============================================
=         API Configuration Section         =
===============================================*/

export function ApiConfigSection({
  notionDatabaseUrl,
  notionClientSecret,
  llmApiKey,
  llmModel,
  onNotionDatabaseUrlChange,
  onNotionClientSecretChange,
  onLlmApiKeyChange,
  onLlmModelChange,
  onSaveConfiguration,
  onTestConnection,
  isSaving,
  isTesting,
}: ApiConfigSectionProps) {
  return (
    <Card padding={4} border>
      <Stack space={4}>
        <Text size={3} weight="bold">
          API Configuration
        </Text>

        <Text size={1} muted>
          Configure your Notion API credentials to connect to your database. LLM
          configuration is optional for now.
        </Text>

        {/* Notion Database ID */}
        <Box>
          <Text size={2} weight="medium" style={{ marginBottom: 6 }}>
            Notion Database ID
          </Text>
          <TextInput
            placeholder="2849c9a7e45e81e0a190c25132ee5c75"
            value={notionDatabaseUrl}
            onChange={(event) =>
              onNotionDatabaseUrlChange(event.currentTarget.value)
            }
          />
          <Text size={1} muted style={{ marginTop: 4 }}>
            The database ID from your Notion database URL (just the ID part)
          </Text>
        </Box>

        {/* Notion Client Secret */}
        <Box>
          <Text size={2} weight="medium" style={{ marginBottom: 6 }}>
            Notion Client Secret
          </Text>
          <TextInput
            type="password"
            placeholder="secret_..."
            value={notionClientSecret}
            onChange={(event) =>
              onNotionClientSecretChange(event.currentTarget.value)
            }
          />
          <Text size={1} muted style={{ marginTop: 4 }}>
            Your Notion integration secret key (starts with "secret_")
          </Text>
        </Box>

        {/* LLM API Key - Optional */}
        <Box>
          <Text size={2} weight="medium" style={{ marginBottom: 6 }}>
            LLM API Key (Optional)
          </Text>
          <TextInput
            type="password"
            placeholder="sk-... (optional for now)"
            value={llmApiKey}
            onChange={(event) => onLlmApiKeyChange(event.currentTarget.value)}
          />
          <Text size={1} muted style={{ marginTop: 4 }}>
            Your OpenAI or other LLM provider API key - Optional for now
          </Text>
        </Box>

        {/* LLM Model Selection */}
        <Box>
          <Text size={2} weight="medium" style={{ marginBottom: 6 }}>
            LLM Model
          </Text>
          <Select
            value={llmModel}
            onChange={(event) => onLlmModelChange(event.currentTarget.value)}
          >
            <option value="mistral-large-latest">Mistral Large</option>
            <option value="mistral-medium-latest">Mistral Medium</option>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          </Select>
          <Text size={1} muted style={{ marginTop: 4 }}>
            Choose the LLM model for content generation
          </Text>
        </Box>

        {/* Save and Test Buttons */}
        <Box>
          <Stack space={3}>
            <Button
              text="Save Configuration"
              tone="default"
              disabled={!notionDatabaseUrl || !notionClientSecret || isSaving}
              loading={isSaving}
              onClick={onSaveConfiguration}
            />
            <Button
              text="Test Connection"
              tone="primary"
              disabled={!notionDatabaseUrl || !notionClientSecret || isTesting}
              loading={isTesting}
              onClick={onTestConnection}
            />
          </Stack>
          <Text size={1} muted style={{ marginTop: 8 }}>
            Save your credentials first, then test the connection
          </Text>
        </Box>
      </Stack>
    </Card>
  );
}
