import { transform, type Configuration, type Series, type SeriesData } from '@venz/shared';
import { type AddToast } from '../stores/toast';
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
  addToast: AddToast;
};

export const handleDrop = (props: HandleDropProps) => async (event: DragEvent) => {
  event.preventDefault();

  const files = Array.from(event.dataTransfer?.files || []);

  for (const file of files) {
    if (!/\.(json|txt|csv)$/.test(file.name)) {
      props.addToast(`Unsupported file type (${file.name})`, 'error');
      continue;
    }

    try {
      const input = await file.text();

      if (!props.chartId || props.chartId === 'chart') {
        const { config: incomingConfig, data: incomingData } = transform(
          input,
          -1,
          undefined,
          props.config(),
          props.data(),
        );
        if (incomingConfig) {
          props.setConfig(incomingConfig);
          props.setSeries(incomingConfig.series);
          props.setSelectedSeries(incomingConfig.series.map(s => s.id));
          props.setData([...incomingData]);
        }
      } else {
        const match = file.name.match(/^venz-drop-(?<configId>[0-9]+)(?:-(?<seriesId>.+))?\.json$/);

        if (!match?.groups) {
          props.addToast(
            `Filename must be "venz-drop-${props.chartId}.json" or "venz-drop-${props.chartId}-[seriesId].json"`,
            'error',
          );
          continue;
        }

        const configId = Number(match.groups.configId);
        const seriesId = Number(match.groups.seriesId);

        if (configId !== Number(props.chartId)) {
          props.addToast(`Wrong configuration? Mismatch for ${file.name}`, 'error');
          continue;
        }

        if (seriesId) {
          const { data: incomingData } = transform(input, { configId, seriesId });
          if (incomingData) {
            const s = new Set(props.selectedSeries()).add(seriesId);
            props.setSelectedSeries([...s]);
            props.setData([...incomingData]);
          }
        } else {
          const { data: incomingData } = transform(input, { configId });
          props.setData(incomingData);
        }

        await storage.saveSeriesData(Number(props.chartId), props.data());
      }
    } catch (error: unknown) {
      if (error instanceof Error) props.addToast(`Unable to load ${file.name} (${error.message})`, 'error');
      props.addToast(`Unable to load ${file.name}`, 'error');
      console.error(error);
    }
  }
};

export const handleGlobalPaste = (props: HandleDropProps) => async (event: ClipboardEvent) => {
  const files = event.clipboardData?.files;
  if (files?.length) {
    handleDrop(props)({ preventDefault: () => {}, dataTransfer: { files } } as DragEvent);
  }

  const input = event.clipboardData?.getData('text');
  if (input) {
    try {
      const { config: incomingConfig, data: incomingData } = transform(input, {
        config: props.config(),
        data: props.data(),
      });
      if (incomingConfig) {
        props.setConfig(incomingConfig);
        props.setSeries(incomingConfig.series);
        props.setSelectedSeries(incomingConfig.series.map(s => s.id));
        props.setData([...incomingData]);

        if (props.chartId) await storage.saveSeriesData(Number(props.chartId), props.data());
      } else {
        props.addToast('Received invalid data', 'error');
      }
    } catch (error) {
      props.addToast('Invalid JSON format', 'error');
      console.error(error);
    }
  }
};
