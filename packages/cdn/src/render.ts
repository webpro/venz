import { parseHTML } from "linkedom";
import { renderSVG, type RenderProps } from "@venz/shared/render";
import { transform, SEPARATOR } from "@venz/shared/adapter";
import { configTypes, type SeriesData } from "@venz/shared/types";
import { getPivotMode } from "@venz/shared/chart";
import type { Theme, ChartType, LegendPosition } from "@venz/shared/chart";

const THEME_FG: Record<Theme, string> = { dark: "#fff", light: "#000", "high-contrast": "#ff0" };

const CHART_TYPES: ChartType[] = ["box", "median", "scatter", "line", "bar"];
const LEGEND_POSITIONS: LegendPosition[] = ["tr", "tl", "br", "bl", "n"];

function parseParams(params: URLSearchParams) {
  const getAll = (key: string) => params.getAll(key);
  const get = (key: string) => params.get(key);

  const labels = getAll("label");
  const values = getAll("data");

  const input =
    values.length === 1 && (values[0].startsWith("{") || values[0].startsWith("["))
      ? values[0]
      : labels.length === values.length
        ? labels.map((label, i) => [label, values[i].split(SEPARATOR).map(Number)])
        : values;

  const ct = get("ct");
  const initialConfig = {
    type: typeof ct === "string" && configTypes.includes(ct as any) ? ct : "standard",
    labelX: get("labelX") ?? get("lx") ?? undefined,
    labelY: get("labelY") ?? get("ly") ?? undefined,
    labels: getAll("l"),
    colors: getAll("color"),
    commands: getAll("command"),
  };

  const { config, data } = transform(input, { initialConfig });

  const typeParam = get("type");
  const chartType: ChartType = CHART_TYPES.includes(typeParam as ChartType)
    ? (typeParam as ChartType)
    : typeParam === "pivot"
      ? "line"
      : "median";
  const pivotMode = getPivotMode(typeParam, get("p"), get("t"));
  const lpParam = get("lp");
  const legendPosition: LegendPosition = LEGEND_POSITIONS.includes(lpParam as LegendPosition)
    ? (lpParam as LegendPosition)
    : "tr";
  const fullRange = get("br") !== "1";

  return { chartType, pivotMode, legendPosition, fullRange, config, data };
}

export function renderChart(
  params: URLSearchParams,
  width: number,
  height: number,
  padding: number,
  theme: Theme,
): string {
  const { chartType, pivotMode, legendPosition, fullRange, config, data } = parseParams(params);

  const innerWidth = width - 2 * padding;
  const innerHeight = height - 2 * padding;

  const { document } = parseHTML("<!DOCTYPE html><html><body></body></html>");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  document.body.appendChild(svg);

  Object.defineProperty(svg, "clientWidth", { value: innerWidth, configurable: true });
  Object.defineProperty(svg, "clientHeight", { value: innerHeight, configurable: true });

  const series = config?.series ?? [];
  const seriesX = config?.seriesX ?? [];
  const selectedSeries = series.map((s) => s.id);
  const selectedSeriesX = seriesX.map((s) => s.id);

  const props: RenderProps = {
    svgRef: svg as unknown as SVGSVGElement,
    config: () => config,
    data: () => data as SeriesData[],
    series,
    selectedSeries: () => selectedSeries,
    seriesX,
    selectedSeriesX: () => selectedSeriesX,
    chartType: () => chartType,
    pivotMode: () => pivotMode,
    legendPosition: () => legendPosition,
    sortMode: () => "original",
    fullRange: () => fullRange,
    theme: () => theme,
    interactive: false,
  };

  renderSVG(props);

  const fg = THEME_FG[theme];
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("viewBox", `${-padding} ${-padding} ${width} ${height}`);
  svg.setAttribute("font-size", "16px");

  return svg
    .toString()
    .replaceAll("currentColor", fg)
    .replace(/font-size:\s*(\d+)px/g, (_, s) => `font-size:${Math.round(Number(s) * 1.6)}px`)
    .replace(/font-size="(\d+)"/g, (_, s) => `font-size="${Math.round(Number(s) * 1.6)}"`);
}
