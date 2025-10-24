import { Card, Text, TextInput, Box, Stack, Button, Select } from '@sanity/ui';

interface ApiConfigSectionProps {
  notionDatabaseUrl: string;
  notionClientSecret: string;
  llmApiKey: string;
  llmModel: string;
  sanityProjectId: string;
  sanityToken: string;
  sanityDataset: string;
  onNotionDatabaseUrlChange: (value: string) => void;
  onNotionClientSecretChange: (value: string) => void;
  onLlmApiKeyChange: (value: string) => void;
  onLlmModelChange: (value: string) => void;
  onSanityProjectIdChange: (value: string) => void;
  onSanityTokenChange: (value: string) => void;
  onSanityDatasetChange: (value: string) => void;
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
  sanityProjectId,
  sanityToken,
  sanityDataset,
  onNotionDatabaseUrlChange,
  onNotionClientSecretChange,
  onLlmApiKeyChange,
  onLlmModelChange,
  onSanityProjectIdChange,
  onSanityTokenChange,
  onSanityDatasetChange,
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
            <option value="open-mistral-7b">Open Mistral 7B (Free Tier)</option>
            <option value="open-mixtral-8x7b">
              Open Mixtral 8x7B (Free Tier)
            </option>
            <option value="mistral-large-latest">Mistral Large (Paid)</option>
            <option value="mistral-medium-latest">Mistral Medium (Paid)</option>
            <option value="gpt-4">GPT-4 (Paid)</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Paid)</option>
          </Select>
          <Text size={1} muted style={{ marginTop: 4 }}>
            Free tier models have generous limits (1B tokens/month). Paid models
            have higher quality but cost per request.
          </Text>
        </Box>

        {/* Sanity Configuration */}
        <Box>
          <Text size={2} weight="medium" style={{ marginBottom: 6 }}>
            Sanity Project ID
          </Text>
          <TextInput
            value={sanityProjectId}
            onChange={(e) => onSanityProjectIdChange(e.currentTarget.value)}
            placeholder="abc123xyz"
          />
          <Text size={1} muted style={{ marginTop: 4 }}>
            Found in Sanity Manage → Project Settings
          </Text>
        </Box>

        <Box>
          <Text size={2} weight="medium" style={{ marginBottom: 6 }}>
            Sanity API Token
          </Text>
          <TextInput
            type="password"
            value={sanityToken}
            onChange={(e) => onSanityTokenChange(e.currentTarget.value)}
            placeholder="sk..."
          />
          <Text size={1} muted style={{ marginTop: 4 }}>
            Create token with Editor permissions in Sanity Manage → API
          </Text>
        </Box>

        <Box>
          <Text size={2} weight="medium" style={{ marginBottom: 6 }}>
            Sanity Dataset
          </Text>
          <Select
            value={sanityDataset}
            onChange={(e) => onSanityDatasetChange(e.currentTarget.value)}
          >
            <option value="production">production</option>
            <option value="staging">staging</option>
            <option value="development">development</option>
          </Select>
          <Text size={1} muted style={{ marginTop: 4 }}>
            Choose the dataset where content will be created. Most projects use
            "production".
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
