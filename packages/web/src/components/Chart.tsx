import { createEffect, createResource, createSignal, onCleanup, Show } from 'solid-js';
import { useNavigate, useParams, useSearchParams } from '@solidjs/router';
import { renderSVG } from '@venz/shared/render';
import { Button, ButtonLink } from './Button';
import { storage } from '../storage';
import { useToast } from '../stores/toast';
import { createStore } from 'solid-js/store';
import { useTheme } from '../stores/theme';
import { ChartSeries } from './ChartSeries';
import { DropZone } from './DropZone';
import { ChartControls } from './ChartControls';
import { handleDrop, handleGlobalPaste } from './handle-drop';
import { createShareableUrl, transformFromSearchParams } from '../util/helpers';
import type { PivotMode, SortMode } from '../types';

export const isGenericChart = (id: string | undefined) => !id || id === 'chart';

export default function Chart() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { theme, setTheme } = useTheme();

  if (searchParams.type === 'pivot') {
    const url = new URL(window.location.href);
    url.searchParams.set('type', 'line');
    history.replaceState(null, '', url.pathname + url.search);
  }

  const chromeless = searchParams.chrome === '0';

  if (chromeless) {
    document.body.style.transition = 'none';
    document.documentElement.style.transition = 'none';
    if (searchParams.theme) {
      const t = searchParams.theme as 'dark' | 'light' | 'high-contrast';
      setTheme(t);
      document.documentElement.className = t;
    }
  }

  const fromUrl = transformFromSearchParams(searchParams);

  const [chartType, setChartType] = createSignal(fromUrl.type);
  const [pivotMode, setPivotMode] = createSignal<PivotMode>(fromUrl.pivotMode);
  const [config, setConfig] = createSignal(fromUrl.config);
  const [series, setSeries] = createStore(fromUrl.config?.series ?? []);
  const [selectedSeries, setSelectedSeries] = createSignal(series.map(series => series.id));
  const [seriesX, setSeriesX] = createStore(config()?.seriesX ?? []);
  const [selectedSeriesX, setSelectedSeriesX] = createSignal(seriesX.map(series => series.id));
  const [data, setData] = createSignal(fromUrl.data);
  const [fullRange, setFullRange] = createSignal(fromUrl.fullRange);
  const [sortMode, setSortMode] = createSignal<SortMode>('original');
  const [legendPosition, setLegendPosition] = createSignal(fromUrl.legendPosition);

  createEffect(() => {
    if (!(!searchParams.type && chartType() === 'median')) setSearchParams({ type: chartType() });
    if (!(!searchParams.ct && config()?.type === 'standard')) setSearchParams({ ct: config()?.type });
    if (!(!searchParams.lp && legendPosition() === 'tr')) setSearchParams({ lp: legendPosition() });
    if (!(!searchParams.br && fullRange() === true)) setSearchParams({ br: fullRange() ? '0' : '1' });
    const t = pivotMode() === 'transposed-pivoted' || pivotMode() === 'transposed' ? '1' : undefined;
    const p = pivotMode() === 'none' || pivotMode() === 'transposed-pivoted' ? '1' : undefined;
    if (!(!searchParams.p && !p)) setSearchParams({ p });
    if (!(!searchParams.t && !t)) setSearchParams({ t });
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

  const chartId = () => (isGenericChart(params.id) ? undefined : Number(params.id));

  createResource(chartId, async id => {
    const [chartData, chartConfig] = await Promise.all([storage.getSeriesData(id), storage.getConfig(id)]);
    const configSeries = chartConfig?.series ?? [];
    const configSeriesX = chartConfig?.seriesX ?? [];
    setConfig(chartConfig);
    setSeries(configSeries);
    setSelectedSeries(configSeries.map(s => s.id));
    setSeriesX(configSeriesX);
    setSelectedSeriesX(configSeriesX.map(s => s.id));
    setData(chartData);
  });

  createEffect(() => {
    const handler = handleGlobalPaste({
      chartId: params.id,
      config,
      setConfig,
      setSeries,
      selectedSeries,
      setSelectedSeries,
      setSeriesX,
      setSelectedSeriesX,
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
      pivotMode,
      selectedSeries,
      seriesX,
      selectedSeriesX,
      legendPosition,
      sortMode,
      fullRange,
      theme,
    });
  });

  const getShareableUrl = () => {
    const [, url] = createShareableUrl(searchParams, series, seriesX, data());
    return decodeURIComponent(url.searchParams.toString());
  };

  const handleShare = () => {
    const [loss, url] = createShareableUrl(searchParams, series, seriesX, data());
    const relative = loss * 100;
    const prettyUrl = url.origin + '?' + decodeURIComponent(url.searchParams.toString());
    navigator.clipboard.writeText(prettyUrl);
    addToast(`URL copied to clipboard (${relative === 0 ? 'no' : `${relative.toFixed(2)}%`} data loss)`);
  };

  if (chromeless) {
    return <svg ref={svgRef} class="h-96 w-full" id="chart" />;
  }

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
        setSeriesX,
        setSelectedSeriesX,
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
        hasSeriesX={Boolean(config()?.seriesX?.length)}
        isTooManyValues={data()[0]?.values && data()[0].values.length > 500}
        chartType={chartType}
        setChartType={setChartType}
        pivotMode={pivotMode}
        setPivotMode={setPivotMode}
        sortMode={sortMode}
        setSortMode={setSortMode}
        legendPosition={legendPosition}
        setLegendPosition={setLegendPosition}
        fullRange={fullRange}
        setFullRange={setFullRange}
        getShareableUrl={getShareableUrl}
        onShare={handleShare}
      />

      {series.length > 0 && (
        <ChartSeries
          data={data}
          series={series}
          setSeries={setSeries}
          selectedSeries={selectedSeries}
          setSelectedSeries={setSelectedSeries}
          seriesX={seriesX}
          setSeriesX={setSeriesX}
          selectedSeriesX={selectedSeriesX}
          setSelectedSeriesX={setSelectedSeriesX}
          type={config()?.type}
          pivotMode={pivotMode}
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
