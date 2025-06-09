import { isHyperfineJSON, transformHyperfineData } from './hyperfine.ts';
import { isMitataJSON, transformMitataData } from './mitata.ts';
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
import type { Configuration, SeriesData } from '../types.ts';

export { generateCommand } from './hyperfine.ts';

export type InitialConfig = { labelX?: string; labelY?: string; labels?: string[]; colors?: string[] };

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
): { config: undefined | Configuration; data: SeriesData[] } {
  const { configId = -1, seriesId, config } = options;

  if (typeof input !== 'string' && typeof input !== 'object')
    throw new Error('Input must be a string or a JSON object');

  if (input.length === 0) return { config: undefined, data: [] };

  try {
    const json = typeof input === 'string' ? JSON.parse(input) : input;

    if (isHyperfineJSON(json)) {
      return transformHyperfineData(json, configId, seriesId, config);
    }

    if (isMitataJSON(json)) {
      return transformMitataData(json, configId, seriesId, config);
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
  }

  return { config: undefined, data: [] };
}
