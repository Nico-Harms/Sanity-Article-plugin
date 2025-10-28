import { useCallback, useEffect, useRef, useState } from 'react';
import type { PluginConfig, SchemaType } from '@sanity-notion-llm/shared';
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

export function usePluginConfig(studioId: string | null) {
  const [state, setState] = useState<PluginConfigState>({
    config: null,
    schemaTypes: [],
    loading: Boolean(studioId),
    saving: false,
    error: null,
  });

  const lastSaved = useRef<string | null>(null);

  // ---------------------------------------------------------------------------
  // Load configuration + schema types
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!studioId) {
      setState({
        config: null,
        schemaTypes: [],
        loading: false,
        saving: false,
        error: 'Missing studio identifier.',
      });
      lastSaved.current = null;
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
        // Track saved state excluding instruction fields
        const {
          generalInstructions,
          toneInstructions,
          fieldInstructions,
          ...configWithoutInstructions
        } = config;
        lastSaved.current = JSON.stringify(configWithoutInstructions);

        setState({
          config,
          schemaTypes: schemaResp.schemas ?? [],
          loading: false,
          saving: false,
          error: null,
        });
      } catch (error) {
        console.error('[usePluginConfig] load failed', error);

        if (cancelled) return;

        const fallback = createDefaultConfig(studioId);
        // Track saved state excluding instruction fields
        const {
          generalInstructions,
          toneInstructions,
          fieldInstructions,
          ...configWithoutInstructions
        } = fallback;
        lastSaved.current = JSON.stringify(configWithoutInstructions);

        setState({
          config: fallback,
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

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const updateConfig = useCallback(
    (updater: (current: PluginConfig) => PluginConfig) => {
      setState((prev) =>
        prev.config ? { ...prev, config: updater(prev.config) } : prev
      );
    },
    []
  );

  const persist = useCallback(async (configToPersist: PluginConfig) => {
    try {
      const response = await ApiClient.saveConfig(configToPersist);
      const nextConfig = response.config ?? configToPersist;
      // Track saved state excluding instruction fields
      const {
        generalInstructions,
        toneInstructions,
        fieldInstructions,
        ...configWithoutInstructions
      } = nextConfig;
      lastSaved.current = JSON.stringify(configWithoutInstructions);

      setState((prev) => ({
        ...prev,
        config: nextConfig,
        saving: false,
        error: response.error ?? null,
      }));
    } catch (error) {
      console.error('[usePluginConfig] save failed', error);
      setState((prev) => ({
        ...prev,
        saving: false,
        error: 'Failed to save configuration. Please retry.',
      }));
    }
  }, []);

  // Manual save (used by the settings tab button)
  const saveConfig = useCallback(async () => {
    if (!studioId) return;
    const snapshot = state.config ?? createDefaultConfig(studioId);
    setState((prev) => ({ ...prev, saving: true, error: null }));
    await persist(snapshot);
  }, [persist, state.config, studioId]);

  // Automatic persistence when config changes (excluding instruction fields)
  // DISABLED: Field purpose changes are handled by debounced save in NotionLLMTool
  // This prevents double saves when typing in field purposes
  // useEffect(() => {
  //   if (!studioId || !state.config || state.loading) return;

  //   // Create a copy of config without instruction fields for comparison
  //   const {
  //     generalInstructions,
  //     toneInstructions,
  //     fieldInstructions,
  //     ...configWithoutInstructions
  //   } = state.config;
  //   const payload = JSON.stringify(configWithoutInstructions);

  //   if (payload === lastSaved.current) return;

  //   setState((prev) => ({ ...prev, saving: true }));
  //   void persist(state.config);
  // }, [persist, state.config, state.loading, studioId]);

  // Update schema + fetch detected fields
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
        console.error('[usePluginConfig] fetch fields failed', error);
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
