import { MistralProvider } from './providers/MistralProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { PerplexityProvider } from './providers/PerplexityProvider';

/*===============================================
|=           LLM Provider Factory               =
===============================================*/

type ProviderType = 'mistral' | 'openai' | 'gemini' | 'perplexity';

export type LLMProvider =
  | MistralProvider
  | OpenAIProvider
  | GeminiProvider
  | PerplexityProvider;

export class LLMProviderFactory {
  /**
   * Create an LLM provider instance based on the provider type
   *
   * @param provider - The provider type selected by the user
   * @param apiKey - API key for the selected provider
   * @param model - Model name for the selected provider
   * @returns Provider instance ready to generate content
   * @throws Error if provider type is not supported
   */
  static createProvider(
    provider: ProviderType,
    apiKey: string,
    model: string
  ): LLMProvider {
    switch (provider) {
      case 'mistral':
        return new MistralProvider(apiKey, model);
      case 'openai':
        return new OpenAIProvider(apiKey, model);
      case 'gemini':
        return new GeminiProvider(apiKey, model);
      case 'perplexity':
        return new PerplexityProvider(apiKey, model);
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }
}
