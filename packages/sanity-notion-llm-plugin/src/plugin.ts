import { definePlugin } from 'sanity';
import { NotionLLMTool } from './tool/NotionLLMTool';

export const sanityNotionLLMPlugin = definePlugin({
  name: 'sanity-notion-llm-plugin',
  tools: [
    {
      name: 'notion-llm',
      title: 'Notion LLM',
      component: NotionLLMTool,
    },
  ],
});
