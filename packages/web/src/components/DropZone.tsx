import { createSignal, Match, Show, Switch, type Accessor } from 'solid-js';
import { Link } from './Button';
import { generateCommand, type Configuration } from '@venz/shared';

type Props = {
  config: Accessor<Configuration>;
};

export const DropZone = (props: Props) => {
  const [isDragging, setIsDragging] = createSignal(false);

  return (
    <div
      class={`p-4 border-2 border-dashed rounded-lg min-h-96 flex items-center justify-center transition-all duration-200 ${
        isDragging() ? 'border-solid scale-[.96]' : 'border-foreground'
      }`}
      onDragOver={e => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={() => setIsDragging(false)}
    >
      <div class="text-foreground text-lg">
        <div class="flex flex-col gap-8 items-center">
          <Switch>
            <Match when={props.config()?.series.length > 0}>
              <p>
                Run this command in the terminal and drop <code>venz-drop-{props.config()?.id}.json</code> here
              </p>

              <pre class="m-8 py-4 rounded-sm overflow-x-auto border relative light:bg-gray-200">
                <span class="select-none absolute left-4 text-foreground">$</span>
                <code class="text-wrap pl-8 pr-1 block ml-1">{generateCommand(props.config())}</code>
              </pre>
            </Match>

            <Match when={!props.config()?.series}>
              <h2 class="text-3xl">Create chart from numbers</h2>
              <h3 class="text-2xl">Drop file or paste text here</h3>
              <Link href="/about" class="underline text-xl">
                What's this?
              </Link>
            </Match>
          </Switch>
        </div>
      </div>
    </div>
  );
};
