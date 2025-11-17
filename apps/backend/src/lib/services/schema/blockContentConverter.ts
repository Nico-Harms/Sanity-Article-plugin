/**
 * BLOCK CONTENT CONVERTER
 *
 * Converts plain text strings with markdown links to Sanity block content format.
 * Handles parsing of markdown links [text](url) and converts them to Sanity's
 * link annotation format with proper marks and markDefs.
 */

type SanitySpan = {
  _type: 'span';
  _key: string;
  text: string;
  marks: string[];
};

type SanityLinkDef = {
  _type: 'link';
  _key: string;
  href: string;
};

function generateKey(): string {
  return Math.random().toString(36).substring(2, 15);
}

function createSpan(text: string, marks: string[] = []): SanitySpan {
  return {
    _type: 'span',
    _key: generateKey(),
    text,
    marks,
  };
}

function parseMarkdownLinks(text: string): {
  children: SanitySpan[];
  markDefs: SanityLinkDef[];
} {
  const children: SanitySpan[] = [];
  const markDefs: SanityLinkDef[] = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    const [fullMatch, linkText, url] = match;
    const matchStart = match.index;
    const matchEnd = matchStart + fullMatch.length;

    // Add text before the link
    if (matchStart > lastIndex) {
      const textBefore = text.substring(lastIndex, matchStart);
      if (textBefore) {
        children.push(createSpan(textBefore));
      }
    }

    // Create link mark definition
    const linkKey = generateKey();
    markDefs.push({
      _type: 'link',
      _key: linkKey,
      href: url,
    });

    // Add link span with mark reference
    children.push(createSpan(linkText, [linkKey]));
    lastIndex = matchEnd;
  }

  // Add remaining text after last link
  if (lastIndex < text.length) {
    const textAfter = text.substring(lastIndex);
    if (textAfter) {
      children.push(createSpan(textAfter));
    }
  }

  // If no links found, return single span with all text
  if (children.length === 0) {
    children.push(createSpan(text));
  }

  return { children, markDefs };
}

export function convertStringToBlockContent(text: unknown): any[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const cleanText = text.trim();
  if (!cleanText) {
    return [];
  }

  const paragraphs = cleanText
    .split(/\n\s*\n/)
    .filter((paragraph) => paragraph.trim());

  if (paragraphs.length === 0) {
    paragraphs.push(cleanText);
  }

  return paragraphs
    .map((paragraph) => {
      const cleanParagraph = paragraph.trim();
      if (!cleanParagraph) return null;

      const { children, markDefs } = parseMarkdownLinks(cleanParagraph);

      const block: any = {
        _type: 'block',
        _key: generateKey(),
        style: 'normal',
        children,
      };

      if (markDefs.length > 0) {
        block.markDefs = markDefs;
      }

      return block;
    })
    .filter(Boolean);
}

