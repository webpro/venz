import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { renderChart } from './render.ts';

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

  get size() {
    return this.#map.size;
  }
}

const cache = new LRUCache(CACHE_SIZE);

const app = new Hono();

app.get('/', c => c.redirect('https://try.venz.dev', 301));

app.get('/favicon.svg', c => {
  return new Response(favicon, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=604800, immutable' },
  });
});

app.get('/favicon.ico', c => c.redirect('/favicon.svg', 301));

function cacheKey(file: string, params: URLSearchParams, width: number, height: number, quality: number) {
  const sorted = [...params].sort((a, b) => a[0].localeCompare(b[0]));
  return `${file}:${width}x${height}:q${quality}:${new URLSearchParams(sorted)}`;
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
  const themeParam = params.get('theme');
  const theme = THEMES.includes(themeParam as any) ? (themeParam as typeof THEMES[number]) : 'dark';

  for (const key of ['w', 'h', 'q', 'chrome']) params.delete(key);
  if (!params.has('theme')) params.set('theme', theme);

  const key = cacheKey(ext, params, width, height, quality);
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
    const svg = renderChart(params, width, height, theme);

    let image: string | Buffer;
    if (ext === 'svg') {
      image = svg;
    } else {
      const bg = THEME_BG[theme];
      const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width }, background: bg });
      const rendered = resvg.render();
      const raw = sharp(rendered.pixels, { raw: { width: rendered.width, height: rendered.height, channels: 4 } });
      if (ext === 'png') {
        image = await raw.png().toBuffer();
      } else if (ext === 'webp') {
        image = await raw.webp({ quality }).toBuffer();
      } else {
        image = await raw.avif({ quality }).toBuffer();
      }
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

app.get('/stats', c => {
  return c.json({ cache: cache.size });
});

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`OG image server listening on :${PORT}`);
});

process.once('SIGTERM', () => process.exit());
process.once('SIGINT', () => process.exit());
