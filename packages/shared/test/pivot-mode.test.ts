import { expect, test } from 'vitest';
import { getPivotMode } from '../src/chart.ts';

test('returns pivoted by default', () => {
  expect(getPivotMode()).toBe('pivoted');
  expect(getPivotMode(undefined, undefined, undefined)).toBe('pivoted');
});

test('p=1 returns none', () => {
  expect(getPivotMode(undefined, '1')).toBe('none');
});

test('t=1 returns transposed', () => {
  expect(getPivotMode(undefined, undefined, '1')).toBe('transposed');
});

test('p=1 and t=1 returns transposed-pivoted', () => {
  expect(getPivotMode(undefined, '1', '1')).toBe('transposed-pivoted');
});

test('type=pivot returns pivoted (legacy)', () => {
  expect(getPivotMode('pivot')).toBe('pivoted');
});

test('type=pivot with t=1 returns transposed', () => {
  expect(getPivotMode('pivot', undefined, '1')).toBe('transposed');
});

test('type=pivot with p=1 still returns pivoted (legacy overrides)', () => {
  expect(getPivotMode('pivot', '1')).toBe('pivoted');
});

test('ignores array values', () => {
  expect(getPivotMode(undefined, ['1'], undefined)).toBe('pivoted');
  expect(getPivotMode(undefined, undefined, ['1'])).toBe('pivoted');
});

test('ignores non-1 string values', () => {
  expect(getPivotMode(undefined, '0')).toBe('pivoted');
  expect(getPivotMode(undefined, undefined, '2')).toBe('pivoted');
});
