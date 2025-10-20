import { defineConfig } from 'sanity';
import { sanityNotionLLMPlugin } from 'sanity-notion-llm-plugin';

export default defineConfig({
  name: 'default',
  title: 'Sanity Studio with Notion LLM Plugin',

  projectId: 'placeholder', // Replace with your actual project ID
  dataset: 'production',

  plugins: [sanityNotionLLMPlugin()],

  schema: {
    types: [
      // No content schemas yet - just testing the plugin
    ],
  },
});
