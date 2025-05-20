import { transform } from '@venz/shared';
import type { ChartType, LegendPosition, SearchParams } from '../types';

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
  const { label, data, labelY: ly, labelX: lx } = searchParams;
  const labels = typeof label === 'string' ? [label] : Array.isArray(label) ? label : [];
  const values = typeof data === 'string' ? [data] : Array.isArray(data) ? data : [];
  const str = labels.length === values.length ? labels.map((label, i) => [label, values[i]].join(' ')) : values;

  const { config, data: seriesData } = transform(str.join('\n'), -1);

  const type = getChartType(searchParams.type);
  const legendPosition = getLegendPosition(searchParams.lp);
  const fullRange = getFullRange(searchParams.br);

  const series = Array.from(config?.series ?? []);
  const selectedSeries = series?.map(series => series.id) ?? [];

  const labelX = Array.isArray(lx) ? lx[0] : lx;
  const labelY = Array.isArray(ly) ? ly[0] : ly;
  if (config) config.labelX = labelX;
  if (config) config.labelY = labelX;

  return { type, legendPosition, fullRange, config, data: seriesData, series, selectedSeries, labelX, labelY };
}
