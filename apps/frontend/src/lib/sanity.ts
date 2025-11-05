import { createClient } from '@sanity/client';

export const client = createClient({
  projectId: 'mejvb3fs',
  dataset: 'production',
  useCdn: false, // Set to true if you want to use CDN
  apiVersion: '2025-10-21', // Use current date
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
