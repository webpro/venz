export type SearchParams = {
  [x: string]: undefined | string | string[];
};

export type ChartType = 'box' | 'median' | 'scatter' | 'line' | 'pivot' | 'bar';

export type SortMode = 'original' | 'ascending' | 'descending';

export type LegendPosition = 'n' | 'tr' | 'br' | 'bl' | 'tl';

export type ImgBgPadding = 0 | 12 | 24;
