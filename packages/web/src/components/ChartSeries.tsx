import type { ConfigType, Configuration, Series, SeriesData } from '@venz/shared';
import { createMemo, For, type Accessor, type Setter } from 'solid-js';
import { storage } from './Chart';
import { useParams } from '@solidjs/router';
import { useTheme } from '../stores/theme';

const getSeriesColor = (s: Series, theme: string) =>
  createMemo(() => (theme === 'high-contrast' ? 'currentColor' : s.color));

type Props = {
  data: Accessor<SeriesData[]>;
  series: Accessor<Series[]>;
  setSeries: Setter<Series[]>;
  selectedSeries: Accessor<number[]>;
  setSelectedSeries: Setter<number[]>;
  type: ConfigType;
};

export const ChartSeries = (props: Props) => {
  const params = useParams();
  const { theme } = useTheme();

  const isGenericChart = () => !params.id || params.id === 'chart';

  const handleSave = async () => {
    if (!isGenericChart()) {
      const config = await storage.getConfig(Number(params.id));
      storage.updateConfig(Number(params.id), { ...config, series: props.series() });
    }
  };

  const seriesWithStats = createMemo(() => {
    const allData = props.data();
    const fastestStats = allData.reduce(
      (fastest, current) => (current.median < fastest.median ? current : fastest),
      allData[0],
    );

    return props.series
      .toSorted((a, b) => {
        const aStats = allData.find(d => d.seriesId === a.id);
        const bStats = allData.find(d => d.seriesId === b.id);
        return (aStats?.median || 0) - (bStats?.median || 0);
      })
      .map(s => {
        const stats = allData.find(d => d.seriesId === s.id);
        const isFastest = stats?.median === fastestStats?.median;
        const ratio = stats?.median / fastestStats?.median;
        const relativeStddev = !isFastest
          ? Math.sqrt(
              Math.pow(stats?.stddev / stats?.median, 2) + Math.pow(fastestStats?.stddev / fastestStats?.median, 2),
            ) * ratio
          : 0;

        return {
          ...s,
          stats,
          isFastest,
          ratio,
          relativeStddev,
          fastestSeries: isFastest ? null : props.series.find(fs => fs.id === fastestStats?.seriesId),
        };
      });
  });

  return (
    <form
      class="flex flex-col border border-foreground rounded-2"
      onSubmit={event => {
        event.preventDefault();
        handleSave();
      }}
    >
      <button type="submit" class="hidden" />

      <For each={seriesWithStats()}>
        {(s, i) => {
          const fasterSeries = seriesWithStats()[0];

          return (
            <label
              for={`toggle-visibility-${i()}`}
              class="flex items-center gap-2 px-4 py-1 cursor-pointer hover:bg-foreground hover:text-background!"
              style={`color: ${getSeriesColor(s, theme())()}`}
            >
              <input
                type="checkbox"
                id={`toggle-visibility-${i()}`}
                aria-label="toggle series visibility"
                checked={props.selectedSeries().includes(s.id)}
                onChange={event => {
                  props.setSelectedSeries(prev =>
                    (event.currentTarget.checked ? [...prev, s.id] : prev.filter(id => id !== s.id)).sort(),
                  );
                }}
                class="w-4 h-4 rounded-sm"
              />
              <div class="relative w-6 scale-50">
                <input
                  type="color"
                  aria-label="color"
                  value={s.color}
                  onChange={event => {
                    props.setSeries(series => series.id === s.id, 'color', event.currentTarget.value);
                    handleSave();
                  }}
                  class="w-full h-3 cursor-pointer appearance-none bg-transparent border-0"
                />
                <div
                  class="pointer-events-none absolute inset-0 rounded-full"
                  style={{ 'background-color': getSeriesColor(s, theme())() }}
                />
              </div>
              <input
                type="text"
                aria-label="series label"
                value={s.label}
                onChange={event => {
                  props.setSeries(series => series.id === s.id, 'label', event.currentTarget.value);
                }}
                onBlur={handleSave}
                class="bg-transparent border-none py-1"
              />

              {(props.type === 'hyperfine-default' || props.type === 'hyperfine-json') && (
                <code class="p-2 text-base text-gray-400 font-mono">{s.command}</code>
              )}

              {props.type !== 'list' &&
                seriesWithStats().length > 1 &&
                (!s.ratio || s.ratio === 1 || (
                  <em class="text-right ml-auto text-gray-400">
                    <span class="mr-2" style={`color: ${fasterSeries.color}`}>
                      {fasterSeries.label}
                    </span>
                    is {s.ratio.toFixed(2)} ± {s.relativeStddev.toFixed(2)} times faster
                  </em>
                ))}
            </label>
          );
        }}
      </For>
    </form>
  );
};
