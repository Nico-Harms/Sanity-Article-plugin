import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-gray-600 mb-6">Page not found</p>
      <Link
        href="/"
        className="text-blue-600 hover:underline"
      >
        ← Back to home
      </Link>
    </div>
  );
}

