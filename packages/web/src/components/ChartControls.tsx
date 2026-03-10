import { IconButton } from './Button';
import { Chart } from './icons/Chart';
import { Scatter } from './icons/Scatter';
import { Download } from './icons/Download';
import { BoxPlot } from './icons/BoxPlot';
import { MedianChart } from './icons/Median';
import { Transpose } from './icons/Pivot';
import { SwapAxis } from './icons/SwapAxis';
import { ScatterPlot } from './icons/ScatterPlot';
import { LegendBottomLeft, LegendBottomRight, LegendNone, LegendTopLeft, LegendTopRight } from './icons/Legend';
import { Line } from './icons/Line';
import { SortAsc } from './icons/SortAsc';
import { SortDesc } from './icons/SortDesc';
import { Dropdown } from './Dropdown';
import { Bar } from './icons/Bar';
import { download, type ImageFormat } from '../util/download';
import { createSignal, type Accessor, type Setter } from 'solid-js';
import type { ChartType, ImgBgPadding, LegendPosition, PivotMode, SortMode } from '../types';
import { Clipboard } from './icons/Clipboard';
import { Link } from './icons/Link';
import { cdnOrigin } from '../util/helpers';
import { useTheme } from '../stores/theme';

type ChartControlsProps = {
  svgRef: SVGSVGElement;
  hasSeriesX: boolean;
  isTooManyValues: boolean;
  chartType: Accessor<ChartType>;
  setChartType: Setter<ChartType>;
  pivotMode: Accessor<PivotMode>;
  setPivotMode: Setter<PivotMode>;
  sortMode: Accessor<SortMode>;
  setSortMode: Setter<SortMode>;
  legendPosition: Accessor<LegendPosition>;
  setLegendPosition: Setter<LegendPosition>;
  fullRange: Accessor<boolean>;
  setFullRange: Setter<boolean>;
  getShareableUrl: () => string;
  onShare: () => void;
};

const BG_COLORS = ['none', '#000', '#fff'];

export const ChartControls = (props: ChartControlsProps) => {
  const [imgDownloadBgColor, setImgDownloadBgColor] = createSignal('none');
  const [imgDownloadPadding, setImgDownloadPadding] = createSignal<ImgBgPadding>(0);

  const downloadImg = (format: ImageFormat) => {
    download(props.svgRef, { format, backgroundColor: imgDownloadBgColor(), padding: imgDownloadPadding() });
  };

  const { theme } = useTheme();

  const ogImageUrl = (ext: string) => `${cdnOrigin}/i/chart.${ext}?${props.getShareableUrl()}&theme=${theme()}`;

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
        ]}
        onChange={props.setChartType}
      />

      {props.hasSeriesX && (() => {
        const m = () => props.pivotMode();
        const isPivoted = () => m() === 'pivoted' || m() === 'transposed-pivoted';
        const isTransposed = () => m() === 'transposed' || m() === 'transposed-pivoted';
        const togglePivot = () =>
          props.setPivotMode(m => m === 'none' ? 'pivoted' : m === 'pivoted' ? 'none' : m === 'transposed' ? 'transposed-pivoted' : 'transposed');
        const toggleTranspose = () =>
          props.setPivotMode(m => m === 'none' ? 'transposed' : m === 'transposed' ? 'none' : m === 'pivoted' ? 'transposed-pivoted' : 'pivoted');
        return (
          <>
            <IconButton
              aria-label="Transpose"
              onClick={toggleTranspose}
              title="Transpose"
              className={isTransposed() ? 'bg-foreground! text-background!' : ''}
            >
              <SwapAxis />
            </IconButton>
            <IconButton
              aria-label="Pivot"
              onClick={togglePivot}
              title="Pivot"
              className={isPivoted() ? 'bg-foreground! text-background!' : ''}
            >
              <Transpose />
            </IconButton>
          </>
        );
      })()}

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

      <IconButton
        aria-label="Toggle chart break"
        onClick={() => props.setFullRange(prev => !prev)}
        className={props.fullRange() ? '' : 'bg-foreground! text-background!'}
      >
        {props.fullRange() ? <Chart /> : <Scatter />}
      </IconButton>

      <Dropdown
        label="Export & share"
        icon={<Download />}
        options={[
          { value: 'copy', label: 'copy chart url', icon: Clipboard, onClick: props.onShare },
          { separator: true, value: '', label: '' },
          { value: 'link-svg', label: 'open svg', icon: Link, href: ogImageUrl('svg') },
          { value: 'link-png', label: 'open png', icon: Link, href: ogImageUrl('png') },
          { value: 'link-webp', label: 'open webp', icon: Link, href: ogImageUrl('webp') },
          { value: 'link-avif', label: 'open avif', icon: Link, href: ogImageUrl('avif') },
          { separator: true, value: '', label: '' },
          { value: 'svg', icon: Download, label: 'download svg', onClick: () => downloadImg('svg') },
          { value: 'png', icon: Download, label: 'download png', onClick: () => downloadImg('png') },
          { value: 'webp', icon: Download, label: 'download webp', onClick: () => downloadImg('webp') },
          { separator: true, value: '', label: '' },
          {
            value: 'bg-color',
            label: `bg (${imgDownloadBgColor()})`,
            icon: () => <div class={`w-full h-full`} style={`background-color: ${imgDownloadBgColor()}`} />,
            onClick: () => {
              const currentIndex = BG_COLORS.indexOf(imgDownloadBgColor());
              setImgDownloadBgColor(BG_COLORS[(currentIndex + 1) % BG_COLORS.length]);
            },
          },
          {
            value: 'padding',
            label: `padding: ${imgDownloadPadding()}`,
            onClick: () => setImgDownloadPadding(prev => (prev === 0 ? 12 : prev === 12 ? 24 : 0)),
          },
        ]}
      />
    </div>
  );
};
