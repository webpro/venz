export type Theme = 'light' | 'dark' | 'high-contrast';
export type ChartType = 'box' | 'median' | 'scatter' | 'line' | 'bar';
export type LegendPosition = 'n' | 'tr' | 'br' | 'bl' | 'tl';
export type SortMode = 'original' | 'ascending' | 'descending';
export type PivotMode = 'none' | 'pivoted' | 'transposed' | 'transposed-pivoted';

type Param = string | string[] | null | undefined;

export function getPivotMode(type?: Param, p?: Param, t?: Param): PivotMode {
  const isPivoted = type === 'pivot' || p === '1';
  const isTransposed = t === '1';
  return isTransposed && isPivoted ? 'transposed-pivoted' : isPivoted ? 'pivoted' : isTransposed ? 'transposed' : 'none';
}
