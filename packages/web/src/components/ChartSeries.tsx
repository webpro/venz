import type { ConfigType, Series, SeriesData } from '@venz/shared';
import { createMemo, For, type Accessor, type Setter } from 'solid-js';
import { isGenericChart, storage } from './Chart';
import { useParams } from '@solidjs/router';
import { useTheme } from '../stores/theme';
import type { ChartType } from '../types';
import { transpose } from '../util/helpers';

const getSeriesColor = (s: Series, theme: string) =>
  createMemo(() => (theme === 'high-contrast' ? 'currentColor' : s.color));

type Props = {
  data: Accessor<SeriesData[]>;
  series: Series[];
  setSeries: Setter<Series[]>;
  selectedSeries: Accessor<number[]>;
  selectedSeriesX: Accessor<number[]>;
  seriesX: Series[];
  setSeriesX: Setter<Series[]>;
  setSelectedSeries: Setter<number[]>;
  setSelectedSeriesX: Setter<number[]>;
  type: ConfigType;
  chartType: Accessor<ChartType>;
};

export const ChartSeries = (props: Props) => {
  const params = useParams();
  const { theme } = useTheme();

  const handleSave = async () => {
    if (!isGenericChart(params.id)) {
      const config = await storage.getConfig(Number(params.id));
      storage.updateConfig(Number(params.id), { ...config, series: props.series });
    }
  };

  const data = () => (props.chartType() === 'pivot' ? transpose(props.data()) : props.data());
  const series = () => (props.chartType() === 'pivot' ? props.seriesX : props.series);
  const selectedSeries = () => (props.chartType() === 'pivot' ? props.selectedSeriesX() : props.selectedSeries());
  const setSelectedSeries = () => (props.chartType() === 'pivot' ? props.setSelectedSeriesX : props.setSelectedSeries);
  const setSeries = () => (props.chartType() === 'pivot' ? props.setSeriesX : props.setSeries);

  const seriesWithStats = createMemo(() => {
    const _data = data();
    const _series = series();
    const lowestStats = _data.reduce(
      (lowest, current) => (current.median < lowest.median ? current : lowest),
      _data[0]
    );

    return _series
      .toSorted((a, b) => {
        const aStats = _data.find(d => d.seriesId === a.id);
        const bStats = _data.find(d => d.seriesId === b.id);
        return (aStats?.median || 0) - (bStats?.median || 0);
      })
      .map(s => {
        const stats = _data.find(d => d.seriesId === s.id);
        const isLowest = stats?.median === lowestStats?.median;
        const ratio = stats?.median / lowestStats?.median;
        const relativeStddev = !isLowest
          ? Math.sqrt(
              Math.pow(stats?.stddev / stats?.median, 2) + Math.pow(lowestStats?.stddev / lowestStats?.median, 2)
            ) * ratio
          : 0;

        return {
          ...s,
          stats,
          isFastest: isLowest,
          ratio,
          relativeStddev,
          fastestSeries: isLowest ? null : _series.find(fs => fs.id === lowestStats?.seriesId),
        };
      });
  });

  return (
    <form
      class="flex flex-col border border-foreground rounded-2 max-w-full"
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
              class="flex flex-wrap items-center gap-2 px-4 py-1 cursor-pointer hover:bg-foreground hover:text-background!"
              style={`color: ${getSeriesColor(s, theme())()}`}
            >
              <div class="flex items-center gap-2 min-w-0">
                <input
                  type="checkbox"
                  id={`toggle-visibility-${i()}`}
                  aria-label="toggle series visibility"
                  checked={selectedSeries().includes(s.id)}
                  onChange={event => {
                    setSelectedSeries()(prev =>
                      (event.currentTarget.checked ? [...prev, s.id] : prev.filter(id => id !== s.id)).sort()
                    );
                  }}
                  class="w-4 h-4 rounded-sm"
                />
                <div class="relative w-6 scale-50 flex-shrink-0">
                  <input
                    type="color"
                    aria-label="color"
                    value={s.color}
                    onChange={event => {
                      setSeries()(series => series.id === s.id, 'color', event.currentTarget.value);
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
                    setSeries()(series => series.id === s.id, 'label', event.currentTarget.value);
                  }}
                  onBlur={handleSave}
                  class="bg-transparent border-none py-1"
                />
              </div>

              {s.command && <code class="py-2 text-base text-gray-400 font-mono">{s.command}</code>}

              {props.type !== 'list' &&
                seriesWithStats().length > 1 &&
                (!s.ratio || s.ratio === 1 || (
                  <em class="text-gray-400 w-auto ml-auto">
                    <span class="mr-2" style={`color: ${fasterSeries.color}`}>
                      {fasterSeries.label}
                    </span>
                    is {s.ratio.toFixed(2)} ± {s.relativeStddev.toFixed(2)} times{' '}
                    {props.type.startsWith('hyperfine-') || props.type.startsWith('mitata-') ? 'faster' : 'lower'}
                  </em>
                ))}
            </label>
          );
        }}
      </For>
    </form>
  );
};
