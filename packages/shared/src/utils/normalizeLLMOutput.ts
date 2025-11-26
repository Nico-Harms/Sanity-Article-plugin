import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkGfm from 'remark-gfm';

/*===============================================
|=           LLM Output Normalizer             =
===============================================*/

/**
 * NORMALIZE LLM OUTPUT
 *
 * Cleans and normalizes text returned from LLM providers (Mistral, Perplexity, OpenAI).
 * Removes citation artifacts (especially from Perplexity) and normalizes markdown formatting.
 *
 * Key Features:
 * - Removes Perplexity citation references: [1], [2], etc.
 * - Removes source annotations: (Source: ...)
 * - Removes zero-width spaces and watermarks
 * - Normalizes markdown formatting using remark
 * - Preserves valid markdown: headings, bold, italic, links, lists, code blocks
 *
 * Processing Flow:
 * 1. Regex cleanup - remove citations and artifacts
 * 2. Markdown normalization - parse and reformat with remark
 * 3. Post-processing - trim and clean up whitespace
 *
 * Usage:
 * ```typescript
 * const cleanText = await normalizeLLMOutput(rawLLMResponse);
 * ```
 */

/**
 * Remove Perplexity citations and artifacts from text
 *
 * Handles:
 * - Numeric citations: [1], [2], [123]
 * - Source annotations: (Source: URL) or (Source: text)
 * - Zero-width spaces and Unicode watermarks
 * - Source/References/Citations sections at document end
 *
 * @param text - Raw text with potential citations
 * @returns Text with citations removed
 */
function removeCitations(text: string): string {
  let cleaned = text;

  // Remove numeric citations like [1], [2], [123]
  // But preserve markdown links [text](url)
  // Look for citations that are NOT followed by parentheses (which would indicate a link)
  cleaned = cleaned.replace(/\[(\d+)\](?!\()/g, '');

  // Remove source annotations like (Source: ...)
  cleaned = cleaned.replace(/\(Source:\s*[^)]+\)/gi, '');

  // Remove zero-width spaces and common Unicode watermarks
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // Remove "Sources:" section at the end of text
  // Matches "Sources:" followed by numbered list items
  cleaned = cleaned.replace(/\n*Sources:\n(\d+\.\s*.*\n?)+$/gi, '');

  // Remove "References:" or "Citations:" sections at the end
  cleaned = cleaned.replace(/\n*(References|Citations):\n(\d+\.\s*.*\n?)+$/gi, '');

  return cleaned;
}

/**
 * Normalize markdown formatting using remark
 *
 * Transformations:
 * - Parse markdown to AST
 * - Normalize list markers to '-' (bullet lists)
 * - Remove excessive blank lines
 * - Ensure valid heading structure
 * - Preserve bold, italic, links, code blocks
 * - Convert back to clean markdown
 *
 * @param text - Text with markdown formatting
 * @returns Normalized markdown text
 */
async function normalizeMarkdown(text: string): Promise<string> {
  try {
    const processor = unified()
      .use(remarkParse) // Parse markdown to AST
      .use(remarkGfm) // Support GitHub-flavored markdown (tables, strikethrough, etc.)
      .use(remarkStringify); // Stringify AST back to markdown with default settings

    const result = await processor.process(text);
    return String(result);
  } catch (error) {
    console.error('[normalizeLLMOutput] Markdown normalization failed:', error);
    // If markdown processing fails, return the text as-is
    return text;
  }
}

/**
 * Remove excessive blank lines from text
 *
 * Reduces multiple consecutive blank lines to a maximum of one blank line.
 * This helps clean up formatting without affecting paragraph structure.
 *
 * @param text - Text with potential excessive blank lines
 * @returns Text with normalized blank lines
 */
function removeExcessiveBlankLines(text: string): string {
  // Replace 3+ consecutive newlines with exactly 2 newlines (1 blank line)
  return text.replace(/\n{3,}/g, '\n\n');
}

/**
 * Normalize LLM output by removing citations and normalizing markdown
 *
 * Main entry point for cleaning LLM-generated text.
 * Applies citation removal, markdown normalization, and post-processing.
 *
 * @param raw - Raw text from LLM provider
 * @returns Clean, normalized markdown text
 *
 * @example
 * ```typescript
 * const rawText = "Digital twin technology is amazing [1]. ## Overview\n\nIt works great (Source: research.com)."
 * const cleanText = await normalizeLLMOutput(rawText);
 * // Result: "Digital twin technology is amazing. ## Overview\n\nIt works great."
 * ```
 */
export async function normalizeLLMOutput(raw: string): Promise<string> {
  if (!raw || typeof raw !== 'string') {
    return '';
  }

  // Step 1: Remove citations and artifacts (regex-based)
  let cleaned = removeCitations(raw);

  // Step 2: Normalize markdown formatting (remark-based)
  cleaned = await normalizeMarkdown(cleaned);

  // Step 3: Post-processing
  // Remove excessive blank lines
  cleaned = removeExcessiveBlankLines(cleaned);

  // Trim leading/trailing whitespace
  cleaned = cleaned.trim();

  // Ensure single trailing newline for consistency
  if (cleaned && !cleaned.endsWith('\n')) {
    cleaned += '\n';
  }

  return cleaned;
}

