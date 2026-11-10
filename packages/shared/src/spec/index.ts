import { transform, SEPARATOR } from '../adapters/index.ts';
import { COLORS } from '../colors.ts';
import type { Configuration, SeriesData } from '../types.ts';
import { toPivotMode, type ChartSpec, type ParsedChart } from './types.ts';
import { readV1, V1_PARAMS } from './v1.ts';
import { readV2, writeV2 } from './v2.ts';

export type { By, ChartSpec, ParsedChart } from './types.ts';
export { fromPivotMode, toPivotMode } from './types.ts';
export { readV1, readV2, writeV2, V1_PARAMS };

type Version = 1 | 2;

/** URL format version of chart parameters: v1 if they include a v1-only parameter, otherwise v2 */
export const getVersion = (params: URLSearchParams): Version =>
  V1_PARAMS.some(key => params.has(key)) || params.get('type') === 'pivot' ? 1 : 2;

export const readSpec = (params: URLSearchParams): ChartSpec =>
  getVersion(params) === 2 ? readV2(params) : readV1(params);

/**
 * The adapters apply `labelX`, `labelY`, `unit`, `color`, `command` and `col` to labeled rows only, which are also the
 * only data with columns. v2 applies them to any data, and gives any data columns (one per value of the first row).
 */
function applyToAnyData(spec: ChartSpec, config: Configuration, data: SeriesData[]): Configuration {
  const series = config.series.map((s, i) => ({
    ...s,
    color: spec.colors[i] ?? s.color,
    command: spec.commands[i] ?? s.command,
  }));
  const seriesX = config.seriesX?.length
    ? config.seriesX.map((s, i) => ({ ...s, label: spec.cols[i] ?? s.label, color: spec.colors[i] ?? s.color }))
    : Array.from({ length: data[0]?.values.length ?? 0 }, (_, i) => ({
        id: i,
        configId: config.id,
        label: spec.cols[i] ?? `Series ${i + 1}`,
        color: spec.colors[i] ?? COLORS[i % COLORS.length],
      }));
  return {
    ...config,
    labelX: spec.labelX ?? config.labelX,
    labelY: spec.labelY ?? config.labelY,
    rawUnit: spec.unit ?? config.rawUnit,
    series,
    seriesX,
  };
}

export function toChart(spec: ChartSpec, version: Version = 2): ParsedChart {
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
    config: version === 2 && config ? applyToAnyData(spec, config, data) : config,
    data,
  };
}

/** Parses chart URL parameters of any version, shared by the chart page and the image CDN */
export const parseChartParams = (params: URLSearchParams): ParsedChart => toChart(readSpec(params), getVersion(params));

const IMAGE_PARAMS = ['w', 'h', 'q', 'pad'];

/** The v2 equivalent of v1 chart or image URL parameters, rendering the same chart */
export function upgradeV1(params: URLSearchParams): URLSearchParams {
  const spec = readV1(params);
  // Without data (saved charts on the chart page), there is nothing to compare with
  if (spec.data.length > 0 && !toChart(spec, 1).config?.seriesX) {
    // v1 has no columns here (unlabeled rows, tool output): it ignores these parameters, and draws `by` swapped
    // with samples where it would need columns
    Object.assign(spec, { labelX: undefined, labelY: undefined, unit: undefined, colors: [], commands: [], cols: [] });
    if (!spec.samples) Object.assign(spec, { by: spec.by === 'row' ? 'col' : 'row', samples: true });
  }
  const upgraded = writeV2(spec);
  for (const key of IMAGE_PARAMS) {
    const value = params.get(key);
    if (value !== null) upgraded.set(key, value);
  }
  return upgraded;
}
