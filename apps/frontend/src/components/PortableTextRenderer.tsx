'use client';

import { PortableText } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';
import type { ReactNode } from 'react';
import { urlFor } from '@/lib/sanity';

interface PortableTextRendererProps {
  content: PortableTextBlock[];
}

// Define component props with proper typing
interface BlockProps {
  children?: ReactNode;
}

interface LinkProps {
  children?: ReactNode;
  value?: { href?: string };
}

interface ImageValue {
  asset?: { _ref?: string };
  alt?: string;
  caption?: string;
}

const components = {
  types: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    image: ({ value }: { value: ImageValue }) => {
      if (!value?.asset) return null;
      // Cast to any for urlFor compatibility
      const imageUrl = urlFor(value as any)
        .width(800)
        .height(600)
        .url();
      return (
        <div className="my-8">
          <img
            src={imageUrl}
            alt={value.alt || 'Image'}
            className="w-full rounded-lg"
          />
          {value.caption && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              {value.caption}
            </p>
          )}
        </div>
      );
    },
  },
  block: {
    h1: ({ children }: BlockProps) => (
      <h1 className="text-4xl font-bold mt-8 mb-4">{children}</h1>
    ),
    h2: ({ children }: BlockProps) => (
      <h2 className="text-3xl font-bold mt-6 mb-3">{children}</h2>
    ),
    h3: ({ children }: BlockProps) => (
      <h3 className="text-2xl font-semibold mt-4 mb-2">{children}</h3>
    ),
    h4: ({ children }: BlockProps) => (
      <h4 className="text-xl font-semibold mt-3 mb-2">{children}</h4>
    ),
    normal: ({ children }: BlockProps) => (
      <p className="mb-4 leading-relaxed">{children}</p>
    ),
    blockquote: ({ children }: BlockProps) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-700">
        {children}
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }: BlockProps) => (
      <strong className="font-bold">{children}</strong>
    ),
    em: ({ children }: BlockProps) => <em className="italic">{children}</em>,
    link: ({ value, children }: LinkProps) => {
      const href = value?.href || '';
      const target = href.startsWith('http') ? '_blank' : undefined;
      const rel = target === '_blank' ? 'noopener noreferrer' : undefined;
      return (
        <a
          href={href}
          target={target}
          rel={rel}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {children}
        </a>
      );
    },
  },
  list: {
    bullet: ({ children }: BlockProps) => (
      <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>
    ),
    number: ({ children }: BlockProps) => (
      <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }: BlockProps) => <li className="ml-4">{children}</li>,
    number: ({ children }: BlockProps) => <li className="ml-4">{children}</li>,
  },
};

export default function PortableTextRenderer({
  content,
}: PortableTextRendererProps) {
  if (!content || content.length === 0) {
    return <p className="text-gray-500">No content available.</p>;
  }

  return (
    <div className="prose prose-lg max-w-none">
      <PortableText value={content} components={components} />
    </div>
  );
}
