import Link from 'next/link';
import {
  getAllComplexBlogs,
  getAllPosts,
  ComplexBlogPost,
  PostDetail,
} from '@/lib/sanity';
import PortableTextRenderer from '@/components/PortableTextRenderer';
import ComplexBlogModules from '@/components/ComplexBlogModules';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [posts, complexBlogs] = await Promise.all([
    getAllPosts(),
    getAllComplexBlogs(),
  ]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Latest Posts</h2>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No posts found.</p>
          <p className="text-gray-400 mt-2">
            Create your first post in the{' '}
            <a
              href="http://localhost:3333"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Sanity Studio - test
            </a>
          </p>
        </div>
      ) : (
        <div className="grid gap-8">
          {posts.map((post: PostDetail) => (
            <article
              key={post._id}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <h3 className="text-xl font-semibold mb-2">
                <Link
                  href={`/posts/${post.slug?.current || post._id}`}
                  className="text-gray-900 hover:text-blue-600 transition-colors"
                >
                  {post.title || 'Untitled Post'}
                </Link>
              </h3>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-4">
                  {post.author && <span>By {post.author.name}</span>}
                  <span>{new Date(post._createdAt).toLocaleDateString()}</span>
                </div>

                {post.categories && post.categories.length > 0 && (
                  <div className="flex space-x-2">
                    {post.categories.map((category, index: number) => (
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

              {post.mainImage?.asset?.url && (
                <div className="mb-4">
                  <img
                    src={post.mainImage.asset.url}
                    alt={post.title || 'Post image'}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              {post.body && post.body.length > 0 && (
                <div className="mt-4">
                  <PortableTextRenderer content={post.body} />
                </div>
              )}

              {post.excerpt && !post.body && (
                <p className="text-gray-600">{post.excerpt}</p>
              )}
            </article>
          ))}
        </div>
      )}

      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Complex Blog Posts</h2>

        {complexBlogs.length === 0 ? (
          <p className="text-gray-500">No complex blog posts available.</p>
        ) : (
          <div className="grid gap-8">
            {complexBlogs.map((blog: ComplexBlogPost) => (
              <article
                key={blog._id}
                className="bg-white rounded-lg shadow-sm border p-6"
              >
                <h3 className="text-xl font-semibold mb-2">
                  <Link
                    href={`/posts/${blog.slug?.current || blog._id}`}
                    className="text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {blog.title || 'Untitled Complex Blog'}
                  </Link>
                </h3>

                <div className="text-sm text-gray-500 mb-4">
                  <span>
                    {blog.publishedAt
                      ? new Date(blog.publishedAt).toLocaleDateString()
                      : 'Publish date not set'}
                  </span>
                </div>

                {blog.ingress && blog.ingress.length > 0 && (
                  <div className="mt-4">
                    <PortableTextRenderer content={blog.ingress} />
                  </div>
                )}

                {blog.modules && blog.modules.length > 0 && (
                  <div className="mt-6">
                    <ComplexBlogModules modules={blog.modules} />
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
