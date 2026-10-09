import { expect, test } from 'vitest';
import { generateCommand, transform } from '../src/adapters/index.ts';
import { isHyperfineJSON } from '../src/adapters/hyperfine.ts';
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

test.each(['hyperfine-results-parameterized.json', 'hyperfine-results-v2-parameterized.json'])(
  'transform hyperfine json (parameterized): %s',
  async filename => {
    const __filename = new URL('.', import.meta.url);
    const filePath = new URL(`./fixtures/${filename}`, __filename);
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
  }
);

test.each(['time_wall_clock', 'memory_peak_resident'])(
  'transform hyperfine v2 wall-clock timings with primary metric %s',
  async primaryMetric => {
    const input = JSON.parse(await readFile(new URL('./fixtures/hyperfine-results-v2.json', import.meta.url), 'utf-8'));
    input.primary_metric = primaryMetric;

    const output = transform(JSON.stringify(input));

    expect(output.config).toEqual({
      id: -1,
      title: expect.stringMatching(/New hyperfine benchmark \(\d{1,2}\/\d{1,2} \d{1,2}:\d{1,2}\)/),
      type: 'hyperfine',
      rawUnit: 's',
      series: [
        { color: C0, command: 'sleep 0.22', configId: -1, id: 0, label: 'short nap' },
        { color: C1, command: 'sleep 0.23', configId: -1, id: 1, label: 'sleep 0.23' },
      ],
    });
    expect(output.data).toEqual([
      {
        values: [0.2, 0.22, 0.27],
        mean: 0.23,
        median: 0.22,
        stddev: 0.0360555127546399,
        min: 0.2,
        max: 0.27,
        id: 0,
        seriesId: 0,
      },
      { values: [0.23], mean: 0.23, median: 0.23, stddev: 0, min: 0.23, max: 0.23, id: 1, seriesId: 1 },
    ]);
    expect(generateCommand(output.config!)).toContain("'sleep 0.22'");
    expect(generateCommand(output.config!)).not.toContain('short nap');
  }
);

test('hyperfine v2 updates an existing v1 configuration', async () => {
  const v1 = await readFile(new URL('./fixtures/hyperfine-results.json', import.meta.url), 'utf-8');
  const v2 = await readFile(new URL('./fixtures/hyperfine-results-v2.json', import.meta.url), 'utf-8');
  const { config } = transform(v1, { configId: 7 });
  config!.series[0].id = 10;
  config!.series[1].id = 20;

  const output = transform(v2, { config });

  expect(output.config).toBe(config);
  expect(output.config!.series.map(s => s.label)).toEqual(['sleep 0.22', 'sleep 0.23']);
  expect(output.data).toEqual([
    {
      values: [0.2, 0.22, 0.27],
      mean: 0.23,
      median: 0.22,
      stddev: 0.0360555127546399,
      min: 0.2,
      max: 0.27,
      id: 10,
      seriesId: 10,
    },
    { values: [0.23], mean: 0.23, median: 0.23, stddev: 0, min: 0.23, max: 0.23, id: 20, seriesId: 20 },
  ]);
});

test('hyperfine v2 combines multiple parameter values in labels', async () => {
  const input = JSON.parse(
    await readFile(new URL('./fixtures/hyperfine-results-v2-parameterized.json', import.meta.url), 'utf-8')
  );
  input.results[0].command = 'bench fast 1';
  input.results[0].parameters = { algo: { value: 'fast' }, size: { value: '1' } };
  input.results[1].command = 'bench slow 2';
  input.results[1].parameters = { algo: { value: 'slow' }, size: { value: '2' } };

  const output = transform(input);

  expect(output.config).toMatchObject({
    type: 'hyperfine-parameter',
    parameterNames: ['algo', 'size'],
    command: 'bench {algo} {size}',
  });
  expect(output.config!.series.map(s => s.label)).toEqual(['fast 1', 'slow 2']);
  expect(output.config!.series.map(s => s.parameters)).toEqual([
    { algo: 'fast', size: '1' },
    { algo: 'slow', size: '2' },
  ]);
});

test.each([
  null,
  {},
  { schema_version: 2 },
  { schema_version: 2, results: [] },
  { schema_version: 2, results: [null] },
  { schema_version: 2, results: [{}] },
])('does not detect incomplete hyperfine v2 data: %j', input => {
  expect(isHyperfineJSON(input)).toBe(false);
});
