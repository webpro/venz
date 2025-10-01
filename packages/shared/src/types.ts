export const configTypes = [
  'standard',
  'hyperfine',
  'hyperfine-parameter',
  'mitata',
  'mitata-parameter',
  'list',
] as const;

export type ConfigType = (typeof configTypes)[number];

export interface BaseConfig {
  title: string;
  type: ConfigType;
  labelX?: string;
  labelY?: string;
  series: Series[];
  seriesX?: Series[];
}

export interface ConfigStandard extends BaseConfig {
  id: number;
  type: 'standard';
  sort?: 'default' | 'semver' | 'data' | 'datetime';
}

interface HyperfineConfigDefault extends BaseConfig {
  id: number;
  type: 'hyperfine';
}

interface HyperfineConfigParameter extends BaseConfig {
  id: number;
  type: 'hyperfine-parameter';
  parameterNames: string[];
  command: string;
}

export interface ConfigMitataDefault extends BaseConfig {
  id: number;
  type: 'mitata';
}

export interface ConfigMitataParameter extends BaseConfig {
  id: number;
  type: 'mitata-parameter';
  parameterNames: string[];
  command?: string;
}

export interface ConfigList extends BaseConfig {
  id: number;
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
  | ConfigList
  | ConfigStandard;

export interface IncomingConfig extends BaseConfig {
  series: IncomingSeries[];
}

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
  configId: number;
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

export interface HyperfineResults extends JsonObject {
  command: string;
  mean: number;
  stddev: number;
  median: number;
  user: number;
  system: number;
  min: number;
  max: number;
  times: number[];
  exit_codes: number[];
  parameters?: Record<string, string>;
}

export interface HyperfineJSON extends JsonObject {
  results: HyperfineResults[];
}

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
  args?: {
    [key: string]: (string | number)[];
  };
}

export interface MitataJSON extends JsonObject {
  benchmarks: MitataBenchmark[];
}

type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];
