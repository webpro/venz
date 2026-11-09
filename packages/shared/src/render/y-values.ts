import type { ChartType, PivotMode } from '../chart.ts';
import { transpose } from '../transpose.ts';
import type { SeriesData } from '../types.ts';

type Options = {
  data: SeriesData[];
  chartType: ChartType;
  pivotMode: PivotMode;
  selectedSeries: readonly number[];
  selectedSeriesX: readonly number[];
  /** Include lower bounds, for a y-axis that does not start at 0 */
  isBreak?: boolean;
};

/**
 * Values the y-axis needs to cover: only the series that are drawn. Pivoted charts draw the selected columns
 * (`selectedSeriesX`), other charts the selected rows (`selectedSeries`). Without any selection, all data counts.
 */
export const getYValues = ({ data, chartType, pivotMode, selectedSeries, selectedSeriesX, isBreak }: Options) => {
  const isColumns = pivotMode === 'pivoted' || pivotMode === 'transposed-pivoted';
  const all = isColumns ? transpose(data) : data;
  const selectedIds = isColumns ? selectedSeriesX : selectedSeries;
  const selected = all.filter(d => selectedIds.includes(d.seriesId));
  const series = selected.length > 0 ? selected : all;

  if (pivotMode !== 'none') return series.flatMap(d => d.values);
  if (chartType === 'median')
    return series.flatMap(s => (isBreak ? [s.median - s.stddev, s.median + s.stddev] : [s.median + s.stddev]));
  if (chartType === 'bar') return series.map(s => s.median);
  return series.flatMap(s => (isBreak ? [s.min, s.max] : [s.max]));
};
