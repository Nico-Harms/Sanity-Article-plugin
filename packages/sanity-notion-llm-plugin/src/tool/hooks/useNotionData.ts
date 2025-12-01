import { useEffect, useState } from 'react';
import type {
  PluginConfig,
  NotionPage,
  NotionDatabase,
} from 'sanity-hermes-shared';
import { ApiClient } from '../../services/apiClient';

export function useNotionData(
  studioId: string | null,
  config: PluginConfig | null
) {
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [database, setDatabase] = useState<NotionDatabase | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (
      !studioId ||
      !config?.notionDatabaseUrl ||
      !config?.notionClientSecret
    ) {
      setPages([]);
      setDatabase(null);
      return;
    }

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const response = await ApiClient.getNotionData(studioId);
        setPages(response.pages ?? []);
        setDatabase(response.database ?? null);
      } catch (error) {
        console.error('[useNotionData] Failed to load Notion data:', error);
        setError('Failed to load Notion content.');
        setDatabase(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [studioId, config?.notionDatabaseUrl, config?.notionClientSecret]);

  return { pages, database, loading, error };
}
