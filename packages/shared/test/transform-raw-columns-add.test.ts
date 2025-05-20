import { expect, test } from 'vitest';
import { transform } from '../src/adapters/index.ts';

test('transform raw column data', () => {
  const input = `
a b c
- - -
1 2 3
1 2 3
`;

  const { config, data } = transform(input, -1);

  const add = `
a b c
- - -
3 4 5
3 4 5
`;

  const output = transform(add, -1, undefined, config, data);

  expect(output).toEqual({
    config: {
      id: -1,
      title: expect.stringMatching(/New labeled data series \(\d{1,2}\/\d{1,2} \d{1,2}:\d{1,2}\)/),
      type: 'standard',
      series: [
        {
          color: '#8b5cf6',
          configId: -1,
          id: 0,
          label: 'a',
        },
        {
          color: '#ec4899',
          configId: -1,
          id: 1,
          label: 'b',
        },
        {
          color: '#14b8a6',
          configId: -1,
          id: 2,
          label: 'c',
        },
      ],
    },
    data: [
      {
        values: [1, 1, 3, 3],
        mean: 2,
        median: 3,
        stddev: 1,
        min: 1,
        max: 3,
        id: 0,
        seriesId: 0,
      },
      {
        values: [2, 2, 4, 4],
        mean: 3,
        median: 4,
        stddev: 1,
        min: 2,
        max: 4,
        id: 1,
        seriesId: 1,
      },
      {
        values: [3, 3, 5, 5],
        mean: 4,
        median: 5,
        stddev: 1,
        min: 3,
        max: 5,
        id: 2,
        seriesId: 2,
      },
    ],
  });
});
