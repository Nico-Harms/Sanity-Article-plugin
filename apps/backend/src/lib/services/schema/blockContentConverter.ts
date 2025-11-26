/**
 * BLOCK CONTENT CONVERTER
 *
 * Converts plain text strings with markdown links to Sanity block content format.
 * Handles parsing of markdown links [text](url) and converts them to Sanity's
 * link annotation format with proper marks and markDefs.
 */

import type {
  PortableTextBlock,
  PortableTextSpan,
  PortableTextMarkDefinition,
} from '@portabletext/types';

type SanitySpan = PortableTextSpan & { _key: string };

type SanityLinkDef = PortableTextMarkDefinition & {
  _type: 'link';
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

/**
 * Parse inline formatting (bold, italic, links)
 * Simple regex-based parser for common markdown patterns
 */
function parseInline(text: string): {
  children: SanitySpan[];
  markDefs: SanityLinkDef[];
} {
  const children: SanitySpan[] = [];
  const markDefs: SanityLinkDef[] = [];

  // Current simple strategy: Split by special chars is risky.
  // Better strategy: Use a regex that matches ANY special token:
  // Link: \[.*?\]\(.*?\)
  // Bold: \*\*.*?\*\*
  // Italic: \*.*?\*

  const tokenRegex = /(\[(?:[^\]]+)\]\((?:[^)]+)\)|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const matchStart = match.index;

    // Add text before
    if (matchStart > lastIndex) {
      children.push(createSpan(text.substring(lastIndex, matchStart)));
    }

    // Handle the match
    if (fullMatch.startsWith('[')) {
      // Link: [text](url)
      const linkMatch = fullMatch.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, linkText, url] = linkMatch;
        const key = generateKey();
        markDefs.push({ _type: 'link', _key: key, href: url });
        children.push(createSpan(linkText, [key]));
      }
    } else if (fullMatch.startsWith('**')) {
      // Bold: **text**
      const content = fullMatch.slice(2, -2);
      children.push(createSpan(content, ['strong']));
    } else if (fullMatch.startsWith('*')) {
      // Italic: *text*
      const content = fullMatch.slice(1, -1);
      children.push(createSpan(content, ['em']));
    }

    lastIndex = matchStart + fullMatch.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    children.push(createSpan(text.substring(lastIndex)));
  }

  if (children.length === 0) {
    children.push(createSpan(text));
  }

  return { children, markDefs };
}

export function convertStringToBlockContent(
  text: unknown
): PortableTextBlock[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Normalize newlines
  const cleanText = text.replace(/\r\n/g, '\n').trim();
  if (!cleanText) return [];

  const lines = cleanText.split('\n');
  const blocks: PortableTextBlock[] = [];
  let buffer: string[] = [];

  const flushBuffer = () => {
    if (buffer.length > 0) {
      const content = buffer.join(' ');
      const { children, markDefs } = parseInline(content);

      const block: PortableTextBlock = {
        _type: 'block',
        _key: generateKey(),
        style: 'normal',
        markDefs,
        children,
      };

      if (!markDefs.length) delete block.markDefs;
      blocks.push(block);
      buffer = [];
    }
  };

  for (const line of lines) {
    const trim = line.trim();

    // Empty line triggers paragraph break
    if (!trim) {
      flushBuffer();
      continue;
    }

    // Check for Header
    if (trim.startsWith('#')) {
      flushBuffer();

      let style = 'h1';
      let content = trim;

      if (trim.startsWith('### ')) {
        style = 'h3';
        content = trim.substring(4);
      } else if (trim.startsWith('## ')) {
        style = 'h2';
        content = trim.substring(3);
      } else if (trim.startsWith('# ')) {
        style = 'h1';
        content = trim.substring(2);
      } else {
        // Treat as plain text if just # without space (optional, but safer to assume h1 if #Text)
        // But standard markdown requires space.
        // Let's handle standard headers with space
        if (!trim.match(/^#+\s/)) {
          buffer.push(trim);
          continue;
        }
      }

      const { children, markDefs } = parseInline(content);
      const block: PortableTextBlock = {
        _type: 'block',
        _key: generateKey(),
        style,
        markDefs,
        children,
      };
      if (!markDefs.length) delete block.markDefs;
      blocks.push(block);
      continue;
    }

    // Check for List Item
    // Matches "- " or "* " or "1. "
    if (
      trim.startsWith('- ') ||
      trim.startsWith('* ') ||
      /^\d+\.\s/.test(trim)
    ) {
      flushBuffer();

      let listItem = 'bullet';
      let content = trim;

      if (trim.startsWith('- ') || trim.startsWith('* ')) {
        content = trim.substring(2);
      } else {
        listItem = 'number';
        content = trim.replace(/^\d+\.\s/, '');
      }

      const { children, markDefs } = parseInline(content);
      const block: PortableTextBlock = {
        _type: 'block',
        _key: generateKey(),
        style: 'normal',
        listItem,
        markDefs,
        children,
      };
      if (!markDefs.length) delete block.markDefs;
      blocks.push(block);
      continue;
    }

    // Regular text line - add to buffer (will be joined for wrapping)
    buffer.push(trim);
  }

  // Final flush
  flushBuffer();

  return blocks;
}
