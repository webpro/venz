import { expect, test } from 'vitest';
import { calculateStats } from '../src/adapters/standard.ts';
import { getYValues } from '../src/render/y-values.ts';
import type { SeriesData } from '../src/types.ts';

// Rows A, B, C (`label`) with columns x, y, z (`l`): the 10 is in row A and in column x
const rows = [
  [10, 1, 1],
  [1, 2, 1],
  [1, 1, 3],
];
const data: SeriesData[] = rows.map((values, i) => ({ id: i, seriesId: i, ...calculateStats(values) }));
const all = [0, 1, 2];
const max = (values: number[]) => Math.max(...values);

test('none: covers only selected rows', () => {
  const options = { data, chartType: 'line', pivotMode: 'none', selectedSeriesX: all } as const;
  expect(max(getYValues({ ...options, selectedSeries: all }))).toBe(10);
  expect(max(getYValues({ ...options, selectedSeries: [1, 2] }))).toBe(3);
});

test('none: bar covers only medians of selected rows', () => {
  const tall: SeriesData[] = [
    { id: 0, seriesId: 0, ...calculateStats([10, 10, 10]) },
    { id: 1, seriesId: 1, ...calculateStats([2, 2, 2]) },
  ];
  const options = { data: tall, chartType: 'bar', pivotMode: 'none', selectedSeriesX: all } as const;
  expect(getYValues({ ...options, selectedSeries: [0, 1] })).toEqual([10, 2]);
  expect(getYValues({ ...options, selectedSeries: [1] })).toEqual([2]);
});

test('transposed: covers only selected rows', () => {
  const options = { data, chartType: 'line', pivotMode: 'transposed', selectedSeriesX: all } as const;
  expect(max(getYValues({ ...options, selectedSeries: all }))).toBe(10);
  expect(getYValues({ ...options, selectedSeries: [1, 2] })).toEqual([1, 2, 1, 1, 1, 3]);
});

test('pivoted: covers only selected columns', () => {
  const options = { data, chartType: 'line', pivotMode: 'pivoted', selectedSeries: all } as const;
  expect(max(getYValues({ ...options, selectedSeriesX: all }))).toBe(10);
  expect(getYValues({ ...options, selectedSeriesX: [1, 2] })).toEqual([1, 2, 1, 1, 1, 3]);
});

test('transposed-pivoted: covers only selected columns', () => {
  const options = { data, chartType: 'bar', pivotMode: 'transposed-pivoted', selectedSeries: all } as const;
  expect(max(getYValues({ ...options, selectedSeriesX: [0] }))).toBe(10);
  expect(max(getYValues({ ...options, selectedSeriesX: [2] }))).toBe(3);
});

test('break: includes lower bounds of selected rows', () => {
  const options = { data, pivotMode: 'none', selectedSeries: [1, 2], selectedSeriesX: all, isBreak: true } as const;
  expect(getYValues({ ...options, chartType: 'line' })).toEqual([1, 2, 1, 3]);
  const median = getYValues({ ...options, chartType: 'median' });
  expect(median).toHaveLength(4);
  expect(Math.min(...median)).toBeLessThan(1);
});

test('falls back to all data without any selection', () => {
  const options = { data, chartType: 'line', selectedSeries: [], selectedSeriesX: [] } as const;
  expect(max(getYValues({ ...options, pivotMode: 'none' }))).toBe(10);
  expect(max(getYValues({ ...options, pivotMode: 'transposed' }))).toBe(10);
  expect(max(getYValues({ ...options, pivotMode: 'pivoted' }))).toBe(10);
});
