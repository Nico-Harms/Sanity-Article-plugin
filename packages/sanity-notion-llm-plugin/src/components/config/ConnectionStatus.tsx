import { Card, Text, Badge, Box, Stack, Flex } from '@sanity/ui';

interface ConnectionStatusProps {
  isConnected: boolean;
  lastTested?: Date;
  errorMessage?: string;
  fieldErrors?: Record<string, string>;
}

/*===============================================
=         Connection Status Component         =
===============================================*/

export function ConnectionStatus({
  isConnected,
  lastTested,
  errorMessage,
  fieldErrors,
}: ConnectionStatusProps) {
  if (!lastTested) {
    return null; // Don't show anything until first test
  }

  const hasFieldErrors = fieldErrors && Object.keys(fieldErrors).length > 0;

  return (
    <Card padding={3} border tone={isConnected ? 'positive' : 'critical'}>
      <Stack space={2}>
        <Box>
          <Flex align="center" gap={2}>
            <Text size={2} weight="medium">
              Connection Status
            </Text>
            <Badge tone={isConnected ? 'positive' : 'critical'} mode="outline">
              {isConnected ? 'Connected' : 'Failed'}
            </Badge>
          </Flex>
        </Box>

        {isConnected ? (
          <Text size={1} muted>
            Last tested: {lastTested.toLocaleString()}
          </Text>
        ) : (
          <Stack space={2}>
            {hasFieldErrors ? (
              <>
                <Text size={1} weight="medium">
                  Specific credential errors:
                </Text>
                {Object.entries(fieldErrors).map(([field, message]) => (
                  <Box
                    key={field}
                    padding={2}
                    style={{
                      backgroundColor: 'rgba(231,76,60,0.1)',
                      borderRadius: '4px',
                    }}
                  >
                    <Text size={1} style={{ color: '#e74c3c' }}>
                      <strong>{field}:</strong> {message}
                    </Text>
                  </Box>
                ))}
              </>
            ) : (
              <Text size={1} muted>
                {errorMessage ||
                  'Connection failed. Please check your credentials.'}
              </Text>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
