import type { Configuration, SeriesData, Series } from '@venz/shared';
import type { StorageAdapter } from './index.js';
import { migrations } from './migrations.js';
import { demoConfigurations } from './demo.js';

const o = obj => JSON.parse(JSON.stringify(obj));

export class LocalStorageAdapter implements StorageAdapter {
  private dbName = 'venz-benchmarks';
  private configTableName = 'configurations';
  private dataTableName = 'data';
  private initialized = false;

  private async getDb() {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 2);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onblocked = event => console.log(event);
      request.onupgradeneeded = event => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.configTableName)) {
          db.createObjectStore(this.configTableName, { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(this.dataTableName)) {
          db.createObjectStore(this.dataTableName, { keyPath: 'id' });
        }
        const transaction = request.transaction;
        if (event.oldVersion < 2) migrations[1](db, transaction);
      };
    });
  }

  private async initialize(db: IDBDatabase): Promise<void> {
    if (this.initialized) return;
    return new Promise((resolve, reject) => {
      if (!db.objectStoreNames.contains(this.configTableName)) {
        this.initialized = true;
        resolve();
      }
      const transaction = db.transaction(this.configTableName, 'readonly');
      const store = transaction.objectStore(this.configTableName);
      const request = store.count();

      request.onsuccess = async () => {
        if (request.result === 0) {
          for (const { config, data } of demoConfigurations) {
            const { id } = await this.saveConfig(config);
            await this.saveSeriesData(id, data);
          }
        }
        this.initialized = true;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getConfigs(): Promise<Configuration[]> {
    const db = await this.getDb();
    await this.initialize(db);
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.configTableName, 'readonly');
      const store = transaction.objectStore(this.configTableName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getConfig(id: number): Promise<Configuration> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.configTableName, 'readonly');
      const store = transaction.objectStore(this.configTableName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveConfig(config: Configuration): Promise<{ id: number }> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.configTableName, 'readwrite');
      const store = transaction.objectStore(this.configTableName);
      const { id, ...data } = o(config);
      const request = store.add(data);
      request.onsuccess = () => resolve({ id: Number(request.result) });
      request.onerror = () => reject(request.error);
    });
  }

  async deleteConfig(id: number): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.configTableName, 'readwrite');
      const store = transaction.objectStore(this.configTableName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateConfig(id: number, config: Configuration): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.configTableName, 'readwrite');
      const store = transaction.objectStore(this.configTableName);
      const request = store.put({ id, ...o(config) });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveSeriesData(id: number, data: SeriesData[]): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.dataTableName, 'readwrite');
      const store = transaction.objectStore(this.dataTableName);
      const request = store.put({ id, data });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSeriesData(id: number): Promise<SeriesData[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.dataTableName, 'readonly');
      const store = transaction.objectStore(this.dataTableName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result?.data || []);
      request.onerror = () => reject(request.error);
    });
  }
}
