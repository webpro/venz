import { select, type Selection } from 'd3-selection';
import { scaleLinear, scalePoint } from 'd3-scale';
import { max } from 'd3-array';
import { axisLeft, axisBottom } from 'd3-axis';
import { curveMonotoneX, line } from 'd3-shape';
import { compare, valid } from 'semver';
import type { Configuration, RawUnit, Series, SeriesData } from '../types.ts';
import type { Theme, ChartType, LegendPosition, PivotMode, SortMode } from '../chart.ts';
import { transpose } from '../transpose.ts';

const isPointScale = (scale: unknown): scale is ReturnType<typeof scalePoint> =>
  typeof scale === 'function' && 'step' in scale;

type DisplayUnit = { label: string; convert: (raw: number) => number };

function bestDisplayUnit(rawUnit: RawUnit, representative: number): DisplayUnit {
  if (rawUnit === 'ns') {
    if (representative >= 1e9) return { label: 's', convert: n => n / 1e9 };
    if (representative >= 1e6) return { label: 'ms', convert: n => n / 1e6 };
    if (representative >= 1e3) return { label: 'µs', convert: n => n / 1e3 };
    return { label: 'ns', convert: n => n };
  }
  if (representative >= 1) return { label: 's', convert: s => s };
  if (representative >= 0.001) return { label: 'ms', convert: s => s * 1e3 };
  if (representative >= 1e-6) return { label: 'µs', convert: s => s * 1e6 };
  return { label: 'ns', convert: s => s * 1e9 };
}

function bestScaleFactor(representative: number): DisplayUnit | undefined {
  if (representative >= 1e9) return { label: '×1,000,000,000', convert: n => n / 1e9 };
  if (representative >= 1e6) return { label: '×1,000,000', convert: n => n / 1e6 };
  if (representative >= 1e4) return { label: '×1,000', convert: n => n / 1e3 };
  return undefined;
}

export type RenderProps = {
  svgRef: SVGSVGElement;
  config: () => Configuration | undefined;
  data: () => SeriesData[];
  series: Series[];
  selectedSeries: () => number[];
  seriesX: Series[];
  selectedSeriesX: () => number[];
  chartType: () => ChartType;
  pivotMode: () => PivotMode;
  legendPosition: () => LegendPosition;
  sortMode: () => SortMode;
  fullRange: () => boolean;
  theme: () => Theme;
  interactive?: boolean;
};

type ChartContext = {
  svg: Selection<SVGGElement, unknown, null, undefined>;
  x: ReturnType<typeof scaleLinear> | ReturnType<typeof scalePoint>;
  y: ReturnType<typeof scaleLinear>;
  height: number;
  props: RenderProps;
  pivotMode: PivotMode;
  fmt: (raw: number) => string;
};

const getColor = (theme: Theme, series: Series) =>
  theme === 'high-contrast' ? 'currentColor' : series.color;

const getDecimals = (values: number[]) => {
  if (values.length === 0) return 0;
  const maxFrac = Math.max(...values.map(n => (n.toString().split('.')[1] || '').length));
  if (maxFrac === 0) return 0;
  const magnitude = Math.max(...values.map(Math.abs));
  if (magnitude >= 100) return Math.min(1, maxFrac);
  if (magnitude >= 10) return Math.min(2, maxFrac);
  return Math.min(3, maxFrac);
};

