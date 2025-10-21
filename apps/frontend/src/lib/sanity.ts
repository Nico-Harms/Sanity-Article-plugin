import { createClient } from '@sanity/client';

export const client = createClient({
  projectId: 'mejvb3fs',
  dataset: 'production',
  useCdn: false, // Set to true if you want to use CDN
  apiVersion: '2025-10-21', // Use current date
});

// Query to get all posts
export const getAllPosts = async () => {
  const query = `*[_type == "post"] | order(_createdAt desc) {
    _id,
    title,
    slug,
    excerpt,
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

  return await client.fetch(query);
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

  return await client.fetch(query, { slug });
};
