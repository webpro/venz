import { createEffect, createResource, createSignal, onCleanup, Show } from 'solid-js';
import { useLocation, useNavigate, useParams, useSearchParams } from '@solidjs/router';
import { renderSVG } from '@venz/shared/render';
import {
  fromPivotMode,
  getVersion,
  readV2,
  toChart,
  upgradeV1,
  writeV2,
  type ChartSpec,
} from '@venz/shared/spec';
import { Button, ButtonLink } from './Button';
import { storage } from '../storage';
import { useToast } from '../stores/toast';
import { createStore } from 'solid-js/store';
import { useTheme } from '../stores/theme';
import { ChartSeries } from './ChartSeries';
import { DropZone } from './DropZone';
import { ChartControls } from './ChartControls';
import { handleDrop, handleGlobalPaste } from './handle-drop';
import { createShareableUrl, prettyQuery, toURLSearchParams } from '../util/helpers';
import type { PivotMode, SortMode } from '../types';

export const isGenericChart = (id: string | undefined) => !id || id === 'chart';

export default function Chart() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { theme, setTheme } = useTheme();

  // v1 links render as before, through their v2 equivalent
  const urlSpec = () => {
    const query = toURLSearchParams(searchParams);
    return readV2(getVersion(query) === 1 ? upgradeV1(query) : query);
  };
  const fromUrlSpec = urlSpec();
  const chromeless = fromUrlSpec.embed;

  if (chromeless) {
    document.body.style.transition = 'none';
    document.documentElement.style.transition = 'none';
    if (fromUrlSpec.theme) {
      setTheme(fromUrlSpec.theme);
      document.documentElement.className = fromUrlSpec.theme;
    }
  }

  const fromUrl = toChart(fromUrlSpec);

  const [chartType, setChartType] = createSignal(fromUrl.chartType);
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

  /** The chart in the address bar, with the current view settings */
  const viewSpec = (): ChartSpec => ({
    ...urlSpec(),
    type: chartType(),
    ...fromPivotMode(pivotMode()),
    legend: legendPosition(),
    zero: fullRange(),
    unit: config()?.rawUnit,
  });

  // Keep the address bar in sync with the view, in v2 (which also upgrades v1 links)
  createEffect(() => {
    const query = writeV2(viewSpec()).toString();
    const current = new URLSearchParams(location.search).toString();
    if (query !== current)
      navigate(query ? `${location.pathname}?${query}` : location.pathname, { replace: true, scroll: false });
  });

  const handleSaveAsNewConfiguration = async () => {
    const { id } = await storage.saveConfig(config());
    if (id) {
      await storage.saveSeriesData(id, data());
      addToast('New configuration saved');
      navigate(`/chart/${id}`, { state: { type: config()?.type } });
    }
  };

  // eslint-disable-next-line no-unassigned-vars -- assigned via JSX ref={svgRef}
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
    const [, url] = createShareableUrl(viewSpec(), series, seriesX, data());
    return prettyQuery(url.searchParams);
  };

  const handleShare = () => {
    const [loss, url] = createShareableUrl(viewSpec(), series, seriesX, data());
    const relative = loss * 100;
    const prettyUrl = url.origin + '?' + prettyQuery(url.searchParams);
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
