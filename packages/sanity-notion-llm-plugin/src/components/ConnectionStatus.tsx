import { Card, Text, Badge, Box, Stack, Flex } from '@sanity/ui';

interface ConnectionStatusProps {
  isConnected: boolean;
  lastTested?: Date;
  errorMessage?: string;
}

/*===============================================
=         Connection Status Component         =
===============================================*/

export function ConnectionStatus({
  isConnected,
  lastTested,
  errorMessage,
}: ConnectionStatusProps) {
  if (!lastTested) {
    return null; // Don't show anything until first test
  }

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
          <Text size={1} muted>
            {errorMessage ||
              'Connection failed. Please check your credentials.'}
          </Text>
        )}
      </Stack>
    </Card>
  );
}
