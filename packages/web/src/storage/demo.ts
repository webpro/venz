import { COLORS, type Configuration, type IncomingConfig, type SeriesData } from '@venz/shared';
import { calculateStats } from '@venz/shared/src/adapters/standard';

const examples = [
  [
    {
      title: 'standard example #1',
      type: 'standard',
      series: [
        { label: 'Series 1', color: COLORS[0] },
        { label: 'Series 2', color: COLORS[1] },
        { label: 'Series 3', color: COLORS[2] },
      ],
    },
    [
      [5, 5, 4.75, 5, 5.25, 5, 4.75, 5, 5],
      [4.75, 5.25, 4.25, 5, 6, 5, 4.25, 5.25, 4.75],
      [5.25, 4.75, 5.5, 5, 4.5, 5, 5.5, 4.75, 5.25],
    ],
  ],
  [
    {
      title: 'hyperfine example #1',
      type: 'hyperfine',
      series: [
        { label: 'Third command', command: 'sleep 0.35', color: COLORS[2] },
        { label: 'Second command', command: 'sleep 0.31', color: COLORS[1] },
        { label: 'First command', command: 'sleep 0.33', color: COLORS[0] },
      ],
    },
  ],
  [
    {
      title: 'hyperfine example #2',
      type: 'hyperfine',
      series: [
        { label: 'compress', command: 'yes | head -c 10M | compress > /dev/null', color: COLORS[3] },
        { label: 'gzip', command: 'yes | head -c 10M | gzip > /dev/null', color: COLORS[4] },
        { label: 'lz4', command: 'yes | head -c 10M | lz4 > /dev/null', color: COLORS[5] },
        { label: 'zstd', command: 'yes | head -c 10M | zstd > /dev/null', color: COLORS[6] },
      ],
    },
  ],
  [
    {
      title: 'hyperfine example #3',
      type: 'hyperfine-parameter',
      parameterName: 'compiler',
      command: '{compiler} -O2 main.cpp',
      series: [
        { label: 'gcc', command: 'gcc -O2 main.cpp', color: COLORS[7], parameters: { compiler: 'gcc' } },
        { label: 'clang', command: 'clang -O2 main.cpp', color: COLORS[8], parameters: { compiler: 'clang' } },
      ],
    },
  ],
] satisfies [IncomingConfig, number[][]?][];

export const demoConfigurations = examples.map(([config, data], configId) => {
  return {
    config: {
      ...config,
      id: configId,
      series: config.series.map((series, id) => ({ ...series, id, configId, values: [] })),
    },
    data: data?.map((values, index) => ({ ...calculateStats(values), id: index, seriesId: index })) ?? [],
  };
}) satisfies { config: Configuration; data: SeriesData[] }[];
