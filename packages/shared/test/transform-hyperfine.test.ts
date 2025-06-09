import { expect, test } from 'vitest';
import { transform } from '../src/adapters/index.ts';
import { readFile } from 'node:fs/promises';

test('transform hyperfine json data', async () => {
  const __filename = new URL('.', import.meta.url);
  const filePath = new URL('./fixtures/hyperfine-results.json', __filename);
  const input = await readFile(filePath, 'utf-8');

  const output = transform(input);

  expect(output).toEqual({
    config: {
      id: -1,
      title: expect.stringMatching(/New hyperfine benchmark \(\d{1,2}\/\d{1,2} \d{1,2}:\d{1,2}\)/),
      type: 'hyperfine',
      series: [
        {
          color: '#8b5cf6',
          command: 'sleep 0.22',
          configId: -1,
          id: 0,
          label: 'Command 1',
        },
        {
          color: '#ec4899',
          command: 'sleep 0.23',
          configId: -1,
          id: 1,
          label: 'Command 2',
        },
      ],
    },
    data: [
      {
        values: [0.22, 0.22, 0.22],
        mean: 0.22,
        median: 0.22,
        stddev: 0,
        min: 0.22,
        max: 0.22,
        id: 0,
        seriesId: 0,
      },
      {
        values: [0.23, 0.23, 0.23],
        mean: 0.23,
        median: 0.23,
        stddev: 0,
        min: 0.23,
        max: 0.23,
        id: 1,
        seriesId: 1,
      },
    ],
  });
});

test('transform hyperfine json (parameterized)', async () => {
  const __filename = new URL('.', import.meta.url);
  const filePath = new URL('./fixtures/hyperfine-results-parameterized.json', __filename);
  const input = await readFile(filePath, 'utf-8');

  const output = transform(input);

  expect(output).toEqual({
    config: {
      id: -1,
      title: expect.stringMatching(/New hyperfine benchmark \(\d{1,2}\/\d{1,2} \d{1,2}:\d{1,2}\)/),
      type: 'hyperfine-parameter',
      parameterNames: ['value'],
      command: 'echo {value}',
      series: [
        {
          color: '#8b5cf6',
          command: 'echo 0',
          parameters: { value: '0' },
          configId: -1,
          id: 0,
          label: '0',
        },
        {
          color: '#ec4899',
          command: 'echo 1',
          parameters: { value: '1' },
          configId: -1,
          id: 1,
          label: '1',
        },
      ],
    },
    data: [
      {
        values: [0.22, 0.22, 0.22],
        mean: 0.22,
        median: 0.22,
        stddev: 0,
        min: 0.22,
        max: 0.22,
        id: 0,
        seriesId: 0,
      },
      {
        values: [0.23, 0.23, 0.23],
        mean: 0.23,
        median: 0.23,
        stddev: 0,
        min: 0.23,
        max: 0.23,
        id: 1,
        seriesId: 1,
      },
    ],
  });
});
