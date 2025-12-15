import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Posts from Sanity',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <header className="mb-10">
            <h1 className="text-3xl font-bold">Blog</h1>
            <p className="text-gray-600">Powered by Sanity</p>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
