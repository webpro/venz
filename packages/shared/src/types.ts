export const configTypes = [
  'standard',
  'hyperfine',
  'hyperfine-parameter',
  'mitata',
  'mitata-parameter',
  'tinybench',
  'vitest-bench',
  'list',
] as const;

export type ConfigType = (typeof configTypes)[number];

export type RawUnit = 'ns' | 's';

export interface BaseConfig<S extends BaseSeries = Series> {
  id?: number;
  title: string;
  type: ConfigType;
  sort?: 'default' | 'semver' | 'data' | 'datetime';
  labelX?: string;
  labelY?: string;
  rawUnit?: RawUnit;
  series: S[];
  seriesX?: Series[];
}

export interface ConfigStandard extends BaseConfig {
  type: 'standard';
}

interface HyperfineConfigDefault extends BaseConfig {
  type: 'hyperfine';
}

interface HyperfineConfigParameter extends BaseConfig {
  type: 'hyperfine-parameter';
  parameterNames: string[];
  command: string;
}

export interface ConfigMitataDefault extends BaseConfig {
  type: 'mitata';
}

export interface ConfigMitataParameter extends BaseConfig {
  type: 'mitata-parameter';
  parameterNames: string[];
  command?: string;
}

export interface ConfigTinybench extends BaseConfig {
  type: 'tinybench' | 'vitest-bench';
}

export interface ConfigList extends BaseConfig {
  type: 'list';
  sort: 'default' | 'semver' | 'data' | 'datetime';
  command?: string;
  prepare?: SimpleCommand[];
  build?: SimpleCommand[];
}

export type Configuration =
  | HyperfineConfigDefault
  | HyperfineConfigParameter
  | ConfigMitataDefault
  | ConfigMitataParameter
  | ConfigTinybench
  | ConfigList
  | ConfigStandard;

export interface IncomingConfig extends BaseConfig<IncomingSeries> {}

export interface BaseSeries {
  label?: string;
  command?: string;
  color?: string;
}

export interface IncomingSeriesDefault extends BaseSeries {}

export interface IncomingSeries extends BaseSeries {
  parameters?: Record<string, string | number>;
  prepare?: SimpleCommand[];
  meta?: { hash?: string };
}

export interface Series extends IncomingSeries {
  id: number;
  label: string;
  configId?: number;
  color: string;
}

export interface Statistics {
  values: number[];
  mean: number;
  median: number;
  stddev: number;
  min: number;
  max: number;
}

export interface SeriesData extends Statistics {
  id: number;
  seriesId: number;
  label?: string;
}

export interface SimpleCommand {
  command: string;
}

// https://github.com/sharkdp/hyperfine/blob/master/src/benchmark/benchmark_result.rs
// https://github.com/sharkdp/hyperfine/blob/master/src/export/json.rs
export interface HyperfineResults extends JsonObject {
  command: string;
  mean: number;
  stddev?: number;
  median: number;
  user: number;
  system: number;
  min: number;
  max: number;
  times?: number[];
  exit_codes: (number | null)[];
  parameters?: Record<string, string>;
}

export interface HyperfineJSON extends JsonObject {
  results: HyperfineResults[];
}

// https://github.com/evanwashere/mitata/blob/master/src/main.mjs
// https://github.com/evanwashere/mitata/blob/master/src/lib.mjs
interface MitataStats extends JsonObject {
  samples: number[];
  min: number;
  max: number;
  avg: number;
  p50: number;
  ticks: number;
}

interface MitataRun extends JsonObject {
  stats: MitataStats;
  name: string;
  args: Record<string, string | number>;
}

interface MitataBenchmark extends JsonObject {
  alias: string;
  runs: MitataRun[];
  kind?: 'static' | 'args' | 'multi-args';
  args?: {
    [key: string]: (string | number)[];
  };
}

export interface MitataJSON extends JsonObject {
  benchmarks: MitataBenchmark[];
}

// https://github.com/tinylibs/tinybench/blob/main/src/types.ts
interface TinybenchLatencyStats extends JsonObject {
  mean: number;
  min: number;
  max: number;
  p50: number;
  p75: number;
  p99: number;
  p995: number;
  p999: number;
  sd: number;
  samplesCount: number;
  samples?: number[];
}

export interface TinybenchTask extends JsonObject {
  name?: string;
  state: string;
  totalTime: number;
  latency: TinybenchLatencyStats;
  throughput: TinybenchLatencyStats;
}

export type TinybenchJSON = TinybenchTask[];

// https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/runtime/types/benchmark.ts
// https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/node/reporters/benchmark/json-formatter.ts
interface VitestBenchResult extends JsonObject {
  name: string;
  rank: number;
  sampleCount: number;
  median: number;
  totalTime: number;
  min: number;
  max: number;
  hz: number;
  period: number;
  samples: number[];
  mean: number;
  sd: number;
}

interface VitestBenchGroup extends JsonObject {
  fullName: string;
  benchmarks: VitestBenchResult[];
}

interface VitestBenchFile extends JsonObject {
  filepath: string;
  groups: VitestBenchGroup[];
}

export interface VitestBenchJSON extends JsonObject {
  files: VitestBenchFile[];
}

type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray | undefined;
export type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];
