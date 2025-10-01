import { select } from 'd3-selection';
import { scaleLinear, scalePoint } from 'd3-scale';
import { max } from 'd3-array';
import { axisLeft, axisBottom } from 'd3-axis';
import { curveMonotoneX, line } from 'd3-shape';
import { compare } from 'semver';
import type { Accessor } from 'solid-js';
import type { Configuration, Series, SeriesData } from '@venz/shared';
import type { Theme } from '../stores/theme';
import type { ChartType, LegendPosition, SortMode } from '../types';
import { transpose } from '../util/helpers';

type RenderProps = {
  svgRef: SVGSVGElement;
  config: Accessor<Configuration | undefined>;
  data: Accessor<SeriesData[]>;
  series: Series[];
  selectedSeries: Accessor<number[]>;
  seriesX: Series[];
  selectedSeriesX: Accessor<number[]>;
  chartType: Accessor<ChartType>;
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

  const pad = props.chartType() === 'pivot' ? 0 : 1;

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

  const getLinearScale = (props: RenderProps, width: number) => {
    const _max = max(props.data().map(s => s.values.length ?? 0));
    return scaleLinear()
      .domain([0, _max ? _max - 1 : 0])
      .range([0, width])
      .nice();
  };

  const isLabeled = Boolean(props.data()[0]?.label);

  const isSelected = (_, index: number) => props.selectedSeries().includes(index);

  const getLabeledScale = (props: RenderProps) => {
    const sort = props.config()?.sort;
    const data = props.data();
    const selected =
      props.chartType() === 'pivot'
        ? data.map(m => m.label)
        : data.filter(isSelected).map(m => (isLabeled ? m.label : m.seriesId));
    const domain = [...new Set(selected)];
    if (props.sortMode() === 'original') {
      if (sort === 'semver') domain.sort(compare);
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

  const x =
    props.chartType() === 'scatter' || props.chartType() === 'line'
      ? getLinearScale(props, width)
      : getLabeledScale(props);

  const getYScale = () => {
    const values =
      props.chartType() === 'pivot'
        ? transpose(props.data()).flatMap(d => d.values.filter(isSelected))
        : props.chartType() === 'bar'
          ? props.data().map(s => s.median)
          : props
              .data()
              .filter(s => props.selectedSeries().includes(s.seriesId))
              .flatMap(s => s.max);

    return scaleLinear()
      .domain([0, Math.max(...values) * 1.05])
      .range([height, 0])
      .nice();
  };

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

    const values =
      props.chartType() === 'median' || props.chartType() === 'bar'
        ? props.data().map(s => s.median)
        : props.chartType() === 'pivot'
          ? transpose(props.data()).flatMap(d => d.values.filter(isSelected))
          : props
              .data()
              .filter(s => props.selectedSeries().includes(s.seriesId))
              .flatMap(s => [s.min, s.max]);

    return scaleLinear()
      .domain([Math.min(...values) * 0.9, Math.max(...values) * 1.01])
      .range([height, 0])
      .nice();
  };

  const y = props.fullRange() ? getYScale() : getYScaleWithBreak();

  svg
    .append('g')
    .attr('class', 'grid')
    .style('stroke', 'currentColor')
    .style('opacity', 0.2)
    .call(
      axisLeft(y)
        .tickSize(-width)
        .tickFormat(() => '')
    );

  if (props.chartType() !== 'bar') {
    svg
      .append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0, ${height})`)
      .style('stroke', 'currentColor')
      .style('opacity', 0.2)
      .call(
        axisBottom(x)
          .tickSize(-height)
          .tickFormat(() => '')
      );
  }

  svg
    .append('g')
    .call(axisLeft(y).tickFormat(props.fullRange() ? null : d => (d === y.domain()[0] ? '' : d)))
    .selectAll('text')
    .style('fill', 'currentColor');

  const isAlignEnd = props.chartType() === 'scatter' || props.chartType() === 'line' || props.chartType() === 'pivot';

  const labels = x.domain().map(d => String(d));

  const isDenseTicks = labels.length > 20 || labels.reduce((acc, l) => acc + l.length, 0) > 100;

  svg
    .append('g')
    .attr('transform', `translate(0,${height})`)
    .call(axisBottom(x))
    .selectAll('text')
    .style('fill', 'currentColor')
    .attr('transform', () => (isDenseTicks ? 'rotate(-45)' : null))
    .attr('text-anchor', (d, i, r) =>
      isAlignEnd && r.length !== 1 && r.length === i + 1 ? 'end' : isDenseTicks ? 'end' : 'middle'
    )
    .attr('dy', isDenseTicks ? '.1em' : '0.7em')
    .attr('dx', isDenseTicks ? '-.8em' : null)
    .text(d =>
      props.chartType() === 'scatter' || props.chartType() === 'line'
        ? Number.isInteger(d)
          ? Number(d) + 1
          : ''
        : props.series[d]?.label || d
    );

  svg
    .append('text')
    .attr('x', width / 2)
    .attr('y', height + 10 + margin.bottom / 2)
    .attr('text-anchor', 'middle')
    .style('fill', 'currentColor')
    .style('font-family', 'sans-serif')
    .text(props.config()?.labelX ?? 'Run #');

  svg
    .append('text')
    .attr('x', -height / 2)
    .attr('y', -45)
    .attr('transform', 'rotate(-90)')
    .attr('text-anchor', 'middle')
    .style('fill', 'currentColor')
    .style('font-family', 'sans-serif')
    .text(props.config()?.labelY ?? `median (s)`);

  if (props.legendPosition() !== 'n') {
    const isRight = props.legendPosition().includes('r');
    const isTop = props.legendPosition().includes('t');
    const legendX = isRight ? width * 0.95 : width * 0.05;
    const legendY = isTop ? 20 : height - 30;
    const textAnchor = isRight ? 'end' : 'start';
    const circleOffset = isRight ? 20 : -15;

    const legend = svg.append('g').attr('class', 'legend').attr('transform', `translate(${legendX}, ${legendY})`);

    const topTen = (props.chartType() === 'pivot' ? props.selectedSeriesX() : props.selectedSeries()).slice(0, 10);

    legend
      .selectAll('g')
      .data(topTen)
      .enter()
      .append('g')
      .attr(
        'transform',
        (_, i) => `translate(0, ${props.legendPosition().includes('t') ? i * 25 : (i + 1 - topTen.length) * 25})`
      )
      .each(function (selectedId) {
        const currentSeries = (props.chartType() === 'pivot' ? props.seriesX : props.series).find(
          s => s.id === selectedId
        );
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

  if (props.chartType() === 'pivot') {
    for (const selectedId of props.selectedSeriesX()) {
      const currentSeries = props.seriesX.find(s => s.id === selectedId);
      const stats = transpose(props.data()).find(d => d.seriesId === selectedId);

      if (!currentSeries || !stats) continue;

      const color = props.theme() === 'high-contrast' ? 'currentColor' : currentSeries.color;

      const labels = props.data().map(d => d.label ?? d.seriesId);

      const curve = line()
        .x((d, i) => x(labels[i]))
        .y(d => y(d))
        .curve(curveMonotoneX);

      svg
        .append('path')
        .datum(stats.values)
        .attr('class', 'line')
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('d', curve);

      svg
        .selectAll(`circle-${selectedId}`)
        .data(stats.values)
        .enter()
        .append('g')
        .attr('transform', (d, i) => `translate(${x(labels[i])},${y(d)})`)
        .each(function (d, i) {
          const g = select(this);
          g.append('circle').attr('r', 12).attr('fill', 'transparent').attr('class', 'hit-area');
          g.append('circle').attr('r', 3).attr('fill', color).attr('class', 'visible-dot');

          const isFirst = i === 0;
          const isLast = i === stats.values.length - 1;
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
    }
  } else {
    for (const selectedId of props.selectedSeries()) {
      const currentSeries = props.series.find(s => s.id === selectedId);
      const stats = props.data().find(d => d.seriesId === selectedId);

      if (!currentSeries || !stats) continue;

      const color = props.theme() === 'high-contrast' ? 'currentColor' : currentSeries.color;

      if (props.chartType() === 'median') {
        const radius = Math.abs(y(stats.median) - y(stats.median + stats.stddev));
        const decimals = Math.min(3, Math.max(...stats.values.map(n => (n.toString().split('.')[1] || '').length)));

        const cx = x(selectedId) || x(stats.label);

        svg
          .append('circle')
          .attr('cx', cx)
          .attr('cy', y(stats.median))
          .attr('r', radius)
          .attr('fill', color)
          .attr('fill-opacity', 0.2);

        svg
          .append('circle')
          .attr('cx', cx)
          .attr('cy', y(stats.median))
          .attr('r', 4)
          .attr('fill', color)
          .attr('stroke', color)
          .attr('stroke-width', 2);

        svg
          .append('text')
          .attr('x', cx + 6)
          .attr('y', y(stats.median) - 6)
          .style('fill', color)
          .style('font-family', 'sans-serif')
          .style('font-size', '12px')
          .text(stats.median.toFixed(decimals));
      } else if (props.chartType() === 'box') {
        const sortedValues = stats.values.toSorted((a, b) => a - b);
        const q1 = sortedValues[Math.floor(sortedValues.length * 0.25)];
        const q3 = sortedValues[Math.floor(sortedValues.length * 0.75)];

        const xPos = x(selectedId) || x(stats.label);
        const boxWidth = Math.max(10, 50 - props.data().length * 1.5);
        const halfWidth = boxWidth / 2;

        svg
          .append('rect')
          .attr('x', xPos - halfWidth)
          .attr('y', y(q3))
          .attr('width', boxWidth)
          .attr('height', y(q1) - y(q3))
          .attr('fill', color)
          .attr('fill-opacity', 0.2)
          .attr('stroke', color);

        svg
          .append('line')
          .attr('x1', xPos - halfWidth)
          .attr('x2', xPos + halfWidth)
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
        const xPos = x(selectedId) || x(stats.label);
        const barWidth = Math.max(10, 50 - props.data().length * 1.5);

        svg
          .append('rect')
          .attr('x', xPos - barWidth / 2)
          .attr('y', y(stats.median))
          .attr('width', barWidth)
          .attr('height', height - y(stats.median))
          .attr('fill', color);

        const decimals = Math.min(3, Math.max(...stats.values.map(n => (n.toString().split('.')[1] || '').length)));

        svg
          .append('text')
          .attr('x', xPos)
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
