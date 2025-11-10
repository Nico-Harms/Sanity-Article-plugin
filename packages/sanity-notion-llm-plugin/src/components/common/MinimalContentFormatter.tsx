import React from 'react';
import { PortableText } from '@portabletext/react';
import { Card, Text, Stack, Box } from '@sanity/ui';
import { format } from 'date-fns';

interface MinimalContentFormatterProps {
  content: any;
  documentType?: string;
}

export function MinimalContentFormatter({
  content,
}: MinimalContentFormatterProps) {
  if (!content) {
    return (
      <Text size={1} muted>
        No content available
      </Text>
    );
  }

  // Helper: Format field names for display
  const formatFieldName = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Helper: Try to format as date
  const tryFormatDate = (value: string) => {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return format(date, 'MMM dd, yyyy');
      }
    } catch {
      return value;
    }
    return value;
  };

  // Detect: Is this Portable Text content?
  const isPortableText = (value: any) => {
    return (
      Array.isArray(value) &&
      value.length > 0 &&
      value.some(
        (item: any) =>
          item &&
          typeof item === 'object' &&
          ['block', 'image', 'code'].includes(item._type)
      )
    );
  };

  // Detect: Is this a structured object array?
  const isStructuredObjectArray = (value: any) => {
    return (
      Array.isArray(value) &&
      value.length > 0 &&
      value.every((item: any) => item && typeof item === 'object')
    );
  };

  // Detect: Likely a date string?
  const looksLikeDate = (value: string) => {
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
      /T\d{2}:\d{2}:\d{2}/, // Contains time
    ];
    return datePatterns.some((pattern) => pattern.test(value));
  };

  // Render: Structured object in a card
  const renderStructuredObject = (obj: any, index: number) => {
    const objectKeys = Object.keys(obj).filter((k) => !k.startsWith('_'));
    const displayType = obj._type ? formatFieldName(obj._type) : null;

    return (
      <Card
        key={index}
        padding={3}
        border
        radius={2}
        style={{ marginBottom: '0.5rem' }}
      >
        <Stack space={2}>
          {displayType && (
            <Text
              size={1}
              weight="semibold"
              style={{ color: 'var(--sanity-color-primary)' }}
            >
              {displayType}
            </Text>
          )}
          <Stack space={1}>
            {objectKeys.map((k) => {
              const val = obj[k];
              const displayValue =
                typeof val === 'string' ? val : JSON.stringify(val, null, 2);
              return (
                <Text key={k} size={1} style={{ paddingLeft: '0.5rem' }}>
                  <strong>{formatFieldName(k)}:</strong> {displayValue}
                </Text>
              );
            })}
          </Stack>
        </Stack>
      </Card>
    );
  };

  // Render: Individual field based on structure
  const renderField = (key: string, value: any, index: number) => {
    // Skip internal fields
    if (
      key.startsWith('_') ||
      ['_id', '_type', '_rev', '_createdAt', '_updatedAt'].includes(key)
    ) {
      return null;
    }

    const fieldLabel = formatFieldName(key);

    // 1. String values
    if (typeof value === 'string' && value.trim()) {
      const isDate = looksLikeDate(value);
      const isShort = value.length < 150;
      const isFirstField = index === 0;

      return (
        <Box key={key} style={{ marginBottom: '2rem' }}>
          <Text size={1} weight="medium" style={{ marginBottom: '0.5rem' }}>
            {fieldLabel}:
          </Text>
          <Text
            size={isFirstField && isShort ? 3 : 1}
            weight={isFirstField && isShort ? 'bold' : undefined}
            style={{
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6',
              ...(isDate && { color: 'var(--sanity-color-text-secondary)' }),
              ...(isFirstField &&
                isShort && {
                  marginBottom: '1rem',
                  borderBottom: '2px solid var(--sanity-color-border)',
                  paddingBottom: '0.5rem',
                }),
            }}
          >
            {isDate ? tryFormatDate(value) : value}
          </Text>
        </Box>
      );
    }

    // 2. Numbers and booleans
    if (typeof value === 'number' || typeof value === 'boolean') {
      return (
        <Box key={key} style={{ marginBottom: '2rem' }}>
          <Text size={1} weight="medium" style={{ marginBottom: '0.5rem' }}>
            {fieldLabel}:
          </Text>
          <Text size={1}>{String(value)}</Text>
        </Box>
      );
    }

    // 3. Portable Text (rich content)
    if (isPortableText(value)) {
      return (
        <Box key={key} style={{ marginBottom: '2.5rem' }}>
          <Text size={1} weight="medium" style={{ marginBottom: '0.5rem' }}>
            {fieldLabel}:
          </Text>
          <Card padding={3} border radius={2}>
            <PortableText value={value} />
          </Card>
        </Box>
      );
    }

    // 4. Arrays of structured objects
    if (isStructuredObjectArray(value)) {
      return (
        <Box key={key} style={{ marginBottom: '2rem' }}>
          <Text size={1} weight="medium" style={{ marginBottom: '0.75rem' }}>
            {fieldLabel}:
          </Text>
          <Stack space={2}>
            {value.map((item: any, idx: number) =>
              renderStructuredObject(item, idx)
            )}
          </Stack>
        </Box>
      );
    }

    // 5. Simple arrays
    if (Array.isArray(value) && value.length > 0) {
      return (
        <Box key={key} style={{ marginBottom: '2rem' }}>
          <Text size={1} weight="medium" style={{ marginBottom: '0.5rem' }}>
            {fieldLabel}:
          </Text>
          <Stack space={1}>
            {value.slice(0, 10).map((item: any, idx: number) => (
              <Text key={idx} size={1} style={{ paddingLeft: '0.5rem' }}>
                • {typeof item === 'string' ? item : JSON.stringify(item)}
              </Text>
            ))}
            {value.length > 10 && (
              <Text size={1} muted style={{ paddingLeft: '0.5rem' }}>
                ... and {value.length - 10} more
              </Text>
            )}
          </Stack>
        </Box>
      );
    }

    // 6. Objects
    if (typeof value === 'object' && value !== null) {
      const objectKeys = Object.keys(value).filter((k) => !k.startsWith('_'));

      // Small objects: inline display
      if (objectKeys.length > 0 && objectKeys.length <= 3) {
        return (
          <Box key={key} style={{ marginBottom: '2rem' }}>
            <Text size={1} weight="medium" style={{ marginBottom: '0.5rem' }}>
              {fieldLabel}:
            </Text>
            <Stack space={1}>
              {objectKeys.map((k) => (
                <Text key={k} size={1} style={{ paddingLeft: '0.5rem' }}>
                  <strong>{formatFieldName(k)}:</strong>{' '}
                  {typeof value[k] === 'string'
                    ? value[k]
                    : JSON.stringify(value[k])}
                </Text>
              ))}
            </Stack>
          </Box>
        );
      }

      // Larger objects: structured card
      if (objectKeys.length > 0) {
        return (
          <Box key={key} style={{ marginBottom: '2rem' }}>
            <Text size={1} weight="medium" style={{ marginBottom: '0.5rem' }}>
              {fieldLabel}:
            </Text>
            {renderStructuredObject(value, 0)}
          </Box>
        );
      }
    }

    return null;
  };

  // Sort fields: prioritize content-like fields, then alphabetically
  const contentFieldKeywords = [
    'title',
    'name',
    'heading',
    'headline',
    'ingress',
    'excerpt',
    'summary',
    'body',
    'content',
    'description',
  ];
  const sortedFields = Object.entries(content).sort(([keyA], [keyB]) => {
    const priorityA = contentFieldKeywords.indexOf(keyA.toLowerCase());
    const priorityB = contentFieldKeywords.indexOf(keyB.toLowerCase());

    if (priorityA !== -1 && priorityB !== -1) return priorityA - priorityB;
    if (priorityA !== -1) return -1;
    if (priorityB !== -1) return 1;
    return keyA.localeCompare(keyB);
  });

  // Render all fields
  const contentFields = sortedFields
    .map(([key, value], index) => renderField(key, value, index))
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
