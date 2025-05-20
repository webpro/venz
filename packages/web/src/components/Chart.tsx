import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { select } from 'd3-selection';
import { scaleLinear, scalePoint } from 'd3-scale';
import { max } from 'd3-array';
import { axisLeft, axisBottom } from 'd3-axis';
import { curveMonotoneX, line } from 'd3-shape';
import { Button, ButtonLink, Link } from './Button';
import { useNavigate, useParams, useSearchParams } from '@solidjs/router';
import { getStorageAdapter } from '../storage';
import { type Series, type Configuration, transform, type SeriesData } from '@venz/shared';
import { useToast } from '../stores/toast';
import { createStore } from 'solid-js/store';
import { compare } from 'semver';
import { useTheme } from '../stores/theme';
import { ChartSeries } from './ChartSeries';
import { DropZone } from './DropZone';
import { ChartControls } from './ChartControls';
import { handleDrop } from './handleDrop';

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
  const [randomNumbers, setRandomNumbers] = createSignal<number[]>([]);
  const [isRealData, setIsRealData] = createSignal(series.length > 0);

  const generateNumbers = () => {
    const numbers = Array.from({ length: 20 }, () => Math.floor(Math.random() * 100) + 1);
    navigator.clipboard.writeText(numbers.join('\n'));
    setRandomNumbers(numbers);
    return numbers;
  };

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
    const handleGlobalPaste = async e => {
      const files = e.clipboardData?.files;
      if (files?.length) {
        handleDrop({
          chartId: params.id,
          config,
          setConfig,
          setSeries,
          selectedSeries,
          setSelectedSeries,
          data,
          setData,
        })({ preventDefault: () => {}, dataTransfer: { files } } as DragEvent);

        setIsRealData(true);
      }

      const input = e.clipboardData?.getData('text');
      if (input) {
        try {
          const { config: incomingConfig, data: incomingData } = transform(input, -1, undefined, config());
          if (incomingConfig) {
            setConfig(incomingConfig);
            setSeries(incomingConfig.series);
            setSelectedSeries(prev => incomingConfig.series.map(w => w.id));
            setData(prev => [...prev, ...incomingData]);
            setIsRealData(true);
          } else {
            addToast('Received invalid data', 'error');
          }
        } catch (error) {
          addToast('Invalid JSON format', 'error');
        }
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    onCleanup(() => document.removeEventListener('paste', handleGlobalPaste));
  });

  createEffect(() => {
    const margin = { top: 30, right: 0, bottom: 90, left: 60 };
    const svgWidth = svgRef.clientWidth;
    const svgHeight = svgRef.clientHeight;
    const width = svgWidth - margin.left;
    const height = svgHeight - margin.bottom;

    select(svgRef).selectAll('*').remove();

    if (data().length === 0) return;

    const root = select(svgRef);

    root.attr('role', 'img');

    root.append('title').text(config()?.title ?? 'Venz chart');

    const svg = root.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const pad = config()?.type === 'list' ? 0 : 1;

    svg.append('style').text(`
      .tooltip {
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease-in-out;
      }
      .tooltip-bg {
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease-in-out;
      }
      .hit-area:hover + .visible-dot + .tooltip-group > .tooltip-bg,
      .hit-area:hover + .visible-dot + .tooltip-group > .tooltip {
        opacity: 1;
      }
    `);

    const x =
      chartType() === 'scatter' || chartType() === 'line'
        ? scaleLinear()
            .domain([0, max(data().map(s => s.values.length ?? 0)) - 1])
            .range([0, width])
        : scalePoint()
            .domain(
              config()?.sort === 'semver'
                ? [...new Set(data().map(m => m.label))].sort(compare)
                : config()?.sort === 'datetime'
                  ? [...new Set(data().map(m => m.label))].sort((a, b) => new Date(a) - new Date(b))
                  : sortMode() === 'original'
                    ? selectedSeries().sort()
                    : selectedSeries().sort((a, b) => {
                        const aMetric = data().find(m => m.seriesId === a)?.median ?? 0;
                        const bMetric = data().find(m => m.seriesId === b)?.median ?? 0;
                        return sortMode() === 'ascending' ? aMetric - bMetric : bMetric - aMetric;
                      }),
            )
            .range([0, width])
            .padding(pad);

    const y = (() => {
      if (!fullRange()) {
        const width = 8;
        const start = height * 0.9;
        const unit = (height * 0.1) / 5;

        svg
          .append('path')
          .attr('d', `M 0,${start} v ${unit * 2},0`)
          .style('stroke', 'currentColor')
          .style('stroke-width', 1);

        svg
          .append('path')
          .attr('d', `M -${width},${start + unit * 2} l ${width * 2},0`)
          .attr('transform', `rotate(-10, 0, ${start + unit * 2})`)
          .style('stroke', 'currentColor')
          .style('stroke-width', 2);

        svg
          .append('path')
          .attr('d', `M -${width},${start + unit * 3} l ${width * 2},0`)
          .attr('transform', `rotate(-10, 0, ${start + unit * 3})`)
          .style('stroke', 'currentColor')
          .style('stroke-width', 2);

        svg
          .append('path')
          .attr('d', `M 0,${start + unit * 3} v ${unit * 2},0`)
          .style('stroke', 'currentColor')
          .style('stroke-width', 1);

        return scaleLinear()
          .domain([
            Math.min(
              ...data()
                .filter(s => selectedSeries().includes(s.seriesId))
                .flatMap(m => m.min),
            ),
            Math.max(
              ...data()
                .filter(s => selectedSeries().includes(s.seriesId))
                .flatMap(m => m.max),
            ),
          ])
          .range([height * 0.9, 0])
          .nice();
      }

      return scaleLinear()
        .domain([
          0,
          Math.max(
            ...data()
              .filter(s => selectedSeries().includes(s.seriesId))
              .flatMap(s => s.max),
          ),
        ])
        .range([height, 0])
        .nice();
    })();

    svg
      .append('g')
      .attr('class', 'grid')
      .style('stroke', 'currentColor')
      .style('opacity', 0.2)
      .call(axisLeft(y).tickSize(-width).tickFormat(''));

    if (chartType() !== 'bar') {
      svg
        .append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0, ${height})`)
        .style('stroke', 'currentColor')
        .style('opacity', 0.2)
        .call(axisBottom(x).tickSize(-height).tickFormat(''));
    }

    svg.append('g').call(axisLeft(y)).selectAll('text').style('fill', 'currentColor');

    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(axisBottom(x))
      .selectAll('text')
      .style('fill', 'currentColor')
      .attr('transform', () => (data().length > 10 ? 'rotate(-45)' : null))
      .attr('text-anchor', data().length > 10 ? 'end' : 'middle')
      .attr('dy', data().length > 10 ? '.1em' : '0.7em')
      .attr('dx', data().length > 10 ? '-.8em' : null)
      .text(d => (chartType() === 'scatter' || chartType() === 'line' ? Number(d) + 1 : series[d]?.label || d));

    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', height + 10 + margin.bottom / 2)
      .attr('text-anchor', 'middle')
      .style('fill', 'currentColor')
      .style('font-family', 'sans-serif')
      .text(config()?.labelX || 'Run #');

    svg
      .append('text')
      .attr('x', -height / 2)
      .attr('y', -45)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
      .style('fill', 'currentColor')
      .style('font-family', 'sans-serif')
      .text(config()?.labelY || `median (s)`);

    if (legendPosition() !== 'none') {
      const isRight = legendPosition().includes('Right');
      const isTop = legendPosition().includes('top');
      const legendX = isRight ? width * 0.95 : width * 0.05;
      const legendY = isTop ? 20 : height - 30;
      const textAnchor = isRight ? 'end' : 'start';
      const circleOffset = isRight ? 20 : -15;

      const legend = svg.append('g').attr('class', 'legend').attr('transform', `translate(${legendX}, ${legendY})`);

      legend
        .selectAll('g')
        .data(selectedSeries())
        .enter()
        .append('g')
        .attr(
          'transform',
          (_, i) =>
            `translate(0, ${legendPosition().includes('top') ? i * 25 : (i + 1 - selectedSeries().length) * 25})`,
        )
        .each(function (selectedId) {
          const currentSeries = series.find(s => s.id === selectedId);
          const elementColor = theme() === 'high-contrast' ? 'currentColor' : currentSeries.color;
          const g = select(this);
          g.append('text')
            .attr('x', 0)
            .attr('y', 10)
            .style('fill', elementColor)
            .style('font-family', 'sans-serif')
            .attr('text-anchor', textAnchor)
            .text(currentSeries.label);
          g.append('circle').attr('cx', circleOffset).attr('cy', 6).attr('r', 4).style('fill', elementColor);
        });
    }

    for (const selectedId of selectedSeries()) {
      const currentSeries = series.find(s => s.id === selectedId);
      const stats = data().find(d => d.seriesId === selectedId);

      if (!stats || !currentSeries) continue;

      const color = theme() === 'high-contrast' ? 'currentColor' : currentSeries.color;

      if (config()?.type === 'list') {
        const stats = data().filter(d => d.seriesId === selectedId);

        if (stats.length === 1) {
          svg
            .append('circle')
            .attr('cx', x(stats[0].label) ?? 0)
            .attr('cy', y(stats[0].mean))
            .attr('r', 4)
            .attr('fill', color);
        } else {
          const l = line()
            .x(d => x(d.label) ?? 0)
            .y(d => y(d.mean))
            .curve(curveMonotoneX);

          svg
            .append('path')
            .datum(stats)
            .attr('class', 'line')
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 2)
            .attr('d', l);

          svg
            .selectAll(`circle-${selectedId}`)
            .data(stats)
            .enter()
            .append('g')
            .attr('transform', d => `translate(${x(d.label) ?? 0},${y(d.mean)})`)
            .each(function (d, i) {
              const g = select(this);
              g.append('circle').attr('r', 12).attr('fill', 'transparent').attr('class', 'hit-area');
              g.append('circle').attr('r', 2).attr('fill', color).attr('class', 'visible-dot');

              const isFirst = i === 0;
              const isLast = i === stats.length - 1;
              const xOffset = isFirst ? 10 : isLast ? -10 : 0;

              const tooltipGroup = g.append('g').attr('class', 'tooltip-group');

              const text = tooltipGroup
                .append('text')
                .attr('class', 'tooltip')
                .attr('y', -10)
                .attr('x', xOffset)
                .attr('text-anchor', isFirst ? 'start' : isLast ? 'end' : 'middle')
                .style('font-size', '12px')
                .style('fill', color)
                .text(d.mean);

              const textWidth = text.node()?.getBBox().width ?? 20;
              const padding = 8;

              tooltipGroup
                .append('rect')
                .attr('class', 'tooltip-bg')
                .attr('x', xOffset + (isFirst ? -padding : isLast ? -textWidth - padding : -textWidth / 2 - padding))
                .attr('y', -25)
                .attr('width', textWidth + padding * 2)
                .attr('height', 20)
                .attr('rx', 4)
                .attr('fill', 'var(--background-rgb)')
                .attr('stroke', 'rgba(255, 255, 255, 0.2)');

              text.raise();
            });
        }
      } else {
        if (chartType() === 'median') {
          const radius = Math.abs(y(stats.median) - y(stats.median + stats.stddev));
          const decimals = Math.min(3, Math.max(...stats.values.map(n => (n.toString().split('.')[1] || '').length)));

          svg
            .append('circle')
            .attr('cx', x(selectedId) ?? 0)
            .attr('cy', y(stats.median))
            .attr('r', radius)
            .attr('fill', color)
            .attr('fill-opacity', 0.2);

          svg
            .append('circle')
            .attr('cx', x(selectedId) ?? 0)
            .attr('cy', y(stats.median))
            .attr('r', 4)
            .attr('fill', color)
            .attr('stroke', color)
            .attr('stroke-width', 2);

          svg
            .append('text')
            .attr('x', (x(selectedId) ?? 0) + 12)
            .attr('y', y(stats.median))
            .style('fill', color)
            .style('font-family', 'sans-serif')
            .style('font-size', '12px')
            .text(stats.median.toFixed(decimals));
        } else if (chartType() === 'box') {
          const sortedValues = stats.values.toSorted((a, b) => a - b);
          const q1 = sortedValues[Math.floor(sortedValues.length * 0.25)];
          const q3 = sortedValues[Math.floor(sortedValues.length * 0.75)];

          const xPos = x(selectedId) ?? 0;

          svg
            .append('rect')
            .attr('x', xPos - 20)
            .attr('y', y(q3))
            .attr('width', 40)
            .attr('height', y(q1) - y(q3))
            .attr('fill', color)
            .attr('fill-opacity', 0.2)
            .attr('stroke', color);

          svg
            .append('line')
            .attr('x1', xPos - 20)
            .attr('x2', xPos + 20)
            .attr('y1', y(stats.median))
            .attr('y2', y(stats.median))
            .attr('stroke', color)
            .attr('stroke-width', 2);

          svg
            .append('line')
            .attr('x1', xPos)
            .attr('x2', xPos)
            .attr('y1', y(stats.min))
            .attr('y2', y(stats.max))
            .attr('stroke', color)
            .attr('stroke-width', 1);

          svg
            .append('line')
            .attr('x1', xPos - 10)
            .attr('x2', xPos + 10)
            .attr('y1', y(stats.max))
            .attr('y2', y(stats.max))
            .attr('stroke', color)
            .attr('stroke-width', 1);

          svg
            .append('line')
            .attr('x1', xPos - 10)
            .attr('x2', xPos + 10)
            .attr('y1', y(stats.min))
            .attr('y2', y(stats.min))
            .attr('stroke', color)
            .attr('stroke-width', 1);

          if (stats.values.length <= 10) {
            svg
              .append('g')
              .selectAll(`circle-${selectedId}`)
              .data(stats.values)
              .enter()
              .append('circle')
              .attr('cx', xPos)
              .attr('cy', d => y(d))
              .attr('r', 3)
              .attr('fill', color)
              .attr('opacity', 0.6);
          }
        } else if (chartType() === 'scatter') {
          const dataLength = stats.values.length;

          svg
            .append('rect')
            .attr('x', x(0))
            .attr('y', y(stats.median + stats.stddev))
            .attr('width', x(dataLength - 1) - x(0))
            .attr('height', y(stats.median - stats.stddev) - y(stats.median + stats.stddev))
            .attr('fill', color)
            .attr('fill-opacity', 0.2);

          svg
            .append('line')
            .attr('x1', x(0))
            .attr('x2', x(dataLength - 1))
            .attr('y1', y(stats.median))
            .attr('y2', y(stats.median))
            .attr('stroke', color)
            .attr('stroke-width', 2);

          svg
            .selectAll(`circle-${selectedId}`)
            .data(stats.values)
            .enter()
            .append('circle')
            .attr('cx', (d, i) => x(i))
            .attr('cy', d => y(d))
            .attr('r', 3)
            .attr('fill', color)
            .attr('opacity', 0.6);
        } else if (chartType() === 'line') {
          const curve = line()
            .x((d, i) => x(i))
            .y(d => y(d))
            .curve(curveMonotoneX);

          const values =
            sortMode() === 'original'
              ? stats.values
              : sortMode() === 'ascending'
                ? stats.values.toSorted((a, b) => a - b)
                : stats.values.toSorted((a, b) => b - a);

          svg
            .append('path')
            .datum(values)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 2)
            .attr('d', curve);

          svg
            .selectAll(`circle-${selectedId}`)
            .data(values)
            .enter()
            .append('g')
            .attr('transform', (d, i) => `translate(${x(i)},${y(d)})`)
            .each(function (d, i) {
              const g = select(this);
              g.append('circle').attr('r', 12).attr('fill', 'transparent').attr('class', 'hit-area');
              g.append('circle').attr('r', 3).attr('fill', color).attr('class', 'visible-dot');

              const isFirst = i === 0;
              const isLast = i === values.length - 1;
              const xOffset = isFirst ? 15 : isLast ? -15 : 0;

              const tooltipGroup = g.append('g').attr('class', 'tooltip-group');

              const text = tooltipGroup
                .append('text')
                .attr('class', 'tooltip')
                .attr('y', -10)
                .attr('x', xOffset)
                .attr('text-anchor', isFirst ? 'start' : isLast ? 'end' : 'middle')
                .style('font-size', '12px')
                .style('fill', 'white')
                .text(d);

              const textWidth = text.node().getBBox().width;
              const padding = 8;

              tooltipGroup
                .append('rect')
                .attr('class', 'tooltip-bg')
                .attr('x', xOffset + (isFirst ? -padding : isLast ? -textWidth - padding : -textWidth / 2 - padding))
                .attr('y', -25)
                .attr('width', textWidth + padding * 2)
                .attr('height', 20)
                .attr('rx', 4)
                .attr('fill', 'rgba(0, 0, 0, 0.8)')
                .attr('stroke', 'rgba(255, 255, 255, 0.2)');

              text.raise();
            });
        } else if (chartType() === 'bar') {
          const barWidth = 50;

          svg
            .append('rect')
            .attr('x', (x(selectedId) ?? 0) - barWidth / 2)
            .attr('y', y(stats.median))
            .attr('width', barWidth)
            .attr('height', height - y(stats.median))
            .attr('fill', color);

          const decimals = Math.min(3, Math.max(...stats.values.map(n => (n.toString().split('.')[1] || '').length)));

          svg
            .append('text')
            .attr('x', x(selectedId) ?? 0)
            .attr('y', y(stats.median) - 10)
            .attr('text-anchor', 'middle')
            .style('fill', color)
            .style('font-family', 'sans-serif')
            .style('font-size', '12px')
            .text(stats.median.toFixed(decimals));
        }
      }
    }
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

      <Show when={!params.id && !isRealData()}>
        <div class="flex flex-col gap-8 items-center">
          <p>Need some data to try it out?</p>
          <Button
            onClick={() => {
              generateNumbers();
              addToast('Numbers copied to clipboard');
            }}
          >
            Generate 20 numbers
          </Button>

          <output class="block text-center text-balance">{randomNumbers().join(', ')}</output>

          <Show when={randomNumbers().length > 0}>
            <Button
              onClick={() => {
                const { config: incomingConfig, data: incomingData } = transform(
                  randomNumbers().join('\n'),
                  -1,
                  undefined,
                  config(),
                );
                if (incomingConfig) {
                  setConfig(incomingConfig);
                  setSeries(incomingConfig.series);
                  setSelectedSeries(incomingConfig.series.map(w => w.id));
                  setData(prev => [...prev, ...incomingData]);
                }
                setRandomNumbers([]);
                addToast('Numbers added to chart');
              }}
            >
              Paste numbers
            </Button>
          </Show>

          <Link href="/config">← To configurations</Link>
        </div>
      </Show>
    </div>
  );
}
