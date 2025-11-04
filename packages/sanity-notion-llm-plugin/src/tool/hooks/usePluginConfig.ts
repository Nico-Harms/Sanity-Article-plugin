import { useCallback, useEffect, useState } from 'react';
import type { PluginConfig, SchemaType, DetectedField } from '@sanity-notion-llm/shared';
import { ApiClient } from '../../services/apiClient';

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
export function usePluginConfig(studioId: string | null) {
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
        setState({
          config,
          schemaTypes: schemaResp.schemas ?? [],
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
  }, [studioId]);

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
    setState((prev) => ({ ...prev, saving: true, error: null }));
    await persist(snapshot);
  }, [persist, state.config, studioId]);

  // Update schema and fetch detected fields
  const setSchema = useCallback(
    async (schemaName: string | null) => {
      if (!studioId || !state.config) return;

      updateConfig((current) => ({
        ...current,
        selectedSchema: schemaName,
        detectedFields: schemaName ? current.detectedFields : [],
      }));

      if (!schemaName) return;

      try {
        const response = await ApiClient.getSchemaFields(studioId, schemaName);
        if (response.fields) {
          updateConfig((current) => ({
            ...current,
            detectedFields: response.fields!.map((field) => ({
              ...field,
              enabled: false,
              purpose: '',
            })),
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
    [studioId, state.config, updateConfig]
  );

  return {
    state,
    updateConfig,
    saveConfig,
    setSchema,
  };
}
