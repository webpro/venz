import { expect, test } from 'vitest';
import { transform } from '../src/adapters/index.ts';
import { matchRawTitle } from './helpers.ts';
import { C0, C1 } from '../src/colors.ts';

test('transform and add numeric data (single)', () => {
  const input = JSON.stringify([1, 1, 1]);

  const { config, data } = transform(input);

  const add = JSON.stringify([2, 2, 2]);

  const output = transform(add, { config, data });

  expect(output).toEqual({
    config: {
      title: matchRawTitle,
      type: 'standard',
      series: [
        {
          color: C0,
          command: '',
          id: 0,
          label: 'Series 1',
        },
        {
          color: C1,
          command: '',
          id: 1,
          label: 'Series 2',
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
    ],
  });
});
