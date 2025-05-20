import { isHyperfineJSON, transformHyperfineData } from './hyperfine.ts';
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

export function transform(
  input: string,
  id: number,
  seriesId?: number,
  config?: Configuration,
  data?: SeriesData[]
): { config: undefined | Configuration; data: SeriesData[] } {
  if (typeof input !== 'string') throw new Error('Input must be a string');
  if (input.length === 0) return { config: undefined, data: [] };

  try {
    const json = JSON.parse(input);
    if (isHyperfineJSON(json)) {
      return transformHyperfineData(json, id, seriesId, config);
    }

    if (Array.isArray(json)) {
      if (json.every(isLabelValueTuple)) {
        return transformLabeledData(json, id, seriesId, config, data);
      }

      if (json.every(v => typeof v === 'number')) {
        return transformData([json], id, seriesId, config, data);
      }

      if (json.every(v => Array.isArray(v) && v.every(v => typeof v === 'number'))) {
        return transformData(json, id, seriesId, config, data);
      }
    }
  } catch (error) {
    if (isLabeledRawData(input)) {
      return transformLabeledData(parseLabeledValues(input), id, seriesId, config, data);
    }

    if (isRawNumericData(input)) {
      return transformRawData(input, id, seriesId, config, data);
    }

    if (isLabeledColumnsRawData(input)) {
      return transformLabeledColumnsData(parseLabeledColumnValues(input), id, seriesId, config, data);
    }

    console.error(error);
  }

  return { config: undefined, data: [] };
}
