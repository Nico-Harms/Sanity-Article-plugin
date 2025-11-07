import OpenAI from 'openai';

/*===============================================
|=           Perplexity AI Provider             =
===============================================*/

/**
 * PERPLEXITY PROVIDER
 *
 * Handles content generation using Perplexity AI models.
 * Uses OpenAI-compatible Chat Completions API.
 *
 * Documentation: https://docs.perplexity.ai/getting-started/quickstart
 *
 * Key Features:
 * - OpenAI SDK compatible
 * - Chat Completions format for article generation
 * - Optional citations and search results (available in response metadata)
 *
 * Models:
 * - sonar-pro: Most capable model (recommended)
 * - sonar: Fast and efficient
 * - sonar-reasoning: Enhanced reasoning capabilities
 */
export class PerplexityProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    // Perplexity uses OpenAI-compatible API
    // Point OpenAI client to Perplexity's endpoint
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.perplexity.ai',
    });
    this.model = model;
  }

  /**
   * Generate content using Perplexity AI Chat Completions
   *
   * This uses the same format as OpenAI's chat completions
   * for generating long-form content like articles.
   *
   * @param prompt - The prompt to send to the model
   * @returns Generated content as a string
   */
  async generateContent(prompt: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from Perplexity AI');
      }

      return content.trim();
    } catch (error) {
      console.error('[perplexity-provider] API call failed:', error);
      throw new Error(
        `Perplexity AI API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
