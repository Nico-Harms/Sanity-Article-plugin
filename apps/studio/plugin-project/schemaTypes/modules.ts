import {defineType, defineField} from 'sanity'

export const richTextModule = defineType({
  name: 'richTextModule',
  title: 'Rich Text Module',
  type: 'object',
  fields: [
    defineField({
      name: 'content',
      title: 'Content',
      type: 'blockContent',
    }),
  ],
})

export const quoteModule = defineType({
  name: 'quoteModule',
  title: 'Quote Module',
  type: 'object',
  fields: [
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
    }),
  ],
})

export const imageModule = defineType({
  name: 'imageModule',
  title: 'Image Module',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
    }),
  ],
})

export const codeModule = defineType({
  name: 'codeModule',
  title: 'Code Module',
  type: 'object',
  fields: [
    defineField({
      name: 'code',
      title: 'Code',
      type: 'text',
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
    }),
  ],
})
