import { expect, test } from 'vitest';
import { transform } from '../src/adapters/index.ts';
import { readFile } from 'node:fs/promises';
import { C0, C1 } from '../src/colors.ts';

test('transform vitest bench json data', async () => {
  const __filename = new URL('.', import.meta.url);
  const filePath = new URL('./fixtures/vitest-bench-results.json', __filename);
  const input = await readFile(filePath, 'utf-8');

  const output = transform(input);

  expect(output.config!.type).toBe('vitest-bench');
  expect(output.config!.rawUnit).toBe('ns');
  expect(output.config!.title).toMatch(/New vitest benchmark/);
  expect(output.config!.series).toEqual([
    { color: C0, command: 'Array.sort', configId: -1, id: 0, label: 'Array.sort' },
    { color: C1, command: 'Array.toSorted', configId: -1, id: 1, label: 'Array.toSorted' },
  ]);

  expect(output.data[0]).toEqual(
    expect.objectContaining({
      values: [42000],
      mean: 44000,
      median: 42000,
      stddev: 5000,
      min: 35000,
      max: 68000,
    })
  );

  expect(output.data[1]).toEqual(
    expect.objectContaining({
      values: [48000],
      mean: 50000,
      median: 48000,
      stddev: 6000,
      min: 40000,
      max: 75000,
    })
  );
});

test('prefixes names when multiple groups', async () => {
  const __filename = new URL('.', import.meta.url);
  const filePath = new URL('./fixtures/vitest-bench-results-multi-group.json', __filename);
  const input = await readFile(filePath, 'utf-8');

  const output = transform(input);

  expect(output.config!.type).toBe('vitest-bench');
  expect(output.config!.series).toHaveLength(2);
  expect(output.config!.series[0].label).toBe('string ops > concat');
  expect(output.config!.series[1].label).toBe('array ops > concat');
});
