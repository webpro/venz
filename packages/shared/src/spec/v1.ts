import { transform, SEPARATOR, type InitialConfig } from '../adapters/index.ts';
import { getPivotMode, type ChartType, type LegendPosition, type PivotMode } from '../chart.ts';
import { configTypes, type ConfigType, type Configuration, type RawUnit, type SeriesData } from '../types.ts';

const CHART_TYPES: ChartType[] = ['box', 'median', 'scatter', 'line', 'bar'];
const LEGEND_POSITIONS: LegendPosition[] = ['tr', 'tl', 'br', 'bl', 'n'];

const isConfigType = (value: string | null): value is ConfigType => configTypes.some(type => type === value);

export type ParsedChart = {
  chartType: ChartType;
  pivotMode: PivotMode;
  legendPosition: LegendPosition;
  fullRange: boolean;
  config: Configuration | undefined;
  data: SeriesData[];
};

/**
 * Parses v1 chart parameters, the URL format links in the wild use. Frozen, since such links are out
 * there: keep every quirk, including the aliases the CDN accepted (`lx`, `ly`, `type=pivot`, hex colors without `#`).
 * Repeated single-value parameters use their first value.
 */
export function parseV1(params: URLSearchParams): ParsedChart {
  const get = (key: string) => params.get(key);
  const getAll = (key: string) => params.getAll(key);

  const labels = getAll('label');
  const values = getAll('data');

  const input =
    values.length === 1 && (values[0].startsWith('{') || values[0].startsWith('['))
      ? values[0]
      : labels.length === values.length
        ? labels.map((label, i): [string, number[]] => [label, values[i].split(SEPARATOR).map(Number)])
        : values;

  const ct = get('ct');
  const unit = get('unit');
  const rawUnit: RawUnit | undefined = unit === 'ns' || unit === 's' ? unit : undefined;
  const initialConfig: InitialConfig = {
    type: isConfigType(ct) ? ct : 'standard',
    labelX: get('labelX') ?? get('lx') ?? undefined,
    labelY: get('labelY') ?? get('ly') ?? undefined,
    rawUnit,
    labels: getAll('l'),
    colors: getAll('color').map(color => (/^[0-9a-fA-F]{3,8}$/.test(color) ? `#${color}` : color)),
    commands: getAll('command'),
  };

  const { config, data } = transform(input, { initialConfig });

  const typeParam = get('type');
  const chartType: ChartType = CHART_TYPES.includes(typeParam as ChartType)
    ? (typeParam as ChartType)
    : typeParam === 'pivot'
      ? 'line'
      : 'median';
  const hasExplicitPivot = get('pivot') !== null || get('transpose') !== null;
  const pivotMode = hasExplicitPivot
    ? getPivotMode(get('pivot'), get('transpose'))
    : typeParam === 'pivot'
      ? 'pivoted'
      : chartType === 'line' || chartType === 'scatter'
        ? 'none'
        : 'pivoted';
  const lp = get('lp');
  const legendPosition: LegendPosition = LEGEND_POSITIONS.includes(lp as LegendPosition)
    ? (lp as LegendPosition)
    : 'tr';
  const fullRange = get('br') !== '1';

  return { chartType, pivotMode, legendPosition, fullRange, config, data };
}
