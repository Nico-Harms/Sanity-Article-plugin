import { Card, Text, TextInput, Box, Stack, Button, Select } from '@sanity/ui';
import type { PluginConfig } from 'sanity-hermes-shared';
import type { ConfigFieldKey } from '../../tool/types';

interface ApiConfigSectionProps {
  config: PluginConfig;
  onFieldChange: (field: ConfigFieldKey, value: string) => void;
  onTestConnection: () => void;
  isTesting: boolean;
  onClearFieldError?: (field: ConfigFieldKey) => void;
  datePropertyOptions?: Array<{ value: string; label: string }>;
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
    helper:
      'Your Notion integration secret key. You can find it in the Notion Developer Portal.',
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

const LLM_PROVIDERS = [
  {
    value: 'mistral',
    label: 'Mistral AI',
    apiUrl: 'https://console.mistral.ai/',
  },
  {
    value: 'openai',
    label: 'OpenAI (ChatGPT)',
    apiUrl: 'https://platform.openai.com/api-keys',
  },
  {
    value: 'gemini',
    label: 'Google Gemini',
    apiUrl: 'https://makersuite.google.com/app/apikey',
  },
  {
    value: 'perplexity',
    label: 'Perplexity AI',
    apiUrl: 'https://www.perplexity.ai/settings/api',
  },
];

const LLM_MODELS: Record<string, Array<{ value: string; label: string }>> = {
  mistral: [
    { value: 'open-mistral-7b', label: 'Mistral 7B (Free)' },
    { value: 'open-mixtral-8x7b', label: 'Mixtral 8x7B (Free)' },
    { value: 'mistral-large-latest', label: 'Mistral Large' },
    { value: 'mistral-medium-latest', label: 'Mistral Medium' },
  ],
  openai: [
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ],
  gemini: [
    { value: 'gemini-pro', label: 'Gemini Pro' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  ],
  perplexity: [
    { value: 'sonar-pro', label: 'Sonar Pro (Recommended)' },
    { value: 'sonar', label: 'Sonar' },
    { value: 'sonar-reasoning', label: 'Sonar Reasoning' },
  ],
};

const DATASET_OPTIONS = ['production', 'staging', 'development'];

export function ApiConfigSection({
  config,
  onFieldChange,
  onTestConnection,
  isTesting,
  onClearFieldError,
  datePropertyOptions = [],
}: ApiConfigSectionProps) {
  // Default to mistral if no provider selected
  const selectedProvider = config.llmProvider || 'mistral';
  const availableModels = LLM_MODELS[selectedProvider] || LLM_MODELS.mistral;
  const selectedProviderInfo = LLM_PROVIDERS.find(
    (p) => p.value === selectedProvider
  );
  const hasDateOptions = datePropertyOptions.length > 0;
  const hasCustomDateSelection =
    !!config.publishDateProperty &&
    !datePropertyOptions.some(
      (option) => option.value === config.publishDateProperty
    );

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

        {INPUT_FIELDS.map(({ key, label, helper, placeholder, type }) => {
          const fieldError = config.fieldErrors?.[key];
          const hasError = !!fieldError;
          return (
            <Box key={key}>
              <Text size={2} weight="medium" style={{ marginBottom: 6 }}>
                {label}
              </Text>
              <TextInput
                type={type ?? 'text'}
                placeholder={placeholder}
                value={config[key] || ''}
                onChange={(event) => {
                  onFieldChange(key, event.currentTarget.value);
                  // Clear field error when user starts typing
                  if (hasError && onClearFieldError) {
                    onClearFieldError(key);
                  }
                }}
                style={{
                  borderColor: hasError ? '#e74c3c' : undefined,
                  borderWidth: hasError ? '2px' : undefined,
                }}
              />
              {hasError ? (
                <Text size={1} style={{ marginTop: 4, color: '#e74c3c' }}>
                  {fieldError}
                </Text>
              ) : (
                <Text size={1} muted style={{ marginTop: 4 }}>
                  {helper}
                </Text>
              )}
            </Box>
          );
        })}

        <Box>
          <Text size={2} weight="medium" style={{ marginBottom: 6 }}>
            Planned Publish Date Field
          </Text>
          <Select
            value={config.publishDateProperty || ''}
            onChange={(event) =>
              onFieldChange('publishDateProperty', event.currentTarget.value)
            }
            disabled={!hasDateOptions && !hasCustomDateSelection}
          >
            <option value="">
              Auto-detect (Publish Date / Planned Date / Date)
            </option>
            {datePropertyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            {hasCustomDateSelection && (
              <option value={config.publishDateProperty}>
                {config.publishDateProperty} (not found in database)
              </option>
            )}
          </Select>
          <Text size={1} muted style={{ marginTop: 4 }}>
            {hasDateOptions
              ? 'Select which Notion date property represents the planned publish date.'
              : 'Run “Test Connection” after entering your Notion credentials to load date fields from the database.'}
          </Text>
        </Box>

        <Box>
          <Text size={2} weight="medium" style={{ marginBottom: 6 }}>
            LLM Provider
          </Text>
          <Select
            value={selectedProvider}
            onChange={(event) => {
              const newProvider = event.currentTarget.value;
              onFieldChange('llmProvider', newProvider);
              // Reset model to first available for the new provider
              const firstModel = LLM_MODELS[newProvider]?.[0]?.value;
              if (firstModel) {
                onFieldChange('llmModel', firstModel);
              }
            }}
          >
            {LLM_PROVIDERS.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </Select>
          <Text size={1} muted style={{ marginTop: 4 }}>
            Select your AI provider.{' '}
            {selectedProviderInfo && (
              <>
                Get API key at:{' '}
                <a
                  href={selectedProviderInfo.apiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {selectedProviderInfo.label}
                </a>
              </>
            )}
          </Text>
        </Box>

        <Box>
          <Text size={2} weight="medium" style={{ marginBottom: 6 }}>
            LLM API Key
          </Text>
          <TextInput
            type="password"
            placeholder="Enter your API key..."
            value={config.llmApiKey || ''}
            onChange={(event) =>
              onFieldChange('llmApiKey', event.currentTarget.value)
            }
          />
          <Text size={1} muted style={{ marginTop: 4 }}>
            API key for {selectedProviderInfo?.label}. Keep this secure!
          </Text>
        </Box>

        <Box>
          <Text size={2} weight="medium" style={{ marginBottom: 6 }}>
            LLM Model
          </Text>
          <Select
            value={config.llmModel || availableModels[0]?.value}
            onChange={(event) =>
              onFieldChange('llmModel', event.currentTarget.value)
            }
          >
            {availableModels.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Text size={1} muted style={{ marginTop: 4 }}>
            Choose the model for content generation. Free models (like Mistral
            7B) have generous limits.
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
