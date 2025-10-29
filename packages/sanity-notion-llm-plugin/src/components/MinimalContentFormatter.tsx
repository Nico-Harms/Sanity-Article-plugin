import { PortableText } from '@portabletext/react';
import { Card, Text, Stack, Box } from '@sanity/ui';
import { format } from 'date-fns';

interface MinimalContentFormatterProps {
  content: any;
  documentType?: string;
}

export function MinimalContentFormatter({
  content,
  documentType,
}: MinimalContentFormatterProps) {
  if (!content) {
    return (
      <Text size={1} muted>
        No content available
      </Text>
    );
  }

  // Helper to format field names nicely
  const formatFieldName = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Helper to format dates
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  // Check if content is Portable Text
  const isPortableText = (value: any) => {
    return (
      Array.isArray(value) &&
      value.some(
        (item: any) =>
          item._type === 'block' ||
          item._type === 'image' ||
          item._type === 'code'
      )
    );
  };

  // Render individual fields
  const renderField = (key: string, value: any) => {
    // Skip internal Sanity fields
    if (
      key.startsWith('_') ||
      ['_id', '_type', '_rev', '_createdAt', '_updatedAt'].includes(key)
    ) {
      return null;
    }

    // Handle strings
    if (typeof value === 'string' && value.trim()) {
      const isDate =
        key.toLowerCase().includes('date') ||
        key.toLowerCase().includes('time');

      const isTitle =
        key.toLowerCase() === 'title' || key.toLowerCase() === 'name';

      return (
        <Box key={key} style={{ marginBottom: '2rem' }}>
          <Text size={1} weight="medium" style={{ marginBottom: '2.25rem' }}>
            {formatFieldName(key)}:
          </Text>
          <Text
            size={isTitle ? 3 : 1}
            weight={isTitle ? 'bold' : undefined}
            style={{
              color: isDate ? 'var(--sanity-color-text-secondary)' : 'inherit',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6',
              ...(isTitle && {
                marginBottom: '1rem',
                borderBottom: '2px solid var(--sanity-color-border)',
                paddingBottom: '0.5rem',
              }),
            }}
          >
            {isDate ? formatDate(value) : value}
          </Text>
        </Box>
      );
    }

    // Handle Portable Text arrays - use default rendering
    if (Array.isArray(value) && value.length > 0 && isPortableText(value)) {
      return (
        <Box key={key} style={{ marginBottom: '2.5rem' }}>
          <Text size={1} weight="medium" style={{ marginBottom: '0.5rem' }}>
            {formatFieldName(key)}:
          </Text>
          <Card padding={3} border radius={2}>
            {/* Use default Portable Text rendering - much simpler! */}
            <PortableText value={value} />
          </Card>
        </Box>
      );
    }

    // Handle regular arrays
    if (Array.isArray(value) && value.length > 0) {
      return (
        <Box key={key} style={{ marginBottom: '2rem' }}>
          <Text size={1} weight="medium" style={{ marginBottom: '0.5rem' }}>
            {formatFieldName(key)}:
          </Text>
          <Stack space={1}>
            {value.slice(0, 5).map((item: any, index: number) => (
              <Card key={index} padding={2} border radius={1}>
                <Text size={1}>
                  {typeof item === 'string'
                    ? item
                    : JSON.stringify(item, null, 2)}
                </Text>
              </Card>
            ))}
            {value.length > 5 && (
              <Text size={1} muted>
                ... and {value.length - 5} more items
              </Text>
            )}
          </Stack>
        </Box>
      );
    }

    // Handle objects
    if (typeof value === 'object' && value !== null) {
      return (
        <Box key={key} style={{ marginBottom: '2rem' }}>
          <Text size={1} weight="medium" style={{ marginBottom: '0.5rem' }}>
            {formatFieldName(key)}:
          </Text>
          <Card padding={2} border radius={1}>
            <Text
              size={1}
              style={{ fontFamily: 'monospace', fontSize: '0.875em' }}
            >
              {JSON.stringify(value, null, 2)}
            </Text>
          </Card>
        </Box>
      );
    }

    return null;
  };

  // Define field priority order (title first, then common content fields, then others)
  const fieldPriority = [
    'title',
    'name',
    'heading',
    'headline',
    'body',
    'content',
    'description',
    'excerpt',
    'summary',
    'text',
    'content',
    'author',
    'date',
    'publishedAt',
    'createdAt',
    'updatedAt',
  ];

  // Sort fields by priority, then alphabetically
  const sortedFields = Object.entries(content).sort(([keyA], [keyB]) => {
    const priorityA = fieldPriority.indexOf(keyA.toLowerCase());
    const priorityB = fieldPriority.indexOf(keyB.toLowerCase());

    // If both have priority, sort by priority order
    if (priorityA !== -1 && priorityB !== -1) {
      return priorityA - priorityB;
    }

    // If only one has priority, prioritize it
    if (priorityA !== -1) return -1;
    if (priorityB !== -1) return 1;

    // If neither has priority, sort alphabetically
    return keyA.localeCompare(keyB);
  });

  // Get all content fields
  const contentFields = sortedFields
    .map(([key, value]) => renderField(key, value))
    .filter(Boolean);

  if (contentFields.length === 0) {
    return (
      <Text size={1} muted>
        No content fields found
      </Text>
    );
  }

  return <Stack space={4}>{contentFields}</Stack>;
}
