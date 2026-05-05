# Venz

The source code of the charting thing that runs on [try.venz.dev][1],
with chart image rendering at [cdn.venz.dev][2].

```sh
pnpm install
pnpm dev
```

## Packages

- `@venz/web` contains the main app at [try.venz.dev][1]
- `@venz/cdn` is the image API at [cdn.venz.dev][2]
- `@venz/shared` has chart rendering, adapters, types

## CDN

- Serves `svg`/`png`/`webp`/`avif` via `/i/chart.{ext}?…`
- Example: [chart.svg?type=bar\&data=4\*3\&data=2\*4][3]
- Docs: [https://try.venz.dev/about#image-url][4]

## Tech

- [SolidStart][5], [D3][6], [Tailwind][7], [vinxi][8], [IndexedDB][9]
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
[3]: https://cdn.venz.dev/i/chart.svg?type=line&lp=br&data=5*4*6&data=4*5*3&data=3*6*4
[4]: https://try.venz.dev/about#image-url
[5]: https://start.solidjs.com
[6]: https://d3js.org
[7]: https://tailwindcss.com
[8]: https://github.com/nksaraf/vinxi
[9]: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
[10]: https://hono.dev
[11]: https://github.com/yisibl/resvg-js
[12]: https://sharp.pixelplumbing.com
[13]: https://developers.cloudflare.com/workers/
[14]: https://github.com/sharkdp/hyperfine
[15]: ./LICENSE
