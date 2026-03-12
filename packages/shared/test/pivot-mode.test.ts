import { expect, test } from 'vitest';
import { getPivotMode } from '../src/chart.ts';

test('returns none by default (no params)', () => {
  expect(getPivotMode()).toBe('none');
  expect(getPivotMode(undefined, undefined)).toBe('none');
});

test('pivot=1 returns pivoted', () => {
  expect(getPivotMode('1')).toBe('pivoted');
});

test('pivot=0 returns none', () => {
  expect(getPivotMode('0')).toBe('none');
});

test('transpose=1 returns transposed-pivoted', () => {
  expect(getPivotMode(undefined, '1')).toBe('transposed-pivoted');
});

test('pivot=1 transpose=1 returns transposed', () => {
  expect(getPivotMode('1', '1')).toBe('transposed');
});

test('pivot=0 transpose=1 returns transposed-pivoted', () => {
  expect(getPivotMode('0', '1')).toBe('transposed-pivoted');
});

test('ignores non-string values', () => {
  expect(getPivotMode(['1'], undefined)).toBe('none');
  expect(getPivotMode(undefined, ['1'])).toBe('none');
  expect(getPivotMode(null, null)).toBe('none');
});
