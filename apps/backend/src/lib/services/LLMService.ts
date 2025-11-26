import type {
  NotionPageData,
  SanityDraftData,
  DetectedField,
  PluginConfig,
} from '@sanity-notion-llm/shared';
import { normalizeLLMOutput } from '@sanity-notion-llm/shared';
import { LLMProviderFactory, type LLMProvider } from './llm/LLMProviderFactory';

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
 * - Multi-Provider Support: Supports Mistral AI, OpenAI, Google Gemini, and Perplexity AI
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
      const prompt = this.buildPrompt(
        notionPage,
        detectedFields,
        schemaType,
        config
      );
      const response = await this.provider.generateContent(prompt);
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
- Based on prompt and informatio provided, generate content for article / insight / blog post / etc.
- Return ONLY a valid JSON object with the following structure:
{
${enabledFields.map((field) => `  "${field.name}": "generated_value"`).join(',\n')}
}
- Ensure all enabled fields are populated
- Escape all quotes, newlines, and special characters properly
- Use \\n for line breaks, \\" for quotes

CRITICAL LINK PRESERVATION RULES:
- The content plan may contain markdown links in the format [text](url)
- You MUST preserve ALL links exactly as they appear in the content plan
- If you see a link like [title of the link - (https:URL), you MUST include it in your generated content with the EXACT same format (title of the link - (https:URL)).
- Do NOT change the link text or URL - use them exactly as provided
- Do NOT convert links to plain text - they must remain in markdown format [text](url)
- If multiple links appear in the content plan, include ALL of them in your generated article
- Links are 1:1 references from the source content - preserve them precisely
- If there are no links, DO NOT include any links in your generated content.

- Return ONLY the JSON object, no additional text

Generate the content now:`;
  }

  /**
   * Parse and validate the LLM response
   */
  private async parseResponse(
    response: string,
    detectedFields: DetectedField[]
  ): Promise<SanityDraftData> {
    // Clean the response - remove markdown code blocks
    const cleanedResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Try to extract JSON object
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    let jsonString = jsonMatch[0];

    // Attempt to parse with multiple fallback strategies
    try {
      // First attempt: parse as-is
      const parsed = JSON.parse(jsonString);
      return await this.normalizeAndValidateResponse(parsed, detectedFields);
    } catch (parseError) {
      // Second attempt: fix unescaped control characters in string values
      console.warn(
        '[llm-service] Initial JSON parse failed, attempting to fix control characters:',
        parseError
      );

      try {
        // Fix unescaped control characters within JSON string values
        // This regex matches string values (content between quotes) and escapes control chars
        jsonString = jsonString.replace(
          /"([^"\\]*(\\.[^"\\]*)*)"/g,
          (match, content) => {
            // Skip if already properly escaped or empty
            if (!content || match.includes('\\n') || match.includes('\\t')) {
              return match;
            }
            // Escape control characters: \n, \r, \t, etc.
            const escaped = content
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t')
              .replace(/\f/g, '\\f')
              .replace(/\b/g, '\\b')
              .replace(/\v/g, '\\v');
            return `"${escaped}"`;
          }
        );

        const parsed = JSON.parse(jsonString);
        return await this.normalizeAndValidateResponse(parsed, detectedFields);
      } catch (secondError) {
        // Third attempt: more aggressive - fix control chars within string values only
        try {
          // Process string values more carefully - escape control chars but preserve structure
          // This regex handles escaped quotes and backslashes properly
          jsonString = jsonMatch[0].replace(
            /"((?:[^"\\]|\\.)*)"/g,
            (match, content) => {
              // Only process if content has unescaped control characters
              if (
                /[\n\r\t\f\b\v]/.test(content) &&
                !/\\[nrtfbv]/.test(content)
              ) {
                const escaped = content
                  .replace(/\n/g, '\\n')
                  .replace(/\r/g, '\\r')
                  .replace(/\t/g, '\\t')
                  .replace(/\f/g, '\\f')
                  .replace(/\b/g, '\\b')
                  .replace(/\v/g, '\\v');
                return `"${escaped}"`;
              }
              return match;
            }
          );

          const parsed = JSON.parse(jsonString);
          return await this.normalizeAndValidateResponse(
            parsed,
            detectedFields
          );
        } catch (finalError) {
          // Log for debugging
          console.error('[llm-service] JSON parsing failed after all attempts');
          console.error(
            '[llm-service] Original response:',
            response.substring(0, 500)
          );
          console.error(
            '[llm-service] Extracted JSON:',
            jsonString.substring(0, 500)
          );
          console.error('[llm-service] Parse error:', finalError);

          throw new Error(
            `Failed to parse LLM response: ${
              finalError instanceof Error
                ? finalError.message
                : 'Invalid JSON format. The LLM may have included unescaped control characters.'
            }`
          );
        }
      }
    }
  }

  /**
   * Normalize string fields and validate parsed response
   *
   * Applies normalizeLLMOutput to all string fields to remove citations
   * and normalize markdown formatting before validation.
   */
  private async normalizeAndValidateResponse(
    parsed: unknown,
    detectedFields: DetectedField[]
  ): Promise<SanityDraftData> {
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid parsed response: not an object');
    }

    // Normalize all string fields in the parsed response
    const normalized = await this.normalizeStringFields(
      parsed as Record<string, unknown>
    );

    // Validate required fields
    const enabledFields = detectedFields.filter((field) => field.enabled);
    const missingFields = enabledFields.filter(
      (field) =>
        !field.isVirtual &&
        !Object.prototype.hasOwnProperty.call(normalized, field.name)
    );

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required fields: ${missingFields.map((f) => f.name).join(', ')}`
      );
    }

    return normalized as SanityDraftData;
  }

  /*===============================================
=          Normalize String Fields           =
===============================================*/

  private async normalizeStringFields(
    obj: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const normalized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Apply normalization to string fields
        try {
          normalized[key] = await normalizeLLMOutput(value);
        } catch (error) {
          console.warn(
            `[llm-service] Failed to normalize field "${key}":`,
            error
          );
          // If normalization fails, use original value
          normalized[key] = value;
        }
      } else if (Array.isArray(value)) {
        // Handle arrays (recursively normalize objects in arrays)
        normalized[key] = await Promise.all(
          value.map(async (item) => {
            if (typeof item === 'string') {
              try {
                return await normalizeLLMOutput(item);
              } catch (error) {
                console.warn(
                  `[llm-service] Failed to normalize array item in "${key}":`,
                  error
                );
                return item;
              }
            } else if (item && typeof item === 'object') {
              return await this.normalizeStringFields(
                item as Record<string, unknown>
              );
            }
            return item;
          })
        );
      } else if (value && typeof value === 'object') {
        // Recursively normalize nested objects
        normalized[key] = await this.normalizeStringFields(
          value as Record<string, unknown>
        );
      } else {
        // Keep other types as-is (numbers, booleans, null, etc.)
        normalized[key] = value;
      }
    }

    return normalized;
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
