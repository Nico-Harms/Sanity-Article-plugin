import type {
  NotionPageData,
  SanityDraftData,
  DetectedField,
  PluginConfig,
} from '@sanity-notion-llm/shared';
import { LLMProviderFactory, type LLMProvider } from './llm/LLMProviderFactory';
import { PromptBuilder } from './llm/PromptBuilder';
import { ResponseParser } from './llm/ResponseParser';

/*===============================================
|=                 LLMService - Main Class         =
===============================================*/

export class LLMService {
  private provider: LLMProvider;

  constructor(provider: string, apiKey: string, model: string) {
    this.provider = LLMProviderFactory.createProvider(
      provider as 'mistral' | 'openai' | 'gemini' | 'perplexity',
      apiKey,
      model
    );
  }

  /**
   * Generate article content from Notion page data
   *
   * @param notionPage - The Notion page data containing content and subject
   * @param detectedFields - Array of detected fields with their purposes
   * @param schemaType - The Sanity schema type name (e.g., "article", "blogPost")
   * @param config - Plugin configuration containing custom instructions
   * @returns Structured data matching Sanity schema fields
   */
  async generateArticle(
    notionPage: NotionPageData,
    detectedFields: DetectedField[],
    schemaType: string,
    config: PluginConfig
  ): Promise<SanityDraftData> {
    try {
      const prompt = PromptBuilder.build(
        notionPage,
        detectedFields,
        schemaType,
        config
      );
      const response = await this.provider.generateContent(prompt);
      return ResponseParser.parse(response, detectedFields);
    } catch (error) {
      console.error('[llm-service] Error generating article:', error);
      throw new Error(
        `Failed to generate article: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

/**
 * Factory function to create LLM service instance
 */
export function createLLMService(
  provider: string,
  apiKey: string,
  model: string
): LLMService {
  return new LLMService(provider, apiKey, model);
}
