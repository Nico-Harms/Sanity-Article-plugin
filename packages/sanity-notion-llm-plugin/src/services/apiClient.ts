import type { PluginConfig } from '@sanity-notion-llm/shared';

const BACKEND_URL =
  process.env.SANITY_STUDIO_BACKEND_URL || 'http://localhost:3001';

export interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  config?: T;
  database?: any;
  pages?: any[];
  page?: any;
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
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
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
}
