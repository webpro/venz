import { expect, test } from 'vitest';
import { transform } from '../src/adapters/index.ts';

test('transform raw labeled data rows (datetime)', () => {
  const input = `
2025-04 1 2 3
2025-05 4 5 6
2025-06 7 8 9
`;

  const output = transform(input, -1);

  expect(output).toEqual({
    config: {
      id: -1,
      title: expect.stringMatching(/New labeled data series \(\d{1,2}\/\d{1,2} \d{1,2}:\d{1,2}\)/),
      type: 'standard',
      sort: 'datetime',
      series: [
        {
          color: '#8b5cf6',
          configId: -1,
          id: 0,
          label: '2025-04',
        },
        {
          color: '#ec4899',
          configId: -1,
          id: 1,
          label: '2025-05',
        },
        {
          color: '#14b8a6',
          configId: -1,
          id: 2,
          label: '2025-06',
        },
      ],
      labels: [
        {
          color: '#8b5cf6',
          configId: -1,
          id: 0,
          label: 'Series 1',
        },
        {
          color: '#ec4899',
          configId: -1,
          id: 1,
          label: 'Series 2',
        },
        {
          color: '#14b8a6',
          configId: -1,
          id: 2,
          label: 'Series 3',
        },
      ],
    },
    data: [
      {
        values: [1, 2, 3],
        mean: 2,
        median: 2,
        stddev: 0.816496580927726,
        min: 1,
        max: 3,
        id: 0,
        seriesId: 0,
        label: '2025-04',
      },
      {
        values: [4, 5, 6],
        mean: 5,
        median: 5,
        stddev: 0.816496580927726,
        min: 4,
        max: 6,
        id: 1,
        seriesId: 1,
        label: '2025-05',
      },
      {
        values: [7, 8, 9],
        mean: 8,
        median: 8,
        stddev: 0.816496580927726,
        min: 7,
        max: 9,
        id: 2,
        seriesId: 2,
        label: '2025-06',
      },
    ],
  });
});

test('transform raw labeled data rows (semver)', () => {
  const input = `
1.0.0 2 2 2
1.0.1 3 3 3
1.0.2 1 1 1
`;

  const output = transform(input, -1);

  expect(output).toEqual({
    config: {
      id: -1,
      title: expect.stringMatching(/New labeled data series \(\d{1,2}\/\d{1,2} \d{1,2}:\d{1,2}\)/),
      type: 'standard',
      sort: 'semver',
      series: [
        {
          color: '#8b5cf6',
          configId: -1,
          id: 0,
          label: '1.0.0',
        },
        {
          color: '#ec4899',
          configId: -1,
          id: 1,
          label: '1.0.1',
        },
        {
          color: '#14b8a6',
          configId: -1,
          id: 2,
          label: '1.0.2',
        },
      ],
      labels: [
        {
          color: '#8b5cf6',
          configId: -1,
          id: 0,
          label: 'Series 1',
        },
        {
          color: '#ec4899',
          configId: -1,
          id: 1,
          label: 'Series 2',
        },
        {
          color: '#14b8a6',
          configId: -1,
          id: 2,
          label: 'Series 3',
        },
      ],
    },
    data: [
      {
        values: [2, 2, 2],
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
        values: [3, 3, 3],
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
        values: [1, 1, 1],
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

test('transform raw labeled data rows (arbitrary)', () => {
  const input = `
A 1 2 3 4
B 4 5 6 7
C 7 8 9 10
`;

  const output = transform(input, -1);

  expect(output).toEqual({
    config: {
      id: -1,
      title: expect.stringMatching(/New labeled data series \(\d{1,2}\/\d{1,2} \d{1,2}:\d{1,2}\)/),
      type: 'standard',
      sort: undefined,
      series: [
        {
          color: '#8b5cf6',
          configId: -1,
          id: 0,
          label: 'A',
        },
        {
          color: '#ec4899',
          configId: -1,
          id: 1,
          label: 'B',
        },
        {
          color: '#14b8a6',
          configId: -1,
          id: 2,
          label: 'C',
        },
      ],
      labels: [
        {
          color: '#8b5cf6',
          configId: -1,
          id: 0,
          label: 'Series 1',
        },
        {
          color: '#ec4899',
          configId: -1,
          id: 1,
          label: 'Series 2',
        },
        {
          color: '#14b8a6',
          configId: -1,
          id: 2,
          label: 'Series 3',
        },
        {
          color: '#f97316',
          configId: -1,
          id: 3,
          label: 'Series 4',
        },
      ],
    },
    data: [
      {
        values: [1, 2, 3, 4],
        mean: 2.5,
        median: 3,
        stddev: 1.118033988749895,
        min: 1,
        max: 4,
        id: 0,
        seriesId: 0,
        label: 'A',
      },
      {
        values: [4, 5, 6, 7],
        mean: 5.5,
        median: 6,
        stddev: 1.118033988749895,
        min: 4,
        max: 7,
        id: 1,
        seriesId: 1,
        label: 'B',
      },
      {
        values: [7, 8, 9, 10],
        mean: 8.5,
        median: 9,
        stddev: 1.118033988749895,
        min: 7,
        max: 10,
        id: 2,
        seriesId: 2,
        label: 'C',
      },
    ],
  });
});