function renderTooltipDot(
  svg: ChartContext['svg'],
  values: number[],
  x: ChartContext['x'],
  y: ChartContext['y'],
  color: string,
  selectedId: number | string,
  getX: (d: number, i: number) => number,
  interactive: boolean
) {
  svg
    .selectAll(`circle-${selectedId}`)
    .data(values)
    .enter()
    .append('g')
    .attr('transform', (d, i) => `translate(${getX(d, i)},${y(d)})`)
    .each(function (d, i) {
      const g = select(this);

      if (interactive) {
        g.append('circle').attr('r', 12).attr('fill', 'transparent').attr('class', 'hit-area');
      }

      g.append('circle').attr('r', 3).attr('fill', color).attr('class', 'visible-dot');

      if (!interactive) return;

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

      const textWidth = text.node()!.getBBox().width;
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
}

const getXPos = (x: ChartContext['x'], id: number, label: string) => x(id) || x(label);

function renderMedian(ctx: ChartContext, stats: SeriesData, color: string, selectedId: number) {
  const { svg, x, y, fmt } = ctx;
  const radius = Math.min(Math.abs(y(stats.median) - y(stats.median + stats.stddev)), ctx.height / 2);
  const cx = getXPos(x, selectedId, stats.label);

  svg.append('circle').attr('cx', cx).attr('cy', y(stats.median)).attr('r', radius).attr('fill', color).attr('fill-opacity', 0.2);
  svg.append('circle').attr('cx', cx).attr('cy', y(stats.median)).attr('r', 4).attr('fill', color).attr('stroke', color).attr('stroke-width', 2);
  svg.append('text').attr('x', cx + 6).attr('y', y(stats.median) - 6).style('fill', color).style('font-family', 'sans-serif').style('font-size', '12px').text(fmt(stats.median));
}

function renderBox(ctx: ChartContext, stats: SeriesData, color: string, selectedId: number) {
  const { svg, x, y, props } = ctx;
  const sortedValues = stats.values.toSorted((a, b) => a - b);
  const q1 = sortedValues[Math.floor(sortedValues.length * 0.25)];
  const q3 = sortedValues[Math.floor(sortedValues.length * 0.75)];
  const xPos = getXPos(x, selectedId, stats.label);
  const boxWidth = Math.max(10, 50 - props.data().length * 1.5);
  const halfWidth = boxWidth / 2;

  svg.append('rect').attr('x', xPos - halfWidth).attr('y', y(q3)).attr('width', boxWidth).attr('height', y(q1) - y(q3)).attr('fill', color).attr('fill-opacity', 0.2).attr('stroke', color);
  svg.append('line').attr('x1', xPos - halfWidth).attr('x2', xPos + halfWidth).attr('y1', y(stats.median)).attr('y2', y(stats.median)).attr('stroke', color).attr('stroke-width', 2);
  svg.append('line').attr('x1', xPos).attr('x2', xPos).attr('y1', y(stats.min)).attr('y2', y(stats.max)).attr('stroke', color).attr('stroke-width', 1);
  svg.append('line').attr('x1', xPos - 10).attr('x2', xPos + 10).attr('y1', y(stats.max)).attr('y2', y(stats.max)).attr('stroke', color).attr('stroke-width', 1);
  svg.append('line').attr('x1', xPos - 10).attr('x2', xPos + 10).attr('y1', y(stats.min)).attr('y2', y(stats.min)).attr('stroke', color).attr('stroke-width', 1);

  if (stats.values.length <= 10) {
    svg.append('g').selectAll(`circle-${selectedId}`).data(stats.values).enter().append('circle').attr('cx', xPos).attr('cy', d => y(d)).attr('r', 3).attr('fill', color).attr('opacity', 0.6);
  }
}

function renderScatter(ctx: ChartContext, stats: SeriesData, color: string, selectedId: number) {
  const { svg, x, y } = ctx;
  const dataLength = stats.values.length;

  svg.append('rect').attr('x', x(0)).attr('y', y(stats.median + stats.stddev)).attr('width', x(dataLength - 1) - x(0)).attr('height', y(stats.median - stats.stddev) - y(stats.median + stats.stddev)).attr('fill', color).attr('fill-opacity', 0.2);
  svg.append('line').attr('x1', x(0)).attr('x2', x(dataLength - 1)).attr('y1', y(stats.median)).attr('y2', y(stats.median)).attr('stroke', color).attr('stroke-width', 2);
  svg.selectAll(`circle-${selectedId}`).data(stats.values).enter().append('circle').attr('cx', (d, i) => x(i)).attr('cy', d => y(d)).attr('r', 3).attr('fill', color).attr('opacity', 0.6);
}

function renderLine(ctx: ChartContext, stats: SeriesData, color: string, selectedId: number) {
  const { svg, x, y, props } = ctx;
  const interactive = props.interactive !== false;
  const curve = line().x((d, i) => x(i)).y(d => y(d)).curve(curveMonotoneX);

  const values =
    props.sortMode() === 'original'
      ? stats.values
      : props.sortMode() === 'ascending'
        ? stats.values.toSorted((a, b) => a - b)
        : stats.values.toSorted((a, b) => b - a);

  svg.append('path').datum(values).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2).attr('d', curve);
  renderTooltipDot(svg, values, x, y, color, selectedId, (_d, i) => x(i), interactive);
}

function renderBar(ctx: ChartContext, stats: SeriesData, color: string, selectedId: number) {
  const { svg, x, y, height, fmt } = ctx;
  if (!isPointScale(x)) return;
  const xPos = getXPos(x, selectedId, stats.label);
  const step = x.step();
  const barWidth = Math.min(step * 0.8, 160);

  svg.append('rect').attr('x', xPos - barWidth / 2).attr('y', y(stats.median)).attr('width', barWidth).attr('height', height - y(stats.median)).attr('fill', color);
  svg.append('text').attr('x', xPos).attr('y', y(stats.median) - 10).attr('text-anchor', 'middle').style('fill', color).style('font-family', 'sans-serif').style('font-size', '12px').text(fmt(stats.median));
}

function renderPivoted(ctx: ChartContext, opts: {
  selectedIds: number[];
  seriesLookup: Series[];
  data: SeriesData[];
  labels: (string | number)[];
}) {
  const { svg, x, y, props } = ctx;
  const interactive = props.interactive !== false;
  const theme = props.theme();
  const chartType = props.chartType();

  const medianTextY = new Map<string, number>();
  if (chartType === 'median') {
    const minGap = 14;
    for (let i = 0; i < opts.labels.length; i++) {
      const entries = opts.selectedIds
        .map(sid => ({ sid, value: opts.data.find(d => d.seriesId === sid)?.values[i] }))
        .filter(e => e.value !== undefined)
        .sort((a, b) => b.value - a.value);

      let lastTextY = -Infinity;
      for (const entry of entries) {
        const naturalY = y(entry.value) - 6;
        const textY = Math.max(naturalY, lastTextY + minGap);
        medianTextY.set(`${entry.sid}-${i}`, textY);
        lastTextY = textY;
      }
    }
  }

  for (const selectedId of opts.selectedIds) {
    const currentSeries = opts.seriesLookup.find(s => s.id === selectedId);
    const stats = opts.data.find(d => d.seriesId === selectedId);

    if (!currentSeries || !stats) continue;

    const color = getColor(theme, currentSeries);

    if (chartType === 'line') {
      const curve = line().x((d, i) => x(opts.labels[i])).y(d => y(d)).curve(curveMonotoneX);
      svg.append('path').datum(stats.values).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2).attr('d', curve);
      renderTooltipDot(svg, stats.values, x, y, color, selectedId, (_d, i) => x(opts.labels[i]), interactive);
    } else if (chartType === 'bar') {
      const groupCount = opts.selectedIds.length;
      const groupIndex = opts.selectedIds.indexOf(selectedId);
      if (!isPointScale(x)) return;
      const step = x.step();
      const totalBarWidth = Math.min(step * 0.8, 160);
      const barWidth = totalBarWidth / groupCount;

      stats.values.forEach((value, i) => {
        const xPos = x(opts.labels[i]);
        const offset = (groupIndex - (groupCount - 1) / 2) * barWidth;
        svg.append('rect').attr('x', xPos + offset - barWidth / 2).attr('y', y(value)).attr('width', barWidth).attr('height', ctx.height - y(value)).attr('fill', color);
        if (groupCount <= 4) {
          svg.append('text').attr('x', xPos + offset).attr('y', y(value) - 4).attr('text-anchor', 'middle').style('fill', color).style('font-family', 'sans-serif').style('font-size', '10px').text(ctx.fmt(value));
        }
      });
    } else if (chartType === 'median') {
      stats.values.forEach((value, i) => {
        const cx = x(opts.labels[i]);
        const textY = medianTextY.get(`${selectedId}-${i}`) ?? y(value) - 6;
        svg.append('circle').attr('cx', cx).attr('cy', y(value)).attr('r', 4).attr('fill', color).attr('stroke', color).attr('stroke-width', 2);
        svg.append('text').attr('x', cx + 6).attr('y', textY).style('fill', color).style('font-family', 'sans-serif').style('font-size', '12px').text(ctx.fmt(value));
      });
    } else if (chartType === 'scatter') {
      svg.selectAll(`circle-t-${selectedId}`).data(stats.values).enter().append('circle').attr('cx', (d, i) => x(opts.labels[i])).attr('cy', d => y(d)).attr('r', 3).attr('fill', color).attr('opacity', 0.6);
    } else if (chartType === 'box') {
      stats.values.forEach((value, i) => {
        const xPos = x(opts.labels[i]);
        svg.append('circle').attr('cx', xPos).attr('cy', y(value)).attr('r', 4).attr('fill', color).attr('stroke', color).attr('stroke-width', 1);
      });
    }
  }
}

