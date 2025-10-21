import { Card, Text, TextInput, Box, Stack, Button } from '@sanity/ui';

interface ApiConfigSectionProps {
  notionDatabaseUrl: string;
  notionClientSecret: string;
  llmApiKey: string;
  onNotionDatabaseUrlChange: (value: string) => void;
  onNotionClientSecretChange: (value: string) => void;
  onLlmApiKeyChange: (value: string) => void;
  onTestConnection: () => void;
  isTesting: boolean;
}

/*===============================================
=         API Configuration Section         =
===============================================*/

export function ApiConfigSection({
  notionDatabaseUrl,
  notionClientSecret,
  llmApiKey,
  onNotionDatabaseUrlChange,
  onNotionClientSecretChange,
  onLlmApiKeyChange,
  onTestConnection,
  isTesting,
}: ApiConfigSectionProps) {
  return (
    <Card padding={4} border>
      <Stack space={4}>
        <Text size={3} weight="bold">
          API Configuration
        </Text>

        <Text size={1} muted>
          Configure your Notion and LLM API credentials to enable content
          generation.
        </Text>

        {/* Notion Database URL */}
        <Box>
          <Text size={2} weight="medium" style={{ marginBottom: 6 }}>
            Notion Database URL
          </Text>
          <TextInput
            placeholder="https://www.notion.so/your-workspace/database-id"
            value={notionDatabaseUrl}
            onChange={(event) =>
              onNotionDatabaseUrlChange(event.currentTarget.value)
            }
          />
          <Text size={1} muted style={{ marginTop: 4 }}>
            The full URL to your Notion database containing your content plan
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

        {/* LLM API Key */}
        <Box>
          <Text size={2} weight="medium" style={{ marginBottom: 6 }}>
            LLM API Key
          </Text>
          <TextInput
            type="password"
            placeholder="sk-..."
            value={llmApiKey}
            onChange={(event) => onLlmApiKeyChange(event.currentTarget.value)}
          />
          <Text size={1} muted style={{ marginTop: 4 }}>
            Your OpenAI or other LLM provider API key
          </Text>
        </Box>

        {/* Test Connection Button */}
        <Box>
          <Button
            text="Test Connection"
            tone="primary"
            disabled={!notionDatabaseUrl || !notionClientSecret || isTesting}
            loading={isTesting}
            onClick={onTestConnection}
          />
          <Text size={1} muted style={{ marginTop: 4 }}>
            Verify your credentials and database access
          </Text>
        </Box>
      </Stack>
    </Card>
  );
}
