import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { COLORS } from '@venz/shared/colors';
import { getVersion, readV2, upgradeV1, writeV2 } from '@venz/shared/spec';
import { renderChart } from '../src/render.ts';
import { cases, toParams } from './v1-cases.ts';
import './fixed-time.ts';

// Each v1 chart URL, upgraded to v2, must render exactly like its v1 reference rendering

// Except where v1 draws an empty plot: `transpose=1` on unlabeled rows needs columns, which v2 gives any data
const EMPTY_IN_V1 = /^unlabeled-\w+-(pivot-1-)?transpose-1$/;
const hasSeries = (svg: string) => COLORS.some(color => svg.includes(color));

test.each(Object.entries(cases))('%s', (name, { query, width = 1200, height = 630, padding = 0, theme }) => {
  const upgraded = upgradeV1(toParams(query));
  expect(getVersion(upgraded)).toBe(2);
  expect(writeV2(readV2(upgraded)).toString()).toBe(upgraded.toString());
  const reference = readFileSync(new URL(`__snapshots__/v1/${name}.svg`, import.meta.url), 'utf8');
  const svg = renderChart(upgraded, width, height, padding, theme ?? null);
  if (EMPTY_IN_V1.test(name)) {
    expect(hasSeries(reference)).toBe(false);
    expect(hasSeries(svg)).toBe(true);
  } else {
    expect(svg).toBe(reference);
  }
});
