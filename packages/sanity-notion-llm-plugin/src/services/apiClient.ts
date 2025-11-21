import type {
  PluginConfig,
  GenerateRequest,
  GenerateResponse,
  DraftWithMetadata,
  DraftStats,
  NotionPage,
  NotionDatabase,
  SchemaType,
  SchemaField,
  SanityDraftData,
} from 'sanity-hermes-shared';

const BACKEND_URL =
  process.env.SANITY_STUDIO_BACKEND_URL ||
  'https://sanity-notion-llm-api.vercel.app';

export interface ApiResponse<T = unknown> {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  config?: T;
  database?: NotionDatabase;
  pages?: NotionPage[];
  page?: NotionPage;
  draft?: DraftWithMetadata;
  drafts?: DraftWithMetadata[];
  sanityDocId?: string;
  schemas?: SchemaType[];
  fields?: SchemaField[];
  stats?: DraftStats;
}

export class ApiClient {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        ) as Error & { fieldErrors?: Record<string, string> };
        error.fieldErrors = errorData.fieldErrors;
        throw error;
      }

      return await response.json();
    } catch (error) {
      console.error(`[api-client] Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  static async loadConfig(
    studioId: string
  ): Promise<ApiResponse<PluginConfig>> {
    return this.makeRequest<PluginConfig>(`/api/config?studioId=${studioId}`);
  }

  static async saveConfig(
    config: PluginConfig
  ): Promise<ApiResponse<PluginConfig>> {
    return this.makeRequest<PluginConfig>('/api/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  static async getNotionData(studioId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/notion/table?studioId=${studioId}`);
  }

  static async updateNotionStatus(
    studioId: string,
    pageId: string,
    status: string,
    propertyName?: string
  ): Promise<ApiResponse> {
    return this.makeRequest('/api/notion/status', {
      method: 'PATCH',
      body: JSON.stringify({ pageId, status, propertyName }),
    });
  }

  static async generateDraft(
    studioId: string,
    notionPageId: string
  ): Promise<GenerateResponse> {
    const request: GenerateRequest = {
      studioId,
      notionPageId,
    };

    const response = await this.makeRequest<GenerateResponse>('/api/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    // Extract the GenerateResponse from the ApiResponse wrapper
    return {
      success: response.success || false,
      draft: response.draft as SanityDraftData | undefined,
      sanityDocId: response.sanityDocId,
      error: response.error,
    };
  }

  static async getDrafts(studioId: string) {
    const response = await this.makeRequest<{ drafts: DraftWithMetadata[] }>(
      `/api/drafts?studioId=${studioId}`
    );
    return {
      drafts: response.drafts ?? null,
      error: response.error ?? null,
    };
  }

  static async getDraftStats(studioId: string) {
    const response = await this.makeRequest<{ stats: DraftStats }>(
      `/api/drafts/stats?studioId=${studioId}`
    );
    return {
      stats: response.stats ?? null,
      error: response.error ?? null,
    };
  }

  static async approveDraft(studioId: string, documentId: string) {
    const response = await this.makeRequest<{ success: boolean }>(
      '/api/drafts/approve',
      {
        method: 'POST',
        body: JSON.stringify({ studioId, documentId }),
      }
    );
    return {
      success: response.success ?? null,
      error: response.error ?? null,
    };
  }

  static async getSchemaTypes(studioId: string) {
    return this.makeRequest(`/api/schema?studioId=${studioId}`);
  }

  static async getSchemaFields(studioId: string, typeName: string) {
    return this.makeRequest(
      `/api/schema?studioId=${studioId}&typeName=${typeName}`
    );
  }

  static async checkHealth(): Promise<ApiResponse> {
    return this.makeRequest('/api/health');
  }
}
