import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {sanityNotionLLMPlugin} from 'sanity-notion-llm-plugin'

export default defineConfig({
  name: 'default',
  title: 'plugin-project',

  projectId: 'mejvb3fs',
  dataset: 'production',

  plugins: [structureTool(), visionTool(), sanityNotionLLMPlugin()],

  schema: {
    types: schemaTypes,
  },
})
