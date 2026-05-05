import type {
  Configuration,
  IncomingSeries,
  JsonValue,
  MitataJSON,
  RawUnit,
  Series,
  SeriesData,
  Statistics,
} from '../types.ts';
import { getNextAvailableColor } from '../colors.ts';
import { calculateStats, formatTimestamp, transformLabeledData } from './standard.ts';
import type { Options } from './index.ts';

const MAX_SAMPLES = 100_000;

export function isMitataJSON(data: JsonValue): data is MitataJSON {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (!('benchmarks' in data) || !Array.isArray(data.benchmarks) || data.benchmarks.length === 0) return false;
  const b = data.benchmarks[0];
  if (!b || typeof b !== 'object' || Array.isArray(b)) return false;
  if (!('runs' in b) || !Array.isArray(b.runs) || b.runs.length === 0) return false;
  const run = b.runs[0];
  if (!run || typeof run !== 'object' || Array.isArray(run)) return false;
  if (!('stats' in run) || !run.stats || typeof run.stats !== 'object' || Array.isArray(run.stats)) return false;
  return 'samples' in run.stats && Array.isArray(run.stats.samples);
}

interface Results {
  series: IncomingSeries;
  data: Statistics;
}

function truncateSamples(samples: number[]): number[] {
  return samples.slice(0, MAX_SAMPLES);
}

function statsFromRun(stats: MitataJSON['benchmarks'][0]['runs'][0]['stats']): Statistics {
  const samples = truncateSamples(stats.samples);
  if (samples.length > 0) return calculateStats(samples);
  return {
    values: [stats.p50],
    mean: stats.avg,
    median: stats.p50,
    stddev: 0,
    min: stats.min,
    max: stats.max,
  };
}

function transformMitataWorkload(json: MitataJSON): Results[] {
  const isParameterized = json.benchmarks[0].kind === 'multi-args' && json.benchmarks[0].args;

  if (isParameterized) {
    return json.benchmarks[0].runs.map(run => ({
      series: { label: run.name, parameters: run.args },
      data: statsFromRun(run.stats),
    }));
  }

  return json.benchmarks.map(benchmark => ({
    series: { label: benchmark.alias ?? benchmark.runs[0].name },
    data: statsFromRun(benchmark.runs[0].stats),
  }));
}

export function transformMitataData(
  json: MitataJSON,
  configId: number,
  seriesId?: number,
  existingConfig?: Configuration
) {
  const timestamp = formatTimestamp();

  const firstStats = json.benchmarks[0].runs[0].stats;
  const size = firstStats.samples.length;
  const rawUnit: RawUnit =
    size > 0 ? (Number.isInteger(firstStats.samples[0]) ? 'ns' : 's') : Number.isInteger(firstStats.p50) ? 'ns' : 's';

  const results = transformMitataWorkload(json);
  const hasParameters = results.every(r => r.series.parameters && Object.keys(r.series.parameters).length > 0);
  const firstSeries = results[0].series;
  const parameters = firstSeries.parameters;
  const parameterNames = Object.keys(parameters ?? {});
  const commandTemplate =
    hasParameters && parameterNames && firstSeries.label
      ? `${firstSeries.label} ${parameterNames.map(p => `{${p}}`).join(' ')}`
      : undefined;

  if (existingConfig) {
    const data: SeriesData[] = [];

    for (let index = 0; index < results.length; index++) {
      const result = results[index];
      const id = existingConfig.series[index].id;
      data.push({ ...result.data, id, seriesId: id });
    }

    return { config: existingConfig, data };
  } else {
    const series: Series[] = [];
    const data: SeriesData[] = [];

    const baseConfig = {
      id: configId,
      series,
      title: `New mitata benchmark (${timestamp})`,
      rawUnit,
    };

    const config: Configuration =
      (existingConfig ?? hasParameters)
        ? { ...baseConfig, type: 'mitata-parameter', parameterNames, command: commandTemplate ?? '' }
        : { ...baseConfig, type: 'mitata' };

    for (const result of results) {
      const id = seriesId ?? series.length;
      const params = result.series.parameters;
      const label =
        hasParameters && params ? parameterNames.map(name => params[name]).join(' ') : (result.series.label ?? '');
      const command =
        hasParameters && params && commandTemplate
          ? parameterNames.reduce((acc, name) => acc.replace(`{${name}}`, params[name].toString()), commandTemplate)
          : (result.series.label ?? '');

      if (!hasParameters) delete result.series.parameters;

      series.push({ ...result.series, id, configId, label, command, color: getNextAvailableColor(series) });
      data.push({ ...result.data, id, seriesId: id });
    }

    const loss = (size - data[0].values.length) / size;

    return { config, data, loss };
  }
}

export function transformLabeledMitataData(runs: Array<{ label: string; json: MitataJSON }>, options: Options = {}) {
  const first = runs[0].json;
  const aliases = first.benchmarks.map(b => b.alias ?? b.runs[0].name);

  const firstStats = first.benchmarks[0].runs[0].stats;
  const rawUnit: RawUnit =
    firstStats.samples.length > 0
      ? Number.isInteger(firstStats.samples[0])
        ? 'ns'
        : 's'
      : Number.isInteger(firstStats.p50)
        ? 'ns'
        : 's';

  const labeledData: Array<[string, number[]]> = runs.map(({ label, json }) => {
    const values = aliases.map(name => {
      const benchmark = json.benchmarks.find(b => (b.alias ?? b.runs[0].name) === name);
      if (!benchmark) return 0;
      const s = benchmark.runs[0].stats;
      if (s.samples.length === 0) return s.p50;
      const sorted = s.samples.toSorted((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)];
    });
    return [label, values];
  });

  return transformLabeledData(labeledData, {
    ...options,
    initialConfig: {
      ...options.initialConfig,
      rawUnit,
      labels: aliases,
    },
  });
}
