import { expect, test } from 'vitest';
import { transform } from '../src/adapters/index.ts';
import { matchLabeledTitle } from './helpers.ts';
import { C0, C1, C2 } from '../src/colors.ts';

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
      title: matchLabeledTitle,
      type: 'standard',
      series: [
        {
          color: C0,
          id: 0,
          label: 'a',
        },
        {
          color: C1,
          id: 1,
          label: 'b',
        },
        {
          color: C2,
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
