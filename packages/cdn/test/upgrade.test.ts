import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { getVersion, readV2, upgradeV1, writeV2 } from '@venz/shared/spec';
import { renderChart } from '../src/render.ts';
import { cases, toParams } from './v1-cases.ts';
import './fixed-time.ts';

// Each v1 chart URL, upgraded to v2, must render exactly like its v1 reference rendering

test.each(Object.entries(cases))('%s', (name, { query, width = 1200, height = 630, padding = 0, theme }) => {
  const upgraded = upgradeV1(toParams(query));
  expect(getVersion(upgraded)).toBe(2);
  expect(writeV2(readV2(upgraded)).toString()).toBe(upgraded.toString());
  const reference = readFileSync(new URL(`__snapshots__/v1/${name}.svg`, import.meta.url), 'utf8');
  expect(renderChart(upgraded, width, height, padding, theme ?? null)).toBe(reference);
});
