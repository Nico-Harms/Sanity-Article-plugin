import { GoogleGenerativeAI } from '@google/generative-ai';

/*===============================================
|=           Google Gemini Provider             =
===============================================*/

/**
 * GEMINI PROVIDER
 *
 * Handles content generation using Google Gemini models.
 */
export class GeminiProvider {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  /**
   * Generate content using Google Gemini
   * @param prompt - The prompt to send to the model
   * @returns Generated content as a string
   */
  async generateContent(prompt: string): Promise<string> {
    try {
      const generativeModel = this.client.getGenerativeModel({
        model: this.model,
      });

      const result = await generativeModel.generateContent(prompt);
      const response = await result.response;
      const content = response.text();

      if (!content) {
        throw new Error('No content received from Google Gemini');
      }

      return content.trim();
    } catch (error) {
      console.error('[gemini-provider] API call failed:', error);
      throw new Error(
        `Google Gemini API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}


