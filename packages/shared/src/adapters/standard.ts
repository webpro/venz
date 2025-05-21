import type { Configuration, Statistics, Series, SeriesData, JsonValue, ConfigList, ConfigStandard } from '../types.ts';
import { getNextAvailableColor } from '../colors.ts';
import type { InitialConfig, Options } from './index.ts';

export function calculateStats(values: number[]): Statistics {
  const sorted = values.toSorted((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;

  return {
    values,
    mean,
    median: sorted[Math.floor(sorted.length / 2)],
    stddev: Math.sqrt(variance),
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

function parseRawValues(input: string): number[] {
  return input
    .split(/[\s,;]+/)
    .map(v => Number.parseFloat(v.trim()))
    .filter(n => !Number.isNaN(n));
}

export function isRawNumericData(input: string): boolean {
  const trimmed = input.trim();
  const hasNumbers = /^[\d.\s,;\n]+$/.test(trimmed);
  if (!hasNumbers) return false;
  const lines = trimmed.split('\n').filter(line => line.trim());
  const isOneNumberPerLine = lines.every(line => parseRawValues(line).length === 1);
  return isOneNumberPerLine ? parseRawValues(trimmed).length > 0 : lines.some(line => parseRawValues(line).length > 0);
}

const createSeries = (id: number, configId: number, seriesNumber: number, existingSeries: Series[] = []): Series => ({
  id,
  configId,
  label: `Series ${seriesNumber}`,
  command: '',
  color: getNextAvailableColor(existingSeries),
});

export function isLabeledColumnsRawData(input: string): boolean {
  try {
    const lines = input
      .trim()
      .split('\n')
      .filter(line => line.trim());
    const labels = lines[0].split(/[\s,;]+/).filter(label => label.trim());
    const values = lines[2].split(/[\s,;]+/).filter(value => value.trim());
    return labels.every(value => /\w/.test(value)) && values.every(value => /^[\d\.]+$/.test(value));
  } catch {
    return false;
  }
}

export function isLabeledRawData(input: string): boolean {
  try {
    const lines = input
      .trim()
      .split('\n')
      .filter(line => line.trim());
    const parts = lines[0].split(/[\s,;]+/);
    return parts.length >= 2 && isNaN(Number(parts[0])) && !isNaN(Number(parts[1]));
  } catch {
    return false;
  }
}

export function parseLabeledColumnValues(input: string): [string[], number[][]] {
  const lines = input.split('\n').filter(line => line.trim());
  const labels = lines[0].split(/[\s,;]+/).map(col => col.trim());
  const values = Array.from({ length: labels.length }, () => [] as number[]);
  for (let i = 1; i < lines.length; i++) {
    const numbers = lines[i]
      .split(/[\s,;]+/)
      .map(v => Number.parseFloat(v))
      .filter(n => !isNaN(n));
    if (numbers.length === labels.length) {
      numbers.forEach((num, colIndex) => values[colIndex].push(num));
    }
  }
  return [labels, values];
}

export function parseLabeledValues(input: string): Array<[string, number[]]> {
  return input
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const [label, ...values] = line.split(/[\s,;]+/);
      const numbers = values.map(Number).filter(n => !isNaN(n));
      return numbers.length > 0 ? [label, numbers] : null;
    })
    .filter((pair): pair is [string, number[]] => pair !== null);
}

export function transformData(values: number[][], options: Options) {
  const { configId, seriesId, config: existingConfig, data: existingData } = options;

  const now = new Date();
  const timestamp = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

  const series: Series[] = [...(existingConfig?.series ?? [])];
  const startId = existingConfig ? Math.max(...existingConfig.series.map(s => s.id)) + 1 : (seriesId ?? 0);
  const startSeriesId = series.length + 1;

  const data: SeriesData[] = existingData ?? [];

  for (let index = 0; index < values.length; index++) {
    series.push(createSeries(startId + index, configId, startSeriesId + index, series));
  }

  for (let i = 0; i < values.length; i++) {
    data.push({
      ...calculateStats(values[i]),
      id: startId + i,
      seriesId: startId + i,
    });
  }

  const config: ConfigStandard = existingConfig
    ? { ...existingConfig, series }
    : { id: configId, title: `Raw data input (${timestamp})`, type: 'standard', series };

  return { config, data };
}

export function transformRawData(input: string, options: Options) {
  const lines = input.split('\n').filter(line => line.trim());
  const isOneNumberPerLine = lines.every(line => parseRawValues(line).length === 1);
  const values = isOneNumberPerLine
    ? [parseRawValues(input)]
    : lines.map(parseRawValues).filter(values => values.length > 0);

  return transformData(values, options);
}

export const isLabelValueTuple = (arr: JsonValue) =>
  Array.isArray(arr) &&
  arr.length === 2 &&
  typeof arr[0] === 'string' &&
  (typeof arr[1] === 'number' || (Array.isArray(arr[1]) && arr[1].every(v => typeof v === 'number')));

export function transformLabeledColumnsData(input: [string[], number[][]], options: Options) {
  const { configId, config: existingConfig, data: existingData } = options;

  const now = new Date();
  const timestamp = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

  const series: Series[] = [...(existingConfig?.series ?? [])];
  const data: SeriesData[] = [...(existingData ?? [])];

  const [headers, values] = input;

  for (let i = 0; i < headers.length; i++) {
    if (!series.find(s => s.label === headers[i])) {
      series.push({
        id: i,
        configId,
        label: headers[i],
        color: getNextAvailableColor(series),
      });

      data.push({
        ...calculateStats(values[i]),
        id: i,
        seriesId: i,
        values: values[i],
      });
    } else {
      const d = data.find(d => d.seriesId === i);
      if (d) Object.assign(d, calculateStats([...d.values, ...values[i]]));
    }
  }

  const config: Configuration = {
    id: configId,
    series,
    type: 'standard',
    title: `New labeled data series (${timestamp})`,
  };

  return { config, data };
}

export function transformLabeledData(input: Array<[string, number | number[]]>, options: Options) {
  const { configId, seriesId, config: existingConfig, data: existingData, initialConfig } = options;
  const now = new Date();
  const timestamp = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

  const nextId = existingConfig ? Math.max(...existingConfig.series.map(s => s.id)) + 1 : (seriesId ?? 0);

  const [label, values] = input[0];
  const size = Array.isArray(values) ? values.length : 1;
  const series: Series[] = existingConfig?.series ?? [];
  const labels: Series[] = existingConfig?.labels ?? [];
  const data: SeriesData[] = existingData ?? [];
  const sort = /\d{2}-\d{2}/.test(label) ? 'datetime' : /\d{1}\.\d{1,}\.\d{1}/.test(label) ? 'semver' : undefined;

  for (let i = 0; i < input.length; i++) {
    const [label, values] = input[i];
    const v = Array.isArray(values) ? values : [values];

    if (!series.some(s => s.label === label)) {
      series.push({
        id: nextId + i,
        configId,
        label,
        color: initialConfig?.colors?.[i] ?? getNextAvailableColor(series),
      });
    }

    if (!data.some(d => d.label === label)) {
      data.push({
        ...calculateStats(v),
        id: i,
        seriesId: nextId + i,
        label,
      });
    } else {
      const d = data.find(d => d.label === label);
      if (d) Object.assign(d, calculateStats([...d.values, ...v]));
    }
  }

  const l = labels.length;
  for (let i = l; i < l + size; i++) {
    labels.push({
      id: i,
      configId,
      label: initialConfig?.labels?.[i] ?? `Series ${i + 1}`,
      color: initialConfig?.colors?.[i] ?? getNextAvailableColor(labels),
    });
  }

  const config: ConfigStandard = existingConfig
    ? { ...existingConfig, series, labels }
    : {
        id: configId,
        title: `New labeled data series (${timestamp})`,
        type: 'standard',
        sort,
        series,
        labels,
        labelX: initialConfig?.labelX,
        labelY: initialConfig?.labelY,
      };

  return { config, data };
}
