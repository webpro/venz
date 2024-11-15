import type { Configuration, SeriesData } from '@venz/shared';
import { LocalStorageAdapter } from './local';

export interface StorageAdapter {
  getConfig(id: number): Promise<Configuration>;
  getConfigs(): Promise<Configuration[]>;
  saveConfig(config: Configuration): Promise<{ id: number }>;
  deleteConfig(id: number): Promise<void>;
  updateConfig(id: number, config: Configuration): Promise<void>;
  saveSeriesData(id: number, series: SeriesData[]): Promise<void>;
  getSeriesData(id: number): Promise<SeriesData[]>;
}

export const getStorageAdapter = () => {
  return new LocalStorageAdapter();
};
