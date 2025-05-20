import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { Button, ButtonLink } from './Button';
import { useNavigate, useParams, useSearchParams } from '@solidjs/router';
import { getStorageAdapter } from '../storage';
import { type Series, type Configuration, type SeriesData } from '@venz/shared';
import { useToast } from '../stores/toast';
import { createStore } from 'solid-js/store';
import { useTheme } from '../stores/theme';
import { ChartSeries } from './ChartSeries';
import { DropZone } from './DropZone';
import { ChartControls } from './ChartControls';
import { handleDrop, handleGlobalPaste } from './handle-drop';
import { renderSVG } from './render';

export const storage = getStorageAdapter();

export type ChartType = 'box' | 'median' | 'scatter' | 'line' | 'bar';
const getChartType = (providedType?: string | string[]): ChartType =>
  typeof providedType === 'string' && ['box', 'median', 'scatter', 'line', 'bar'].includes(providedType)
    ? (providedType as ChartType)
    : 'median';

export type SortMode = 'original' | 'ascending' | 'descending';
export type LegendPosition = 'none' | 'topRight' | 'bottomRight' | 'bottomLeft' | 'topLeft';
export type ImgBgColor = string;
export type ImgBgPadding = 0 | 12 | 24;

export const isGenericChart = (id: string | undefined) => !id || id === 'chart';

export default function Commands() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { theme } = useTheme();

  const [config, setConfig] = createSignal<Configuration | undefined>();
  const [series, setSeries] = createStore<Series[]>(config()?.series ?? []);
  const [selectedSeries, setSelectedSeries] = createSignal<number[]>([]);
  const [data, setData] = createSignal<SeriesData[]>([]);
  const [fullRange, setFullRange] = createSignal(config()?.type !== 'list');
  const [chartType, setChartType] = createSignal<ChartType>(getChartType(searchParams.type));
  const [sortMode, setSortMode] = createSignal<SortMode>('original');
  const [legendPosition, setLegendPosition] = createSignal<LegendPosition>('topRight');
  const [imgDownloadBgColor, setImgDownloadBgColor] = createSignal('none');
  const [imgDownloadPadding, setImgDownloadPadding] = createSignal<ImgBgPadding>(0);

  createEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chartParam = params.get('type');
    if (chartParam && ['box', 'median', 'scatter', 'line'].includes(chartParam)) {
      setChartType(chartParam as 'box' | 'median' | 'scatter' | 'line');
    }
  });

  const handleSaveAsNewConfiguration = async () => {
    const { id } = await storage.saveConfig(config());
    if (id) {
      await storage.saveSeriesData(id, data());
      addToast('New configuration saved');
      navigate(`/chart/${id}`, { state: { type: config()?.type } });
    }
  };

  const showDropZone = () => isGenericChart(params.id) && data().length === 0;

  let svgRef!: SVGSVGElement;

  createEffect(() => {
    if (isGenericChart(params.id)) return;

    (async () => {
      const data = await storage.getSeriesData(Number(params.id));
      const config = await storage.getConfig(Number(params.id));
      const series = config?.series ?? [];
      setConfig(config);
      setSeries(series);
      setSelectedSeries(series.map(w => w.id));
      setData(data);
    })();
  });

  createEffect(() => {
    const handler = handleGlobalPaste({
      chartId: params.id,
      config,
      setConfig,
      setSeries,
      selectedSeries,
      setSelectedSeries,
      data,
      setData,
    });

    document.addEventListener('paste', handler);
    onCleanup(() => document.removeEventListener('paste', handler));
  });

  createEffect(() => {
    renderSVG({
      svgRef,
      config,
      data,
      series,
      chartType,
      selectedSeries,
      legendPosition,
      sortMode,
      fullRange,
      theme,
    });
  });

  return (
    <div
      class="flex flex-col gap-8 max-w-[960px] m-auto"
      onDragOver={event => {
        event.preventDefault();
      }}
      onDrop={handleDrop({
        chartId: params.id,
        config,
        setConfig,
        setSeries,
        selectedSeries,
        setSelectedSeries,
        data,
        setData,
      })}
    >
      <Show when={showDropZone()}>
        <DropZone />
      </Show>

      <svg ref={svgRef} class={`h-96 w-full ${showDropZone() ? ' hidden' : ''}`} />

      <ChartControls
        svgRef={svgRef}
        configType={config()?.type}
        chartType={chartType}
        setChartType={setChartType}
        sortMode={sortMode}
        setSortMode={setSortMode}
        legendPosition={legendPosition}
        setLegendPosition={setLegendPosition}
        fullRange={fullRange}
        setFullRange={setFullRange}
        imgDownloadBgColor={imgDownloadBgColor}
        setImgDownloadBgColor={setImgDownloadBgColor}
        imgDownloadPadding={imgDownloadPadding}
        setImgDownloadPadding={setImgDownloadPadding}
      />

      {series.length > 0 && (
        <ChartSeries
          data={data}
          series={series}
          setSeries={setSeries}
          selectedSeries={selectedSeries}
          setSelectedSeries={setSelectedSeries}
          type={config()?.type}
        />
      )}

      {isGenericChart(params.id) && series.length > 0 ? (
        <div class="self-end flex flex-col gap-2">
          <Button onClick={handleSaveAsNewConfiguration}>Save as new configuration with data ↻</Button>
          <p class="text-xs text-right italic high-contrast:text-base">To edit title, axis labels and more</p>
        </div>
      ) : (
        !isGenericChart(params.id) && (
          <ButtonLink href={config()?.id ? `/config/${config()?.id}` : '/config'} class="self-end">
            ← To configuration
          </ButtonLink>
        )
      )}
    </div>
  );
}
