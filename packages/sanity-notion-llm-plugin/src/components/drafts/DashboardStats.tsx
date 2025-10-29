import React from 'react';
import { Card, Text, Box, Grid, Badge, Stack } from '@sanity/ui';
import { useEffect, useState } from 'react';
import { ApiClient } from '../../services/apiClient';
import type { DraftStats } from '@sanity-notion-llm/shared';

interface DashboardStatsProps {
  studioId: string;
}

const STAT_ITEMS = [
  { label: 'Total Drafts', key: 'total', tone: 'default' as const },
  { label: 'Pending Review', key: 'pending', tone: 'caution' as const },
  { label: 'Approved', key: 'approved', tone: 'positive' as const },
  { label: 'Published', key: 'published', tone: 'positive' as const },
  { label: 'Rejected', key: 'rejected', tone: 'critical' as const },
];

export function DashboardStats({ studioId }: DashboardStatsProps) {
  const [stats, setStats] = useState<DraftStats>({
    total: 0,
    pending: 0,
    approved: 0,
    published: 0,
    rejected: 0,
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
      <Card padding={5} border radius={2}>
        <Text>Loading statistics...</Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card padding={5} border radius={2} tone="critical">
        <Text>{error}</Text>
      </Card>
    );
  }

  return (
    <Card padding={5} border radius={2} shadow={1}>
      <Stack>
        <Text size={2} weight="semibold">
          Content Overview
        </Text>
        <Grid columns={[1, 2, 5]} gap={4}>
          {STAT_ITEMS.map(({ label, key, tone }) => {
            const value = stats[key as keyof DraftStats];
            return (
              <Card key={label} padding={4} border tone={tone} radius={2}>
                <Stack space={4}>
                  <Text size={1} weight="medium" muted>
                    {label}
                  </Text>
                  <Text size={4} weight="bold">
                    {value}
                  </Text>
                  {value > 0 && (
                    <Badge tone={tone} size={0}>
                      {value === 1 ? '1 item' : `${value} items`}
                    </Badge>
                  )}
                </Stack>
              </Card>
            );
          })}
        </Grid>
      </Stack>
    </Card>
  );
}
