import { getPivotMode, type ChartType, type LegendPosition, type PivotMode, type Theme } from '../chart.ts';
import type { RawUnit } from '../types.ts';
import { CHART_TYPES, THEMES, fromPivotMode, type ChartSpec } from './types.ts';

const LEGEND_POSITIONS: LegendPosition[] = ['tr', 'tl', 'br', 'bl', 'n'];

/** Parameters of v1 that v2 does not use: any of them (or `type=pivot`) marks a URL as v1 */
export const V1_PARAMS = ['label', 'l', 'lx', 'ly', 'pivot', 'transpose', 'lp', 'br', 'ct', 'chrome'];

/**
 * Reads v1 chart parameters, the URL format links in the wild use. Frozen, since such links are out
 * there: keep every quirk, including the aliases the CDN accepted (`lx`, `ly`, `type=pivot`, hex colors without `#`).
 * Repeated single-value parameters use their first value. `ct` is not read: it never affected the chart.
 */
export function readV1(params: URLSearchParams): ChartSpec {
  const get = (key: string) => params.get(key);
  const getAll = (key: string) => params.getAll(key);

  const typeParam = get('type');
  const type: ChartType = CHART_TYPES.includes(typeParam as ChartType)
    ? (typeParam as ChartType)
    : typeParam === 'pivot'
      ? 'line'
      : 'median';
  const hasExplicitPivot = get('pivot') !== null || get('transpose') !== null;
  const pivotMode: PivotMode = hasExplicitPivot
    ? getPivotMode(get('pivot'), get('transpose'))
    : typeParam === 'pivot'
      ? 'pivoted'
      : type === 'line' || type === 'scatter'
        ? 'none'
        : 'pivoted';
  const lp = get('lp');
  const unit = get('unit');
  const theme = get('theme');

  return {
    type,
    ...fromPivotMode(pivotMode),
    rows: getAll('label'),
    cols: getAll('l'),
    data: getAll('data'),
    labelX: get('labelX') ?? get('lx') ?? undefined,
    labelY: get('labelY') ?? get('ly') ?? undefined,
    zero: get('br') !== '1',
    legend: LEGEND_POSITIONS.includes(lp as LegendPosition) ? (lp as LegendPosition) : 'tr',
    unit: unit === 'ns' || unit === 's' ? (unit as RawUnit) : undefined,
    colors: getAll('color').map(color => (/^[0-9a-fA-F]{3,8}$/.test(color) ? `#${color}` : color)),
    commands: getAll('command'),
    embed: get('chrome') === '0',
    theme: THEMES.includes(theme as Theme) ? (theme as Theme) : undefined,
  };
}
