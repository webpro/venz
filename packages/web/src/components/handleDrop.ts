import { transform, type Configuration, type Series, type SeriesData } from '@venz/shared';
import { useToast } from '../stores/toast';
import { storage } from './Chart';
import type { Accessor, Setter } from 'solid-js';

type HandleDropProps = {
  chartId?: string;
  config: Accessor<Configuration | undefined>;
  setConfig: Setter<Configuration | undefined>;
  setSeries: Setter<Series[]>;
  selectedSeries: Accessor<number[]>;
  setSelectedSeries: Setter<number[]>;
  data: Accessor<SeriesData[]>;
  setData: Setter<SeriesData[]>;
};

export const handleDrop = (props: HandleDropProps) => async (e: DragEvent) => {
  e.preventDefault();

  const { addToast } = useToast();

  const files = Array.from(e.dataTransfer?.files || []);

  for (const file of files) {
    if (!/\.(json|txt|csv)$/.test(file.name)) {
      addToast(`Unsupported file type (${file.name})`, 'error');
      continue;
    }

    try {
      const input = await file.text();
      const currentConfig = props.config();

      if (!props.chartId || props.chartId === 'chart') {
        const { config: incomingConfig, data: incomingData } = transform(input, -1, undefined, currentConfig);
        if (incomingConfig) {
          props.setConfig(incomingConfig);
          props.setSeries(incomingConfig.series);
          props.setSelectedSeries(incomingConfig.series.map(s => s.id));
          props.setData(prev => [...prev, ...incomingData]);
        }
      } else {
        const match = file.name.match(/^venz-drop-(?<configId>[0-9]+)(?:-(?<seriesId>.+))?\.json$/);

        if (!match?.groups) {
          addToast(
            `Filename must be "venz-drop-${props.chartId}.json" or "venz-drop-${props.chartId}-[seriesId].json"`,
            'error',
          );
          continue;
        }

        const configId = Number(match.groups.configId);
        const seriesId = Number(match.groups.seriesId);

        if (configId !== Number(props.chartId)) {
          addToast(`Wrong configuration? Mismatch for ${file.name}`, 'error');
          continue;
        }

        if (seriesId) {
          const { config: incomingConfig, data: incomingData } = transform(input, configId, seriesId);
          if (incomingConfig) {
            const s = new Set(props.selectedSeries()).add(seriesId);
            const d = props.data().filter(d => d.seriesId !== seriesId);
            props.setSelectedSeries([...s]);
            props.setData([...d, ...incomingData]);
          }
        } else {
          const { data: incomingData } = transform(input, configId);
          props.setData(incomingData);
        }

        await storage.saveSeriesData(Number(props.chartId), props.data());
      }
    } catch (error: unknown) {
      if (error instanceof Error) addToast(`Unable to load ${file.name} (${error.message})`, 'error');
      addToast(`Unable to load ${file.name}`, 'error');
    }
  }
};
