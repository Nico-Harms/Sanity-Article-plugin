import { Mistral } from '@mistralai/mistralai';

/*===============================================
|=           Mistral AI Provider                =
===============================================*/

/**
 * MISTRAL AI PROVIDER
 *
 * Handles content generation using Mistral AI models.
 * Supports free tier models (Mistral 7B, Mixtral 8x7B) and paid models.
 */
export class MistralProvider {
  private client: Mistral;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Mistral({ apiKey });
    this.model = model;
  }

  /**
   * Generate content using Mistral AI
   * @param prompt - The prompt to send to the model
   * @returns Generated content as a string
   */
  async generateContent(prompt: string): Promise<string> {
    try {
      const response = await this.client.chat.complete({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        maxTokens: 4000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from Mistral AI');
      }

      // Handle both string and ContentChunk[] types
      const contentString =
        typeof content === 'string'
          ? content
          : content
              .map((chunk) => {
                if (typeof chunk === 'string') return chunk;
                if ('text' in chunk) return chunk.text;
                return '';
              })
              .join('');

      return contentString.trim();
    } catch (error) {
      console.error('[mistral-provider] API call failed:', error);
      throw new Error(
        `Mistral AI API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}


