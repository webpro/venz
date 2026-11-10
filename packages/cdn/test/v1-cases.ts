import { readFileSync } from 'node:fs';
import type { Theme } from '@venz/shared/chart';

// v1 chart URLs covering every parameter, the CDN-only aliases and the data formats

export type Case = {
  query: string | URLSearchParams;
  width?: number;
  height?: number;
  padding?: number;
  theme?: Theme;
};

const fixture = (name: string) => readFileSync(new URL(`../../shared/test/fixtures/${name}`, import.meta.url), 'utf8');

const json = (data: string, query = '') => {
  const params = new URLSearchParams(query);
  params.append('data', data);
  return params;
};

const unlabeled = 'data=3*2*3*4*2*5&data=4*3*2*5*6*4';
const rows = 'label=astro&label=query&label=rolldown&data=2.1*2.2*2*2.3&data=1.9*2*1.8*2.1&data=3.1*3*3.3*3.2';
const matrix = 'label=astro&label=query&l=6.0.0&l=6.5.0&l=6.44.2&data=2.10*1.57*1.66&data=1.91*1.99*2.09';

const types = ['median', 'box', 'scatter', 'line', 'bar'];
const layouts: Record<string, string> = {
  default: '',
  'pivot-0': 'pivot=0',
  'pivot-1': 'pivot=1',
  'transpose-1': 'transpose=1',
  'pivot-1-transpose-1': 'pivot=1&transpose=1',
};

export const cases: Record<string, Case> = {};

for (const [dataset, data] of Object.entries({ unlabeled, rows, matrix }))
  for (const type of types)
    for (const [layout, params] of Object.entries(layouts))
      cases[`${dataset}-${type}-${layout}`] = { query: [`type=${type}`, params, data].filter(Boolean).join('&') };

for (const type of types) cases[`break-${type}`] = { query: `type=${type}&br=1&${rows}` };
cases['break-0'] = { query: `type=line&br=0&${unlabeled}` };
cases['break-matrix-pivot-1-transpose-1'] = { query: `type=line&pivot=1&transpose=1&br=1&${matrix}` };

for (const lp of ['tl', 'br', 'bl', 'n', 'xx']) cases[`legend-${lp}`] = { query: `type=line&lp=${lp}&${rows}` };

const nanos = 'label=a&label=b&data=1200000*1250000*1190000&data=980000*1010000*995000';
cases['unit-ns'] = { query: `type=median&unit=ns&${nanos}` };
cases['unit-s'] = { query: `type=bar&unit=s&${matrix}` };
cases['unit-invalid'] = { query: `type=median&unit=ms&${nanos}` };

cases['axis-labels'] = { query: `type=line&labelX=run&labelY=duration+(s)&${rows}` };
cases['axis-labels-short'] = { query: `type=line&lx=run&ly=duration&${rows}` };
cases['axis-labels-both'] = { query: `type=line&labelX=long&lx=short&labelY=long&ly=short&${rows}` };
cases['axis-labels-repeated'] = { query: `type=line&labelX=first&labelX=second&${rows}` };
cases['axis-labels-empty'] = { query: `type=line&labelX=&labelY=&${rows}` };

cases['colors'] = { query: `type=line&color=%23ff8800&color=rebeccapurple&${rows}` };
cases['colors-bare-hex'] = { query: `type=line&color=ff8800&color=0af&${rows}` };
cases['colors-pivot-1'] = { query: `type=bar&pivot=1&color=%23ff8800&color=teal&color=gold&${matrix}` };
cases['colors-pivot-1-transpose-1'] = { query: `type=line&pivot=1&transpose=1&color=%23ff8800&color=teal&${matrix}` };

cases['commands'] = { query: `type=median&command=sleep+0.1&command=sleep+0.2&command=sleep+0.3&${rows}` };

