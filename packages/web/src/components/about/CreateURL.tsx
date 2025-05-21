import { origin } from '../../util/helpers';
import { Wink } from '../Button';

export const CreateURL = () => {
  const url = new URL('/', origin);
  url.searchParams.set('type', 'line');
  url.searchParams.append('data', '3;2;3;4;2;5');
  url.searchParams.append('data', '4;3;2;5;6;4');

  return (
    <>
      <p>Create links to share visualizations of your data.</p>

      <p>
        Example: <Wink url={url} />
      </p>

      <h4 class="text-xl">URL parameters</h4>

      <ul class="list-inside list-disc pl-4">
        <li>
          <code>data</code>
          <ul class="list-inside list-disc pl-8">
            <li>numbers for the data series</li>
            <li>separated by comma or semicolon</li>
            <li>can be repeated</li>
          </ul>
        </li>
        <li>
          <code>label</code>
          <ul class="list-inside list-disc pl-8">
            <li>label for the data series</li>
            <li>separated by comma or semicolon</li>
            <li>can be repeated</li>
            <li>
              first <code>label</code> belongs to first <code>data</code> series, etc.
            </li>
          </ul>
        </li>
        <li>
          <code>type</code>
          <ul class="list-inside list-disc pl-8">
            <li>chart type</li>
            <li>
              default: <code>median</code>
            </li>
            <li>
              values
              <ul class="list-inside list-disc pl-8">
                <li>
                  <code>median</code>
                </li>
                <li>
                  <code>box</code>
                </li>
                <li>
                  <code>scatter</code>
                </li>
                <li>
                  <code>line</code>
                </li>
                <li>
                  <code>pivot</code>
                </li>
                <li>
                  <code>bar</code>
                </li>
              </ul>
            </li>
          </ul>
        </li>
        <li>
          <code>labelY</code>
          <ul class="list-inside list-disc pl-8">
            <li>label for y-axis</li>
            <li>
              default: <code>median (s)</code>
            </li>
          </ul>
        </li>
        <li>
          <code>labelX</code>
          <ul class="list-inside list-disc pl-8">
            <li>label for x-axis</li>
            <li>
              default: <code>Run #</code>
            </li>
            <li>only visible with scatter and line chart type</li>
          </ul>
        </li>
        <li>
          <code>color</code>
          <ul class="list-inside list-disc pl-8">
            <li>color for the data series</li>
            <li>can be repeated</li>
            <li>
              first <code>color</code> belongs to first <code>data</code> series, etc.
            </li>
          </ul>
        </li>
        <li>
          <code>lp</code>
          <ul class="list-inside list-disc pl-8">
            <li>legend position</li>
            <li>
              default: <code>tr</code>
            </li>
            <li>
              values
              <ul class="list-inside list-disc pl-8">
                <li>
                  <code>tr</code>
                </li>
                <li>
                  <code>tl</code>
                </li>
                <li>
                  <code>br</code>
                </li>
                <li>
                  <code>bl</code>
                </li>
                <li>
                  <code>n</code>
                </li>
              </ul>
            </li>
          </ul>
        </li>
        <li>
          <code>br</code>
          <ul class="list-inside list-disc pl-8">
            <li>break y-axis scale</li>
            <li>
              default: <code>0</code>
            </li>
            <li>
              values
              <ul class="list-inside list-disc pl-8">
                <li>
                  <code>0</code>
                </li>
                <li>
                  <code>1</code>
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
      <h4 class="text-xl">Example code snippets to create URL</h4>
      <pre class="border p-4">{`
const url = new URL('/', 'https://try.venz.dev');
url.searchParams.set('type', 'line');
url.searchParams.append('data', '1;2;3');
url.searchParams.append('data', '4;5;6');

console.log(url.toString());
`}</pre>
      <pre class="border p-4">{`
const url = new URL('/', 'https://try.venz.dev');
url.searchParams.set('type', 'line');

const series = [[1, 2, 3], [4, 5, 6]];
for (const values of series) {
  url.searchParams.append('data', values.join(','));
}

console.log(url.toString());
`}</pre>
    </>
  );
};
