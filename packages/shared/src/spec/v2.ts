import type { ChartType, LegendPosition, Theme } from '../chart.ts';
import { CHART_TYPES, THEMES, type By, type ChartSpec } from './types.ts';

const LEGEND: Record<string, LegendPosition> = { tr: 'tr', tl: 'tl', br: 'br', bl: 'bl', none: 'n' };

const BARE_HEX = /^[0-9a-fA-F]{3,8}$/;

/** Without `samples`, the other dimension holds samples when it has no names */
const getDefaultSamples = (by: By, rows: string[], cols: string[]) => (by === 'row' ? cols : rows).length === 0;

/** Reads v2 chart parameters. Invalid values fall back to the default, repeated single values use the first. */
export function readV2(params: URLSearchParams): ChartSpec {
  const get = (key: string) => params.get(key);

  const type = get('type');
  const by: By = get('by') === 'col' ? 'col' : 'row';
  const samples = get('samples');
  const rows = params.getAll('row');
  const cols = params.getAll('col');
  const legend = get('legend');
  const unit = get('unit');
  const theme = get('theme');

  return {
    type: CHART_TYPES.includes(type as ChartType) ? (type as ChartType) : 'median',
    by,
    samples: samples === '1' ? true : samples === '0' ? false : getDefaultSamples(by, rows, cols),
    rows,
    cols,
    data: params.getAll('data'),
    labelX: get('labelX') ?? undefined,
    labelY: get('labelY') ?? undefined,
    zero: get('zero') !== '0',
    legend: legend !== null && Object.hasOwn(LEGEND, legend) ? LEGEND[legend] : 'tr',
    unit: unit === 'ns' || unit === 's' ? unit : undefined,
    colors: params.getAll('color').map(color => (BARE_HEX.test(color) ? `#${color}` : color)),
    commands: params.getAll('command'),
    embed: get('embed') === '1',
    theme: THEMES.includes(theme as Theme) ? (theme as Theme) : undefined,
  };
}

/** Writes v2 chart parameters, without the ones that have their default value */
export function writeV2(spec: ChartSpec): URLSearchParams {
  const params = new URLSearchParams();

  if (spec.type !== 'median') params.set('type', spec.type);
  if (spec.by !== 'row') params.set('by', spec.by);
  if (spec.samples !== getDefaultSamples(spec.by, spec.rows, spec.cols))
    params.set('samples', spec.samples ? '1' : '0');
  if (spec.legend !== 'tr') params.set('legend', spec.legend === 'n' ? 'none' : spec.legend);
  if (!spec.zero) params.set('zero', '0');
  if (spec.unit) params.set('unit', spec.unit);
  if (spec.labelX !== undefined) params.set('labelX', spec.labelX);
  if (spec.labelY !== undefined) params.set('labelY', spec.labelY);
  if (spec.embed) params.set('embed', '1');
  if (spec.theme) params.set('theme', spec.theme);
  for (const color of spec.colors)
    params.append('color', color.startsWith('#') && BARE_HEX.test(color.slice(1)) ? color.slice(1) : color);
  for (const command of spec.commands) params.append('command', command);
  for (const row of spec.rows) params.append('row', row);
  for (const col of spec.cols) params.append('col', col);
  for (const values of spec.data) params.append('data', values);

  return params;
}
