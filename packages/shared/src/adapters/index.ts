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
): { config: undefined | Configuration; data: SeriesData[] } {
  if (typeof input !== 'string') throw new Error('Input must be a string');

  try {
    const json = JSON.parse(input);
    if (isHyperfineJSON(json)) {
      return transformHyperfineData(json, id, seriesId);
    }

    if (Array.isArray(json)) {
      if (json.every(isLabelValueTuple)) {
        return transformLabeledData(json, id, seriesId);
      }

      if (json.every(v => typeof v === 'number')) {
        return transformData([json], id, seriesId);
      }

      if (json.every(v => Array.isArray(v) && v.every(v => typeof v === 'number'))) {
        return transformData(json, id, seriesId);
      }
    }
  } catch {
    if (isLabeledRawData(input)) {
      return transformLabeledData(parseLabeledValues(input), id, seriesId, config);
    }

    if (isRawNumericData(input)) {
      return transformRawData(input, id, seriesId, config);
    }

    if (isLabeledColumnsRawData(input)) {
      return transformLabeledColumnsData(parseLabeledColumnValues(input), id, seriesId, config);
    }
  }

  return { config: undefined, data: [] };
}
