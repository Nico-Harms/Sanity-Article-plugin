import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="text-center space-y-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-gray-600">Page not found</p>
      <Link href="/" className="text-blue-700 hover:underline">
        ← Back to posts
      </Link>
    </div>
  );
}
