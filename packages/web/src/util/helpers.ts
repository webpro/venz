import type { Series, SeriesData } from '@venz/shared/types';
import type { SearchParams } from '../types';

const MAX_URL_LENGTH = 15_000;

export const generateNumbers = () => Array.from({ length: 10 }, () => Math.floor(Math.random() * 100) + 1);

export const origin = import.meta.env.DEV ? 'http://localhost:3000' : 'https://try.venz.dev';
export const cdnOrigin =
  import.meta.env.VITE_CDN_ORIGIN ?? (import.meta.env.DEV ? 'http://localhost:3001' : 'https://cdn.venz.dev');

/** Search params of @solidjs/router as URLSearchParams, with repeated keys as repeated entries again */
export const toURLSearchParams = (searchParams: SearchParams) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams))
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) params.append(key, item);
  return params;
};

export function createShareableUrl(
  searchParams: SearchParams,
  series: Series[],
  seriesX: Series[],
  data: SeriesData[]
): [number, URL] {
  const url = new URL('/', origin);

  if (typeof searchParams.type === 'string') url.searchParams.set('type', searchParams.type);
  if (typeof searchParams.lp === 'string') url.searchParams.set('lp', searchParams.lp);
  if (typeof searchParams.br === 'string') url.searchParams.set('br', searchParams.br);
  if (typeof searchParams.labelX === 'string') url.searchParams.set('labelX', searchParams.labelX);
  if (typeof searchParams.labelY === 'string') url.searchParams.set('labelY', searchParams.labelY);
  if (typeof searchParams.ct === 'string') url.searchParams.set('ct', searchParams.ct);
  if (searchParams.pivot === '1' || searchParams.pivot === '0') url.searchParams.set('pivot', searchParams.pivot);
  if (searchParams.transpose === '1') url.searchParams.set('transpose', '1');
  if (typeof searchParams.unit === 'string') url.searchParams.set('unit', searchParams.unit);

  for (const id of series) url.searchParams.append('label', id.label);
  for (const s of seriesX) url.searchParams.append('l', s.label);
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
