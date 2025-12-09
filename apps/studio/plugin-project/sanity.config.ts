import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {sanityNotionLLMPlugin} from 'sanity-hermes'

export default defineConfig({
  name: 'default',
  title: 'plugin-project',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || '',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [
    structureTool(),
    visionTool(),
    sanityNotionLLMPlugin({
      showDebugTab: process.env.SANITY_STUDIO_GENERATE_TAB_CONTENT === 'true',
    }),
  ],

  schema: {
    types: schemaTypes,
  },
})
