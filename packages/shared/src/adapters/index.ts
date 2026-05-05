import { isHyperfineJSON, transformHyperfineData } from './hyperfine.ts';
import { isMitataJSON, transformMitataData } from './mitata.ts';
import { isTinybenchJSON, transformTinybenchData, isVitestBenchJSON, transformVitestBenchData } from './tinybench.ts';
import {
  isLabeledColumnsRawData,
  isLabeledRawData,
  isLabelValueTuple,
  isRawNumericData,
  parseLabeledColumnValues,
  parseLabeledValues,
  transformData,
  transformLabeledColumnsData,
  transformLabeledData,
  transformRawData,
} from './standard.ts';
import type { ConfigType, Configuration, JsonValue, RawUnit, SeriesData } from '../types.ts';

export { SEPARATOR, calculateStats } from './standard.ts';

export { generateCommand } from './hyperfine.ts';

export type InitialConfig = {
  type?: ConfigType;
  labelX?: string;
  labelY?: string;
  rawUnit?: RawUnit;
  labels?: string[];
  colors?: string[];
  commands?: string[];
};

export type Options = {
  configId?: number;
  seriesId?: number;
  config?: Configuration;
  data?: SeriesData[];
  initialConfig?: InitialConfig;
};

export function transform(
  input: string | JsonValue,
  options: Options = {}
): { config: undefined | Configuration; data: SeriesData[]; loss?: number } {
  const { configId = -1, seriesId, config } = options;

  if (typeof input !== 'string' && typeof input !== 'object')
    throw new Error('Input must be a string or a JSON object');

  if (!input || (typeof input === 'string' && input.length === 0)) return { config: undefined, data: [] };

  const result = (() => {
    try {
      const json = typeof input === 'string' ? JSON.parse(input) : input;

      if (isHyperfineJSON(json)) {
        return transformHyperfineData(json, configId, seriesId, config);
      }

      if (isMitataJSON(json)) {
        return transformMitataData(json, configId, seriesId, config);
      }

      if (isTinybenchJSON(json)) {
        return transformTinybenchData(json, configId, seriesId, config);
      }

      if (isVitestBenchJSON(json)) {
        return transformVitestBenchData(json, configId, seriesId, config);
      }

      if (Array.isArray(json)) {
        if (json.every(isLabelValueTuple)) {
          return transformLabeledData(json, options);
        }

        if (json.every(v => typeof v === 'number')) {
          return transformData([json], options);
        }

        if (json.every(v => Array.isArray(v) && v.every(v => typeof v === 'number'))) {
          return transformData(json, options);
        }

        if (json.every(v => typeof v === 'string')) {
          return transform(json.join('\n'), options);
        }
      }
    } catch (error) {
      if (typeof input === 'string') {
        if (isLabeledRawData(input)) {
          return transformLabeledData(parseLabeledValues(input), options);
        }

        if (isRawNumericData(input)) {
          return transformRawData(input, options);
        }

        if (isLabeledColumnsRawData(input)) {
          return transformLabeledColumnsData(parseLabeledColumnValues(input), options);
        }
      }

      console.error(error);

      if (typeof input === 'string') {
        try {
          const json = JSON.parse(input.replace(/'/g, '"').replace(/,\s*([}\]])/g, '$1'));
          if (Array.isArray(json)) return transform(json, options);
        } catch {}
      }
    }

    return { config: undefined, data: [] };
  })();

  console.log(
    `transform ${result.config?.type ?? 'unknown'} series=${result.config?.series?.length ?? 0} data=${result.data?.length ?? 0} unit=${result.config?.rawUnit ?? 'none'}\n${result.data?.map(d => `  [${d.seriesId}] median=${d.median} min=${d.min} max=${d.max} values=${d.values.slice(0, 5).join(',')}${d.values.length > 5 ? '...' : ''}`).join('\n')}`
  );

  return result;
}

export function transformLabeled(
  runs: Array<{ label: string; text: string }>,
  options: Options = {}
): { config: undefined | Configuration; data: SeriesData[] } | null {
  if (runs.length === 0) return null;

  const first = transform(runs[0].text, options);
  if (!first.config || first.data.length === 0) return null;

  const seriesLabels = first.config.series.map(s => s.label);
  const rawUnit = first.config.rawUnit;

  const labeledData: Array<[string, number[]]> = runs.map(({ label, text }) => {
    const { data } = transform(text, options);
    return [label, data.map(d => d.median)];
  });

  return transformLabeledData(labeledData, {
    ...options,
    initialConfig: {
      ...options.initialConfig,
      rawUnit,
      labels: seriesLabels,
    },
  });
}
