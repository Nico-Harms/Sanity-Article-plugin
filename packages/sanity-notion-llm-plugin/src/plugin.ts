import { definePlugin } from 'sanity';
import { NotionLLMTool } from './tool/NotionLLMTool';

export const sanityNotionLLMPlugin = definePlugin({
  name: 'hermes-plugin',
  tools: [
    {
      name: 'hermes',
      title: 'Hermes',
      component: NotionLLMTool,
    },
  ],
});
