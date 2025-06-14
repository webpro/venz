import { getNextAvailableColor } from '../colors.ts';
import type {
  HyperfineResults,
  HyperfineJSON,
  Series,
  Configuration,
  JsonValue,
  IncomingSeries,
  Statistics,
  SeriesData,
} from '../types.ts';

export function isHyperfineJSON(data: JsonValue): data is HyperfineJSON {
  return Boolean(
    data &&
      typeof data === 'object' &&
      'results' in data &&
      Array.isArray(data.results) &&
      data.results[0] &&
      typeof data.results[0] === 'object' &&
      'exit_codes' in data.results[0]
  );
}

interface Results {
  series: IncomingSeries;
  data: Statistics;
}

function transformHyperfineWorkload(data: HyperfineResults): Results {
  return {
    series: {
      command: data.command,
      parameters: data.parameters,
    },
    data: {
      values: data.times,
      mean: data.mean,
      median: data.median,
      stddev: data.stddev,
      min: data.min,
      max: data.max,
    },
  };
}

export function transformHyperfineData(
  json: HyperfineJSON,
  configId: number,
  seriesId?: number,
  existingConfig?: Configuration
) {
  const now = new Date();
  const timestamp = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  const results = json.results.map(transformHyperfineWorkload);

  const hasParameters = results.every(r => r.series.parameters && Object.keys(r.series.parameters).length > 0);
  const firstSeries = results[0].series;
  const parameters = firstSeries.parameters;
  const parameterName = hasParameters && parameters ? Object.keys(parameters)[0] : null;
  const command =
    parameters &&
    parameterName in parameters &&
    firstSeries.command &&
    firstSeries.command.replace(parameters[parameterName].toString(), `{${parameterName}}`);

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
      title: `New hyperfine benchmark (${timestamp})`,
    };

    const config: Configuration =
      (existingConfig ?? hasParameters)
        ? {
            ...baseConfig,
            type: 'hyperfine-parameter',
            parameterNames: hasParameters && parameterName ? [parameterName] : [],
            command: command ?? '',
          }
        : { ...baseConfig, type: 'hyperfine' };

    for (const result of results) {
      const id = seriesId ?? series.length;
      const parameters = result.series.parameters;
      const label = parameterName && parameters ? parameters[parameterName].toString() : `Command ${id + 1}`;

      series.push({ ...result.series, id, configId, label: label, color: getNextAvailableColor(series) });
      data.push({ ...result.data, id, seriesId: id });
    }

    return { config, data };
  }
}

export const generateCommand = (config: Configuration) => {
  const commands = config.series.filter(cmd => cmd.label.trim() && cmd.command && cmd.command.trim());

  switch (config.type) {
    case 'hyperfine-parameter':
      return `hyperfine --warmup 3 --parameter-list ${config.parameterNames[0]} ${commands.map(cmd =>
        cmd.label.split(',')
      )} '${config.command}' --export-json venz-drop-${config.id}.json`;
    case 'hyperfine':
      return [
        'hyperfine --warmup 3',
        ...commands.map(cmd => (cmd.command ? `'${cmd.command.replace(/'/g, "\\'")}'` : '')),
        `--export-json venz-drop-${config.id}.json`,
      ].join(' \\\n  ');
    default:
      return '';
  }
};
