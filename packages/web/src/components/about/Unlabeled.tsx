import { generateNumbers, origin } from '../../util/helpers';
import { Wink } from '../Button';

export const Unlabeled = () => {
  const randomNumbers = generateNumbers();
  const url = new URL('/', origin);
  url.searchParams.set('type', 'line');
  url.searchParams.append('data', randomNumbers.join(','));

  const moreNumbers = generateNumbers();
  const addUrl = new URL('/', origin);
  addUrl.searchParams.set('type', 'line');
  addUrl.searchParams.append('data', randomNumbers.join(','));
  addUrl.searchParams.append('data', moreNumbers.join(','));

  return (
    <>
      <p>Numbers separated by space, comma, semicolon, or newline:</p>

      <div class="flex justify-start gap-8">
        <pre class="border p-4 bg-neutral-800 light:bg-neutral-100 high-contrast:bg-background">
          {randomNumbers.join(', ')}
        </pre>

        <pre class="border p-4 bg-neutral-800 light:bg-neutral-100 high-contrast:bg-background">
          {moreNumbers.join('\n')}
        </pre>
      </div>

      <p>Copy-paste the numbers onto the chart, or try this example link:</p>

      <p>
        <Wink url={url} />
      </p>

      <p>Paste numbers repeatedly to add series, or try this example link:</p>

      <p>
        <Wink url={addUrl} />
      </p>
    </>
  );
};
