import { definePlugin } from 'sanity';
import { NotionLLMTool } from './tool/NotionLLMTool';

export interface HermesPluginOptions {
  /**
   * Enable the "Generate" debug tab for manual content generation.
   * Useful for development and testing.
   * @default false
   */
  showDebugTab?: boolean;
}

export const sanityNotionLLMPlugin = definePlugin<HermesPluginOptions | void>(
  (options) => {
    const showDebugTab = options?.showDebugTab ?? false;

    return {
      name: 'hermes-plugin',
      tools: [
        {
          name: 'hermes',
          title: 'Hermes Content',
          component: (props) => (
            <NotionLLMTool {...props} showDebugTab={showDebugTab} />
          ),
        },
      ],
    };
  }
);
