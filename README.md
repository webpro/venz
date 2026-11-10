# Venz

The source code of the charting thing that runs on [try.venz.dev][1],
with chart image rendering at [cdn.venz.dev][2].

Use Node.js 24 or newer.

```sh
pnpm install
pnpm dev
```

## Packages

- `@venz/web` contains the main app at [try.venz.dev][1]
- `@venz/cdn` is the image API at [cdn.venz.dev][2]
- `@venz/shared` has chart rendering, adapters, types

## Docs

- URL parameters with live examples: [try.venz.dev/about][17]

## CDN

- Serves `svg`/`png`/`webp`/`avif` via `/i/chart.{ext}?…`
- Example: [chart.svg?type=bar\&data=4\*3\&data=2\*4][3]
- Docs: [https://try.venz.dev/about#image-url][4]

## URL versions

- Chart and image URLs use format version 2, parsed in `packages/shared/src/spec`
- URLs with a version 1 parameter (`label`, `l`, `pivot`, `lp`, …) redirect (301) to their version 2 equivalent, on
  the chart page and the CDN
- `packages/cdn/test/__snapshots__/v1` holds reference renderings of v1 URLs: their v2 equivalents must render the same

## Tech

- [SolidStart][5], [D3][6], [Tailwind][7], [Vite][8], [Nitro][16], [IndexedDB][9]
- [Hono][10] + [resvg][11] + [sharp][12] on [Cloudflare Workers + Containers][13] (CDN)

Aims for good accessibility with light, dark and high-contrast modes and full
support for keyboard navigation.

## Origin

The original idea was to be helpful with visualizing [hyperfine][14] output.
Example:

```sh
hyperfine 'sleep 0.22' 'sleep 0.23' --export-json results.json
cat results.json | pbcopy
```

And paste onto the [chart page][1]. The dropdown contains links and download
options to use and reuse the rendered chart in many ways.

## Open Source

Seeing issues or want to improve it? Pull requests are welcome!

## License

[ISC License][15]

[1]: https://try.venz.dev
[2]: https://cdn.venz.dev
[3]: https://cdn.venz.dev/i/chart.svg?type=bar&data=4*3&data=2*4
[4]: https://try.venz.dev/about#image-url
[5]: https://start.solidjs.com
[6]: https://d3js.org
[7]: https://tailwindcss.com
[8]: https://vite.dev
[9]: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
[10]: https://hono.dev
[11]: https://github.com/yisibl/resvg-js
[12]: https://sharp.pixelplumbing.com
[13]: https://developers.cloudflare.com/workers/
[14]: https://github.com/sharkdp/hyperfine
[15]: ./LICENSE
[16]: https://nitro.build
[17]: https://try.venz.dev/about#chart-url
