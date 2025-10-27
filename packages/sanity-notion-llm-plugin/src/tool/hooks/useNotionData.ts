import { useEffect, useState } from 'react';
import type { PluginConfig } from '@sanity-notion-llm/shared';
import { ApiClient } from '../../services/apiClient';

export function useNotionData(
  studioId: string | null,
  config: PluginConfig | null
) {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (
      !studioId ||
      !config?.notionDatabaseUrl ||
      !config?.notionClientSecret
    ) {
      setPages([]);
      return;
    }

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const response = await ApiClient.getNotionData(studioId);
        setPages(response.pages ?? []);
      } catch (error) {
        console.error('[useNotionData] Failed to load Notion data:', error);
        setError('Failed to load Notion content.');
      } finally {
        setLoading(false);
      }
    })();
  }, [studioId, config?.notionDatabaseUrl, config?.notionClientSecret]);

  return { pages, loading, error };
}