const chartRenderers: Record<string, (ctx: ChartContext, stats: SeriesData, color: string, selectedId: number) => void> = {
  median: renderMedian,
  box: renderBox,
  scatter: renderScatter,
  line: renderLine,
  bar: renderBar,
};

function renderLegend(ctx: ChartContext, width: number) {
  const { svg, props } = ctx;
  const position = props.legendPosition();
  if (position === 'n') return;

  const isRight = position.includes('r');
  const isTop = position.includes('t');
  const legendX = isRight ? width * 0.95 : width * 0.05;
  const legendY = isTop ? 20 : ctx.height - 30;
  const textAnchor = isRight ? 'end' : 'start';
  const circleOffset = isRight ? 20 : -15;
  const theme = props.theme();

  const legend = svg.append('g').attr('class', 'legend').attr('transform', `translate(${legendX}, ${legendY})`);
  const useSeriesX = ctx.pivotMode === 'pivoted' || ctx.pivotMode === 'transposed-pivoted';
  const topTen = (useSeriesX ? props.selectedSeriesX() : props.selectedSeries()).slice(0, 10);

  legend
    .selectAll('g')
    .data(topTen)
    .enter()
    .append('g')
    .attr('transform', (_, i) => `translate(0, ${isTop ? i * 25 : (i + 1 - topTen.length) * 25})`)
    .each(function (selectedId) {
      const currentSeries = (useSeriesX ? props.seriesX : props.series).find(s => s.id === selectedId);
      if (!currentSeries) return;
      const elementColor = getColor(theme, currentSeries);
      const g = select(this);
      g.append('text').attr('x', 0).attr('y', 10).style('fill', elementColor).style('font-family', 'sans-serif').attr('text-anchor', textAnchor).text(currentSeries.label);
      g.append('circle').attr('cx', circleOffset).attr('cy', 6).attr('r', 4).style('fill', elementColor);
    });
}