cases['type-missing'] = { query: rows };
cases['type-invalid'] = { query: `type=pie&${rows}` };
cases['type-pivot'] = { query: `type=pivot&${matrix}` };
cases['type-pivot-transpose-1'] = { query: `type=pivot&transpose=1&${matrix}` };

cases['labels-mismatch'] = { query: `type=line&label=a&label=b&data=1*2*3&data=2*3*4&data=3*4*5` };
cases['labels-dates'] = {
  query:
    'type=line&t=1&lp=br&br=1&label=2025-01&label=2025-02&label=2025-03&label=2025-04' +
    '&data=150,150,160&data=120,110,120&data=180,180,210&data=170,190,180',
};
cases['labels-semver-unsorted'] = {
  query: 'type=bar&label=6.10.0&label=6.2.0&label=6.9.1&data=3*3.1&data=2*2.1&data=4*4.2',
};
cases['labels-many-columns'] = {
  query:
    `type=line&pivot=1&transpose=1&label=a&label=b&${Array.from({ length: 25 }, (_, i) => `l=6.${i}.0`).join('&')}` +
    `&data=${Array.from({ length: 25 }, (_, i) => 2 + (i % 7) / 10).join('*')}` +
    `&data=${Array.from({ length: 25 }, (_, i) => 3 - (i % 5) / 10).join('*')}`,
};
cases['legend-many-entries'] = {
  query:
    `type=line&${Array.from({ length: 12 }, (_, i) => `label=s${i}`).join('&')}&` +
    Array.from({ length: 12 }, (_, i) => `data=${i}*${i + 1}*${i + 0.5}`).join('&'),
};

cases['separators'] = { query: 'type=line&data=1,2,3&data=2;3;4&data=3+4+5&data=4*5*6' };
cases['single-values'] = { query: 'type=line&data=5&data=3&data=4' };
cases['single-values-labeled'] = { query: 'type=scatter&label=a&label=b&data=5&data=3' };
// Renders an empty chart: negative numbers fail as JSON in the adapter (shared/src/adapters/index.ts)
cases['negative-decimals'] = { query: 'type=line&data=-1.5*0.25*2.75&data=0.1*-0.2*0.3' };
cases['samples'] = { query: `type=box&data=${Array.from({ length: 200 }, (_, i) => (i * 7919) % 101).join('*')}` };

cases['text-columns'] = {
  query: json(
    'col-A col-B col-C\n 1.2    2    2.5\n 1.1    1.9  2.4\n1.15    1.8  2.4\n0.98    2.2  2.6',
    'type=line&lp=br'
  ),
};
cases['json-array'] = { query: json(JSON.stringify([5, 3, 4]), 'type=line') };
cases['json-rows'] = {
  query: json(
    JSON.stringify([
      [5, 4, 6],
      [4, 5, 3],
      [3, 6, 4],
    ]),
    'type=line'
  ),
};
cases['json-hyperfine'] = { query: json(fixture('hyperfine-results.json'), 'type=median&br=1') };
cases['json-hyperfine-ct'] = { query: json(fixture('hyperfine-results.json'), 'type=box&ct=hyperfine') };
cases['json-hyperfine-parameterized'] = { query: json(fixture('hyperfine-results-parameterized.json'), 'type=line') };
cases['json-mitata'] = { query: json(fixture('mitata-results.json'), 'type=median&br=1') };
cases['json-tinybench'] = { query: json(fixture('tinybench-results.json'), 'type=bar') };
cases['json-vitest-bench'] = { query: json(fixture('vitest-bench-results.json'), 'type=bar') };

for (const theme of ['dark', 'light', 'high-contrast'] as const)
  cases[`theme-${theme}`] = { query: `type=line&${rows}`, theme };
cases['size-padding'] = { query: `type=bar&${matrix}`, width: 800, height: 400, padding: 24, theme: 'light' };

export const toParams = (query: Case['query']) => (typeof query === 'string' ? new URLSearchParams(query) : query);
