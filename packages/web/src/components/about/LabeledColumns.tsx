import { origin } from '../../util/helpers';
import { Wink } from '../Button';

export const LabeledColumns = () => {
  const url = new URL('/', origin);
  url.searchParams.set('type', 'line');
  url.searchParams.set('lp', 'br');
  url.searchParams.append('label', 'Col-A');
  url.searchParams.append('label', 'Col-B');
  url.searchParams.append('label', 'Col-C');
  url.searchParams.append('data', [1.2, 1.1, 1.15, 0.98].join(','));
  url.searchParams.append('data', [2, 1.9, 1.8, 2.2].join(','));
  url.searchParams.append('data', [2.5, 2.4, 2.4, 2.6].join(','));

  const literal = new URL('/', origin);
  literal.searchParams.set('type', 'line');
  literal.searchParams.set('lp', 'br');
  literal.searchParams.set(
    'data',
    'col-A col-B col-C\n 1.2    2    2.5\n 1.1    1.9  2.4\n1.15    1.8  2.4\n0.98    2.2  2.6',
  );

  return (
    <>
      <div class="flex justify-start gap-8">
        <pre class="border p-4 bg-neutral-800 light:bg-neutral-100 high-contrast:bg-background">{`
col-A col-B col-C
----- ----- -----
 1.2    2    2.5
 1.1    1.9  2.4
1.15    1.8  2.4
0.98    2.2  2.6
`}</pre>

        <pre class="border p-4 bg-neutral-800 light:bg-neutral-100 high-contrast:bg-background">{`
col-A,col-B,col-C
1.2,2,2.5
1.1,1.9,2.4
1.15,1.8,2.4
0.98,2.2,2.6
`}</pre>
      </div>

      <p>Copy-paste the labeled numbers onto the chart, or try this example link:</p>

      <p>
        <Wink url={url} />
      </p>

      <p>
        Instead of separate parameters, the <code>data</code> can be the full text:
      </p>

      <p>
        <Wink url={literal} />
      </p>
    </>
  );
};
