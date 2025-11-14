import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { PortableTextBlock } from '@portabletext/types';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-01-01';
const useCdn = process.env.NEXT_PUBLIC_SANITY_USE_CDN === 'true';

if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
  console.warn(
    '[sanity] NEXT_PUBLIC_SANITY_PROJECT_ID is not set. Sanity client will not function properly.'
  );
}

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn,
});

// Image URL builder for Sanity images
const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImage) {
  return builder.image(source);
}

type SanitySlug = {
  current?: string;
};

type SanityAuthor = {
  name?: string;
};

type SanityCategory = {
  title?: string;
};

export type Post = {
  _id: string;
  title?: string;
  slug?: SanitySlug;
  excerpt?: string;
  _createdAt: string;
  author?: SanityAuthor;
  categories?: SanityCategory[];
};

type SanityImageAsset = {
  url?: string;
};

type SanityImage = {
  asset?: SanityImageAsset;
};

// Portable text types are now imported from @portabletext/types

export type ComplexBlogModule = {
  _type: 'richTextModule' | 'quoteModule' | 'imageModule' | 'codeModule';
  _key?: string;
  content?: PortableTextBlock[];
  quote?: string;
  author?: string;
  image?: SanityImage;
  caption?: string;
  code?: string;
  language?: string;
};

export type ComplexBlogPost = {
  _id: string;
  title?: string;
  slug?: SanitySlug;
  publishedAt?: string;
  ingress?: PortableTextBlock[];
  modules?: ComplexBlogModule[];
};

export type PostDetail = Post & {
  body?: PortableTextBlock[];
  mainImage?: SanityImage;
};

const safeFetch = async <T>(
  query: string,
  params: Record<string, unknown>,
  fallback: T
): Promise<T> => {
  try {
    return await client.fetch<T>(query, params);
  } catch (error) {
    console.error('[sanity] Failed fetching data for query', error);
    return fallback;
  }
};

// Query to get all posts with full body content
export const getAllPosts = async (): Promise<PostDetail[]> => {
  const query = `*[_type == "post"] | order(_createdAt desc) {
    _id,
    title,
    slug,
    excerpt,
    _createdAt,
    author->{
      name
    },
    categories[]->{
      title
    },
    body[]{
      ...,
      _type == "image" => {
        ...,
        asset->
      },
      markDefs[]{
        ...,
        _type == "link" => {
          ...,
          "href": @.href
        }
      }
    },
    mainImage{
      asset->{
        _id,
        url
      }
    }
  }`;

  return safeFetch<PostDetail[]>(query, {}, []);
};

export const getAllComplexBlogs = async (): Promise<ComplexBlogPost[]> => {
  const query = `*[_type == "complexBlog"] | order(coalesce(publishedAt, _createdAt) desc) {
    _id,
    title,
    slug,
    publishedAt,
    ingress[]{
      ...,
      _type == "image" => {
        ...,
        asset->
      },
      markDefs[]{
        ...,
        _type == "link" => {
          ...,
          "href": @.href
        }
      }
    },
    modules[]{
      _type,
      _key,
      _type == "richTextModule" => {
        content[]{
          ...,
          _type == "image" => {
            ...,
            asset->
          },
          markDefs[]{
            ...,
            _type == "link" => {
              ...,
              "href": @.href
            }
          }
        }
      },
      _type == "quoteModule" => {
        quote,
        author
      },
      _type == "imageModule" => {
        image{
          asset->{
            _id,
            url
          }
        },
        caption
      },
      _type == "codeModule" => {
        code,
        language
      }
    }
  }`;

  return safeFetch<ComplexBlogPost[]>(query, {}, []);
};

// Query to get a single post by slug with full content
export const getPostBySlug = async (
  slug: string
): Promise<PostDetail | null> => {
  const query = `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    _createdAt,
    author->{
      name,
      image
    },
    mainImage{
      asset->{
        _id,
        url
      }
    },
    categories[]->{
      title
    },
    body[]{
      ...,
      _type == "image" => {
        ...,
        asset->{
          _id,
          url,
          metadata
        },
        alt
      },
      markDefs[]{
        ...,
        _type == "link" => {
          ...,
          "href": @.href
        }
      }
    }
  }`;

  return safeFetch<PostDetail | null>(query, { slug }, null);
};

// Query to get a single complex blog by slug
export const getComplexBlogBySlug = async (
  slug: string
): Promise<ComplexBlogPost | null> => {
  const query = `*[_type == "complexBlog" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    publishedAt,
    ingress[]{
      ...,
      _type == "image" => {
        ...,
        asset->{
          _id,
          url,
          metadata
        },
        alt
      },
      markDefs[]{
        ...,
        _type == "link" => {
          ...,
          "href": @.href
        }
      }
    },
    modules[]{
      _type,
      _key,
      _type == "richTextModule" => {
        content[]{
          ...,
          _type == "image" => {
            ...,
            asset->{
              _id,
              url,
              metadata
            },
            alt
          },
          markDefs[]{
            ...,
            _type == "link" => {
              ...,
              "href": @.href
            }
          }
        }
      },
      _type == "quoteModule" => {
        quote,
        author
      },
      _type == "imageModule" => {
        image{
          asset->{
            _id,
            url,
            metadata
          }
        },
        caption
      },
      _type == "codeModule" => {
        code,
        language
      }
    }
  }`;

  return safeFetch<ComplexBlogPost | null>(query, { slug }, null);
};
