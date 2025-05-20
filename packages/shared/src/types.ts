export const configTypes = ['standard', 'hyperfine-default', 'hyperfine-parameter', 'list'] as const;

export type ConfigType = (typeof configTypes)[number];

export interface BaseConfig {
  title: string;
  type: ConfigType;
  labelX?: string;
  labelY?: string;
}

export interface ConfigStandard extends BaseConfig {
  id: number;
  type: 'standard';
  series: Series[];
}

interface HyperfineConfigDefault extends BaseConfig {
  id: number;
  type: 'hyperfine-default';
  series: Series[];
}

interface HyperfineConfigParameter extends BaseConfig {
  id: number;
  type: 'hyperfine-parameter';
  parameterName: string;
  command: string;
  series: Series[];
}

export interface ConfigList extends BaseConfig {
  id: number;
  type: 'list';
  sort: 'default' | 'semver' | 'data' | 'datetime';
  command: string;
  prepare?: SimpleCommand[];
  build?: SimpleCommand[];
  series: Series[];
}

export type Configuration = HyperfineConfigDefault | HyperfineConfigParameter | ConfigList | ConfigStandard;

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
  parameters?: Record<string, string>;
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

type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];
