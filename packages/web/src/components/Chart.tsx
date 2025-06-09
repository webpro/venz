import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { Button, ButtonLink } from './Button';
import { useNavigate, useParams, useSearchParams } from '@solidjs/router';
import { getStorageAdapter } from '../storage';
import { useToast } from '../stores/toast';
import { createStore } from 'solid-js/store';
import { useTheme } from '../stores/theme';
import { ChartSeries } from './ChartSeries';
import { DropZone } from './DropZone';
import { ChartControls } from './ChartControls';
import { handleDrop, handleGlobalPaste } from './handle-drop';
import { renderSVG } from './render-svg';
import { createShareableUrl, transformFromSearchParams } from '../util/helpers';
import type { ImgBgPadding, SortMode } from '../types';

export const storage = getStorageAdapter();

export const isGenericChart = (id: string | undefined) => !id || id === 'chart';

export default function Chart() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { theme } = useTheme();

  const fromUrl = transformFromSearchParams(searchParams);

  const [chartType, setChartType] = createSignal(fromUrl.type);
  const [config, setConfig] = createSignal(fromUrl.config);
  const [series, setSeries] = createStore(fromUrl.series);
  const [selectedSeries, setSelectedSeries] = createSignal(fromUrl.selectedSeries);
  const [data, setData] = createSignal(fromUrl.data);
  const [fullRange, setFullRange] = createSignal(fromUrl.fullRange);
  const [sortMode, setSortMode] = createSignal<SortMode>('original');
  const [legendPosition, setLegendPosition] = createSignal(fromUrl.legendPosition);
  const [imgDownloadBgColor, setImgDownloadBgColor] = createSignal('none');
  const [imgDownloadPadding, setImgDownloadPadding] = createSignal<ImgBgPadding>(0);

  createEffect(() => {
    if (!(!searchParams.type && chartType() === 'median')) setSearchParams({ type: chartType() });
    if (!(!searchParams.ct && config()?.type === 'standard')) setSearchParams({ ct: config()?.type });
    if (!(!searchParams.lp && legendPosition() === 'tr')) setSearchParams({ lp: legendPosition() });
    if (!(!searchParams.br && fullRange() === true)) setSearchParams({ br: fullRange() ? '0' : '1' });
  });

  createEffect(() => {
    if (config()?.type === 'standard') {
      if (chartType() === 'pivot') {
        setSeries(config()?.labels ?? config()?.series);
        setSelectedSeries((config()?.labels ?? config()?.series).map(series => series.id) ?? []);
      } else {
        setSeries(config()?.series ?? []);
        setSelectedSeries(config()?.series?.map(series => series.id) ?? []);
      }
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
      addToast,
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

  const handleShare = () => {
    const [loss, url] = createShareableUrl(searchParams, series, data());
    const relative = loss * 100;
    const prettyUrl = url.origin + '?' + decodeURIComponent(url.searchParams.toString());
    navigator.clipboard.writeText(prettyUrl);
    addToast(`URL copied to clipboard (${relative === 0 ? 'no' : `${relative.toFixed(2)}%`} data loss)`);
  };

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
        addToast,
      })}
    >
      <Show when={data().length === 0}>
        <DropZone config={config} />
      </Show>

      <svg ref={svgRef} class={`h-96 w-full ${data().length === 0 ? ' hidden' : ''}`} />

      <ChartControls
        svgRef={svgRef}
        hasLabels={data().length === 0 || config()?.labels}
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
        onShare={handleShare}
      />

      {series.length > 0 && (
        <ChartSeries
          data={data}
          series={series}
          setSeries={setSeries}
          selectedSeries={selectedSeries}
          setSelectedSeries={setSelectedSeries}
          type={config()?.type}
          chartType={chartType}
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
