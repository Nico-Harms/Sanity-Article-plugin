/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is enabled by default in Next.js 14+
  experimental: {
    // Enable external packages in monorepo
    externalDir: true,
  },
  // Transpile packages from the monorepo
  transpilePackages: ['@sanity-notion-llm/shared'],
  // Disable ESLint during build (handled at root level)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
