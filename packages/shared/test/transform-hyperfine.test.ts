import { expect, test } from 'vitest';
import { transform } from '../src/adapters/index.ts';
import { readFile } from 'node:fs/promises';
import { C0, C1 } from '../src/colors.ts';

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
      rawUnit: 's',
      series: [
        {
          color: C0,
          command: 'sleep 0.22',
          configId: -1,
          id: 0,
          label: 'sleep 0.22',
        },
        {
          color: C1,
          command: 'sleep 0.23',
          configId: -1,
          id: 1,
          label: 'sleep 0.23',
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

test('truncates long commands in labels', () => {
  const input = JSON.stringify({
    results: [
      {
        command: 'node --max-old-space-size=4096 bench.js',
        mean: 1.5,
        stddev: 0.1,
        median: 1.5,
        user: 0.1,
        system: 0.1,
        min: 1.4,
        max: 1.6,
        times: [1.4, 1.5, 1.6],
        exit_codes: [0, 0, 0],
      },
    ],
  });

  const output = transform(input);
  expect(output.config!.series[0].label).toBe('node --max-…');
  expect(output.config!.series[0].command).toBe('node --max-old-space-size=4096 bench.js');
});

test('handles null times gracefully', async () => {
  const __filename = new URL('.', import.meta.url);
  const filePath = new URL('./fixtures/hyperfine-results-no-times.json', __filename);
  const input = await readFile(filePath, 'utf-8');

  const output = transform(input);

  expect(output.config!.series).toHaveLength(2);
  expect(output.config!.series[0].label).toBe('sleep 0.5');
  expect(output.data[0].median).toBe(0.51);
  expect(output.data[0].values).toEqual([]);
  expect(output.data[1].median).toBe(0.613);
});

test('multiple parameters combine in labels', async () => {
  const __filename = new URL('.', import.meta.url);
  const filePath = new URL('./fixtures/hyperfine-results-multi-param.json', __filename);
  const input = await readFile(filePath, 'utf-8');

  const output = transform(input);

  expect(output.config!.type).toBe('hyperfine-parameter');
  const hpConfig = output.config!;
  if (hpConfig.type !== 'hyperfine-parameter') throw new Error('expected hyperfine-parameter');
  expect(hpConfig.parameterNames).toEqual(['algo', 'size']);
  expect(output.config!.series).toHaveLength(4);
  expect(output.config!.series.map(s => s.label)).toEqual(['fast 1', 'fast 2', 'slow 1', 'slow 2']);
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
      rawUnit: 's',
      parameterNames: ['value'],
      command: 'echo {value}',
      series: [
        {
          color: C0,
          command: 'echo 0',
          parameters: { value: '0' },
          configId: -1,
          id: 0,
          label: '0',
        },
        {
          color: C1,
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
