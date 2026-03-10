import { expect, test } from 'vitest';
import { getPivotMode } from '../src/chart.ts';

test('returns none by default', () => {
  expect(getPivotMode()).toBe('none');
  expect(getPivotMode(undefined, undefined, undefined)).toBe('none');
});

test('p=1 returns pivoted', () => {
  expect(getPivotMode(undefined, '1')).toBe('pivoted');
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

test('type=pivot with t=1 returns transposed-pivoted', () => {
  expect(getPivotMode('pivot', undefined, '1')).toBe('transposed-pivoted');
});

test('ignores array values', () => {
  expect(getPivotMode(undefined, ['1'], undefined)).toBe('none');
  expect(getPivotMode(undefined, undefined, ['1'])).toBe('none');
});

test('ignores non-1 string values', () => {
  expect(getPivotMode(undefined, '0')).toBe('none');
  expect(getPivotMode(undefined, undefined, '2')).toBe('none');
});
