import { Mistral } from '@mistralai/mistralai';
import type {
  NotionPageData,
  SanityDraftData,
  FieldMapping,
} from '@sanity-notion-llm/shared';

/**
 * LLM Service for generating Sanity article drafts from Notion content
 *
 * This service handles:
 * - Building structured prompts from Notion page data
 * - Calling LLM APIs (Mistral, OpenAI, etc.)
 * - Parsing and validating JSON responses
 * - Mapping responses to Sanity schema fields
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
   * @param fieldMappings - Array of field mappings from logical fields to schema fields
   * @param schemaType - The Sanity schema type name (e.g., "article", "blogPost")
   * @returns Structured data matching Sanity schema fields
   */
  async generateArticle(
    notionPage: NotionPageData,
    fieldMappings: FieldMapping[],
    schemaType: string
  ): Promise<SanityDraftData> {
    try {
      const prompt = this.buildPrompt(notionPage, fieldMappings, schemaType);
      const response = await this.callLLM(prompt);
      return this.parseResponse(response, fieldMappings);
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
    fieldMappings: FieldMapping[],
    schemaType: string
  ): string {
    const enabledMappings = fieldMappings.filter((mapping) => mapping.enabled);

    const fieldInstructions = enabledMappings
      .map((mapping) => {
        const logicalField = mapping.logicalField;
        const schemaField = mapping.schemaField;

        return `- ${logicalField}: Map to Sanity field "${schemaField}"`;
      })
      .join('\n');

    return `You are a content writer creating a ${schemaType} article for a Sanity CMS.

CONTENT PLAN:
Subject: ${notionPage.subject}
Content: ${notionPage.content}

TASK:
Generate a complete article based on the content plan above. Return ONLY a valid JSON object with the following structure:

{
${enabledMappings.map((mapping) => `  "${mapping.schemaField}": "generated_value"`).join(',\n')}
}

FIELD MAPPINGS:
${fieldInstructions}

REQUIREMENTS:
- Write engaging, well-structured content (keep it concise - aim for 500-800 words total)
- Use the subject as the main topic
- Expand on the content plan with relevant details
- Ensure all required fields are populated
- Return ONLY the JSON object, no additional text
- Make sure the JSON is valid and properly formatted
- Keep the body content focused and to the point
- IMPORTANT: Escape all quotes, newlines, and special characters in JSON strings
- Use \\n for line breaks, \\" for quotes, and \\\\ for backslashes in content

Generate the article now:`;
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
    fieldMappings: FieldMapping[]
  ): SanityDraftData {
    try {
      // Clean the response - remove any markdown code blocks
      let cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Handle incomplete JSON by trying to fix common issues
      if (!cleanedResponse.endsWith('}')) {
        // If response is cut off, try to find the last complete field
        const lastCompleteField = cleanedResponse.lastIndexOf('",');
        if (lastCompleteField > 0) {
          cleanedResponse =
            cleanedResponse.substring(0, lastCompleteField + 1) + '}';
        } else {
          // If no complete fields found, add a basic structure
          cleanedResponse = cleanedResponse + '"}';
        }
      }

      // Try to parse JSON, with fallback for control character issues
      let parsed;
      try {
        parsed = JSON.parse(cleanedResponse);
      } catch (error) {
        // If JSON parsing fails due to control characters, try to fix them
        console.log(
          '[llm-service] JSON parse failed, attempting to fix control characters...'
        );

        // Use a more robust approach - try to extract JSON from the response
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonString = jsonMatch[0];
          try {
            // Try parsing the extracted JSON
            parsed = JSON.parse(jsonString);
          } catch (secondError) {
            // If still failing, create a minimal valid response
            console.log(
              '[llm-service] JSON extraction failed, creating fallback response'
            );
            parsed = {
              title: 'Generated Article',
              body: 'Content generation completed but JSON parsing failed. Please try again.',
              slug: { current: 'generated-article' },
            };
          }
        } else {
          throw new Error('No valid JSON found in response');
        }
      }

      // Validate that all enabled fields are present
      const enabledMappings = fieldMappings.filter(
        (mapping) => mapping.enabled
      );
      const missingFields = enabledMappings.filter(
        (mapping) => !parsed.hasOwnProperty(mapping.schemaField!)
      );

      if (missingFields.length > 0) {
        throw new Error(
          `Missing required fields: ${missingFields.map((f) => f.schemaField).join(', ')}`
        );
      }

      return parsed as SanityDraftData;
    } catch (error) {
      console.error('[llm-service] Failed to parse LLM response:', error);
      console.error('[llm-service] Raw response:', response);
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
