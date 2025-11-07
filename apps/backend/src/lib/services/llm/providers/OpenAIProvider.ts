import OpenAI from 'openai';

/*===============================================
|=           OpenAI Provider                    =
===============================================*/

/**
 * OPENAI PROVIDER
 *
 * Handles content generation using OpenAI models (GPT-3.5, GPT-4).
 */
export class OpenAIProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  /**
   * Generate content using OpenAI
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
        throw new Error('No content received from OpenAI');
      }

      return content.trim();
    } catch (error) {
      console.error('[openai-provider] API call failed:', error);
      throw new Error(
        `OpenAI API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}


