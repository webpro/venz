import type { Configuration, IncomingSeries, JsonValue, MitataJSON, Series, SeriesData, Statistics } from '../types';
import { getNextAvailableColor } from '../colors';
import { calculateStats } from './standard';

const toSeconds = (ns: number) => ns / 1_000_000_000;

export function isMitataJSON(data: JsonValue): data is MitataJSON {
  return Boolean(
    data &&
      typeof data === 'object' &&
      'benchmarks' in data &&
      Array.isArray(data.benchmarks) &&
      typeof data.benchmarks[0] === 'object' &&
      'runs' in data.benchmarks[0] &&
      data.benchmarks[0].runs[0]?.stats?.samples
  );
}

interface Results {
  series: IncomingSeries;
  data: Statistics;
}

function transformMitataWorkload(json: MitataJSON): Results[] {
  const isParameterized = json.benchmarks[0].kind === 'multi-args' && json.benchmarks[0].args;

  if (isParameterized) {
    return json.benchmarks[0].runs.map((s, index) => {
      const parameters = Object.entries(s.args).reduce(
        (acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        },
        {} as Record<string, string>
      );
      const samples = Number.isInteger(s.stats.samples[0]) ? s.stats.samples.map(toSeconds) : s.stats.samples;
      return {
        series: { label: s.name, parameters },
        data: calculateStats(samples),
      };
    });
  }

  return json.benchmarks.map((s, index) => {
    const samples = Number.isInteger(s.runs[0].stats.samples[0])
      ? s.runs[0].stats.samples.map(toSeconds)
      : s.runs[0].stats.samples;
    return {
      series: { label: s.alias ?? s.runs[0].name },
      data: calculateStats(samples),
    };
  });
}

export function transformMitataData(
  json: MitataJSON,
  configId: number,
  seriesId?: number,
  existingConfig?: Configuration
) {
  const now = new Date();
  const timestamp = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

  const results = transformMitataWorkload(json);
  const hasParameters = results.every(r => r.series.parameters && Object.keys(r.series.parameters).length > 0);
  const firstSeries = results[0].series;
  const parameters = firstSeries.parameters;
  const parameterNames = Object.keys(parameters ?? {});
  const commandTemplate =
    hasParameters && parameterNames && firstSeries.label
      ? `${firstSeries.label} ${parameterNames.map(p => `{${p}}`).join(' ')}`
      : undefined;

  if (existingConfig) {
    const data: SeriesData[] = [];

    for (let index = 0; index < results.length; index++) {
      const result = results[index];
      const id = existingConfig.series[index].id;
      data.push({ ...result.data, id, seriesId: id });
    }

    return { config: existingConfig, data };
  } else {
    const series: Series[] = [];
    const data: SeriesData[] = [];

    const baseConfig = {
      id: configId,
      series,
      title: `New mitata benchmark (${timestamp})`,
    };

    const config: Configuration =
      (existingConfig ?? hasParameters)
        ? { ...baseConfig, type: 'mitata-parameter', parameterNames, command: commandTemplate ?? '' }
        : { ...baseConfig, type: 'mitata' };

    for (const result of results) {
      const id = seriesId ?? series.length;
      const label =
        hasParameters && result.series.parameters
          ? parameterNames.map(name => result.series.parameters[name]).join(' ')
          : `Series ${id + 1}`;
      const command =
        hasParameters && result.series.parameters
          ? parameterNames.reduce(
              (acc, name) => acc.replace(`\{${name}\}`, result.series.parameters[name]),
              commandTemplate
            )
          : result.series.label;

      if (!hasParameters) delete result.series.parameters;

      series.push({ ...result.series, id, configId, label, command, color: getNextAvailableColor(series) });
      data.push({ ...result.data, id, seriesId: id });
    }

    return { config, data };
  }
}
