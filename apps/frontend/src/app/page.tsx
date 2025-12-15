import Link from 'next/link';
import { getAllPosts } from '@/lib/sanity';

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

export default async function HomePage() {
  const posts = await getAllPosts();

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center text-gray-600">
        <p>No posts yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <article
          key={post._id}
          className="rounded-lg border bg-white p-6 shadow-sm"
        >
          <h2 className="text-xl font-semibold">
            <Link
              href={`/posts/${post.slug?.current || post._id}`}
              className="hover:text-blue-700"
            >
              {post.title || 'Untitled'}
            </Link>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {formatDate(post.publishedAt || post._createdAt)}
          </p>
          {post.excerpt && <p className="text-gray-700 mt-3">{post.excerpt}</p>}
        </article>
      ))}
    </div>
  );
}
