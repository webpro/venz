import { createEffect, createMemo, createSignal, For, onCleanup, Show } from 'solid-js';
import { select } from 'd3-selection';
import { scaleLinear, scalePoint } from 'd3-scale';
import { max } from 'd3-array';
import { axisLeft, axisBottom } from 'd3-axis';
import { curveMonotoneX, line } from 'd3-shape';
import { Button, ButtonLink, IconButton, Link } from './Button';
import { Chart } from './icons/Chart';
import { Scatter } from './icons/Scatter';
import { Download } from './icons/Download';
import { BoxPlot } from './icons/BoxPlot';
import { MedianChart } from './icons/Median';
import { ScatterPlot } from './icons/ScatterPlot';
import { useNavigate, useParams, useSearchParams } from '@solidjs/router';
import { getStorageAdapter } from '../storage';
import { type Series, type Configuration, transform, type SeriesData } from '@venz/shared';
import { useToast } from '../stores/toast';
import { LegendBottomLeft, LegendBottomRight, LegendNone, LegendTopLeft, LegendTopRight } from './icons/Legend';
import { createStore } from 'solid-js/store';
import { Line } from './icons/Line';
import { SortAsc } from './icons/SortAsc';
import { SortDesc } from './icons/SortDesc';
import { Dropdown } from './Dropdown';
import { compare } from 'semver';
import { useTheme } from '../stores/theme';
import { Bar } from './icons/Bar';

const storage = getStorageAdapter();

