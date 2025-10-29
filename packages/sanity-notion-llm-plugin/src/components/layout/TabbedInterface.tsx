import { useState } from 'react';
import { Card, Text, Stack, Box, Flex, Button } from '@sanity/ui';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabbedInterfaceProps {
  tabs: Tab[];
  defaultTab?: string;
}

/*===============================================
=         Tabbed Interface Component (TABS FOR UI)      =
===============================================*/

export function TabbedInterface({ tabs, defaultTab }: TabbedInterfaceProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <Card>
      {/* Tab Navigation */}
      <Box
        padding={3}
        style={{ borderBottom: '1px solid var(--card-border-color)' }}
      >
        <Flex gap={1}>
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              text={tab.label}
              mode={activeTab === tab.id ? 'default' : 'ghost'}
              tone={activeTab === tab.id ? 'primary' : 'default'}
              onClick={() => setActiveTab(tab.id)}
              style={{
                borderRadius: '6px 6px 0 0',
                borderBottom:
                  activeTab === tab.id
                    ? '2px solid var(--card-border-color)'
                    : 'none',
              }}
            />
          ))}
        </Flex>
      </Box>

      {/* Tab Content */}
      <Box padding={4}>{activeTabContent}</Box>
    </Card>
  );
}
