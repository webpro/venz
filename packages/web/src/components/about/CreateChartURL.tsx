import type { JSX } from 'solid-js';
import { origin } from '../../util/helpers';
import { Wink } from '../Button';

const cell = 'border px-3 py-1 text-left';

const Param = (props: { name: string; children: JSX.Element }) => (
  <li>
    <code>{props.name}</code>
    <ul class="list-inside list-disc pl-8">{props.children}</ul>
  </li>
);

export const CreateChartURL = () => {
  const url = new URL('/', origin);
  url.searchParams.set('type', 'line');
  url.searchParams.append('data', '3*2*3*4*2*5');
  url.searchParams.append('data', '4*3*2*5*6*4');

  const versions = new URL('/', origin);
  versions.searchParams.set('type', 'line');
  versions.searchParams.set('labelY', 'duration (s)');
  versions.searchParams.append('row', 'astro');
  versions.searchParams.append('row', 'query');
  for (const version of ['6.0.0', '6.5.0', '6.44.2']) versions.searchParams.append('col', version);
  versions.searchParams.append('data', '2.10*1.57*1.66');
  versions.searchParams.append('data', '1.91*1.99*2.09');

  const bars = new URL('/', origin);
  bars.searchParams.set('type', 'bar');
  bars.searchParams.set('by', 'col');
  bars.searchParams.set('labelY', 'duration (s)');
  bars.searchParams.append('row', 'astro');
  bars.searchParams.append('row', 'query');
  for (const version of ['v5.88.0', 'v6.0.0']) bars.searchParams.append('col', version);
  bars.searchParams.append('data', '4*2');
  bars.searchParams.append('data', '3.8*1.7');

  const boxes = new URL('/', origin);
  boxes.searchParams.set('type', 'box');
  boxes.searchParams.set('labelY', 'duration (s)');
  boxes.searchParams.append('row', 'astro');
  boxes.searchParams.append('row', 'query');
  boxes.searchParams.append('data', '2.1*2.2*2*2.3');
  boxes.searchParams.append('data', '1.9*2*1.8*2.1');

  return (
    <>
      <p>Create links to share visualizations of your data.</p>

      <p>
        Example: <Wink url={url} />
      </p>

      <p>
        This describes version 2 of the URL format. URLs with a{' '}
        <a class="underline" href="#v1">
          version 1
        </a>{' '}
        parameter redirect to their version 2 equivalent.
      </p>

      <h4 class="text-2xl mt-4">URL parameters</h4>

      <ul class="list-inside list-disc pl-4">
        <Param name="data">
          <li>numbers of one row</li>
          <li>
            separated by <code>*</code>, comma, semicolon or whitespace (<code>*</code> needs no escaping in URLs)
          </li>
          <li>can be repeated</li>
          <li>
            a single <code>data</code> starting with <code>{'{'}</code> or <code>[</code> is read as JSON (e.g.
            Hyperfine output)
          </li>
        </Param>
        <Param name="row">
          <li>name of a row</li>
          <li>one name per parameter</li>
          <li>can be repeated</li>
          <li>
            first <code>row</code> belongs to first <code>data</code>, etc.
          </li>
          <li>
            only used when there are as many <code>row</code> as <code>data</code> parameters
          </li>
        </Param>
        <Param name="col">
          <li>names of the columns: the positions within each row (e.g. versions, dates or sizes)</li>
          <li>can be repeated</li>
          <li>
            default: <code>Series 1</code>, <code>Series 2</code>, etc.
          </li>
        </Param>
        <Param name="type">
          <li>chart type</li>
          <li>
            default: <code>median</code>
          </li>
          <li>
            values: <code>median</code>, <code>box</code>, <code>scatter</code>, <code>line</code>, <code>bar</code>
          </li>
        </Param>
        <Param name="by">
          <li>
            one line, bar or box per row or per column, each with a legend entry and color (see{' '}
            <a class="underline" href="#series-and-samples">
              series and samples
            </a>
            )
          </li>
          <li>
            default: <code>row</code>
          </li>
          <li>
            values: <code>row</code>, <code>col</code>
          </li>
        </Param>
        <Param name="samples">
          <li>
            whether the values of each line, bar or box are samples (see{' '}
            <a class="underline" href="#series-and-samples">
              series and samples
            </a>
            )
          </li>
          <li>
            default: <code>1</code> when the other dimension has no names (no <code>col</code> with <code>by=row</code>,
            no <code>row</code> with <code>by=col</code>), otherwise <code>0</code>
          </li>
          <li>
            values: <code>0</code>, <code>1</code>
          </li>
        </Param>
        <Param name="labelY">
          <li>label for y-axis</li>
          <li>
            default: <code>median</code>, or <code>median (unit)</code> with <code>unit</code>
          </li>
        </Param>
        <Param name="labelX">
          <li>label for x-axis</li>
          <li>
            default: <code>sample #</code> when the x-axis shows sample numbers, <code>version</code> or{' '}
            <code>date</code> when it shows row names that look like versions or dates, otherwise empty
          </li>
        </Param>
        <Param name="color">
          <li>CSS color</li>
          <li>
            hex colors work without <code>#</code> (<code>color=ff8800</code>), or encode <code>#</code> as{' '}
            <code>%23</code>
          </li>
          <li>can be repeated</li>
          <li>
            first <code>color</code> belongs to first row and to first column, etc. (whichever is in the legend)
          </li>
        </Param>
        <Param name="legend">
          <li>legend position (inside the plot area)</li>
          <li>
            default: <code>tr</code>
          </li>
          <li>
            values: <code>tr</code> (top right), <code>tl</code> (top left), <code>br</code> (bottom right),{' '}
            <code>bl</code> (bottom left), <code>none</code>
          </li>
        </Param>
        <Param name="zero">
          <li>
            <code>0</code> starts the y-axis near the lowest value instead of at zero
          </li>
          <li>
            default: <code>1</code>
          </li>
        </Param>
        <Param name="unit">
          <li>unit of the numbers, the y-axis then shows the best fitting unit (ns, µs, ms or s)</li>
          <li>
            values: <code>s</code>, <code>ns</code>
          </li>
        </Param>
        <Param name="command">
          <li>command line of a row (e.g. from Hyperfine), shown in the series list</li>
          <li>can be repeated</li>
        </Param>
        <Param name="embed">
          <li>
            <code>1</code> shows only the chart, without header and controls (e.g. for iframes)
          </li>
        </Param>
        <Param name="theme">
          <li>
            color theme, applies together with <code>embed=1</code>
          </li>
          <li>
            values: <code>dark</code>, <code>light</code>, <code>high-contrast</code>
          </li>
        </Param>
      </ul>

      <p>
        Invalid values fall back to the default. Links created with the share button are capped at 15,000 characters,
        longer series get truncated.
      </p>

      <h4 id="series-and-samples" class="text-2xl mt-4">
        Series and samples
      </h4>

      <p>
        <code>by</code> decides what gets a line, bar or box, a legend entry and a color: each row, or each column. The
        other dimension is either shown by name on the x-axis, or holds samples (such as repeated measurements):
      </p>

      <div class="overflow-x-auto">
        <table class="border-collapse">
          <thead>
            <tr>
              <th class={cell}>by</th>
              <th class={cell}>samples</th>
              <th class={cell}>line, scatter</th>
              <th class={cell}>box, median, bar</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class={cell}>row</td>
              <td class={cell}>0</td>
              <td class={cell}>
                a line per row, across the <code>col</code> names
              </td>
              <td class={cell}>
                a mark per row at each <code>col</code> name
              </td>
            </tr>
            <tr>
              <td class={cell}>row</td>
              <td class={cell}>1</td>
              <td class={cell}>a line per row, across sample numbers</td>
              <td class={cell}>a mark per row, summarizing its values</td>
            </tr>
            <tr>
              <td class={cell}>col</td>
              <td class={cell}>0</td>
              <td class={cell}>
                a line per column, across the <code>row</code> names
              </td>
              <td class={cell}>
                a mark per column at each <code>row</code> name
              </td>
            </tr>
            <tr>
              <td class={cell}>col</td>
              <td class={cell}>1</td>
              <td class={cell}>a line per column, across sample numbers</td>
              <td class={cell}>a mark per column, summarizing its values</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        So without <code>by</code> or <code>samples</code>, a line chart of rows with <code>col</code> names draws a
        line per row across those names: <Wink url={versions} />
      </p>

      <p>
        And a box plot of rows without <code>col</code> names draws a box per row: <Wink url={boxes} />
      </p>

      <p>
        Grouped bars, with the rows on the x-axis and a bar per column: <Wink url={bars} />
      </p>

      <h4 class="text-2xl mt-4">Example code snippets to create URL</h4>
      <pre class="border p-4">{`
const url = new URL('/', 'https://try.venz.dev');
url.searchParams.set('type', 'line');
url.searchParams.append('data', '1*2*3');
url.searchParams.append('data', '4*5*6');

console.log(url.toString());
`}</pre>
      <pre class="border p-4">{`
const url = new URL('/', 'https://try.venz.dev');
url.searchParams.set('type', 'line');

const series = { a: [1, 2, 3], b: [4, 5, 6] };
for (const [name, values] of Object.entries(series)) {
  url.searchParams.append('row', name);
  url.searchParams.append('data', values.join('*'));
}

console.log(url.toString());
`}</pre>

      <h4 id="v1" class="text-2xl mt-4">
        Version 1
      </h4>

      <p>
        URLs with any of the v1 parameters below, or with <code>type=pivot</code>, use version 1 of the format. Chart
        page and image URLs redirect them permanently (301) to their version 2 equivalent, which renders the same chart.
        Version 2 does not use these parameter names.
      </p>

      <div class="overflow-x-auto">
        <table class="border-collapse">
          <thead>
            <tr>
              <th class={cell}>v1</th>
              <th class={cell}>v2</th>
            </tr>
          </thead>
          <tbody>
            {(
              [
                [['label'], ['row']],
                [['l'], ['col']],
                [
                  ['lx', 'ly'],
                  ['labelX', 'labelY'],
                ],
                [['pivot', 'transpose'], ['by', 'samples'], ' (see below)'],
                [
                  ['lp', 'lp=n'],
                  ['legend', 'legend=none'],
                ],
                [['br=1'], ['zero=0']],
                [['chrome=0'], ['embed=1']],
                [['ct'], [], 'none (it had no effect)'],
                [['type=pivot'], ['type=line&by=col&samples=0']],
              ] as [string[], string[], string?][]
            ).map(([v1, v2, note]) => (
              <tr>
                <td class={cell}>
                  {v1.map((name, i) => (
                    <>
                      {i > 0 && ', '}
                      <code>{name}</code>
                    </>
                  ))}
                </td>
                <td class={cell}>
                  {v2.map((name, i) => (
                    <>
                      {i > 0 && ', '}
                      <code>{name}</code>
                    </>
                  ))}
                  {note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div class="overflow-x-auto">
        <table class="border-collapse">
          <thead>
            <tr>
              <th class={cell}>pivot</th>
              <th class={cell}>transpose</th>
              <th class={cell}>v2</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['0', '0', 'by=row&samples=1'],
              ['1', '0', 'by=col&samples=0'],
              ['0', '1', 'by=col&samples=1'],
              ['1', '1', 'by=row&samples=0'],
            ].map(([pivot, transpose, v2]) => (
              <tr>
                <td class={cell}>{pivot}</td>
                <td class={cell}>{transpose}</td>
                <td class={cell}>
                  <code>{v2}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p>
        In v1, <code>pivot</code> defaults to <code>0</code> for line and scatter charts and to <code>1</code> for the
        other chart types. v1 also ignores <code>labelX</code>, <code>labelY</code>, <code>unit</code>,{' '}
        <code>color</code>, <code>command</code> and <code>l</code> unless the rows are labeled.
      </p>
    </>
  );
};
