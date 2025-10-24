import { getPostBySlug, getAllPosts } from '@/lib/sanity';
import { notFound } from 'next/navigation';
import Link from 'next/link';

type PostPageParams = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const posts = await getAllPosts();

  return posts.map((post: any) => ({
    slug: post.slug?.current || post._id,
  }));
}

export default async function PostPage({
  params,
}: {
  params: PostPageParams;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
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
          {post.title || 'Untitled Post'}
        </h1>

        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
          {post.author && <span>By {post.author.name}</span>}
          <span>{new Date(post._createdAt).toLocaleDateString()}</span>
          {post.categories && post.categories.length > 0 && (
            <div className="flex space-x-2">
              {post.categories.map((category: any, index: number) => (
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

      {post.mainImage && (
        <div className="mb-8">
          <img
            src={post.mainImage.asset?.url}
            alt={post.title || 'Post image'}
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
      )}

      <div className="prose max-w-none">
        {post.body ? (
          <div dangerouslySetInnerHTML={{ __html: post.body }} />
        ) : (
          <p className="text-gray-500">No content available for this post.</p>
        )}
      </div>
    </article>
  );
}
