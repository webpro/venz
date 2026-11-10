import { transform, SEPARATOR } from '../adapters/index.ts';
import { toPivotMode, type ChartSpec, type ParsedChart } from './types.ts';
import { readV1, V1_PARAMS } from './v1.ts';
import { readV2, writeV2 } from './v2.ts';

export type { By, ChartSpec, ParsedChart } from './types.ts';
export { fromPivotMode, toPivotMode } from './types.ts';
export { readV1, readV2, writeV2, V1_PARAMS };

/** URL format version of chart parameters: v1 if they include a v1-only parameter, otherwise v2 */
export const getVersion = (params: URLSearchParams): 1 | 2 =>
  V1_PARAMS.some(key => params.has(key)) || params.get('type') === 'pivot' ? 1 : 2;

export const readSpec = (params: URLSearchParams): ChartSpec =>
  getVersion(params) === 2 ? readV2(params) : readV1(params);

export function toChart(spec: ChartSpec): ParsedChart {
  const values = spec.data;
  const input =
    values.length === 1 && (values[0].startsWith('{') || values[0].startsWith('['))
      ? values[0]
      : spec.rows.length === values.length
        ? spec.rows.map((row, i): [string, number[]] => [row, values[i].split(SEPARATOR).map(Number)])
        : values;

  const { config, data } = transform(input, {
    initialConfig: {
      labelX: spec.labelX,
      labelY: spec.labelY,
      rawUnit: spec.unit,
      labels: spec.cols,
      colors: spec.colors,
      commands: spec.commands,
    },
  });

  return {
    chartType: spec.type,
    pivotMode: toPivotMode(spec.by, spec.samples),
    legendPosition: spec.legend,
    fullRange: spec.zero,
    config,
    data,
  };
}

/** Parses chart URL parameters of any version, shared by the chart page and the image CDN */
export const parseChartParams = (params: URLSearchParams): ParsedChart => toChart(readSpec(params));

const IMAGE_PARAMS = ['w', 'h', 'q', 'pad'];

/** The v2 equivalent of v1 chart or image URL parameters, rendering the same chart */
export function upgradeV1(params: URLSearchParams): URLSearchParams {
  const spec = readV1(params);
  // Without columns (unlabeled rows, tool output), the renderer swaps `by` and uses samples: write what it draws
  if (!spec.samples && !toChart(spec).config?.seriesX?.length) {
    spec.by = spec.by === 'row' ? 'col' : 'row';
    spec.samples = true;
  }
  const upgraded = writeV2(spec);
  for (const key of IMAGE_PARAMS) {
    const value = params.get(key);
    if (value !== null) upgraded.set(key, value);
  }
  return upgraded;
}
