import { getPostBySlug, getComplexBlogBySlug } from '@/lib/sanity';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type PostPageParams = Promise<{ slug: string }>;

export default async function PostPage({ params }: { params: PostPageParams }) {
  const { slug } = await params;

  const [post, complexBlog] = await Promise.all([
    getPostBySlug(slug).catch(() => null),
    getComplexBlogBySlug(slug).catch(() => null),
  ]);

  const article: any = post || complexBlog;

  if (!article) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Post not found
        </h1>
        <Link href="/" className="text-blue-600 hover:underline">
          ← Back to home
        </Link>
      </div>
    );
  }

  return (
    <article className="bg-white rounded-lg shadow-sm border p-8">
      <div className="mb-6">
        <Link
          href="/"
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Back to posts
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {article.title || 'Untitled'}
        </h1>

        <div className="text-sm text-gray-500 mb-6">
          {article.publishedAt || article._createdAt
            ? new Date(
                article.publishedAt || article._createdAt
              ).toLocaleDateString()
            : ''}
        </div>
      </div>

      {article.body &&
        Array.isArray(article.body) &&
        article.body.length > 0 && (
          <div className="prose max-w-none">
            {article.body.map((block: any, idx: number) => {
              if (block._type === 'block' && block.children) {
                const text = block.children
                  .map((child: any) => child.text || '')
                  .join(' ');
                return (
                  <p key={idx} className="mb-4">
                    {text}
                  </p>
                );
              }
              return null;
            })}
          </div>
        )}

      {article.ingress &&
        Array.isArray(article.ingress) &&
        article.ingress.length > 0 && (
          <div className="prose max-w-none mb-8">
            {article.ingress.map((block: any, idx: number) => {
              if (block._type === 'block' && block.children) {
                const text = block.children
                  .map((child: any) => child.text || '')
                  .join(' ');
                return (
                  <p key={idx} className="mb-4">
                    {text}
                  </p>
                );
              }
              return null;
            })}
          </div>
        )}

      {article.body &&
        article.body.length === 0 &&
        (!article.ingress || article.ingress.length === 0) && (
          <p className="text-gray-500">No content available.</p>
        )}
    </article>
  );
}
