import { Select, Box, Text } from '@sanity/ui';
import type { WeekFilterOption } from '../../utils/dateUtils';

interface WeekFilterProps {
  value: WeekFilterOption;
  onChange: (value: WeekFilterOption) => void;
}

const WEEK_OPTIONS: Array<{ value: WeekFilterOption; label: string }> = [
  { value: 'all', label: 'All Weeks' },
  { value: 'this_week', label: 'This Week' },
  { value: 'next_week', label: 'Next Week' },
  { value: 'past_week', label: 'Past Week' },
];

export function WeekFilter({ value, onChange }: WeekFilterProps) {
  return (
    <Box style={{ minWidth: '200px' }}>
      <Select
        value={value}
        onChange={(event) =>
          onChange(event.currentTarget.value as WeekFilterOption)
        }
      >
        {WEEK_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
    </Box>
  );
}
