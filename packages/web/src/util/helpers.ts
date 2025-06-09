import { configTypes, transform, type InitialConfig, type Series, type SeriesData } from '@venz/shared';
import type { ChartType, LegendPosition, SearchParams } from '../types';
import { calculateStats, SEPARATOR } from '@venz/shared/src/adapters/standard';

const MAX_URL_LENGTH = 15_000;

export const generateNumbers = () => Array.from({ length: 10 }, () => Math.floor(Math.random() * 100) + 1);

export const origin = import.meta.env.DEV ? 'http://localhost:3000' : 'https://try.venz.dev';

const getChartType = (value?: string | string[]): ChartType =>
  typeof value === 'string' && ['box', 'median', 'scatter', 'line', 'pivot', 'bar'].includes(value)
    ? (value as ChartType)
    : 'median';

const getLegendPosition = (value?: string | string[]): LegendPosition =>
  typeof value === 'string' && ['tr', 'tl', 'br', 'bl', 'n'].includes(value) ? (value as LegendPosition) : 'tr';

const getFullRange = (value?: string | string[]): boolean =>
  typeof value === 'string' && value === '1' ? false : true;

export function transformFromSearchParams(searchParams: SearchParams) {
  const { label, data, labelY: ly, labelX: lx, l, color, command, ct } = searchParams;
  const labels = typeof label === 'string' ? [label] : Array.isArray(label) ? label : [];
  const values = typeof data === 'string' ? [data] : Array.isArray(data) ? data : [];
  const input =
    values.length === 1 && (values[0].startsWith('{') || values[0].startsWith('['))
      ? values[0]
      : labels.length === values.length
        ? labels.map((label, i) => [label, values[i].split(SEPARATOR).map(Number)])
        : values;

  const initialConfig: InitialConfig = {
    type: typeof ct === 'string' && configTypes.includes(ct) ? ct : 'standard',
    labelX: Array.isArray(lx) ? lx[0] : lx,
    labelY: Array.isArray(ly) ? ly[0] : ly,
    labels: typeof l === 'string' ? [l] : Array.isArray(l) ? l : [],
    colors: typeof color === 'string' ? [color] : Array.isArray(color) ? color : [],
    commands: typeof command === 'string' ? [command] : Array.isArray(command) ? command : [],
  };

  const { config, data: seriesData } = transform(input, { initialConfig });

  const type = getChartType(searchParams.type);
  const legendPosition = getLegendPosition(searchParams.lp);
  const fullRange = getFullRange(searchParams.br);

  const series: Series[] = (type === 'pivot' && config?.labels ? config.labels : config?.series) ?? [];
  const selectedSeries = series.map(label => label.id);

  return { type, legendPosition, fullRange, config, data: seriesData, series, selectedSeries };
}

export function createShareableUrl(searchParams: SearchParams, series: Series[], data: SeriesData[]): [number, URL] {
  const url = new URL('/', origin);

  if (typeof searchParams.type === 'string') url.searchParams.set('type', searchParams.type);
  if (typeof searchParams.lp === 'string') url.searchParams.set('lp', searchParams.lp);
  if (typeof searchParams.br === 'string') url.searchParams.set('br', searchParams.br);
  if (typeof searchParams.labelX === 'string') url.searchParams.set('labelX', searchParams.labelX);
  if (typeof searchParams.labelY === 'string') url.searchParams.set('labelY', searchParams.labelY);
  if (typeof searchParams.ct === 'string') url.searchParams.set('ct', searchParams.ct);

  for (const id of series) url.searchParams.append('label', id.label);
  for (const id of series) if (typeof id.command === 'string') url.searchParams.append('command', id.command);

  const remainingLength = MAX_URL_LENGTH - url.toString().length;
  const maxValuesLength = Math.floor(remainingLength / series.length);
  let loss = 0;
  for (const id of data) {
    const values = id.values.join('*');
    const truncated = values.slice(0, maxValuesLength);
    if (values.length !== truncated.length) {
      url.searchParams.append('data', truncated.slice(0, truncated.lastIndexOf('*')));
      loss += values.length - truncated.length;
    } else url.searchParams.append('data', truncated);
  }

  return [loss / (loss + remainingLength), url];
}

export const transpose = (data: SeriesData[]) => {
  const result: SeriesData[] = [];
  for (let i = 0; i < data[0].values.length; i++) {
    result[i] = { id: i, seriesId: i, ...calculateStats(data.map(d => d.values[i])) };
  }
  return result;
};
