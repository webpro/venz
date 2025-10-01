import { expect, test } from 'vitest';
import { transform } from '../src/adapters/index.ts';
import { matchRawTitle } from './helpers.ts';

test('transform raw numeric data (single)', () => {
  const input = `
1
1
1
`;

  const output = transform(input);

  expect(output).toEqual({
    config: {
      title: matchRawTitle,
      type: 'standard',
      series: [
        {
          color: '#8b5cf6',
          command: '',
          id: 0,
          label: 'Series 1',
        },
      ],
    },
    data: [
      {
        values: [1, 1, 1],
        mean: 1,
        median: 1,
        stddev: 0,
        min: 1,
        max: 1,
        id: 0,
        seriesId: 0,
      },
    ],
  });
});

test('transform raw numeric data (multi)', () => {
  const input = `
1 1 1
2 2 2
3 3 3
`;

  const output = transform(input);

  expect(output).toEqual({
    config: {
      title: matchRawTitle,
      type: 'standard',
      series: [
        {
          color: '#8b5cf6',
          command: '',
          id: 0,
          label: 'Series 1',
        },
        {
          color: '#ec4899',
          command: '',
          id: 1,
          label: 'Series 2',
        },
        {
          color: '#14b8a6',
          command: '',
          id: 2,
          label: 'Series 3',
        },
      ],
    },
    data: [
      {
        values: [1, 1, 1],
        mean: 1,
        median: 1,
        stddev: 0,
        min: 1,
        max: 1,
        id: 0,
        seriesId: 0,
      },
      {
        values: [2, 2, 2],
        mean: 2,
        median: 2,
        stddev: 0,
        min: 2,
        max: 2,
        id: 1,
        seriesId: 1,
      },
      {
        values: [3, 3, 3],
        mean: 3,
        median: 3,
        stddev: 0,
        min: 3,
        max: 3,
        id: 2,
        seriesId: 2,
      },
    ],
  });
});

test('transform raw numeric data (json string)', () => {
  const input = ['1, 2, 3'];
  const output = transform(input);

  expect(output).toEqual({
    config: {
      title: matchRawTitle,
      type: 'standard',
      series: [
        {
          color: '#8b5cf6',
          command: '',
          id: 0,
          label: 'Series 1',
        },
      ],
    },
    data: [
      {
        values: [1, 2, 3],
        mean: 2,
        median: 2,
        stddev: Math.sqrt(2 / 3),
        min: 1,
        max: 3,
        id: 0,
        seriesId: 0,
      },
    ],
  });
});

test('transform raw numeric data (multi json string)', () => {
  const input = ['1, 2, 3', '4, 5, 6'];
  const output = transform(input);

  expect(output).toEqual({
    config: {
      title: matchRawTitle,
      type: 'standard',
      series: [
        {
          color: '#8b5cf6',
          command: '',
          id: 0,
          label: 'Series 1',
        },
        {
          color: '#ec4899',
          command: '',
          id: 1,
          label: 'Series 2',
        },
      ],
    },
    data: [
      {
        values: [1, 2, 3],
        mean: 2,
        median: 2,
        stddev: Math.sqrt(2 / 3),
        min: 1,
        max: 3,
        id: 0,
        seriesId: 0,
      },
      {
        values: [4, 5, 6],
        mean: 5,
        median: 5,
        stddev: Math.sqrt(2 / 3),
        min: 4,
        max: 6,
        id: 1,
        seriesId: 1,
      },
    ],
  });
});
