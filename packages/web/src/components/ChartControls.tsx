import { IconButton } from './Button';
import { Chart } from './icons/Chart';
import { Scatter } from './icons/Scatter';
import { Download } from './icons/Download';
import { BoxPlot } from './icons/BoxPlot';
import { MedianChart } from './icons/Median';
import { Pivot } from './icons/Pivot';
import { ScatterPlot } from './icons/ScatterPlot';
import { LegendBottomLeft, LegendBottomRight, LegendNone, LegendTopLeft, LegendTopRight } from './icons/Legend';
import { Line } from './icons/Line';
import { SortAsc } from './icons/SortAsc';
import { SortDesc } from './icons/SortDesc';
import { Dropdown } from './Dropdown';
import { Bar } from './icons/Bar';
import { download } from '../util/download';
import type { Accessor, Setter } from 'solid-js';
import type { ChartType, ImgBgPadding, LegendPosition, SortMode } from '../types';

type ChartControlsProps = {
  svgRef: SVGSVGElement;
  hasLabels: boolean;
  chartType: Accessor<ChartType>;
  setChartType: Setter<ChartType>;
  sortMode: Accessor<SortMode>;
  setSortMode: Setter<SortMode>;
  legendPosition: Accessor<LegendPosition>;
  setLegendPosition: Setter<LegendPosition>;
  fullRange: Accessor<boolean>;
  setFullRange: Setter<boolean>;
  imgDownloadBgColor: Accessor<string>;
  setImgDownloadBgColor: Setter<string>;
  imgDownloadPadding: Accessor<ImgBgPadding>;
  setImgDownloadPadding: Setter<ImgBgPadding>;
};

export const ChartControls = (props: ChartControlsProps) => {
  return (
    <div class="flex justify-end gap-4">
      <Dropdown
        label="Chart type"
        value={props.chartType()}
        options={[
          { value: 'bar', icon: Bar, label: 'bar' },
          { value: 'median', icon: MedianChart, label: 'median' },
          { value: 'line', icon: Line, label: 'line' },
          { value: 'pivot', icon: Pivot, label: 'pivot', disabled: !props.hasLabels },
          { value: 'box', icon: BoxPlot, label: 'box plot' },
          { value: 'scatter', icon: ScatterPlot, label: 'scatter' },
        ]}
        onChange={props.setChartType}
      />

      <Dropdown
        label="Sort mode"
        value={props.sortMode()}
        options={[
          { value: 'original', icon: Line, label: 'original' },
          { value: 'ascending', icon: SortAsc, label: 'ascending' },
          { value: 'descending', icon: SortDesc, label: 'descending' },
        ]}
        onChange={props.setSortMode}
      />

      <Dropdown
        label="Legend position"
        value={props.legendPosition()}
        options={[
          { value: 'n', icon: LegendNone, label: 'legend' },
          { value: 'tl', icon: LegendTopLeft, label: '' },
          { value: 'tr', icon: LegendTopRight, label: '' },
          { value: 'bl', icon: LegendBottomLeft, label: '' },
          { value: 'br', icon: LegendBottomRight, label: '' },
        ]}
        onChange={props.setLegendPosition}
      />

      <IconButton aria-label="Toggle chart break" onClick={() => props.setFullRange(prev => !prev)}>
        {props.fullRange() ? <Chart /> : <Scatter />}
      </IconButton>

      <Dropdown
        label="Download image"
        icon={<Download />}
        options={[
          { value: 'svg', icon: Download, label: 'svg', onClick: () => download(props.svgRef, { format: 'svg' }) },
          { value: 'png', icon: Download, label: 'png', onClick: () => download(props.svgRef, { format: 'png' }) },
          {
            value: 'webp',
            icon: Download,
            label: 'webP',
            onClick: () => download(props.svgRef, { format: 'webp' }),
          },
          {
            value: 'avif',
            icon: Download,
            label: 'avif',
            onClick: () => download(props.svgRef, { format: 'avif' }),
          },
          { separator: true, value: '', label: '' },
          {
            value: 'bg-color',
            label: `bg (${props.imgDownloadBgColor()})`,
            icon: () => <div class={`w-full h-full`} style={`background-color: ${props.imgDownloadBgColor()}`} />,
            onClick: () => {
              const colors = ['none', '#000', '#fff'];
              const currentIndex = colors.indexOf(props.imgDownloadBgColor());
              const nextIndex = (currentIndex + 1) % colors.length;
              props.setImgDownloadBgColor(colors[nextIndex]);
            },
          },
          {
            value: 'padding',
            label: `padding: ${props.imgDownloadPadding()}`,
            onClick: () => props.setImgDownloadPadding(prev => (prev === 0 ? 12 : prev === 12 ? 24 : 0)),
          },
        ]}
      />
    </div>
  );
};
