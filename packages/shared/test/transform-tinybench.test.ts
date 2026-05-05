import { expect, test } from 'vitest';
import { transform } from '../src/adapters/index.ts';
import { readFile } from 'node:fs/promises';
import { C0, C1, C2 } from '../src/colors.ts';

test('transform tinybench json data (no names)', async () => {
  const __filename = new URL('.', import.meta.url);
  const filePath = new URL('./fixtures/tinybench-results.json', __filename);
  const input = await readFile(filePath, 'utf-8');

  const output = transform(input);

  expect(output.config!.type).toBe('tinybench');
  expect(output.config!.rawUnit).toBe('ns');
  expect(output.config!.title).toMatch(/New tinybench benchmark \(\d{1,2}\/\d{1,2} \d{1,2}:\d{1,2}\)/);
  expect(output.config!.series).toEqual([
    { color: C0, command: '1', configId: -1, id: 0, label: '1' },
    { color: C1, command: '2', configId: -1, id: 1, label: '2' },
    { color: C2, command: '3', configId: -1, id: 2, label: '3' },
  ]);

  expect(output.data[0].values).toEqual([4100, 5000, 8200]);
  expect(output.data[0].min).toBe(4100);
  expect(output.data[0].max).toBe(8200);
  expect(output.data[0].median).toBe(5000);

  expect(output.data[1].values).toEqual([72000, 78000, 95000]);
  expect(output.data[2].values).toEqual([11000, 12500, 16500]);
});

test('transform tinybench json with empty samples (stats fallback)', async () => {
  const __filename = new URL('.', import.meta.url);
  const filePath = new URL('./fixtures/tinybench-results-no-samples.json', __filename);
  const input = await readFile(filePath, 'utf-8');

  const output = transform(input);

  expect(output.config!.type).toBe('tinybench');
  expect(output.config!.rawUnit).toBe('ns');
  expect(output.config!.series).toHaveLength(2);
  expect(output.config!.series[0].label).toBe('1');
  expect(output.config!.series[1].label).toBe('2');

  expect(output.data[0]).toEqual(
    expect.objectContaining({
      values: [3800],
      mean: 4000,
      median: 3800,
      stddev: 700,
      min: 3200,
      max: 5500,
    })
  );
});

test('uses name field when present', () => {
  const input = JSON.stringify([
    {
      name: 'my-bench',
      state: 'completed',
      totalTime: 100,
      period: 0.01,
      latency: {
        mean: 0.01,
        min: 0.008,
        max: 0.012,
        p50: 0.01,
        p75: 0.011,
        p99: 0.012,
        p995: 0.012,
        p999: 0.012,
        sd: 0.001,
        samplesCount: 3,
        samples: [0.008, 0.01, 0.012],
      },
      throughput: {
        mean: 100000,
        min: 83333,
        max: 125000,
        p50: 100000,
        p75: 112500,
        p99: 124000,
        p995: 124500,
        p999: 125000,
        sd: 20000,
        samplesCount: 3,
        samples: [83333, 100000, 125000],
      },
    },
  ]);

  const output = transform(input);
  expect(output.config!.series[0].label).toBe('my-bench');
});

test('filters out non-completed tasks', () => {
  const input = JSON.stringify([
    {
      state: 'completed',
      totalTime: 100,
      period: 0.01,
      latency: {
        mean: 0.01,
        min: 0.008,
        max: 0.012,
        p50: 0.01,
        p75: 0.011,
        p99: 0.012,
        p995: 0.012,
        p999: 0.012,
        sd: 0.001,
        samplesCount: 3,
        samples: [0.008, 0.01, 0.012],
      },
      throughput: {
        mean: 100000,
        min: 83333,
        max: 125000,
        p50: 100000,
        p75: 112500,
        p99: 124000,
        p995: 124500,
        p999: 125000,
        sd: 20000,
        samplesCount: 3,
        samples: [83333, 100000, 125000],
      },
    },
    {
      state: 'errored',
      error: {},
    },
  ]);

  const output = transform(input);
  expect(output.config!.series).toHaveLength(1);
  expect(output.config!.series[0].label).toBe('1');
});
