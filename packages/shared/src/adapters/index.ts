import { isHyperfineJSON, transformHyperfineData } from './hyperfine';
import {
  isLabeledRawData,
  isLabelValueTuple,
  isRawNumericData,
  parseLabeledValues,
  transformData,
  transformLabeledData,
  transformRawData,
} from './standard';
import type { Configuration, SeriesData } from '../types';

export function transform(
  input: string,
  id: number,
  seriesId?: number,
  config?: Configuration,
): { config: undefined | Configuration; data: SeriesData[] } {
  if (typeof input !== 'string') throw new Error('Input must be a string');

  try {
    const json = JSON.parse(input);
    if (isHyperfineJSON(json)) return transformHyperfineData(json, id, seriesId);
    if (Array.isArray(json)) {
      if (json.every(isLabelValueTuple)) return transformLabeledData(json, id, seriesId);
      if (json.every(v => typeof v === 'number')) return transformData([json], id, seriesId);
      if (json.every(v => Array.isArray(v) && v.every(v => typeof v === 'number')))
        return transformData(json, id, seriesId);
    }
  } catch {
    if (isLabeledRawData(input)) return transformLabeledData(parseLabeledValues(input), id, seriesId, config);
    if (isRawNumericData(input)) return transformRawData(input, id, seriesId, config);
  }

  return { config: undefined, data: [] };
}

export { generateCommand } from './hyperfine';
