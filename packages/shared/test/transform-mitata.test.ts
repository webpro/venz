import { expect, test } from 'vitest';
import { transform } from '../src/adapters/index.ts';
import { readFile } from 'node:fs/promises';

test('transform mitata json data', async () => {
  const __filename = new URL('.', import.meta.url);
  const filePath = new URL('./fixtures/mitata-results.json', __filename);
  const input = await readFile(filePath, 'utf-8');

  const output = transform(input);

  expect(output).toEqual({
    loss: 0,
    config: {
      id: -1,
      title: expect.stringMatching(/New mitata benchmark \(\d{1,2}\/\d{1,2} \d{1,2}:\d{1,2}\)/),
      type: 'mitata',
      labelY: 'median (s)',
      series: [
        {
          color: '#8b5cf6',
          command: 'sleep 2.1s',
          configId: -1,
          id: 0,
          label: 'Series 1',
        },
        {
          color: '#ec4899',
          command: 'sleep 2.2s',
          configId: -1,
          id: 1,
          label: 'Series 2',
        },
        {
          color: '#14b8a6',
          command: 'sleep 2.3s',
          configId: -1,
          id: 2,
          label: 'Series 3',
        },
      ],
    },
    data: [
      {
        values: [2.1, 2.1, 2.1],
        mean: 2.1,
        median: 2.1,
        stddev: 0,
        min: 2.1,
        max: 2.1,
        id: 0,
        seriesId: 0,
      },
      {
        values: [2.2, 2.2, 2.2],
        mean: 2.2,
        median: 2.2,
        stddev: 0,
        min: 2.2,
        max: 2.2,
        id: 1,
        seriesId: 1,
      },
      {
        values: [2.3, 2.3, 2.3],
        mean: 2.3,
        median: 2.3,
        stddev: 0,
        min: 2.3,
        max: 2.3,
        id: 2,
        seriesId: 2,
      },
    ],
  });
});

test('transform mitata json (parameterized)', async () => {
  const __filename = new URL('.', import.meta.url);
  const filePath = new URL('./fixtures/mitata-results-parameterized.json', __filename);
  const input = await readFile(filePath, 'utf-8');

  const output = transform(input);

  expect(output).toEqual({
    loss: 0,
    config: {
      id: -1,
      title: expect.stringMatching(/New mitata benchmark \(\d{1,2}\/\d{1,2} \d{1,2}:\d{1,2}\)/),
      type: 'mitata-parameter',
      labelY: 'median (ns)',
      parameterNames: ['len', 'len2'],
      command: 'look_mom_no_spaghetti {len} {len2}',
      series: [
        {
          color: '#8b5cf6',
          configId: -1,
          id: 0,
          label: '1 4',
          command: 'look_mom_no_spaghetti 1 4',
          parameters: { len: 1, len2: '4' },
        },
        {
          color: '#ec4899',
          configId: -1,
          id: 1,
          label: '2 4',
          command: 'look_mom_no_spaghetti 2 4',
          parameters: { len: 2, len2: '4' },
        },
        {
          color: '#14b8a6',
          configId: -1,
          id: 2,
          label: '3 4',
          command: 'look_mom_no_spaghetti 3 4',
          parameters: { len: 3, len2: '4' },
        },
        {
          color: '#f97316',
          command: 'look_mom_no_spaghetti 1 5',
          configId: -1,
          id: 3,
          label: '1 5',
          parameters: {
            len: 1,
            len2: '5',
          },
        },
        {
          color: '#06b6d4',
          command: 'look_mom_no_spaghetti 2 5',
          configId: -1,
          id: 4,
          label: '2 5',
          parameters: {
            len: 2,
            len2: '5',
          },
        },
        {
          color: '#84cc16',
          command: 'look_mom_no_spaghetti 3 5',
          configId: -1,
          id: 5,
          label: '3 5',
          parameters: {
            len: 3,
            len2: '5',
          },
        },
        {
          color: '#6366f1',
          command: 'look_mom_no_spaghetti 1 6',
          configId: -1,
          id: 6,
          label: '1 6',
          parameters: {
            len: 1,
            len2: '6',
          },
        },
        {
          color: '#f43f5e',
          command: 'look_mom_no_spaghetti 2 6',
          configId: -1,
          id: 7,
          label: '2 6',
          parameters: {
            len: 2,
            len2: '6',
          },
        },
        {
          color: '#10b981',
          command: 'look_mom_no_spaghetti 3 6',
          configId: -1,
          id: 8,
          label: '3 6',
          parameters: {
            len: 3,
            len2: '6',
          },
        },
      ],
    },
    data: [
      {
        values: [0.061, 0.061, 0.061],
        mean: 0.061,
        median: 0.061,
        stddev: 0,
        min: 0.061,
        max: 0.061,
        id: 0,
        seriesId: 0,
      },
      {
        values: [0.061, 0.061, 0.061],
        mean: 0.061,
        median: 0.061,
        stddev: 0,
        min: 0.061,
        max: 0.061,
        id: 1,
        seriesId: 1,
      },
      {
        values: [0.061, 0.061, 0.061],
        mean: 0.061,
        median: 0.061,
        stddev: 0,
        min: 0.061,
        max: 0.061,
        id: 2,
        seriesId: 2,
      },
      {
        values: [0.061, 0.061, 0.061],
        mean: 0.061,
        median: 0.061,
        stddev: 0,
        min: 0.061,
        max: 0.061,
        id: 3,
        seriesId: 3,
      },
      {
        values: [0.061, 0.061, 0.061],
        mean: 0.061,
        median: 0.061,
        stddev: 0,
        min: 0.061,
        max: 0.061,
        id: 4,
        seriesId: 4,
      },
      {
        values: [0.061, 0.061, 0.061],
        mean: 0.061,
        median: 0.061,
        stddev: 0,
        min: 0.061,
        max: 0.061,
        id: 5,
        seriesId: 5,
      },
      {
        values: [0.061, 0.061, 0.061],
        mean: 0.061,
        median: 0.061,
        stddev: 0,
        min: 0.061,
        max: 0.061,
        id: 6,
        seriesId: 6,
      },
      {
        values: [0.061, 0.061, 0.061],
        mean: 0.061,
        median: 0.061,
        stddev: 0,
        min: 0.061,
        max: 0.061,
        id: 7,
        seriesId: 7,
      },
      {
        values: [0.061, 0.061, 0.061],
        mean: 0.061,
        median: 0.061,
        stddev: 0,
        min: 0.061,
        max: 0.061,
        id: 8,
        seriesId: 8,
      },
    ],
  });
});