export const renderSVG = (props: RenderProps) => {
  const hasSeriesX = props.seriesX.length > 0;
  const pivotMode = (() => {
    const m = props.pivotMode();
    if (hasSeriesX) return m;
    return m === 'pivoted' ? 'none' : m === 'transposed' ? 'transposed-pivoted' : m;
  })();
  const chartType = props.chartType();
  const isIndexBased = (pivotMode === 'none' || pivotMode === 'transposed-pivoted') && (chartType === 'scatter' || chartType === 'line');
  const interactive = props.interactive !== false;
  const margin = { top: 30, right: 4, bottom: 90, left: 60 };
  const svgWidth = props.svgRef.clientWidth;
  const svgHeight = props.svgRef.clientHeight;
  const width = svgWidth - margin.left - margin.right;
  const height = svgHeight - margin.bottom;

  select(props.svgRef).selectAll('*').remove();

  if (props.data().length === 0) return;

  const root = select(props.svgRef);

  root.attr('role', 'img');
  root.append('title').text(props.config()?.title ?? 'Venz chart');

  const svg = root.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const pad = 1;

  if (interactive) {
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
  }

  const getLinearScale = () => {
    const d = pivotMode === 'transposed-pivoted' ? transpose(props.data()) : props.data();
    const _max = max(d.map(s => s.values.length ?? 0));
    return scaleLinear()
      .domain([0, _max ? _max - 1 : 0])
      .range([0, width])
      .nice();
  };

  const isLabeled = Boolean(props.data()[0]?.label);
  const isSelected = (_, index: number) => props.selectedSeries().includes(index);

  const getLabeledScale = () => {
    const sort = props.config()?.sort;
    const data = props.data();
    const selected =
      pivotMode === 'pivoted'
        ? data.map(m => m.label)
        : pivotMode === 'transposed' || pivotMode === 'transposed-pivoted'
          ? props.seriesX.map(s => s.label)
          : data.filter(isSelected).map(m => (isLabeled ? m.label : m.seriesId));
    const domain = [...new Set(selected)];
    if (props.sortMode() === 'original') {
      if (sort === 'semver') domain.sort((a, b) => valid(a) ? (valid(b) ? compare(a, b) : -1) : valid(b) ? 1 : 0);
      else if (sort === 'datetime') domain.sort((a, b) => new Date(a) - new Date(b));
    } else {
      domain.sort((a, b) => {
        const aMetric = data.find(m => (isLabeled ? m.label : m.seriesId) === a)?.median ?? 0;
        const bMetric = data.find(m => (isLabeled ? m.label : m.seriesId) === b)?.median ?? 0;
        return props.sortMode() === 'ascending' ? aMetric - bMetric : bMetric - aMetric;
      });
    }
    return scalePoint().domain(domain).range([0, width]).padding(pad);
  };

  const x = isIndexBased ? getLinearScale() : getLabeledScale();

  const pivotedData = () => {
    const m = pivotMode;
    return m === 'pivoted' || m === 'transposed-pivoted' ? transpose(props.data()) : props.data();
  };

  const getYScale = () => {
    const values =
      pivotMode !== 'none'
        ? pivotedData().flatMap(d => d.values)
        : chartType === 'bar'
          ? props.data().map(s => s.median)
          : props.data().filter(s => props.selectedSeries().includes(s.seriesId)).flatMap(s => s.max);

    return scaleLinear().domain([0, Math.max(...values) * 1.05]).range([height, 0]).nice();
  };

  const getYScaleWithBreak = () => {
    const breakWidth = 8;
    const start = height * 0.9;
    const unit = (height * 0.1) / 5;

    svg.append('path').attr('d', `M 0,${start} v ${unit * 2},0`).style('stroke', 'currentColor').style('stroke-width', 1);
    svg.append('path').attr('d', `M -${breakWidth},${start + unit * 2} l ${breakWidth * 2},0`).attr('transform', `rotate(-10, 0, ${start + unit * 2})`).style('stroke', 'currentColor').style('stroke-width', 2);
    svg.append('path').attr('d', `M -${breakWidth},${start + unit * 3} l ${breakWidth * 2},0`).attr('transform', `rotate(-10, 0, ${start + unit * 3})`).style('stroke', 'currentColor').style('stroke-width', 2);
    svg.append('path').attr('d', `M 0,${start + unit * 3} v ${unit * 2},0`).style('stroke', 'currentColor').style('stroke-width', 1);

    const selected = props.data().filter(s => props.selectedSeries().includes(s.seriesId));
    const values =
      pivotMode !== 'none'
        ? pivotedData().flatMap(d => d.values)
        : chartType === 'median'
          ? selected.flatMap(s => [s.median - s.stddev, s.median + s.stddev])
          : chartType === 'bar'
            ? props.data().map(s => s.median)
            : selected.flatMap(s => [s.min, s.max]);

    return scaleLinear().domain([Math.min(...values) * 0.99, Math.max(...values) * 1.01]).range([height, 0]).nice();
  };

  const y = props.fullRange() ? getYScale() : getYScaleWithBreak();

  svg.append('g').attr('class', 'grid').style('stroke', 'currentColor').style('opacity', 0.2).call(axisLeft(y).tickSize(-width).tickFormat(() => ''));

  if (chartType !== 'bar') {
    svg.append('g').attr('class', 'grid').attr('transform', `translate(0, ${height})`).style('stroke', 'currentColor').style('opacity', 0.2).call(axisBottom(x).tickSize(-height).tickFormat(() => ''));
  }

  const rawUnit = props.config()?.rawUnit;
  const allValues = props.data().flatMap(d => d.values);
  const representative = allValues.length > 0 ? allValues.reduce((a, b) => a + b, 0) / allValues.length : 0;
  const displayUnit = rawUnit ? bestDisplayUnit(rawUnit, Math.abs(representative)) : bestScaleFactor(Math.abs(representative));
  const convert = displayUnit?.convert ?? (n => n);

  const formatConverted = (n: number) => {
    const v = convert(n);
    const decimals = getDecimals([v]);
    return v.toFixed(decimals);
  };

  const tickFormat = (d: number) =>
    !props.fullRange() && (rawUnit ? d === 0 : d === y.domain()[0]) ? '' : formatConverted(d);

  svg.append('g').call(axisLeft(y).tickFormat(tickFormat)).selectAll('text').style('fill', 'currentColor');

  const labels = x.domain().map(d => String(d));
  const isDenseTicks = labels.length > 20 || labels.reduce((acc, l) => acc + l.length, 0) > 100;

  const xAxisG = svg
    .append('g')
    .attr('transform', `translate(0,${height})`)
    .call(axisBottom(x));

  xAxisG
    .selectAll('text')
    .style('fill', 'currentColor')
    .attr('transform', () => (isDenseTicks ? 'rotate(-45)' : null))
    .attr('text-anchor', isDenseTicks ? 'end' : 'middle')
    .attr('dy', isDenseTicks ? '.1em' : '0.7em')
    .attr('dx', isDenseTicks ? '-.8em' : null)
    .text(d =>
      isIndexBased
        ? Number.isInteger(d) ? Number(d) + 1 : ''
        : pivotMode === 'transposed' || pivotMode === 'transposed-pivoted' ? d : (props.series[d]?.label || d)
    );

  if (!isDenseTicks && isIndexBased) {
    xAxisG.select('.tick:last-of-type text').attr('text-anchor', 'end');
  }

  const labelY = props.config()?.labelY ?? (displayUnit ? `median (${displayUnit.label})` : 'median');

  svg.append('text').attr('x', width / 2).attr('y', height + 10 + margin.bottom / 2).attr('text-anchor', 'middle').style('fill', 'currentColor').style('font-family', 'sans-serif').text(props.config()?.labelX ?? 'Run #');
  svg.append('text').attr('x', -height / 2).attr('y', -45).attr('transform', 'rotate(-90)').attr('text-anchor', 'middle').style('fill', 'currentColor').style('font-family', 'sans-serif').text(labelY);

  const ctx: ChartContext = { svg, x, y, height, props, pivotMode, fmt: formatConverted };

  renderLegend(ctx, width);

  if (pivotMode === 'pivoted') {
    renderPivoted(ctx, {
      selectedIds: props.selectedSeriesX(),
      seriesLookup: props.seriesX,
      data: transpose(props.data()),
      labels: props.data().map(d => d.label ?? d.seriesId),
    });
  } else if (pivotMode === 'transposed') {
    renderPivoted(ctx, {
      selectedIds: props.selectedSeries(),
      seriesLookup: props.series,
      data: props.data(),
      labels: props.seriesX.map(s => s.label),
    });
  } else if (pivotMode === 'transposed-pivoted') {
    const renderer = chartRenderers[chartType];
    const theme = props.theme();
    const tData = transpose(props.data());
    for (const selectedId of props.selectedSeriesX()) {
      const currentSeries = props.seriesX.find(s => s.id === selectedId);
      const stats = tData.find(d => d.seriesId === selectedId);
      if (!currentSeries || !stats) continue;
      renderer(ctx, { ...stats, label: currentSeries.label }, getColor(theme, currentSeries), selectedId);
    }
  } else {
    const renderer = chartRenderers[chartType];
    const theme = props.theme();
    for (const selectedId of props.selectedSeries()) {
      const currentSeries = props.series.find(s => s.id === selectedId);
      const stats = props.data().find(d => d.seriesId === selectedId);
      if (!currentSeries || !stats) continue;
      renderer(ctx, stats, getColor(theme, currentSeries), selectedId);
    }
  }
};
