import React from 'react';
import { Card, Text, Box, Grid, Stack } from '@sanity/ui';
import { useEffect, useState } from 'react';
import { ApiClient } from '../../services/apiClient';
import type { DraftStats } from 'sanity-hermes-shared';

interface DashboardStatsProps {
  studioId: string;
}

interface StatItem {
  label: string;
  key: keyof DraftStats;
  tone: 'default' | 'caution' | 'positive' | 'critical';
}

const STAT_ITEMS: StatItem[] = [
  { label: 'Total Drafts', key: 'total', tone: 'default' },
  { label: 'Pending Review', key: 'pending', tone: 'caution' },
  { label: 'Approved', key: 'approved', tone: 'positive' },
  { label: 'Published', key: 'published', tone: 'positive' },
];

export function DashboardStats({ studioId }: DashboardStatsProps) {
  const [stats, setStats] = useState<DraftStats>({
    total: 0,
    pending: 0,
    approved: 0,
    published: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiClient.getDraftStats(studioId);
      if (response.stats) setStats(response.stats);
    } catch (err) {
      console.error('[DashboardStats] Failed to fetch stats:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [studioId]);

  // Expose refresh function globally for manual refresh
  useEffect(() => {
    (window as any).refreshDashboardStats = fetchStats;
    return () => {
      delete (window as any).refreshDashboardStats;
    };
  }, [studioId]);

  if (loading) {
    return (
      <Box padding={3}>
        <Text size={0} muted>
          Loading...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Card padding={3} radius={2} tone="critical" border>
        <Text size={0}>{error}</Text>
      </Card>
    );
  }

  const total = stats.total || 1; // Prevent division by zero

  return (
    <Box>
      {/* Stats Grid */}
      <Grid columns={[1, 2, 4]} gap={3}>
        {STAT_ITEMS.map(({ label, key }) => {
          return (
            <Card
              key={label}
              padding={4}
              radius={3}
              shadow={1}
              border={true}
              style={{
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Stack space={3} style={{ position: 'relative', zIndex: 1 }}>
                {/* Label */}
                <Box>
                  <Text
                    size={0}
                    weight="semibold"
                    muted
                    style={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: '10px',
                    }}
                  >
                    {label}
                  </Text>
                </Box>

                {/* Value */}
                <Stack space={2}>
                  <Text>{stats[key].toLocaleString()}</Text>

                  {/* Progress bar */}
                  {total > 0 && (
                    <Box>
                      <Box
                        style={{
                          width: '100%',
                          height: '3px',
                          backgroundColor: 'var(--card-border-color)',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}
                      />
                    </Box>
                  )}
                </Stack>
              </Stack>
            </Card>
          );
        })}
      </Grid>
    </Box>
  );
}
