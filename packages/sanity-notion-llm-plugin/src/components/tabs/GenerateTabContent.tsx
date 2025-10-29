import { type PluginConfig } from '@sanity-notion-llm/shared';
import { GenerationSection } from '../generation/GenerationSection';

interface GenerateTabContentProps {
  studioId: string;
  notionPages: any[];
  onGenerationComplete: (draft: any) => void;
}

export function GenerateTabContent({
  studioId,
  notionPages,
  onGenerationComplete,
}: GenerateTabContentProps) {
  return (
    <GenerationSection
      studioId={studioId}
      notionPages={notionPages}
      onGenerationComplete={onGenerationComplete}
    />
  );
}
