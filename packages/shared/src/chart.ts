export type Theme = 'light' | 'dark' | 'high-contrast';
export type ChartType = 'box' | 'median' | 'scatter' | 'line' | 'bar';
export type LegendPosition = 'n' | 'tr' | 'br' | 'bl' | 'tl';
export type SortMode = 'original' | 'ascending' | 'descending';
export type PivotMode = 'none' | 'pivoted' | 'transposed' | 'transposed-pivoted';

type Param = string | string[] | null | undefined;

export function getPivotMode(pivot?: Param, transpose?: Param): PivotMode {
  const isPivoted = pivot === '1';
  const isTransposed = transpose === '1';
  return isTransposed && isPivoted ? 'transposed' : isPivoted ? 'pivoted' : isTransposed ? 'transposed-pivoted' : 'none';
}
