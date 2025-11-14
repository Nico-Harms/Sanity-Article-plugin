import {
  getPostBySlug,
  getComplexBlogBySlug,
} from '@/lib/sanity';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PortableTextRenderer from '@/components/PortableTextRenderer';
import ComplexBlogModules from '@/components/ComplexBlogModules';

export const dynamic = 'force-dynamic';

type PostPageParams = Promise<{ slug: string }>;

export default async function PostPage({
  params,
}: {
  params: PostPageParams;
}) {
  const { slug } = await params;
  
  // Try to fetch as regular post first, then as complex blog
  const [post, complexBlog] = await Promise.all([
    getPostBySlug(slug),
    getComplexBlogBySlug(slug),
  ]);

  const article = post || complexBlog;

  if (!article) {
    notFound();
  }

  // Render regular post
  if (post) {
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
            {post.title || 'Untitled Post'}
          </h1>

          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
            {post.author && <span>By {post.author.name}</span>}
            <span>{new Date(post._createdAt).toLocaleDateString()}</span>
            {post.categories && post.categories.length > 0 && (
              <div className="flex space-x-2">
                {post.categories.map((category, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                  >
                    {category.title}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {post.mainImage?.asset?.url && (
          <div className="mb-8">
            <img
              src={post.mainImage.asset.url}
              alt={post.title || 'Post image'}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>
        )}

        {post.body && post.body.length > 0 ? (
          <PortableTextRenderer content={post.body} />
        ) : (
          <p className="text-gray-500">No content available for this post.</p>
        )}
      </article>
    );
  }

  // Render complex blog
  if (complexBlog) {
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
            {complexBlog.title || 'Untitled Complex Blog'}
          </h1>

          <div className="text-sm text-gray-500 mb-6">
            <span>
              {complexBlog.publishedAt
                ? new Date(complexBlog.publishedAt).toLocaleDateString()
                : 'Publish date not set'}
            </span>
          </div>
        </div>

        {complexBlog.ingress && complexBlog.ingress.length > 0 && (
          <div className="mb-8">
            <PortableTextRenderer content={complexBlog.ingress} />
          </div>
        )}

        {complexBlog.modules && complexBlog.modules.length > 0 && (
          <ComplexBlogModules modules={complexBlog.modules} />
        )}

        {(!complexBlog.ingress || complexBlog.ingress.length === 0) &&
          (!complexBlog.modules || complexBlog.modules.length === 0) && (
            <p className="text-gray-500">
              No content available for this blog post.
            </p>
          )}
      </article>
    );
  }

  notFound();
}
