import { useCallback, useEffect, useState } from 'react';
import type { Schema } from 'sanity';
import type {
  PluginConfig,
  SchemaType,
  DetectedField,
} from 'sanity-hermes-shared';
import { ApiClient } from '../../services/apiClient';
import { parseStudioSchema } from '../utils/schema';

export interface PluginConfigState {
  config: PluginConfig | null;
  schemaTypes: SchemaType[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const createDefaultConfig = (studioId: string): PluginConfig => ({
  studioId,
  selectedSchema: null,
  detectedFields: [],
  notionDatabaseUrl: '',
  notionClientSecret: '',
  llmProvider: 'mistral',
  llmApiKey: '',
  llmModel: 'open-mistral-7b',
  sanityProjectId: '',
  sanityToken: '',
  sanityDataset: 'production',
  isActive: true,
});

/**
 * Main plugin configuration hook with smart field saving
 *
 * Handles:
 * - Loading configuration and schema types
 * - Smart field saving (immediate for boolean, debounced for text)
 * - Manual configuration saving
 * - Schema selection and field detection
 */
export function usePluginConfig(studioId: string | null, schema?: Schema) {
  const [state, setState] = useState<PluginConfigState>({
    config: null,
    schemaTypes: [],
    loading: Boolean(studioId),
    saving: false,
    error: null,
  });

  // Load configuration and schema types
  useEffect(() => {
    if (!studioId) {
      setState({
        config: null,
        schemaTypes: [],
        loading: false,
        saving: false,
        error: 'Missing studio identifier.',
      });
      return;
    }

    let cancelled = false;

    (async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const [configResp, schemaResp] = await Promise.all([
          ApiClient.loadConfig(studioId),
          ApiClient.getSchemaTypes(studioId),
        ]);

        if (cancelled) return;

        const config = configResp.config ?? createDefaultConfig(studioId);
        const parsedSchemaTypes =
          schema && typeof schema.getTypeNames === 'function'
            ? parseStudioSchema(schema)
            : [];
        const resolvedSchemaTypes =
          parsedSchemaTypes.length > 0
            ? parsedSchemaTypes
            : (schemaResp.schemas ?? []);

        setState({
          config,
          schemaTypes: resolvedSchemaTypes,
          loading: false,
          saving: false,
          error: null,
        });
      } catch (error) {
        console.error('[usePluginConfig] Load failed:', error);
        if (cancelled) return;

        setState({
          config: createDefaultConfig(studioId),
          schemaTypes: [],
          loading: false,
          saving: false,
          error:
            'Unable to load configuration. Please verify backend connectivity.',
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [studioId, schema]);

  // Update config state
  const updateConfig = useCallback(
    (updater: (current: PluginConfig) => PluginConfig) => {
      setState((prev) =>
        prev.config ? { ...prev, config: updater(prev.config) } : prev
      );
    },
    []
  );

  // Save configuration to backend
  const persist = useCallback(async (configToPersist: PluginConfig) => {
    try {
      const response = await ApiClient.saveConfig(configToPersist);
      const nextConfig = response.config ?? configToPersist;

      setState((prev) => ({
        ...prev,
        config: nextConfig,
        saving: false,
        error: response.error ?? null,
      }));
    } catch (error) {
      console.error('[usePluginConfig] Save failed:', error);
      setState((prev) => ({
        ...prev,
        saving: false,
        error: 'Failed to save configuration. Please retry.',
      }));
    }
  }, []);

  // Manual save (for settings tab button)
  const saveConfig = useCallback(async () => {
    if (!studioId) return;
    const snapshot = state.config ?? createDefaultConfig(studioId);
    // Ensure isActive is true when saving
    const configToSave = { ...snapshot, isActive: true };

    setState((prev) => ({ ...prev, saving: true, error: null }));
    await persist(configToSave);
  }, [persist, state.config, studioId]);

  // Update schema and fetch detected fields
  const setSchema = useCallback(
    async (schemaName: string | null) => {
      if (!studioId || !state.config) return;

      if (!schemaName) {
        updateConfig((current) => ({
          ...current,
          selectedSchema: null,
          detectedFields: [],
        }));
        return;
      }

      const selectedType = state.schemaTypes.find(
        (type) => type.name === schemaName
      );

      if (selectedType) {
        updateConfig((current) => {
          const existingFields = new Map(
            current.detectedFields.map((field) => [field.name, field])
          );

          const mergedFields = selectedType.fields.map((field) => {
            const existing = existingFields.get(field.name);
            return {
              ...field,
              enabled: existing ? existing.enabled : false,
              purpose: existing ? existing.purpose : '',
            } as DetectedField;
          });

          return {
            ...current,
            selectedSchema: schemaName,
            detectedFields: mergedFields,
          };
        });
        return;
      }

      try {
        const response = await ApiClient.getSchemaFields(studioId, schemaName);
        if (response.fields) {
          updateConfig((current) => ({
            ...current,
            selectedSchema: schemaName,
            detectedFields: response.fields!.map(
              (field) =>
                ({
                  ...field,
                  enabled: false,
                  purpose: '',
                }) as DetectedField
            ),
          }));
        }
      } catch (error) {
        console.error('[usePluginConfig] Fetch fields failed:', error);
        setState((prev) => ({
          ...prev,
          error: 'Unable to load fields for selected schema.',
        }));
      }
    },
    [studioId, state.config, state.schemaTypes, updateConfig]
  );

  return {
    state,
    updateConfig,
    saveConfig,
    setSchema,
  };
}
