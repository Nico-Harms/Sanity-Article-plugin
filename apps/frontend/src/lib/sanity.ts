import { createClient } from '@sanity/client';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION;
const useCdn = process.env.NEXT_PUBLIC_SANITY_USE_CDN;

if (!projectId) {
  throw new Error(
    'Missing NEXT_PUBLIC_SANITY_PROJECT_ID environment variable for Sanity client'
  );
}

export const client = createClient({
  projectId,
  dataset,
  useCdn,
  apiVersion,
});

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

type PortableTextSpan = {
  _type?: string;
  text?: string;
};

type PortableTextBlock = {
  _type?: string;
  children?: PortableTextSpan[];
};

export type ComplexBlogPost = {
  _id: string;
  title?: string;
  slug?: SanitySlug;
  publishedAt?: string;
  ingress?: PortableTextBlock[];
};

// Query to get all posts
export const getAllPosts = async (): Promise<Post[]> => {
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
    }
  }`;

  return client.fetch<Post[]>(query);
};

export const getAllComplexBlogs = async (): Promise<ComplexBlogPost[]> => {
  const query = `*[_type == "complexBlog"] | order(coalesce(publishedAt, _createdAt) desc) {
    _id,
    title,
    slug,
    publishedAt,
    ingress[]{
      _type,
      children[]{
        _type,
        text
      }
    }
  }`;

  return client.fetch<ComplexBlogPost[]>(query);
};

// Query to get a single post by slug
export const getPostBySlug = async (slug: string) => {
  const query = `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    body,
    _createdAt,
    author->{
      name,
      image
    },
    mainImage,
    categories[]->{
      title
    }
  }`;

  return client.fetch(query, { slug });
};
