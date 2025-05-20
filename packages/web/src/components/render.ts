import { select } from 'd3-selection';
import { scaleLinear, scalePoint } from 'd3-scale';
import { max } from 'd3-array';
import { axisLeft, axisBottom } from 'd3-axis';
import { curveMonotoneX, line } from 'd3-shape';
import { compare } from 'semver';
import type { Accessor } from 'solid-js';
import type { Configuration, Series, SeriesData } from '@venz/shared';
import type { ChartType, LegendPosition, SortMode } from './Chart';
import type { Theme } from '../stores/theme';

type RenderProps = {
  svgRef: SVGSVGElement;
  config: Accessor<Configuration | undefined>;
  data: Accessor<SeriesData[]>;
  series: Series[];
  chartType: Accessor<ChartType>;
  selectedSeries: Accessor<number[]>;
  legendPosition: Accessor<LegendPosition>;
  sortMode: Accessor<SortMode>;
  fullRange: Accessor<boolean>;
  theme: () => Theme;
};

export const renderSVG = (props: RenderProps) => {
  const margin = { top: 30, right: 0, bottom: 90, left: 60 };
  const svgWidth = props.svgRef.clientWidth;
  const svgHeight = props.svgRef.clientHeight;
  const width = svgWidth - margin.left;
  const height = svgHeight - margin.bottom;

  select(props.svgRef).selectAll('*').remove();

  if (props.data().length === 0) return;

  const root = select(props.svgRef);

  root.attr('role', 'img');

  root.append('title').text(props.config()?.title ?? 'Venz chart');

  const svg = root.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const pad = props.config()?.type === 'list' ? 0 : 1;

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

  const getXLinearScale = (props: RenderProps, width: number) => {
    const maxLength = max(props.data().map(s => s.values.length ?? 0));
    return scaleLinear()
      .domain([0, maxLength ? maxLength - 1 : 0])
      .range([0, width]);
  };

  const getXPointsScale = (props: RenderProps) => {
    const sort = props.config()?.sort;

    const domain =
      sort === 'semver'
        ? [...new Set(props.data().map(m => m.label))].sort(compare)
        : sort === 'datetime'
          ? [...new Set(props.data().map(m => m.label))].sort((a, b) => new Date(a) - new Date(b))
          : props.sortMode() === 'original'
            ? props.selectedSeries().sort()
            : props.selectedSeries().sort((a, b) => {
                const aMetric = props.data().find(m => m.seriesId === a)?.median ?? 0;
                const bMetric = props.data().find(m => m.seriesId === b)?.median ?? 0;
                return props.sortMode() === 'ascending' ? aMetric - bMetric : bMetric - aMetric;
              });

    return scalePoint().domain(domain).range([0, width]).padding(pad);
  };

  const x =
    props.chartType() === 'scatter' || props.chartType() === 'line'
      ? getXLinearScale(props, width)
      : getXPointsScale(props);

  const getYScale = () =>
    scaleLinear()
      .domain([
        0,
        Math.max(
          ...props
            .data()
            .filter(s => props.selectedSeries().includes(s.seriesId))
            .flatMap(s => s.max),
        ),
      ])
      .range([height, 0])
      .nice();

  const getYScaleWithBreak = () => {
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
          ...props
            .data()
            .filter(s => props.selectedSeries().includes(s.seriesId))
            .flatMap(m => m.min),
        ),
        Math.max(
          ...props
            .data()
            .filter(s => props.selectedSeries().includes(s.seriesId))
            .flatMap(m => m.max),
        ),
      ])
      .range([height * 0.9, 0])
      .nice();
  };

  const y = props.fullRange() ? getYScale() : getYScaleWithBreak();

  svg
    .append('g')
    .attr('class', 'grid')
    .style('stroke', 'currentColor')
    .style('opacity', 0.2)
    .call(axisLeft(y).tickSize(-width).tickFormat(''));

  if (props.chartType() !== 'bar') {
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
    .attr('transform', () => (props.data().length > 10 ? 'rotate(-45)' : null))
    .attr('text-anchor', props.data().length > 10 ? 'end' : 'middle')
    .attr('dy', props.data().length > 10 ? '.1em' : '0.7em')
    .attr('dx', props.data().length > 10 ? '-.8em' : null)
    .text(d =>
      props.chartType() === 'scatter' || props.chartType() === 'line' ? Number(d) + 1 : props.series[d]?.label || d,
    );

  svg
    .append('text')
    .attr('x', width / 2)
    .attr('y', height + 10 + margin.bottom / 2)
    .attr('text-anchor', 'middle')
    .style('fill', 'currentColor')
    .style('font-family', 'sans-serif')
    .text(props.config()?.labelX || 'Run #');

  svg
    .append('text')
    .attr('x', -height / 2)
    .attr('y', -45)
    .attr('transform', 'rotate(-90)')
    .attr('text-anchor', 'middle')
    .style('fill', 'currentColor')
    .style('font-family', 'sans-serif')
    .text(props.config()?.labelY || `median (s)`);

  if (props.legendPosition() !== 'none') {
    const isRight = props.legendPosition().includes('Right');
    const isTop = props.legendPosition().includes('top');
    const legendX = isRight ? width * 0.95 : width * 0.05;
    const legendY = isTop ? 20 : height - 30;
    const textAnchor = isRight ? 'end' : 'start';
    const circleOffset = isRight ? 20 : -15;

    const legend = svg.append('g').attr('class', 'legend').attr('transform', `translate(${legendX}, ${legendY})`);

    legend
      .selectAll('g')
      .data(props.selectedSeries())
      .enter()
      .append('g')
      .attr(
        'transform',
        (_, i) =>
          `translate(0, ${props.legendPosition().includes('top') ? i * 25 : (i + 1 - props.selectedSeries().length) * 25})`,
      )
      .each(function (selectedId) {
        const currentSeries = props.series.find(s => s.id === selectedId);
        const elementColor = props.theme() === 'high-contrast' ? 'currentColor' : currentSeries.color;
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

  for (const selectedId of props.selectedSeries()) {
    const currentSeries = props.series.find(s => s.id === selectedId);
    const stats = props.data().find(d => d.seriesId === selectedId);

    if (!stats || !currentSeries) continue;

    const color = props.theme() === 'high-contrast' ? 'currentColor' : currentSeries.color;

    if (props.config()?.type === 'list') {
      const stats = props.data().filter(d => d.seriesId === selectedId);

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
      if (props.chartType() === 'median') {
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
      } else if (props.chartType() === 'box') {
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
      } else if (props.chartType() === 'scatter') {
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
      } else if (props.chartType() === 'line') {
        const curve = line()
          .x((d, i) => x(i))
          .y(d => y(d))
          .curve(curveMonotoneX);

        const values =
          props.sortMode() === 'original'
            ? stats.values
            : props.sortMode() === 'ascending'
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
      } else if (props.chartType() === 'bar') {
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
};
