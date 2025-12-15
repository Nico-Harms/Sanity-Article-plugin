import type { SanityDraftData, DetectedField } from '@sanity-notion-llm/shared';
import { normalizeLLMOutput } from '@sanity-notion-llm/shared';
import { convertStringToBlockContent } from '../schema/blockContentConverter';

export class ResponseParser {
  /**
   * Escape control characters in JSON string values
   * This must be done BEFORE JSON.parse to avoid "Bad control character" errors
   */
  private static escapeControlCharsInJson(jsonString: string): string {
    // Process character by character to properly handle JSON string values
    let result = '';
    let inString = false;
    let i = 0;

    while (i < jsonString.length) {
      const char = jsonString[i];

      if (char === '"' && (i === 0 || jsonString[i - 1] !== '\\')) {
        inString = !inString;
        result += char;
      } else if (inString) {
        // Inside a JSON string - escape control characters
        if (char === '\n') {
          result += '\\n';
        } else if (char === '\r') {
          result += '\\r';
        } else if (char === '\t') {
          result += '\\t';
        } else if (char === '\b') {
          result += '\\b';
        } else if (char === '\f') {
          result += '\\f';
        } else if (char.charCodeAt(0) < 32) {
          // Other control characters - use unicode escape
          result += '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0');
        } else {
          result += char;
        }
      } else {
        // Outside string - keep whitespace for JSON structure, escape others
        if (char === '\n' || char === '\r' || char === '\t' || char === ' ') {
          result += char;
        } else if (char.charCodeAt(0) < 32) {
          // Skip other control characters outside strings
        } else {
          result += char;
        }
      }
      i++;
    }

    return result;
  }

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

    // ALWAYS escape control characters first - this prevents "Bad control character" errors
    jsonString = this.escapeControlCharsInJson(jsonString);

    // Attempt to parse with multiple fallback strategies
    try {
      // First attempt: parse the escaped JSON
      const parsed = JSON.parse(jsonString);
      return await this.normalizeAndValidateResponse(parsed, detectedFields);
    } catch (parseError) {
      console.warn(
        '[response-parser] Initial JSON parse failed, attempting fixes:',
        parseError
      );

      // Second attempt: try to fix incomplete JSON by closing braces/brackets
      try {
        let fixedJson = jsonString.trim();

        // Count braces and brackets
        const openBraces = (fixedJson.match(/\{/g) || []).length;
        const closeBraces = (fixedJson.match(/\}/g) || []).length;
        const openBrackets = (fixedJson.match(/\[/g) || []).length;
        const closeBrackets = (fixedJson.match(/\]/g) || []).length;

        // Add missing closing braces
        for (let i = 0; i < openBraces - closeBraces; i++) {
          fixedJson += '}';
        }

        // Add missing closing brackets
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          fixedJson += ']';
        }

        // Close unclosed strings at the end
        if (fixedJson.split('"').length % 2 === 0) {
          fixedJson += '"';
        }

        const parsed = JSON.parse(fixedJson);
        console.log('[response-parser] Successfully fixed incomplete JSON');
        return await this.normalizeAndValidateResponse(parsed, detectedFields);
      } catch (fixError) {
        console.warn(
          '[response-parser] Failed to fix incomplete JSON:',
          fixError
        );
      }

      // Log for debugging
      console.error('[response-parser] JSON parsing failed after all attempts');
      console.error(
        '[response-parser] Original response:',
        response.substring(0, 500)
      );
      console.error(
        '[response-parser] Processed JSON:',
        jsonString.substring(0, 500)
      );

      throw new Error(
        `Failed to parse LLM response: ${
          parseError instanceof Error
            ? parseError.message
            : 'Invalid JSON format'
        }`
      );
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
    fieldPath: string,
    fieldTypeMap: Map<string, string>
  ): boolean {
    const fieldType = fieldTypeMap.get(fieldPath);
    return fieldType === 'datetime' || fieldType === 'date';
  }

  /**
   * Fix malformed escape sequences in parsed string content
   * LLMs sometimes output \bn instead of \n, or other malformed sequences
   */
  private static fixMalformedContent(text: string): string {
    return (
      text
        // Fix \bn -> newline (LLM outputs backspace+n instead of newline)
        .replace(/\\bn/g, '\n')
        // Fix literal \n strings that should be newlines
        .replace(/\\n/g, '\n')
        // Fix double-escaped newlines
        .replace(/\\\\n/g, '\n')
        // Normalize multiple newlines to double newlines for paragraphs
        .replace(/\n{3,}/g, '\n\n')
    );
  }

  private static async normalizeStringFields(
    obj: Record<string, unknown>,
    fieldTypeMap: Map<string, string>,
    parentPath = ''
  ): Promise<Record<string, unknown>> {
    const normalized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = parentPath ? `${parentPath}.${key}` : key;

      if (typeof value === 'string') {
        if (this.shouldSkipNormalization(currentPath, fieldTypeMap)) {
          const validDate = this.validateDateField(value);
          normalized[key] = validDate;
        } else {
          // Check for block content fields using the full path
          const fieldType = fieldTypeMap.get(currentPath);

          // Apply normalization to other string fields
          try {
            // First fix any malformed escape sequences
            const fixedValue = this.fixMalformedContent(value);
            const cleanedValue = await normalizeLLMOutput(fixedValue);

            if (fieldType === 'blockContent' || fieldType === 'array') {
              // Convert markdown string to Portable Text blocks
              console.log(
                `[response-parser] Converting ${currentPath} to blockContent (type: ${fieldType})`
              );
              normalized[key] = convertStringToBlockContent(cleanedValue);
            } else {
              // Keep as cleaned string
              normalized[key] = cleanedValue;
            }
          } catch (error) {
            console.warn(
              `[response-parser] Failed to normalize field "${currentPath}":`,
              error
            );
            // If normalization fails, use original value with basic fixes
            normalized[key] = this.fixMalformedContent(value);
          }
        }
      } else if (Array.isArray(value)) {
        // Handle arrays - also fix strings within arrays
        normalized[key] = await Promise.all(
          value.map(async (item) => {
            if (typeof item === 'string') {
              return this.fixMalformedContent(item);
            } else if (item && typeof item === 'object') {
              return this.normalizeStringFields(
                item as Record<string, unknown>,
                fieldTypeMap,
                currentPath
              );
            }
            return item;
          })
        );
      } else if (value && typeof value === 'object') {
        // Recursively normalize nested objects
        normalized[key] = await this.normalizeStringFields(
          value as Record<string, unknown>,
          fieldTypeMap,
          currentPath
        );
      } else {
        normalized[key] = value;
      }
    }

    return normalized;
  }
}
