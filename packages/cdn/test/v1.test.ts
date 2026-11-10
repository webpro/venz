import { expect, test } from 'vitest';
import { renderChart } from '../src/render.ts';
import { cases, toParams } from './v1-cases.ts';
import './fixed-time.ts';

// Reference renderings of v1 chart URLs, the format links in the wild use. Their output must stay byte-identical.
// Run `pnpm test -u` only for an intended rendering change.

test.each(Object.entries(cases))('%s', async (name, { query, width = 1200, height = 630, padding = 0, theme }) => {
  const svg = renderChart(toParams(query), width, height, padding, theme ?? null);
  await expect(svg).toMatchFileSnapshot(`__snapshots__/v1/${name}.svg`);
});
