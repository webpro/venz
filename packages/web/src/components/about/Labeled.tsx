import { origin } from '../../util/helpers';
import { Wink } from '../Button';

export const Labeled = () => {
  const url = new URL('/', origin);
  url.searchParams.set('type', 'pivot');
  url.searchParams.set('lp', 'br');
  url.searchParams.set('br', '1');
  url.searchParams.append('label', '2025-01');
  url.searchParams.append('label', '2025-02');
  url.searchParams.append('label', '2025-03');
  url.searchParams.append('label', '2025-04');
  url.searchParams.append('data', [150, 150, 160].join(','));
  url.searchParams.append('data', [120, 110, 120].join(','));
  url.searchParams.append('data', [180, 180, 210].join(','));
  url.searchParams.append('data', [170, 190, 180].join(','));

  return (
    <>
      <div class="flex flex-wrap justify-start gap-8">
        <pre class="border p-4 bg-neutral-800 light:bg-neutral-100 high-contrast:bg-background">{`
2025-01 150
2025-02 120
2025-03 180
2025-04 170
`}</pre>

        <pre class="border p-4 bg-neutral-800 light:bg-neutral-100 high-contrast:bg-background">{`
2025-01 150 150 160
2025-02 120 110 120
2025-03 180 180 210
2025-04 170 190 180
`}</pre>

        <pre class="border p-4 bg-neutral-800 light:bg-neutral-100 high-contrast:bg-background">{`
1.0.0 3
1.0.1 3.05
1.1.0 2.88
1.2.0 2.9
1.2.1 2.8
`}</pre>
      </div>

      <p>If the labels are recognized as date or semver, they're sorted accordingly.</p>

      <p>Copy-paste the labeled numbers onto the chart, or try this example link:</p>

      <p>
        <Wink url={url} />
      </p>

      <p>Pasting additional data results onto the chart results in merged data with additional series.</p>
    </>
  );
};
