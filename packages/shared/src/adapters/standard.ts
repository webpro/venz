import type { Configuration, Statistics, Series, SeriesData, JsonValue } from '../types';
import { getNextAvailableColor } from '../colors';

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
    if (parts.length !== 2) return false;
    return isNaN(Number(parts[0])) && !isNaN(Number(parts[1]));
  } catch {
    return false;
  }
}

export function parseLabeledColumnValues(input: string): [string[], number[][]] {
  const lines = input.split('\n').filter(line => line.trim());
  const labels = lines[0].split(/[\s,;]+/).map(col => col.trim());
  const valuess = Array.from({ length: labels.length }, () => [] as number[]);
  for (let i = 1; i < lines.length; i++) {
    const numbers = lines[i]
      .split(/[\s,;]+/)
      .map(v => Number.parseFloat(v))
      .filter(n => !isNaN(n));
    if (numbers.length === labels.length) {
      numbers.forEach((num, colIndex) => valuess[colIndex].push(num));
    }
  }
  return [labels, valuess];
}

export function parseLabeledValues(input: string): Array<[string, number]> {
  return input
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const [label, value] = line.split(/[\s,;]+/);
      const num = Number.parseFloat(value);
      return !isNaN(num) ? [label, num] : null;
    })
    .filter((pair): pair is [string, number] => pair !== null);
}

export function transformData(values: number[][], configId: number, seriesId?: number, existingConfig?: Configuration) {
  const now = new Date();
  const timestamp = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

  const series: Series[] = [...(existingConfig?.series ?? [])];
  const startId = existingConfig ? Math.max(...existingConfig.series.map(s => s.id)) + 1 : (seriesId ?? 0);
  const startSeriesId = series.length + 1;

  for (let index = 0; index < values.length; index++) {
    series.push(createSeries(startId + index, configId, startSeriesId + index, series));
  }

  const data: SeriesData[] = values.map((nums, i) => ({
    ...calculateStats(nums),
    id: startId + i,
    seriesId: startId + i,
  }));

  const config: Configuration = existingConfig
    ? { ...existingConfig, series }
    : { id: configId, title: `Raw data input (${timestamp})`, type: 'standard', series };

  return { config, data };
}

export function transformRawData(input: string, configId: number, seriesId?: number, existingConfig?: Configuration) {
  const lines = input.split('\n').filter(line => line.trim());
  const isOneNumberPerLine = lines.every(line => parseRawValues(line).length === 1);
  const values = isOneNumberPerLine
    ? [parseRawValues(input)]
    : lines.map(parseRawValues).filter(values => values.length > 0);

  return transformData(values, configId, seriesId, existingConfig);
}

export const isLabelValueTuple = (arr: JsonValue) =>
  Array.isArray(arr) && arr.length === 2 && typeof arr[0] === 'string' && typeof arr[1] === 'number';

export function transformLabeledColumnsData(
  input: [string[], number[][]],
  configId: number,
  seriesId?: number,
  existingConfig?: Configuration,
) {
  const now = new Date();
  const timestamp = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

  const series: Series[] = [];

  const data: SeriesData[] = [];

  const [headers, values] = input;

  for (let i = 0; i < headers.length; i++) {
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
  }

  const config: Configuration = {
    id: configId,
    series,
    type: 'standard',
    title: `New labeled data series (${timestamp})`,
  };

  return { config, data };
}

export function transformLabeledData(
  input: Array<[string, number]>,
  configId: number,
  seriesId?: number,
  existingConfig?: Configuration,
) {
  const now = new Date();
  const timestamp = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

  const nextId = existingConfig ? Math.max(...existingConfig.series.map(s => s.id)) + 1 : (seriesId ?? 0);

  const series: Series[] = [
    {
      id: nextId,
      configId,
      label: `Series ${nextId + 1}`,
      command: '',
      color: getNextAvailableColor(existingConfig?.series ?? []),
    },
  ];

  const data: SeriesData[] = input.map(([label, value], index) => ({
    ...calculateStats([value]),
    id: index,
    seriesId: nextId,
    values: [value],
    label,
    mean: value,
  }));

  const config: Configuration = existingConfig
    ? { ...existingConfig, series: [...existingConfig.series, ...series] }
    : {
        id: configId,
        title: `New labeled data series (${timestamp})`,
        type: 'list',
        sort: 'datetime',
        command: '',
        series,
      };

  return { config, data };
}
