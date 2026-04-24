import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { renderChart, THEME_FG } from './render.ts';

const favicon = readFileSync(new URL('favicon.svg', import.meta.url));

const PORT = Number(process.env.PORT) || 3001;
const CACHE_SIZE = Number(process.env.CACHE_SIZE) || 200;
const isDev = process.env.TARGET_ORIGIN?.includes('localhost') ?? false;
const CACHE_MAX_AGE = isDev ? 0 : 86_400;
const VIEWPORT = { width: 1200, height: 630 };

const THEMES = ['dark', 'light', 'high-contrast'] as const;
const THEME_BG: Record<string, string> = { dark: '#151419', light: '#d6dbdc', 'high-contrast': '#000000' };

const FORMATS: Record<string, { contentType: string }> = {
  svg: { contentType: 'image/svg+xml' },
  png: { contentType: 'image/png' },
  webp: { contentType: 'image/webp' },
  avif: { contentType: 'image/avif' },
};

class LRUCache {
  #map = new Map();
  #max: number;

  constructor(max: number) {
    this.#max = max;
  }

  get(key: string) {
    const value = this.#map.get(key);
    if (value === undefined) return undefined;
    this.#map.delete(key);
    this.#map.set(key, value);
    return value;
  }

  set(key: string, value: unknown) {
    this.#map.delete(key);
    this.#map.set(key, value);
    if (this.#map.size > this.#max) {
      this.#map.delete(this.#map.keys().next().value);
    }
  }

  clear() {
    this.#map.clear();
  }

  get size() {
    return this.#map.size;
  }
}

const cache = new LRUCache(CACHE_SIZE);

const app = new Hono();

app.get('/', c => {
  if (c.req.header('host') === 'ping') return c.text('ok');
  return c.redirect('https://try.venz.dev', 301);
});

app.get('/favicon.svg', c => {
  return new Response(favicon, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=604800, immutable' },
  });
});

app.get('/favicon.ico', c => c.redirect('/favicon.svg', 301));

const PADDINGS = [0, 12, 24];

function cacheKey(file: string, params: URLSearchParams, width: number, height: number, padding: number, quality: number) {
  const sorted = [...params].sort((a, b) => a[0].localeCompare(b[0]));
  return `${file}:${width}x${height}:p${padding}:q${quality}:${new URLSearchParams(sorted)}`;
}

function etag(key: string) {
  return `"${createHash('sha1').update(key).digest('hex').slice(0, 16)}"`;
}

app.get('/i/:file', async c => {
  const match = c.req.param('file').match(/^chart\.(svg|png|webp|avif)$/);
  if (!match) return c.text('Use: /i/chart.{svg,png,webp,avif}', 400);
  const ext = match[1];
  const format = FORMATS[ext];

  const params = new URL(c.req.url).searchParams;
  const width = Math.min(Number(params.get('w')) || VIEWPORT.width, 3840);
  const height = Math.min(Number(params.get('h')) || VIEWPORT.height, 2160);
  const quality = Math.min(Math.max(Number(params.get('q')) || 90, 1), 100);
  const padParam = Number(params.get('pad')) || 0;
  const padding = PADDINGS.includes(padParam) ? padParam : 0;
  const themeParam = params.get('theme');
  const theme = THEMES.includes(themeParam as any) ? (themeParam as typeof THEMES[number]) : 'dark';

  for (const key of ['w', 'h', 'q', 'pad', 'chrome']) params.delete(key);
  if (!params.has('theme')) params.set('theme', theme);

  const key = cacheKey(ext, params, width, height, padding, quality);
  const tag = etag(key);
  const cacheControl = isDev ? 'no-store' : `public, max-age=${CACHE_MAX_AGE}, immutable`;

  if (c.req.header('if-none-match') === tag) {
    return new Response(null, { status: 304, headers: { ETag: tag, 'Cache-Control': cacheControl } });
  }

  const cached = cache.get(key);
  if (cached) {
    return new Response(cached as BodyInit, {
      headers: { 'Content-Type': format.contentType, 'Cache-Control': cacheControl, ETag: tag },
    });
  }

  try {
    const svg = renderChart(params, width, height, padding, theme);

    let image: string | Uint8Array<ArrayBuffer>;
    if (ext === 'svg') {
      image = svg;
    } else {
      const bg = THEME_BG[theme];
      const rasterSvg = svg
        .replaceAll('currentColor', THEME_FG[theme])
        .replace(/font-size:\s*(\d+)px/g, (_, s) => `font-size:${Math.round(Number(s) * 1.6)}px`)
        .replace(/font-size="(\d+)"/g, (_, s) => `font-size="${Math.round(Number(s) * 1.6)}"`);
      const resvg = new Resvg(rasterSvg, {
        fitTo: { mode: 'width', value: width },
        background: bg,
        font: {
          fontDirs: ['/usr/share/fonts'],
          defaultFontFamily: 'DejaVu Sans',
          sansSerifFamily: 'DejaVu Sans',
        },
      });
      const rendered = resvg.render();
      const raw = sharp(rendered.pixels, { raw: { width: rendered.width, height: rendered.height, channels: 4 } });
      let buf: Buffer;
      if (ext === 'png') {
        buf = await raw.png().toBuffer();
      } else if (ext === 'webp') {
        buf = await raw.webp({ lossless: true }).toBuffer();
      } else {
        buf = await raw.avif({ lossless: true }).toBuffer();
      }
      image = new Uint8Array(buf);
    }

    if (!isDev) cache.set(key, image);

    return new Response(image, {
      headers: { 'Content-Type': format.contentType, 'Cache-Control': cacheControl, ETag: tag },
    });
  } catch (err) {
    console.error('Render failed:', (err as Error).message);
    return c.text('Failed to generate image', 500);
  }
});

app.get('/health', c => c.text('ok'));

app.get('/cache/clear', c => {
  cache.clear();
  return c.text('ok');
});

app.get('/stats', c => {
  return c.json({ cache: cache.size });
});

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`OG image server listening on :${PORT}`);
});

process.once('SIGTERM', () => process.exit());
process.once('SIGINT', () => process.exit());
