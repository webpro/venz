import { writeV2, type ChartSpec } from '@venz/shared/spec';
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

/** Query string of a URL, readable: only characters with a meaning in a query stay encoded */
export const prettyQuery = (params: URLSearchParams) =>
  decodeURIComponent(params.toString().replace(/%(23|25|26|2B|3D)/gi, '%25$1'));

/** Chart page URL with the chart and its data, capped in length (truncating the values) */
export function createShareableUrl(
  spec: ChartSpec,
  series: Series[],
  seriesX: Series[],
  data: SeriesData[]
): [number, URL] {
  const url = new URL('/', origin);

  const isGenerated = seriesX.every((s, i) => s.label === `Series ${i + 1}`);
  const params = writeV2({
    ...spec,
    rows: series.map(s => s.label),
    cols: isGenerated ? [] : seriesX.map(s => s.label),
    commands: series.flatMap(s => (typeof s.command === 'string' ? [s.command] : [])),
    data: [],
    embed: false,
    theme: undefined,
  });
  url.search = params.toString();

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
