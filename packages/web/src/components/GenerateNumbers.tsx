import { createSignal, Show, type Accessor, type Setter } from 'solid-js';
import { Button, Link } from './Button';
import { useToast } from '../stores/toast';
import { transform, type Configuration, type Series, type SeriesData } from '@venz/shared';

type Props = {
  config: Accessor<Configuration | undefined>;
  setConfig: Setter<Configuration | undefined>;
  setData: Setter<SeriesData[]>;
  setSeries: Setter<Series[]>;
  setSelectedSeries: Setter<number[]>;
};

export const GenerateNumbers = (props: Props) => {
  const { addToast } = useToast();
  const [randomNumbers, setRandomNumbers] = createSignal<number[]>([]);

  const generateNumbers = () => {
    const numbers = Array.from({ length: 20 }, () => Math.floor(Math.random() * 100) + 1);
    navigator.clipboard.writeText(numbers.join('\n'));
    setRandomNumbers(numbers);
    return numbers;
  };

  return (
    <div class="flex flex-col gap-8 items-center">
      <p>Need some data to try it out?</p>
      <Button
        onClick={() => {
          generateNumbers();
          addToast('Numbers copied to clipboard');
        }}
      >
        Generate 20 numbers
      </Button>

      <output class="block text-center text-balance">{randomNumbers().join(', ')}</output>

      <Show when={randomNumbers().length > 0}>
        <Button
          onClick={() => {
            const { config: incomingConfig, data: incomingData } = transform(
              randomNumbers().join('\n'),
              -1,
              undefined,
              props.config(),
            );
            if (incomingConfig) {
              props.setConfig(incomingConfig);
              props.setSeries(incomingConfig.series);
              props.setSelectedSeries(incomingConfig.series.map(w => w.id));
              props.setData(prev => [...prev, ...incomingData]);
            }
            setRandomNumbers([]);
            addToast('Numbers added to chart');
          }}
        >
          Paste numbers
        </Button>
      </Show>

      <Link href="/config">← To configurations</Link>
    </div>
  );
};
