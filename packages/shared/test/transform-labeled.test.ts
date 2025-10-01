import { expect, test } from 'vitest';
import { transform } from '../src/adapters/index.ts';
import { matchLabeledTitle } from './helpers.ts';

test('transform labeled data (datetime)', () => {
  const input = JSON.stringify([
    ['2025-04', 2],
    ['2025-05', 3],
    ['2025-06', 1],
  ]);

  const output = transform(input);

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
      ],
    },
    data: [
      {
        values: [2],
        mean: 2,
        median: 2,
        stddev: 0,
        min: 2,
        max: 2,
        id: 0,
        seriesId: 0,
        label: '2025-04',
      },
      {
        values: [3],
        mean: 3,
        median: 3,
        stddev: 0,
        min: 3,
        max: 3,
        id: 1,
        seriesId: 1,
        label: '2025-05',
      },
      {
        values: [1],
        mean: 1,
        median: 1,
        stddev: 0,
        min: 1,
        max: 1,
        id: 2,
        seriesId: 2,
        label: '2025-06',
      },
    ],
  });
});

test('transform labeled data (semver)', () => {
  const input = JSON.stringify([
    ['1.0.0', 2],
    ['1.0.1', 3],
    ['1.0.2', 1],
  ]);

  const output = transform(input);

  expect(output).toEqual({
    config: {
      title: matchLabeledTitle,
      type: 'standard',
      sort: 'semver',
      series: [
        {
          color: '#8b5cf6',
          id: 0,
          label: '1.0.0',
        },
        {
          color: '#ec4899',
          id: 1,
          label: '1.0.1',
        },
        {
          color: '#14b8a6',
          id: 2,
          label: '1.0.2',
        },
      ],
      seriesX: [
        {
          color: '#8b5cf6',
          id: 0,
          label: 'Series 1',
        },
      ],
    },
    data: [
      {
        values: [2],
        mean: 2,
        median: 2,
        stddev: 0,
        min: 2,
        max: 2,
        id: 0,
        seriesId: 0,
        label: '1.0.0',
      },
      {
        values: [3],
        mean: 3,
        median: 3,
        stddev: 0,
        min: 3,
        max: 3,
        id: 1,
        seriesId: 1,
        label: '1.0.1',
      },
      {
        values: [1],
        mean: 1,
        median: 1,
        stddev: 0,
        min: 1,
        max: 1,
        id: 2,
        seriesId: 2,
        label: '1.0.2',
      },
    ],
  });
});
