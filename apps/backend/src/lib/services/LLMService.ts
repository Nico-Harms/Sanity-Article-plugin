import { Mistral } from '@mistralai/mistralai';
import type {
  NotionPageData,
  SanityDraftData,
  DetectedField,
  PluginConfig,
} from '@sanity-notion-llm/shared';

/*===============================================
|=                 LLMService                   =
===============================================*/

/**
 * LLM SERVICE
 *
 * Generates Sanity article drafts from Notion content using Large Language Models.
 * Handles prompt engineering, API calls, and response parsing for content generation.
 *
 * Key Features:
 * - Dynamic Prompt Building: Creates structured prompts based on detected schema fields
 * - Multi-Model Support: Currently supports Mistral AI (extensible to other LLMs)
 * - Field-Aware Generation: Uses field purposes to generate contextually appropriate content
 * - JSON Response Parsing: Validates and parses LLM responses into structured data
 *
 * Prompt Engineering:
 * - Includes Notion content plan (subject + content)
 * - Lists all enabled fields with their purposes
 * - Provides clear JSON structure requirements
 * - Includes content quality guidelines
 *
 * Error Handling:
 * - Validates LLM responses for required fields
 * - Handles API rate limits and errors
 * - Provides detailed error messages for debugging
 *
 * Security:
 * - Uses encrypted API keys from configuration
 * - No content persistence - generates on-demand
 * - Validates all inputs before processing
 */
export class LLMService {
  private client: Mistral;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Mistral({ apiKey });
    this.model = model;
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
      const prompt = this.buildPrompt(
        notionPage,
        detectedFields,
        schemaType,
        config
      );
      const response = await this.callLLM(prompt);
      return this.parseResponse(response, detectedFields);
    } catch (error) {
      console.error('[llm-service] Error generating article:', error);
      throw new Error(
        `Failed to generate article: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build a structured prompt for the LLM
   */
  private buildPrompt(
    notionPage: NotionPageData,
    detectedFields: DetectedField[],
    schemaType: string,
    config: PluginConfig
  ): string {
    const enabledFields = detectedFields.filter((field) => field.enabled);

    const fieldInstructions = enabledFields
      .map((field) => {
        const purpose = field.purpose || 'Generate appropriate content';
        const label = field.title || field.name;
        return `- ${label} (${field.type}): ${purpose}`;
      })
      .join('\n');

    // Build custom instructions section
    const customInstructions = [];
    if (config.generalInstructions) {
      customInstructions.push(
        `GENERAL INSTRUCTIONS:\n${config.generalInstructions}`
      );
    }
    if (config.toneInstructions) {
      customInstructions.push(`TONE & STYLE:\n${config.toneInstructions}`);
    }
    if (config.fieldInstructions) {
      customInstructions.push(
        `FIELD-SPECIFIC INSTRUCTIONS:\n${config.fieldInstructions}`
      );
    }

    const customInstructionsSection =
      customInstructions.length > 0
        ? `\n\nCUSTOM INSTRUCTIONS:\n${customInstructions.join('\n\n')}`
        : '';

    return `You are a content writer creating a ${schemaType} document for a Sanity CMS.

CONTENT PLAN:
Subject: ${notionPage.subject}
Content: ${notionPage.content}

FIELDS TO GENERATE:
${fieldInstructions}${customInstructionsSection}

REQUIREMENTS:
- Return ONLY a valid JSON object with the following structure:
{
${enabledFields.map((field) => `  "${field.name}": "generated_value"`).join(',\n')}
}
- Ensure all enabled fields are populated
- Escape all quotes, newlines, and special characters properly
- Use \\n for line breaks, \\" for quotes
- Return ONLY the JSON object, no additional text

Generate the content now:`;
  }

  /**
   * Call the LLM API with the prompt
   */
  private async callLLM(prompt: string): Promise<string> {
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
        maxTokens: 4000, // Increased for longer articles
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from LLM');
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
      console.error('[llm-service] LLM API call failed:', error);
      throw new Error(
        `LLM API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Parse and validate the LLM response
   */
  private parseResponse(
    response: string,
    detectedFields: DetectedField[]
  ): SanityDraftData {
    // Clean the response - remove markdown code blocks
    const cleanedResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Try to extract and parse JSON
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      const enabledFields = detectedFields.filter((field) => field.enabled);
      const missingFields = enabledFields.filter(
        (field) => !field.isVirtual && !parsed.hasOwnProperty(field.name)
      );

      if (missingFields.length > 0) {
        throw new Error(
          `Missing required fields: ${missingFields.map((f) => f.name).join(', ')}`
        );
      }

      return parsed as SanityDraftData;
    } catch (error) {
      console.error('[llm-service] JSON parsing failed:', error);
      throw new Error(
        `Failed to parse LLM response: ${error instanceof Error ? error.message : 'Invalid JSON'}`
      );
    }
  }
}

/**
 * Factory function to create LLM service instance
 */
export function createLLMService(apiKey: string, model: string): LLMService {
  return new LLMService(apiKey, model);
}
