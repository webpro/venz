import { transform, transformLabeled } from '@venz/shared/adapter';
import type { Configuration, Series, SeriesData } from '@venz/shared/types';
import { type AddToast } from '../stores/toast';
import { storage } from '../storage';
import type { Accessor, Setter } from 'solid-js';

type HandleDropProps = {
  chartId?: string;
  config: Accessor<Configuration | undefined>;
  setConfig: Setter<Configuration | undefined>;
  setSeries: Setter<Series[]>;
  selectedSeries: Accessor<number[]>;
  setSelectedSeries: Setter<number[]>;
  setSeriesX: Setter<Series[]>;
  setSelectedSeriesX: Setter<number[]>;
  data: Accessor<SeriesData[]>;
  setData: Setter<SeriesData[]>;
  addToast: AddToast;
};

const applyResult = (props: HandleDropProps, config: Configuration, data: SeriesData[]) => {
  props.setConfig(config);
  props.setSeries(config.series);
  props.setSelectedSeries(config.series.map(s => s.id));
  props.setSeriesX(config.seriesX ?? []);
  props.setSelectedSeriesX((config.seriesX ?? []).map(s => s.id));
  props.setData([...data]);
};

export const handleDrop = (props: HandleDropProps) => async (event: DragEvent) => {
  event.preventDefault();

  const files = Array.from(event.dataTransfer?.files || []);
  const isGeneric = !props.chartId || props.chartId === 'chart';

  if (isGeneric) {
    const entries = await Promise.all(
      files.map(async f => ({ label: f.name.replace(/\.[^.]+$/, ''), text: await f.text() }))
    );

    const labeled = entries.length > 1 ? transformLabeled(entries) : null;
    if (labeled?.config) {
      applyResult(props, labeled.config, labeled.data);
      return;
    }

    for (const { label, text } of entries) {
      try {
        const { config, data, loss } = transform(text, { config: props.config(), data: props.data() });
        if (config) {
          if (label) config.title = label;
          applyResult(props, config, data);
          if (loss) props.addToast(`Data loss: ${(loss * 100).toFixed(2)}%`, 'error');
        }
      } catch (error: unknown) {
        props.addToast(`Unable to load ${label} (${error instanceof Error ? error.message : 'unknown'})`, 'error');
        console.error(error);
      }
    }
    return;
  }

  for (const file of files) {
    const input = await file.text();
    const match = file.name.match(/^venz-drop-(?<configId>[0-9]+)(?:-(?<seriesId>.+))?\.json$/);

    if (!match?.groups) {
      props.addToast(
        `Filename must be "venz-drop-${props.chartId}.json" or "venz-drop-${props.chartId}-[seriesId].json"`,
        'error'
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
};

export const handleGlobalPaste = (props: HandleDropProps) => async (event: ClipboardEvent) => {
  const files = event.clipboardData?.files;
  if (files?.length) {
    handleDrop(props)({ preventDefault: () => {}, dataTransfer: { files } } as DragEvent);
  }

  const input = event.clipboardData?.getData('text');
  if (input) {
    try {
      const { config, data } = transform(input, { config: props.config(), data: props.data() });
      if (config) {
        applyResult(props, config, data);
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
