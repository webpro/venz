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
import { download, type ImageFormat } from '../util/download';
import { createSignal, type Accessor, type Setter } from 'solid-js';
import type { ChartType, ImgBgPadding, LegendPosition, SortMode } from '../types';
import { Share } from './icons/Share';

type ChartControlsProps = {
  svgRef: SVGSVGElement;
  hasSeriesX: boolean;
  isTooManyValues: boolean;
  chartType: Accessor<ChartType>;
  setChartType: Setter<ChartType>;
  sortMode: Accessor<SortMode>;
  setSortMode: Setter<SortMode>;
  legendPosition: Accessor<LegendPosition>;
  setLegendPosition: Setter<LegendPosition>;
  fullRange: Accessor<boolean>;
  setFullRange: Setter<boolean>;
  onShare: () => void;
};

export const ChartControls = (props: ChartControlsProps) => {
  const [imgDownloadBgColor, setImgDownloadBgColor] = createSignal('none');
  const [imgDownloadPadding, setImgDownloadPadding] = createSignal<ImgBgPadding>(0);

  const downloadImg = (format: ImageFormat) => {
    download(props.svgRef, { format, backgroundColor: imgDownloadBgColor(), padding: imgDownloadPadding() });
  };

  return (
    <div class="flex justify-end gap-4">
      <Dropdown
        label="Chart type"
        value={props.chartType()}
        options={[
          { value: 'bar', icon: Bar, label: 'bar' },
          { value: 'median', icon: MedianChart, label: 'median' },
          { value: 'box', icon: BoxPlot, label: 'box plot' },
          { value: 'line', icon: Line, label: 'line', disabled: props.isTooManyValues },
          { value: 'scatter', icon: ScatterPlot, label: 'scatter', disabled: props.isTooManyValues },
          { value: 'pivot', icon: Pivot, label: 'pivot', disabled: !props.hasSeriesX },
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
          { value: 'svg', icon: Download, label: 'svg', onClick: () => downloadImg('svg') },
          { value: 'png', icon: Download, label: 'png', onClick: () => downloadImg('png') },
          { value: 'webp', icon: Download, label: 'webP', onClick: () => downloadImg('webp') },
          { value: 'avif', icon: Download, label: 'avif', onClick: () => downloadImg('avif') },
          { separator: true, value: '', label: '' },
          {
            value: 'bg-color',
            label: `bg (${imgDownloadBgColor()})`,
            icon: () => <div class={`w-full h-full`} style={`background-color: ${imgDownloadBgColor()}`} />,
            onClick: () => {
              const colors = ['none', '#000', '#fff'];
              const currentIndex = colors.indexOf(imgDownloadBgColor());
              const nextIndex = (currentIndex + 1) % colors.length;
              setImgDownloadBgColor(colors[nextIndex]);
            },
          },
          {
            value: 'padding',
            label: `padding: ${imgDownloadPadding()}`,
            onClick: () => setImgDownloadPadding(prev => (prev === 0 ? 12 : prev === 12 ? 24 : 0)),
          },
        ]}
      />

      <IconButton aria-label="Share URL" onClick={props.onShare} title="Copy URL to clipboard">
        <Share />
      </IconButton>
    </div>
  );
};
