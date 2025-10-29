import { Card, Text, TextInput, Box, Stack, Button, Select } from '@sanity/ui';
import type { PluginConfig } from '@sanity-notion-llm/shared';
import type { ConfigFieldKey } from '../../tool/types';

interface ApiConfigSectionProps {
  config: PluginConfig;
  onFieldChange: (field: ConfigFieldKey, value: string) => void;
  onTestConnection: () => void;
  isTesting: boolean;
}

const INPUT_FIELDS: Array<{
  key: ConfigFieldKey;
  label: string;
  helper: string;
  placeholder?: string;
  type?: 'text' | 'password';
}> = [
  {
    key: 'notionDatabaseUrl',
    label: 'Notion Database ID',
    placeholder: '2849c9a7e45e81e0a190c25132ee5c75',
    helper: 'The database ID from your Notion database URL (just the ID part)',
  },
  {
    key: 'notionClientSecret',
    label: 'Notion Client Secret',
    type: 'password',
    placeholder: 'secret_...',
    helper: 'Your Notion integration secret key (starts with "secret_")',
  },
  {
    key: 'llmApiKey',
    label: 'LLM API Key (Optional)',
    type: 'password',
    placeholder: 'sk-... (optional)',
    helper: 'Your OpenAI or other LLM provider API key - optional for now',
  },
  {
    key: 'sanityProjectId',
    label: 'Sanity Project ID',
    placeholder: 'abc123xyz',
    helper: 'Found in Sanity Manage → Project Settings',
  },
  {
    key: 'sanityToken',
    label: 'Sanity API Token',
    type: 'password',
    placeholder: 'sk...',
    helper: 'Create a token with Editor permissions in Sanity Manage → API',
  },
];

const LLM_MODELS = [
  { value: 'open-mistral-7b', label: 'Open Mistral 7B (Free Tier)' },
  { value: 'open-mixtral-8x7b', label: 'Open Mixtral 8x7B (Free Tier)' },
  { value: 'mistral-large-latest', label: 'Mistral Large (Paid)' },
  { value: 'mistral-medium-latest', label: 'Mistral Medium (Paid)' },
  { value: 'gpt-4', label: 'GPT-4 (Paid)' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Paid)' },
];

const DATASET_OPTIONS = ['production', 'staging', 'development'];

export function ApiConfigSection({
  config,
  onFieldChange,
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
          Configure your Notion API credentials to connect to your database. LLM
          configuration is optional for now.
        </Text>

        {INPUT_FIELDS.map(({ key, label, helper, placeholder, type }) => (
          <Box key={key}>
            <Text size={2} weight="medium" style={{ marginBottom: 6 }}>
              {label}
            </Text>
            <TextInput
              type={type ?? 'text'}
              placeholder={placeholder}
              value={config[key] || ''}
              onChange={(event) =>
                onFieldChange(key, event.currentTarget.value)
              }
            />
            <Text size={1} muted style={{ marginTop: 4 }}>
              {helper}
            </Text>
          </Box>
        ))}

        <Box>
          <Text size={2} weight="medium" style={{ marginBottom: 6 }}>
            LLM Model
          </Text>
          <Select
            value={config.llmModel || 'open-mistral-7b'}
            onChange={(event) =>
              onFieldChange('llmModel', event.currentTarget.value)
            }
          >
            {LLM_MODELS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Text size={1} muted style={{ marginTop: 4 }}>
            Free tier models have generous limits (1B tokens/month). Paid models
            have higher quality but cost per request.
          </Text>
        </Box>

        <Box>
          <Text size={2} weight="medium" style={{ marginBottom: 6 }}>
            Sanity Dataset
          </Text>
          <Select
            value={config.sanityDataset || 'production'}
            onChange={(event) =>
              onFieldChange('sanityDataset', event.currentTarget.value)
            }
          >
            {DATASET_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <Text size={1} muted style={{ marginTop: 4 }}>
            Choose the dataset where content will be created. Most projects use
            "production".
          </Text>
        </Box>

        <Box>
          <Button
            text="Test Connection"
            tone="primary"
            disabled={
              !config.notionDatabaseUrl ||
              !config.notionClientSecret ||
              isTesting
            }
            loading={isTesting}
            onClick={onTestConnection}
          />
        </Box>
      </Stack>
    </Card>
  );
}
