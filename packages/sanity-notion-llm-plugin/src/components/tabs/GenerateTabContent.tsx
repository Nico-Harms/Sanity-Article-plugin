import { type NotionPage, type SanityDraftData } from 'sanity-hermes-shared';
import { GenerationSection } from '../generation/GenerationSection';

interface GenerateTabContentProps {
  studioId: string;
  notionPages: NotionPage[];
  onGenerationComplete: (draft: SanityDraftData) => void;
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
