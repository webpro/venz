import { expect, test } from 'vitest';
import { transform } from '../src/adapters/index.ts';

test('transform raw column data', () => {
  const input = `
a b c
- - -
1 2 3
1 2 3
`;

  const output = transform(input);

  expect(output).toEqual({
    config: {
      title: expect.stringMatching(/New labeled data series \(\d{1,2}\/\d{1,2} \d{1,2}:\d{1,2}\)/),
      type: 'standard',
      series: [
        {
          color: '#8b5cf6',
          id: 0,
          label: 'a',
        },
        {
          color: '#ec4899',
          id: 1,
          label: 'b',
        },
        {
          color: '#14b8a6',
          id: 2,
          label: 'c',
        },
      ],
    },
    data: [
      {
        values: [1, 1],
        mean: 1,
        median: 1,
        stddev: 0,
        min: 1,
        max: 1,
        id: 0,
        seriesId: 0,
      },
      {
        values: [2, 2],
        mean: 2,
        median: 2,
        stddev: 0,
        min: 2,
        max: 2,
        id: 1,
        seriesId: 1,
      },
      {
        values: [3, 3],
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
