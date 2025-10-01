import { expect, test } from 'vitest';
import { transform } from '../src/adapters/index.ts';
import { matchLabeledTitle } from './helpers.ts';

test('transform and add labeled data (datetime)', () => {
  const input = JSON.stringify([
    ['2025-04', 2],
    ['2025-05', 3],
    ['2025-06', 1],
  ]);

  const { config, data } = transform(input);

  const add = JSON.stringify([
    ['2025-04', 4],
    ['2025-05', 5],
    ['2025-06', 3],
  ]);

  const output = transform(add, { config, data });

  expect(output).toEqual({
    config: {
      title: matchLabeledTitle,
      type: 'standard',
      sort: 'datetime',
      series: [
        {
          color: '#8b5cf6',
          id: 0,
          label: '2025-04',
        },
        {
          color: '#ec4899',
          id: 1,
          label: '2025-05',
        },
        {
          color: '#14b8a6',
          id: 2,
          label: '2025-06',
        },
      ],
      seriesX: [
        {
          color: '#8b5cf6',
          id: 0,
          label: 'Series 1',
        },
        {
          color: '#ec4899',
          id: 1,
          label: 'Series 2',
        },
      ],
    },
    data: [
      {
        values: [2, 4],
        mean: 3,
        median: 4,
        stddev: 1,
        min: 2,
        max: 4,
        id: 0,
        seriesId: 0,
        label: '2025-04',
      },
      {
        values: [3, 5],
        mean: 4,
        median: 5,
        stddev: 1,
        min: 3,
        max: 5,
        id: 1,
        seriesId: 1,
        label: '2025-05',
      },
      {
        values: [1, 3],
        mean: 2,
        median: 3,
        stddev: 1,
        min: 1,
        max: 3,
        id: 2,
        seriesId: 2,
        label: '2025-06',
      },
    ],
  });
});
