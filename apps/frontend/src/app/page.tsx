import Link from 'next/link';
import { getAllPosts, getAllComplexBlogs } from '@/lib/sanity';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [posts, complexBlogs] = await Promise.all([
    getAllPosts().catch(() => []),
    getAllComplexBlogs().catch(() => []),
  ]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Latest Posts</h2>

      {posts.length === 0 && complexBlogs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No posts found.</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {posts.map((post: any) => (
            <article
              key={post._id}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <h3 className="text-xl font-semibold mb-2">
                <Link
                  href={`/posts/${post.slug?.current || post._id}`}
                  className="text-gray-900 hover:text-blue-600"
                >
                  {post.title || 'Untitled Post'}
                </Link>
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {post._createdAt
                  ? new Date(post._createdAt).toLocaleDateString()
                  : ''}
              </p>
              {post.excerpt && <p className="text-gray-600">{post.excerpt}</p>}
            </article>
          ))}

          {complexBlogs.map((blog: any) => (
            <article
              key={blog._id}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <h3 className="text-xl font-semibold mb-2">
                <Link
                  href={`/posts/${blog.slug?.current || blog._id}`}
                  className="text-gray-900 hover:text-blue-600"
                >
                  {blog.title || 'Untitled Blog'}
                </Link>
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {blog.publishedAt
                  ? new Date(blog.publishedAt).toLocaleDateString()
                  : ''}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
