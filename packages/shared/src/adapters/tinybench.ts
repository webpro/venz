import type {
  Configuration,
  JsonValue,
  Series,
  SeriesData,
  Statistics,
  TinybenchJSON,
  VitestBenchJSON,
} from '../types.ts';
import { getNextAvailableColor } from '../colors.ts';
import { calculateStats, formatTimestamp } from './standard.ts';

const MAX_SAMPLES = 100_000;
const MS_TO_NS = 1e6;

interface MsStats {
  mean: number;
  median: number;
  sd: number;
  min: number;
  max: number;
  samples?: number[];
}

function msToNsStats(stats: MsStats): Statistics {
  const raw = stats.samples;
  if (raw && raw.length > 0) {
    const samples = raw.length > MAX_SAMPLES ? raw.slice(0, MAX_SAMPLES) : raw;
    // eslint-disable-next-line unicorn/no-new-array
    const nsValues = new Array<number>(samples.length);
    for (let i = 0; i < samples.length; i++) nsValues[i] = Math.round(samples[i] * MS_TO_NS);
    return calculateStats(nsValues);
  }
  const median = Math.round(stats.median * MS_TO_NS);
  return {
    values: [median],
    mean: Math.round(stats.mean * MS_TO_NS),
    median,
    stddev: Math.round(stats.sd * MS_TO_NS),
    min: Math.round(stats.min * MS_TO_NS),
    max: Math.round(stats.max * MS_TO_NS),
  };
}

// --- tinybench v6 (raw bench.results) ---

export function isTinybenchJSON(data: JsonValue): data is TinybenchJSON {
  return Boolean(
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === 'object' &&
    data[0] &&
    'latency' in data[0] &&
    typeof data[0].latency === 'object' &&
    data[0].latency &&
    'mean' in data[0].latency
  );
}

export function transformTinybenchData(
  json: TinybenchJSON,
  configId: number,
  seriesId?: number,
  existingConfig?: Configuration
) {
  const tasks = json.filter(t => t.state === 'completed' || t.state === 'aborted-with-statistics');

  if (existingConfig) {
    const data: SeriesData[] = [];
    for (let i = 0; i < tasks.length; i++) {
      const id = existingConfig.series[i].id;
      data.push({ ...msToNsStats({ ...tasks[i].latency, median: tasks[i].latency.p50 }), id, seriesId: id });
    }
    return { config: existingConfig, data };
  }

  const timestamp = formatTimestamp();
  const series: Series[] = [];
  const data: SeriesData[] = [];

  const firstSamples = tasks[0].latency.samples;
  const size = firstSamples?.length ?? 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const id = seriesId ?? series.length;
    const label = task.name ?? `${i + 1}`;
    series.push({ id, configId, label, command: label, color: getNextAvailableColor(series) });
    data.push({ ...msToNsStats({ ...task.latency, median: task.latency.p50 }), id, seriesId: id });
  }

  const config: Configuration = {
    id: configId,
    series,
    title: `New tinybench benchmark (${timestamp})`,
    type: 'tinybench',
    rawUnit: 'ns',
  };

  const loss = size > 0 ? (size - data[0].values.length) / size : 0;

  return { config, data, loss };
}

// --- vitest bench (vitest bench --outputJson) ---

export function isVitestBenchJSON(data: JsonValue): data is VitestBenchJSON {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (!('files' in data) || !Array.isArray(data.files) || data.files.length === 0) return false;
  const file = data.files[0];
  if (!file || typeof file !== 'object' || Array.isArray(file)) return false;
  if (!('groups' in file) || !Array.isArray(file.groups) || file.groups.length === 0) return false;
  const group = file.groups[0];
  if (!group || typeof group !== 'object' || Array.isArray(group)) return false;
  if (!('benchmarks' in group) || !Array.isArray(group.benchmarks) || group.benchmarks.length === 0) return false;
  const bench = group.benchmarks[0];
  return bench !== null && typeof bench === 'object' && !Array.isArray(bench) && 'mean' in bench;
}

export function transformVitestBenchData(
  json: VitestBenchJSON,
  configId: number,
  seriesId?: number,
  existingConfig?: Configuration
) {
  const groups = json.files.flatMap(f => f.groups);
  const multiGroup = groups.length > 1;
  const benchmarks = groups.flatMap(g =>
    g.benchmarks.map(b => ({ ...b, name: multiGroup ? `${g.fullName} > ${b.name}` : b.name }))
  );

  if (existingConfig) {
    const data: SeriesData[] = [];
    for (let i = 0; i < benchmarks.length; i++) {
      const id = existingConfig.series[i].id;
      data.push({ ...msToNsStats(benchmarks[i]), id, seriesId: id });
    }
    return { config: existingConfig, data };
  }

  const timestamp = formatTimestamp();
  const series: Series[] = [];
  const data: SeriesData[] = [];

  for (const bench of benchmarks) {
    const id = seriesId ?? series.length;
    series.push({ id, configId, label: bench.name, command: bench.name, color: getNextAvailableColor(series) });
    data.push({ ...msToNsStats(bench), id, seriesId: id });
  }

  const config: Configuration = {
    id: configId,
    series,
    title: `New vitest benchmark (${timestamp})`,
    type: 'vitest-bench',
    rawUnit: 'ns',
  };

  return { config, data };
}
