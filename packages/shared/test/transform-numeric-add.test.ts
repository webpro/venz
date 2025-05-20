import { expect, test } from 'vitest';
import { transform } from '../src/adapters/index.ts';

test('transform and add numeric data (single)', () => {
  const input = JSON.stringify([1, 1, 1]);

  const { config, data } = transform(input, -1);

  const add = JSON.stringify([2, 2, 2]);

  const output = transform(add, -1, undefined, config, data);

  expect(output).toEqual({
    config: {
      id: -1,
      title: expect.stringMatching(/Raw data input \(\d{1,2}\/\d{1,2} \d{1,2}:\d{1,2}\)/),
      type: 'standard',
      series: [
        {
          color: '#8b5cf6',
          command: '',
          configId: -1,
          id: 0,
          label: 'Series 1',
        },
        {
          color: '#ec4899',
          command: '',
          configId: -1,
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
