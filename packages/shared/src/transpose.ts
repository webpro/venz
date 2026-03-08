import type { SeriesData } from './types.ts';
import { calculateStats } from './adapters/standard.ts';

export const transpose = (data: SeriesData[]) => {
  const result: SeriesData[] = [];
  if (!data[0]) return result;
  for (let i = 0; i < data[0].values.length; i++) {
    result[i] = { id: i, seriesId: i, ...calculateStats(data.map(d => d.values[i])) };
  }
  return result;
};
