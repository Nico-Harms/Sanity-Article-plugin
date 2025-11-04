import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'complexBlog',
  title: 'Complex Blog',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'ingress',
      title: 'Ingress',
      type: 'blockContent',
      description: 'Short introduction shown before the main content',
    }),
    defineField({
      name: 'modules',
      title: 'Content Modules',
      type: 'array',
      of: [
        {type: 'richTextModule'},
        {type: 'quoteModule'},
        {type: 'imageModule'},
        {type: 'codeModule'},
      ],
      description: 'Flexible content blocks for the blog article',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
    }),
  ],
})
