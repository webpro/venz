import { parseV1, type ParsedChart } from './v1.ts';

export type { ParsedChart };

/** Parses chart URL parameters, shared by the chart page and the image CDN */
export const parseChartParams = (params: URLSearchParams): ParsedChart => parseV1(params);
