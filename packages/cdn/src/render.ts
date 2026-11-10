import { parseHTML } from 'linkedom';
import { renderSVG, type RenderProps } from '@venz/shared/render';
import { parseChartParams } from '@venz/shared/spec';
import type { Theme } from '@venz/shared/chart';

export const THEME_FG: Record<Theme, string> = { dark: '#fff', light: '#000', 'high-contrast': '#ff0' };

export function renderChart(
  params: URLSearchParams,
  width: number,
  height: number,
  padding: number,
  theme: Theme | null
): string {
  const { chartType, pivotMode, legendPosition, fullRange, config, data } = parseChartParams(params);

  const innerWidth = width - 2 * padding;
  const innerHeight = height - 2 * padding;

  const { document } = parseHTML('<!DOCTYPE html><html><body></body></html>');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  document.body.appendChild(svg);

  Object.defineProperty(svg, 'clientWidth', { value: innerWidth, configurable: true });
  Object.defineProperty(svg, 'clientHeight', { value: innerHeight, configurable: true });

  const series = config?.series ?? [];
  const seriesX = config?.seriesX ?? [];
  const selectedSeries = series.map(s => s.id);
  const selectedSeriesX = seriesX.map(s => s.id);

  const props: RenderProps = {
    svgRef: svg as unknown as SVGSVGElement,
    config: () => config,
    data: () => data,
    series,
    selectedSeries: () => selectedSeries,
    seriesX,
    selectedSeriesX: () => selectedSeriesX,
    chartType: () => chartType,
    pivotMode: () => pivotMode,
    legendPosition: () => legendPosition,
    sortMode: () => 'original',
    fullRange: () => fullRange,
    theme: () => theme ?? 'dark',
    interactive: false,
  };

  renderSVG(props);

  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', `${-padding} ${-padding} ${width} ${height}`);
  svg.setAttribute('font-size', '16px');

  if (theme === null) {
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = 'svg:root{color-scheme:light dark;color:CanvasText}';
    svg.insertBefore(style, svg.firstChild);
  } else {
    svg.setAttribute('style', `color:${THEME_FG[theme]}`);
  }

  return svg.toString();
}
