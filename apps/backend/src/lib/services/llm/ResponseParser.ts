import type { SanityDraftData, DetectedField } from '@sanity-notion-llm/shared';
import { normalizeLLMOutput } from '@sanity-notion-llm/shared';
import { convertStringToBlockContent } from '../schema/blockContentConverter';

export class ResponseParser {
  /**
   * Parse and validate the LLM response
   */
  static async parse(
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
        '[response-parser] Initial JSON parse failed, attempting to fix control characters:',
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
          console.error(
            '[response-parser] JSON parsing failed after all attempts'
          );
          console.error(
            '[response-parser] Original response:',
            response.substring(0, 500)
          );
          console.error(
            '[response-parser] Extracted JSON:',
            jsonString.substring(0, 500)
          );
          console.error('[response-parser] Parse error:', finalError);

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
  private static async normalizeAndValidateResponse(
    parsed: unknown,
    detectedFields: DetectedField[]
  ): Promise<SanityDraftData> {
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid parsed response: not an object');
    }

    const fieldTypeMap = new Map<string, string>();
    detectedFields.forEach((field) => {
      fieldTypeMap.set(field.name, field.type);
    });

    const normalized = await this.normalizeStringFields(
      parsed as Record<string, unknown>,
      fieldTypeMap
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

  private static validateDateField(value: string): string | null {
    try {
      // Try to parse the date
      const date = new Date(value);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn(`[response-parser] Invalid date value: "${value}"`);
        return null;
      }

      // Return ISO string format
      return date.toISOString();
    } catch (error) {
      console.warn(`[response-parser] Failed to parse date "${value}":`, error);
      return null;
    }
  }

  /**
   * Check if a field should skip normalization
   */
  private static shouldSkipNormalization(
    fieldName: string,
    fieldTypeMap: Map<string, string>
  ): boolean {
    const fieldType = fieldTypeMap.get(fieldName);
    return fieldType === 'datetime' || fieldType === 'date';
  }

  private static async normalizeStringFields(
    obj: Record<string, unknown>,
    fieldTypeMap: Map<string, string>
  ): Promise<Record<string, unknown>> {
    const normalized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        if (this.shouldSkipNormalization(key, fieldTypeMap)) {
          const validDate = this.validateDateField(value);
          normalized[key] = validDate;
        } else {
          // Check for block content fields
          const fieldType = fieldTypeMap.get(key);

          // Apply normalization to other string fields
          try {
            const cleanedValue = await normalizeLLMOutput(value);

            if (fieldType === 'blockContent' || fieldType === 'array') {
              // Convert markdown string to Portable Text blocks
              normalized[key] = convertStringToBlockContent(cleanedValue);
            } else {
              // Keep as cleaned string
              normalized[key] = cleanedValue;
            }
          } catch (error) {
            console.warn(
              `[response-parser] Failed to normalize field "${key}":`,
              error
            );
            // If normalization fails, use original value
            normalized[key] = value;
          }
        }
      } else if (Array.isArray(value)) {
        // Handle arrays (recursively normalize objects in arrays)
        normalized[key] = await Promise.all(
          value.map(async (item) => {
            if (typeof item === 'string') {
              // Don't normalize string items in arrays - they're usually not text content
              return item;
            } else if (item && typeof item === 'object') {
              return await this.normalizeStringFields(
                item as Record<string, unknown>,
                fieldTypeMap
              );
            }
            return item;
          })
        );
      } else if (value && typeof value === 'object') {
        // Recursively normalize nested objects
        normalized[key] = await this.normalizeStringFields(
          value as Record<string, unknown>,
          fieldTypeMap
        );
      } else {
        normalized[key] = value;
      }
    }

    return normalized;
  }
}
