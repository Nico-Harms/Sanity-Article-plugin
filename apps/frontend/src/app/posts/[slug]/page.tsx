import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { PortableTextBlock } from '@portabletext/types';
import { getPostBySlug } from '@/lib/sanity';

const formatDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
};

const blockToPlainText = (block: PortableTextBlock): string => {
  const children =
    (block as { children?: Array<{ text?: string }> }).children ?? [];
  return children.map((child) => child.text || '').join(' ');
};

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return notFound();
  }

  const bodyText =
    post.body?.map((block) => blockToPlainText(block)).filter(Boolean) ?? [];

  return (
    <article className="rounded-lg border bg-white p-8 shadow-sm">
      <div className="mb-6">
        <Link href="/" className="text-blue-700 hover:underline">
          ← Back to posts
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">{post.title || 'Untitled'}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {formatDate(post.publishedAt || post._createdAt)}
      </p>

      {bodyText.length > 0 ? (
        <div className="space-y-4 leading-relaxed text-gray-800">
          {bodyText.map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No content.</p>
      )}
    </article>
  );
}
