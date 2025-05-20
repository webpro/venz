import { origin } from '../../util/helpers';
import { Wink } from '../Button';

export const NumbersJSON = () => {
  const url = new URL('/', origin);
  url.searchParams.set('type', 'line');
  url.searchParams.append('data', JSON.stringify([5, 3, 4]));

  const series = new URL('/', origin);
  series.searchParams.set('type', 'line');
  series.searchParams.append(
    'data',
    JSON.stringify([
      [5, 4, 6],
      [4, 5, 3],
      [3, 6, 4],
    ]),
  );

  return (
    <>
      <div class="flex justify-start gap-8">
        <pre class="border p-4 bg-neutral-800 light:bg-neutral-100 high-contrast:bg-background">{`
[5, 4, 5]
`}</pre>

        <pre class="border p-4 bg-neutral-800 light:bg-neutral-100 high-contrast:bg-background">{`
[
  [5, 4, 6],
  [4, 5, 3],
  [3, 6, 4]
]
`}</pre>
      </div>
      <p>Copy-paste the labeled numbers onto the chart, or try an example link:</p>

      <p>
        <Wink url={url} />
      </p>

      <p>
        <Wink url={series} />
      </p>
    </>
  );
};

export const LabeledNumbersJSON = () => {
  const url = new URL('/', origin);
  url.searchParams.set('type', 'bar');
  url.searchParams.set('labelY', 'Units');
  url.searchParams.append(
    'data',
    JSON.stringify([
      ['Bananas', 5],
      ['Apples', 4],
      ['Oranges', 3],
    ]),
  );

  return (
    <>
      <div class="flex justify-start gap-8">
        <pre class="border p-4 bg-neutral-800 light:bg-neutral-100 high-contrast:bg-background">{`
[
  ["Bananas", 5],
  ["Apples", 4],
  ["Oranges", 3]
]
`}</pre>
      </div>

      <p>Copy-paste the labeled numbers onto the chart, or try this example link:</p>

      <p>
        <Wink url={url} />
      </p>
    </>
  );
};

export const LabeledNumberSeriesJSON = () => {
  const url = new URL('/', origin);
  url.searchParams.set('type', 'line');
  url.searchParams.append(
    'data',
    JSON.stringify([
      ['Bananas', [5, 4, 6]],
      ['Apples', [4, 5, 3]],
      ['Oranges', [3, 6, 4]],
    ]),
  );

  return (
    <>
      <div class="flex justify-start gap-8">
        <pre class="border p-4 bg-neutral-800 light:bg-neutral-100 high-contrast:bg-background">{`
[
  ["Bananas", [5, 4, 5]],
  ["Apples", [4, 5, 4]],
  ["Oranges", [3, 6, 3]]
]
`}</pre>
      </div>
      <p>Copy-paste the labeled numbers onto the chart, or try this example link:</p>

      <p>
        <Wink url={url} />
      </p>
    </>
  );
};
