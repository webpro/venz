export const migrations = {
  1: (db: IDBDatabase, transaction: IDBTransaction) => {
    if (!db.objectStoreNames.contains('benchmarks')) return;
    const benchmarksStore = transaction.objectStore('benchmarks');
    const metricsStore = transaction.objectStore('metrics');

    benchmarksStore.getAll().onsuccess = e => {
      const cfgs = (e.target as IDBRequest).result;
      metricsStore.count().onsuccess = e => {
        const count = (e.target as IDBRequest).result;

        if (cfgs.length === 2 && cfgs[0].title === 'Example #1' && cfgs[1].title === 'Example #2' && count === 1) {
          db.deleteObjectStore('benchmarks');
          db.deleteObjectStore('metrics');
          return;
        }

        const configStore = transaction.objectStore('configurations');
        const dataStore = transaction.objectStore('data');

        benchmarksStore.openCursor().onsuccess = e => {
          const cursor = (e.target as IDBRequest).result;
          if (cursor) {
            const oldConfig = cursor.value;
            const newConfig = {
              ...oldConfig,
              type: 'hyperfine-default',
              series: (oldConfig.commands || []).map((cmd: any) => ({
                id: cmd.id,
                label: cmd.title,
                command: cmd.command,
                color: cmd.color,
              })),
            };
            delete newConfig.commands;
            delete newConfig.strategy;
            configStore.add(newConfig);
            cursor.continue();
          } else {
            metricsStore.openCursor().onsuccess = e => {
              const cursor = (e.target as IDBRequest).result;
              if (cursor) {
                const oldData = cursor.value;
                const newData = {
                  id: oldData.id,
                  data: oldData.data.map((d: any, index: number) => ({
                    seriesId: index,
                    values: d.results[0].data.times,
                    mean: d.results[0].data.mean,
                    stddev: d.results[0].data.stddev,
                    median: d.results[0].data.median,
                    min: d.results[0].data.min,
                    max: d.results[0].data.max,
                  })),
                };
                dataStore.add(newData);
                cursor.continue();
              } else {
                db.deleteObjectStore('benchmarks');
                db.deleteObjectStore('metrics');
              }
            };
          }
        };
      };
    };
  },
  2: (db: IDBDatabase, transaction: IDBTransaction) => {
    debugger;
    const configStore = transaction.objectStore('configurations');
    configStore.openCursor().onsuccess = e => {
      const cursor = (e.target as IDBRequest).result;
      if (cursor) {
        const config = cursor.value;
        if (config.type === 'hyperfine-default') {
          config.type = 'hyperfine';
          cursor.update(config);
        }
        if (config.type === 'hyperfine-parameter' && 'parameterName' in config) {
          config.parameterNames = [config.parameterName];
          delete config.parameterName;
          cursor.update(config);
        }
        cursor.continue();
      }
    };
  },
};
