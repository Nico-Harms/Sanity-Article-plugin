import { Card, Text, Stack } from '@sanity/ui';

export function NotionLLMTool() {
  return (
    <Card padding={4}>
      <Stack space={3}>
        <Text size={3} weight="bold">
          Hello from Notion LLM Plugin
        </Text>
        <Text size={2}>
          This is a minimal plugin tool. More functionality coming soon!
        </Text>
        <input type="text" />
      </Stack>
    </Card>
  );
}
