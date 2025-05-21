import { transform, type ConfigStandard, type Configuration, type InitialConfig, type SeriesData } from '@venz/shared';
import type { ChartType, LegendPosition, SearchParams } from '../types';
import { calculateStats } from '@venz/shared/src/adapters/standard';

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
  const { label, data, labelY: ly, labelX: lx, l, color } = searchParams;
  const labels = typeof label === 'string' ? [label] : Array.isArray(label) ? label : [];
  const values = typeof data === 'string' ? [data] : Array.isArray(data) ? data : [];
  const input = labels.length === values.length ? labels.map((label, i) => [label, values[i]].join(' ')) : values;

  const initialConfig: InitialConfig = {
    labelX: Array.isArray(lx) ? lx[0] : lx,
    labelY: Array.isArray(ly) ? ly[0] : ly,
    labels: typeof l === 'string' ? [l] : Array.isArray(l) ? l : [],
    colors: typeof color === 'string' ? [color] : Array.isArray(color) ? color : [],
  };

  const { config, data: seriesData } = transform(input.join('\n'), { initialConfig });

  const type = getChartType(searchParams.type);
  const legendPosition = getLegendPosition(searchParams.lp);
  const fullRange = getFullRange(searchParams.br);

  const series = (type === 'pivot' && config?.labels ? config.labels : config?.series) ?? [];
  const selectedSeries = series.map(label => label.id);

  return { type, legendPosition, fullRange, config, data: seriesData, series, selectedSeries };
}

export const transpose = (data: SeriesData[]) => {
  const result: SeriesData[] = [];
  for (let i = 0; i < data[0].values.length; i++) {
    result[i] = { id: i, seriesId: i, ...calculateStats(data.map(d => d.values[i])) };
  }
  return result;
};
