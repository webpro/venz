# Venz

The source code of the charting thing that runs on
[try.venz.dev](https://try.venz.dev)

```sh
pnpm install
pnpm run -F '@venz/web' dev
```

## Tech

- [SolidStart](https://start.solidjs.com)
- [D3](https://d3js.org)
- [Tailwind](https://tailwindcss.com)
- [vinxi](https://github.com/nksaraf/vinxi)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

Aims for good accessibility with light, dark and high-contrast modes and full
support for keyboard navigation.

## hyperfine

Original idea was to be helpful with visualizing
[hyperfine](https://github.com/sharkdp/hyperfine) output. Example:

```sh
hyperfine 'sleep 0.22' 'sleep 0.23' --export-json results.json
cat results.json | pbcopy
```

And paste onto the chart page.

## Open Source

Seeing issues or want to improve it? Pull requests are welcome!
