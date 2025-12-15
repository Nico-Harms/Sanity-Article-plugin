import { definePlugin } from 'sanity';
import { NotionLLMTool } from './tool/NotionLLMTool';

export const sanityNotionLLMPlugin = definePlugin(() => {
  return {
    name: 'hermes-plugin',
    tools: [
      {
        name: 'hermes',
        title: 'Hermes Content',
        component: () => <NotionLLMTool />,
      },
    ],
  };
});
