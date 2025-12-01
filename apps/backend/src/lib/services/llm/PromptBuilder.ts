import type {
  NotionPageData,
  DetectedField,
  PluginConfig,
} from '@sanity-notion-llm/shared';

export class PromptBuilder {
  /**
   * Build a structured prompt for the LLM
   */
  static build(
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

    return `You are an expert content writer creating a comprehensive ${schemaType} document for a Sanity CMS.

CONTENT BRIEF (TO BE EXPANDED):
Subject: ${notionPage.subject}
Brief/Outline: ${notionPage.content}

YOUR TASK:
The "Brief/Outline" above is a SHORT SUMMARY that you must EXPAND into a full, detailed, well-structured article.
Do NOT simply translate or paraphrase the brief. Instead, use it as inspiration to write comprehensive, engaging content.

FIELDS TO GENERATE:
${fieldInstructions}${customInstructionsSection}

CONTENT REQUIREMENTS:
1. EXPAND the brief into full article content with:
   - Detailed explanations and context
   - Multiple well-developed sections with headings
   - Concrete examples and use cases
   - Actionable insights and takeaways
   - Professional, engaging tone

2. STRUCTURE your content with:
   - Clear introduction that hooks the reader
   - Body sections with descriptive headings (use ## for h2, ### for h3)
   - Supporting details and explanations
   - Natural conclusion or call-to-action

3. LENGTH & DEPTH:
   - Generate substantial content (aim for 500-1500 words depending on the topic)
   - Don't just restate the brief - elaborate and add value
   - Provide depth and context that makes this worth reading

4. MARKDOWN FORMATTING:
   - Use **bold** for emphasis
   - Use *italic* for subtle emphasis
   - Use ## for main headings, ### for subheadings
   - Use lists where appropriate
   - Use clear paragraph breaks (\\n\\n)

LINK HANDLING:
- If the brief contains links [text](url), integrate them naturally into your expanded content
- Preserve the exact URLs provided
- You may adjust link text slightly to fit naturally in your expanded writing
- Add the links where they make sense contextually in your article

OUTPUT FORMAT:
- Return ONLY a valid JSON object with this exact structure:
{
${enabledFields.map((field) => `  "${field.name}": "generated_value"`).join(',\n')}
}
- Ensure all enabled fields are populated with meaningful, expanded content
- Escape all quotes, newlines, and special characters properly
- Use \\n for line breaks, \\" for quotes

IMPORTANT FIELD TYPE RULES:
- For datetime/date fields: Use ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ or YYYY-MM-DD)
- For string/text fields: Generate expanded, detailed content
- For number fields: Use valid numbers only
- Return ONLY the JSON object, no additional text

Generate the comprehensive content now:`;
  }
}
