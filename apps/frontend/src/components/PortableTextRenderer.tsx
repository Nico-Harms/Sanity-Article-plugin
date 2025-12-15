'use client';

import { PortableText } from '@portabletext/react';

interface PortableTextRendererProps {
  content: any[];
}

export default function PortableTextRenderer({
  content,
}: PortableTextRendererProps) {
  if (!content || content.length === 0) {
    return <p className="text-gray-500">No content available.</p>;
  }

  return (
    <div className="prose prose-lg max-w-none">
      <PortableText value={content} />
    </div>
  );
}