type ChartType = 'box' | 'median' | 'scatter' | 'line' | 'bar';
const getChartType = (providedType?: string | string[]): ChartType =>
  typeof providedType === 'string' && ['box', 'median', 'scatter', 'line', 'bar'].includes(providedType)
    ? (providedType as ChartType)
    : 'median';

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
  const [sortMode, setSortMode] = createSignal<'original' | 'ascending' | 'descending'>('original');
  const [legendPosition, setLegendPosition] = createSignal<
    'none' | 'topRight' | 'bottomRight' | 'bottomLeft' | 'topLeft'
  >('topRight');
  const [imgDownloadBgColor, setImgDownloadBgColor] = createSignal('none');
  const [imgDownloadPadding, setImgDownloadPadding] = createSignal<0 | 12 | 24>(0);
  const [randomNumbers, setRandomNumbers] = createSignal<number[]>([]);
  const [isRealData, setIsRealData] = createSignal(series.length > 0);

  const generateNumbers = () => {
    const numbers = Array.from({ length: 20 }, () => Math.floor(Math.random() * 100) + 1);
    navigator.clipboard.writeText(numbers.join('\n'));
    setRandomNumbers(numbers);
    return numbers;
  };

  const isGenericChart = () => !params.id || params.id === 'chart';

  const getSeriesColor = (s: Series) => createMemo(() => (theme() === 'high-contrast' ? 'currentColor' : s.color));

  createEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chartParam = params.get('type');
    if (chartParam && ['box', 'median', 'scatter', 'line'].includes(chartParam)) {
      setChartType(chartParam as 'box' | 'median' | 'scatter' | 'line');
    }
  });

  const handleSave = async () => {
    if (!isGenericChart()) {
      const config = await storage.getConfig(Number(params.id));
      storage.updateConfig(Number(params.id), { ...config, series });
    }
  };

  const handleSaveAsNewConfiguration = async () => {
    const { id } = await storage.saveConfig(config());
    if (id) {
      await storage.saveSeriesData(id, data());
      addToast('New configuration saved');
      navigate(`/chart/${id}`, { state: { type: config()?.type } });
    }
  };

  const showDropZone = () => isGenericChart() && data().length === 0;

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();

    const files = Array.from(e.dataTransfer?.files || []);

    for (const file of files) {
      if (!/\.(json|txt|csv)$/.test(file.name)) {
        addToast(`Unsupported file type (${file.name})`, 'error');
        continue;
      }

      try {
        const input = await file.text();
        const currentConfig = config();

        if (isGenericChart()) {
          const { config: incomingConfig, data: incomingData } = transform(input, -1, undefined, currentConfig);
          if (incomingConfig) {
            setConfig(incomingConfig);
            setSeries(incomingConfig.series);
            setSelectedSeries(incomingConfig.series.map(s => s.id));
            setData(prev => [...prev, ...incomingData]);
          }
        } else {
          const match = file.name.match(/^venz-drop-(?<configId>[0-9]+)(?:-(?<seriesId>.+))?\.json$/);

          if (!match?.groups) {
            addToast(
              `Filename must be "venz-drop-${params.id}.json" or "venz-drop-${params.id}-[seriesId].json"`,
              'error',
            );
            continue;
          }

          const configId = Number(match.groups.configId);
          const seriesId = Number(match.groups.seriesId);

          if (configId !== Number(params.id)) {
            addToast(`Wrong configuration? Mismatch for ${file.name}`, 'error');
            continue;
          }

          if (seriesId) {
            const { config: incomingConfig, data: incomingData } = transform(input, configId, seriesId);
            if (incomingConfig) {
              const s = new Set(selectedSeries()).add(seriesId);
              const d = data().filter(d => d.seriesId !== seriesId);
              setSelectedSeries([...s]);
              setData([...d, ...incomingData]);
            }
          } else {
            const { data: incomingData } = transform(input, configId);
            setData(incomingData);
          }

          await storage.saveSeriesData(Number(params.id), data());
        }
      } catch (error: unknown) {
        if (error instanceof Error) addToast(`Unable to load ${file.name} (${error.message})`, 'error');
        addToast(`Unable to load ${file.name}`, 'error');
      }
    }

    setIsRealData(true);
  };

  let svgRef!: SVGSVGElement;

  const downloadChart = (format: 'png' | 'svg' | 'webp' | 'avif', scale = 2) => {
    if (format === 'svg') {
      const svgClone = svgRef.cloneNode(true) as SVGSVGElement;
      svgClone.setAttribute('class', 'venz-chart');
      const padding = imgDownloadPadding();
      svgClone.setAttribute(
        'viewBox',
        `-${padding} -${padding} ${svgRef.clientWidth + padding * 2} ${svgRef.clientHeight + padding * 2}`,
      );
      if (imgDownloadBgColor() !== 'none') {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        rect.setAttribute('r', '1e5');
        rect.setAttribute('fill', imgDownloadBgColor());
        svgClone.insertBefore(rect, svgClone.firstChild);
        if (imgDownloadBgColor() === '#000') svgClone.setAttribute('style', 'color: white');
      }
      const svgData = new XMLSerializer().serializeToString(svgClone);
      const a = document.createElement('a');
      a.download = 'venz-chart.svg';
      a.href = `data:image/svg+xml;base64,${btoa(svgData)}`;
      a.click();
      return;
    }

    const originalColor = svgRef.style.color;
    if (imgDownloadBgColor() === '#000') svgRef.style.color = 'white';
    const svgData = new XMLSerializer().serializeToString(svgRef);
    if (imgDownloadBgColor() === '#000') svgRef.style.color = originalColor;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const padding = imgDownloadPadding();

    canvas.width = (svgRef.clientWidth + padding * 2) * scale;
    canvas.height = (svgRef.clientHeight + padding * 2) * scale;

    img.onload = () => {
      if (ctx) {
        ctx.scale(scale, scale);
        if (imgDownloadBgColor() !== 'none') {
          ctx.fillStyle = imgDownloadBgColor();
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, padding / scale, padding / scale);
        const a = document.createElement('a');
        a.download = `venz-chart.${format}`;
        a.href = canvas.toDataURL(`image/${format}`);
        a.click();
      }
    };

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  createEffect(() => {
    if (isGenericChart()) return;

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
        await handleDrop({ preventDefault: () => {}, dataTransfer: { files } } as DragEvent);
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

  const seriesWithStats = createMemo(() => {
    const allData = data();
    const fastestStats = allData.reduce(
      (fastest, current) => (current.median < fastest.median ? current : fastest),
      allData[0],
    );

    return series
      .toSorted((a, b) => {
        const aStats = allData.find(d => d.seriesId === a.id);
        const bStats = allData.find(d => d.seriesId === b.id);
        return (aStats?.median || 0) - (bStats?.median || 0);
      })
      .map(s => {
        const stats = allData.find(d => d.seriesId === s.id);
        const isFastest = stats?.median === fastestStats?.median;
        const ratio = stats?.median / fastestStats?.median;
        const relativeStddev = !isFastest
          ? Math.sqrt(
              Math.pow(stats?.stddev / stats?.median, 2) + Math.pow(fastestStats?.stddev / fastestStats?.median, 2),
            ) * ratio
          : 0;

        return {
          ...s,
          stats,
          isFastest,
          ratio,
          relativeStddev,
          fastestSeries: isFastest ? null : series.find(fs => fs.id === fastestStats?.seriesId),
        };
      });
  });

  return (
    <div
      class="flex flex-col gap-8 max-w-[960px] m-auto"
      onDragOver={event => {
        event.preventDefault();
      }}
      onDrop={handleDrop}
    >
      <Show when={showDropZone()}>
        <div class="p-4 border-2 border-dashed border-foreground rounded-lg min-h-96 flex items-center justify-center">
          <div class="text-foreground text-lg">
            {params.id && (
              <div class="flex flex-col gap-8 gap-4 items-center justify-center">
                <h2 class="text-2xl">Drop or paste this file here:</h2>
                <p>
                  <code>venz-drop-{params.id}.json</code>
                </p>
                <p>
                  <Link href={`/config/${params.id}`}>← back to configuration</Link>
                </p>
              </div>
            )}
            {!params.id && (
              <div class="flex flex-col gap-8">
                <h2 class="text-3xl">Create chart from numbers</h2>
                <h3 class="text-2xl">Drag & drop or copy-paste a file or text:</h3>
                <ul class="list-disc ml-4">
                  <li>Plain text numbers separated by newline, space, comma or semicolon (= one data series)</li>
                  <li>Multiple numbers on a single line represent one data series</li>
                  <li>JSON array containing numbers or arrays of numbers</li>
                  <li>
                    JSON generated by <code>hyperfine --export-json</code> (<code>--parameter-list</code> supported)
                  </li>
                </ul>
                <p>Add data series by dropping/pasting data again</p>
              </div>
            )}
          </div>
        </div>
      </Show>

      <svg ref={svgRef} class={`h-96 w-full ${showDropZone() ? ' hidden' : ''}`} />

      <div class="flex justify-end gap-4">
        {config()?.type !== 'list' && (
          <>
            <Dropdown
              label="Chart type"
              value={chartType()}
              options={[
                { value: 'median', icon: <MedianChart />, label: 'median' },
                { value: 'box', icon: <BoxPlot />, label: 'box plot' },
                { value: 'scatter', icon: <ScatterPlot />, label: 'scatter' },
                { value: 'line', icon: <Line />, label: 'line' },
                { value: 'bar', icon: <Bar />, label: 'bar' },
              ]}
              onChange={setChartType}
            />

            <Dropdown
              label="Sort mode"
              value={sortMode()}
              options={[
                { value: 'original', icon: <Line />, label: 'original' },
                { value: 'ascending', icon: <SortAsc />, label: 'ascending' },
                { value: 'descending', icon: <SortDesc />, label: 'descending' },
              ]}
              onChange={setSortMode}
            />
          </>
        )}

        <Dropdown
          label="Legend position"
          value={legendPosition()}
          options={[
            { value: 'none', icon: <LegendNone />, label: 'legend' },
            { value: 'topLeft', icon: <LegendTopLeft />, label: '' },
            { value: 'topRight', icon: <LegendTopRight />, label: '' },
            { value: 'bottomLeft', icon: <LegendBottomLeft />, label: '' },
            { value: 'bottomRight', icon: <LegendBottomRight />, label: '' },
          ]}
          onChange={setLegendPosition}
        />

        <IconButton aria-label="Toggle chart break" onClick={() => setFullRange(prev => !prev)}>
          {fullRange() ? <Chart /> : <Scatter />}
        </IconButton>

        <Dropdown
          label="Download image"
          icon={<Download />}
          options={[
            { value: 'png', icon: <Download />, label: 'png', onClick: () => downloadChart('png', 2) },
            { value: 'svg', icon: <Download />, label: 'svg', onClick: () => downloadChart('svg') },
            { value: 'webp', icon: <Download />, label: 'webP', onClick: () => downloadChart('webp', 2) },
            { value: 'avif', icon: <Download />, label: 'avif', onClick: () => downloadChart('avif', 2) },
            { separator: true, value: '', label: '' },
            {
              value: 'bg-color',
              label: `bg (${imgDownloadBgColor()})`,
              icon: <div class={`w-full h-full`} style={`background-color: ${imgDownloadBgColor()}`} />,
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
      </div>

      {series.length > 0 && (
        <form
          class="flex flex-col border border-foreground rounded-2"
          onSubmit={event => {
            event.preventDefault();
            handleSave();
          }}
        >
          <button type="submit" class="hidden" />

          <For each={seriesWithStats()}>
            {(s, i) => {
              const fasterSeries = seriesWithStats()[0];

              return (
                <label
                  for={`toggle-visibility-${i()}`}
                  class="flex items-center gap-2 px-4 py-1 cursor-pointer hover:bg-foreground hover:text-background!"
                  style={`color: ${getSeriesColor(s)()}`}
                >
                  <input
                    type="checkbox"
                    id={`toggle-visibility-${i()}`}
                    aria-label="toggle series visibility"
                    checked={selectedSeries().includes(s.id)}
                    onChange={event => {
                      setSelectedSeries(prev =>
                        (event.currentTarget.checked ? [...prev, s.id] : prev.filter(id => id !== s.id)).sort(),
                      );
                    }}
                    class="w-4 h-4 rounded-sm"
                  />
                  <div class="relative w-6 scale-50">
                    <input
                      type="color"
                      aria-label="color"
                      value={s.color}
                      onChange={event => {
                        setSeries(series => series.id === s.id, 'color', event.currentTarget.value);
                        handleSave();
                      }}
                      class="w-full h-3 cursor-pointer appearance-none bg-transparent border-0"
                    />
                    <div
                      class="pointer-events-none absolute inset-0 rounded-full"
                      style={{ 'background-color': getSeriesColor(s)() }}
                    />
                  </div>
                  <input
                    type="text"
                    aria-label="series label"
                    value={s.label}
                    onChange={event => {
                      setSeries(series => series.id === s.id, 'label', event.currentTarget.value);
                    }}
                    onBlur={handleSave}
                    class="bg-transparent border-none py-1"
                  />

                  {(config()?.type === 'hyperfine-default' || config()?.type === 'hyperfine-json') && (
                    <code class="p-2 text-base text-gray-400 font-mono">{s.command}</code>
                  )}

                  {config()?.type !== 'list' &&
                    seriesWithStats().length > 1 &&
                    (!s.ratio || s.ratio === 1 || (
                      <em class="text-right ml-auto text-gray-400">
                        <span class="mr-2" style={`color: ${fasterSeries.color}`}>
                          {fasterSeries.label}
                        </span>
                        is {s.ratio.toFixed(2)} ± {s.relativeStddev.toFixed(2)} times faster
                      </em>
                    ))}
                </label>
              );
            }}
          </For>
        </form>
      )}

      {isGenericChart() && series.length > 0 ? (
        <div class="self-end flex flex-col gap-2">
          <Button onClick={handleSaveAsNewConfiguration}>Save as new configuration with data ↻</Button>
          <p class="text-xs text-right italic high-contrast:text-base">To edit title, axis labels and more</p>
        </div>
      ) : (
        !isGenericChart() && (
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
