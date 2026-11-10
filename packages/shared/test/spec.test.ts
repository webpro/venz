import { expect, test } from 'vitest';
import {
  fromPivotMode,
  getVersion,
  readV1,
  readV2,
  toPivotMode,
  upgradeV1,
  V1_PARAMS,
  writeV2,
} from '../src/spec/index.ts';

const params = (query: string) => new URLSearchParams(query);

test('detects v1 URLs by their parameters', () => {
  expect(getVersion(params(''))).toBe(2);
  expect(getVersion(params('type=bar&labelY=y&color=f80&unit=ns&data=1*2'))).toBe(2);
  expect(getVersion(params('type=pivot&data=1*2'))).toBe(1);
  for (const key of V1_PARAMS) expect(getVersion(params(`${key}=1&data=1*2`))).toBe(1);
  expect(getVersion(params('label=a&row=a&data=1*2'))).toBe(1);
});

test('maps every pivot mode to by and samples and back', () => {
  for (const pivotMode of ['none', 'pivoted', 'transposed', 'transposed-pivoted'] as const) {
    const { by, samples } = fromPivotMode(pivotMode);
    expect(toPivotMode(by, samples)).toBe(pivotMode);
  }
});

test('reads v2 defaults', () => {
  expect(readV2(params(''))).toEqual({
    type: 'median',
    by: 'row',
    samples: true,
    rows: [],
    cols: [],
    data: [],
    labelX: undefined,
    labelY: undefined,
    zero: true,
    legend: 'tr',
    unit: undefined,
    colors: [],
    commands: [],
    embed: false,
    theme: undefined,
  });
});

test.each([
  ['', 'row', true],
  ['row=a', 'row', true],
  ['col=a', 'row', false],
  ['by=col', 'col', true],
  ['by=col&col=a', 'col', true],
  ['by=col&row=a', 'col', false],
  ['samples=0', 'row', false],
  ['samples=1&col=a', 'row', true],
  ['by=col&samples=1&row=a', 'col', true],
])('v2 %s: by=%s, samples=%s', (query, by, samples) => {
  expect(readV2(params(query))).toMatchObject({ by, samples });
});

test('reads every v2 parameter', () => {
  const query =
    'type=bar&by=col&samples=0&legend=none&zero=0&unit=ns&labelX=x&labelY=y&embed=1&theme=light' +
    '&color=f80&color=%23123456&color=teal&command=a&row=r1&col=c1&data=1*2';
  expect(readV2(params(query))).toEqual({
    type: 'bar',
    by: 'col',
    samples: false,
    rows: ['r1'],
    cols: ['c1'],
    data: ['1*2'],
    labelX: 'x',
    labelY: 'y',
    zero: false,
    legend: 'n',
    unit: 'ns',
    colors: ['#f80', '#123456', 'teal'],
    commands: ['a'],
    embed: true,
    theme: 'light',
  });
});

test('falls back to v2 defaults for invalid values', () => {
  const query = 'type=pie&by=x&samples=yes&legend=n&zero=no&unit=ms&embed=0&theme=blue';
  expect(readV2(params(query))).toEqual(readV2(params('')));
});

test('reads the first of repeated v2 values', () => {
  expect(readV2(params('type=bar&type=line&labelX=a&labelX=b'))).toMatchObject({ type: 'bar', labelX: 'a' });
});

test('ignores v1 parameters in v2', () => {
  const query = 'type=pivot&label=a&l=b&lx=x&ly=y&pivot=1&transpose=1&lp=n&br=1&chrome=0';
  expect(readV2(params(query))).toEqual(readV2(params('')));
});

test('writes v2 parameters, without defaults', () => {
  const spec = { ...readV2(params('')), type: 'line' as const, legend: 'n' as const, colors: ['#ff8800', 'teal'] };
  expect(writeV2(spec).toString()).toBe('type=line&legend=none&color=ff8800&color=teal');
  expect(writeV2(readV2(params(''))).toString()).toBe('');
});

test('writes what it reads', () => {
  const query =
    'type=bar&by=col&samples=1&legend=bl&zero=0&unit=s&labelX=&labelY=y&embed=1&theme=dark' +
    '&color=F80&color=red&command=a&row=r1&row=r2&col=c1&data=1*2&data=3*4';
  expect(writeV2(readV2(params(query))).toString()).toBe(query);
});

test('reads v1 aliases', () => {
  expect(readV1(params('type=pivot&lx=x&ly=y&color=f80&chrome=0'))).toMatchObject({
    type: 'line',
    by: 'col',
    samples: false,
    labelX: 'x',
    labelY: 'y',
    colors: ['#f80'],
    embed: true,
  });
});

test.each([
  [
    'type=line&pivot=1&transpose=1&labelY=duration+(s)&label=astro&label=query&l=6.0.0&l=6.5.0&l=6.44.2&data=2.10*1.57*1.66&data=1.91*1.99*2.09',
    'type=line&labelY=duration+%28s%29&row=astro&row=query&col=6.0.0&col=6.5.0&col=6.44.2&data=2.10*1.57*1.66&data=1.91*1.99*2.09',
  ],
  [
    'type=bar&labelY=duration+(s)&label=astro&label=query&l=v5.88.0&l=v6.0.0&data=4*2&data=3.8*1.7',
    'type=bar&by=col&labelY=duration+%28s%29&row=astro&row=query&col=v5.88.0&col=v6.0.0&data=4*2&data=3.8*1.7',
  ],
  ['type=bar&data=1*2&data=3*4', 'type=bar&data=1*2&data=3*4'],
  [
    'type=box&lp=n&br=1&ct=hyperfine&t=1&lx=run&color=f80&chrome=0&theme=dark&label=a&label=b&data=1*2&data=3*4',
    'type=box&by=col&legend=none&zero=0&labelX=run&embed=1&theme=dark&color=f80&row=a&row=b&data=1*2&data=3*4',
  ],
  [
    'type=pivot&w=800&h=400&q=80&pad=24&ref=x&label=a&l=x&l=y&data=1*2',
    'type=line&by=col&row=a&col=x&col=y&data=1*2&w=800&h=400&q=80&pad=24',
  ],
])('upgrades %s', (v1, v2) => {
  expect(upgradeV1(params(v1)).toString()).toBe(v2);
});
