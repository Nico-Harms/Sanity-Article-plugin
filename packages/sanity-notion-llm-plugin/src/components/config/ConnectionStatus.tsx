import { Text, Badge, Flex } from '@sanity/ui';

interface ConnectionStatusProps {
  isConnected: boolean;
  lastTested?: Date;
  fieldErrors?: Record<string, string>;
}

export function ConnectionStatus({
  isConnected,
  lastTested,
  fieldErrors,
}: ConnectionStatusProps) {
  // Only show if a test has been performed
  if (!lastTested) {
    return null;
  }

  const hasFieldErrors = fieldErrors && Object.keys(fieldErrors).length > 0;

  // Only show errors if there are actual field errors
  if (!isConnected && !hasFieldErrors) {
    return null;
  }

  return (
    <Flex align="center" gap={2}>
      <Text size={1} weight="medium">
        Connection:
      </Text>
      <Badge tone={isConnected ? 'positive' : 'critical'} mode="outline">
        {isConnected ? 'Connected' : 'Failed'}
      </Badge>
      {hasFieldErrors && (
        <Text size={1} muted>
          ({Object.keys(fieldErrors).length} error
          {Object.keys(fieldErrors).length > 1 ? 's' : ''})
        </Text>
      )}
    </Flex>
  );
}
