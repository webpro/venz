import type { ChartType, LegendPosition, PivotMode, Theme } from '../chart.ts';
import type { Configuration, RawUnit, SeriesData } from '../types.ts';

export const CHART_TYPES: ChartType[] = ['box', 'median', 'scatter', 'line', 'bar'];
export const THEMES: Theme[] = ['dark', 'light', 'high-contrast'];

/** A dimension of the data: the `data` rows, or the columns (the positions within each row) */
export type By = 'row' | 'col';

/** Contents of a chart URL, independent of the URL format version */
export type ChartSpec = {
  type: ChartType;
  /** Dimension that gets a line, bar or box per entry, each with a legend entry and color */
  by: By;
  /**
   * The other dimension holds samples: line and scatter charts plot them by sample number, box, median and bar charts
   * summarize them in one mark. Otherwise the x-axis shows the names of the other dimension.
   */
  samples: boolean;
  /** Names of the rows */
  rows: string[];
  /** Names of the columns */
  cols: string[];
  /** Values of each row, as written in the URL */
  data: string[];
  labelX?: string;
  labelY?: string;
  /** The y-axis starts at zero */
  zero: boolean;
  legend: LegendPosition;
  unit?: RawUnit;
  colors: string[];
  commands: string[];
  /** Chart page only: the chart without page header and controls */
  embed: boolean;
  theme?: Theme;
};

/** A chart URL, ready to render */
export type ParsedChart = {
  chartType: ChartType;
  pivotMode: PivotMode;
  legendPosition: LegendPosition;
  fullRange: boolean;
  config: Configuration | undefined;
  data: SeriesData[];
};

export const toPivotMode = (by: By, samples: boolean): PivotMode =>
  by === 'row' ? (samples ? 'none' : 'transposed') : samples ? 'transposed-pivoted' : 'pivoted';

export const fromPivotMode = (pivotMode: PivotMode): { by: By; samples: boolean } => ({
  by: pivotMode === 'none' || pivotMode === 'transposed' ? 'row' : 'col',
  samples: pivotMode === 'none' || pivotMode === 'transposed-pivoted',
});
