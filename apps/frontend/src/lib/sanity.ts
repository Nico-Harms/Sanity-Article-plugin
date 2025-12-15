import { createClient, type SanityClient } from '@sanity/client';
import type { PortableTextBlock } from '@portabletext/types';

type SanitySlug = { current?: string };

export type Post = {
  _id: string;
  title?: string;
  slug?: SanitySlug;
  excerpt?: string;
  publishedAt?: string;
  _createdAt?: string;
  body?: PortableTextBlock[];
};

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-01-01';
const useCdn = process.env.NEXT_PUBLIC_SANITY_USE_CDN === 'true';

const isConfigured = Boolean(projectId && dataset);

const client: SanityClient | null = isConfigured
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn,
    })
  : null;

const safeFetch = async <T>(
  query: string,
  params: Record<string, unknown>,
  fallback: T
): Promise<T> => {
  if (!client) {
    return fallback;
  }

  try {
    return await client.fetch<T>(query, params);
  } catch (error) {
    console.error('[sanity] fetch failed', error);
    return fallback;
  }
};

export const getAllPosts = async (): Promise<Post[]> => {
  const query = `*[_type == "post"] | order(coalesce(publishedAt, _createdAt) desc) {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    _createdAt,
    body[]{
      ...,
      markDefs[]{
        ...,
        _type == "link" => {
          ...,
          "href": @.href
        }
      }
    }
  }`;

  return safeFetch<Post[]>(query, {}, []);
};

export const getPostBySlug = async (slug: string): Promise<Post | null> => {
  const query = `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    _createdAt,
    body[]{
      ...,
      markDefs[]{
        ...,
        _type == "link" => {
          ...,
          "href": @.href
        }
      }
    }
  }`;

  return safeFetch<Post | null>(query, { slug }, null);
};
