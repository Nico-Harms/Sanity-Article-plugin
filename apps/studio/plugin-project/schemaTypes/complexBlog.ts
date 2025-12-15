import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'complexBlog',
  title: 'Article',
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
      name: 'body',
      title: 'Body',
      type: 'blockContent',
    }),
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 4,
      description: 'A compelling quote from the article',
    }),
    defineField({
      name: 'keyTakeaways',
      title: 'Key Takeaways',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Bullet points of main insights',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
    }),
  ],
})
