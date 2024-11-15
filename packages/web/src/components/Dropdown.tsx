import { type ParentComponent, createSignal, Show, Switch, Match, type JSX } from 'solid-js';
import { IconButton } from './Button';

type DropdownProps = {
  icon?: JSX.Element;
  label: string;
  value?: string;
  options?: DropdownOption[];
  onChange?: (value: string) => void;
};

type DropdownOption = {
  value: string;
  icon?: JSX.Element;
  label: string;
  onClick?: () => void;
};

export const Dropdown: ParentComponent<DropdownProps> = props => {
  const [isOpen, setIsOpen] = createSignal(false);

  return (
    <div
      class="relative group text-nowrap"
      onFocusOut={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsOpen(false);
        }
      }}
    >
      <IconButton
        role="combobox"
        aria-label={props.label}
        aria-haspopup="true"
        aria-expanded={isOpen()}
        onClick={() => setIsOpen(!isOpen())}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(true);
            (e.currentTarget.closest('.relative')?.querySelectorAll('[role="option"]')?.[0] as HTMLElement)?.focus();
          }
          if (e.key === 'ArrowDown' && !isOpen()) {
            e.preventDefault();
            setIsOpen(true);
            (e.currentTarget.closest('.relative')?.querySelectorAll('[role="option"]')?.[0] as HTMLElement)?.focus();
          }
          if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      >
        <Show when={props.icon} fallback={props.options?.find(opt => opt.value === props.value)?.icon}>
          {props.icon}
        </Show>
      </IconButton>

      <div class="absolute w-[150%] h-6 right-0 top-[75%]" />

      <div
        class={`absolute right-0 mt-2 ${isOpen() ? 'block' : 'hidden group-hover:block'} rounded-lg border border-foreground shadow-xl overflow-hidden`}
        role="listbox"
        tabIndex={-1}
        onBlur={e => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsOpen(false);
          }
        }}
        onKeyDown={e => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const items = e.currentTarget.querySelectorAll('[role="option"]');
            const currentIndex = Array.from(items).indexOf(document.activeElement as Element);
            const nextIndex =
              e.key === 'ArrowDown'
                ? (currentIndex + 1) % items.length
                : (currentIndex - 1 + items.length) % items.length;
            (items[nextIndex] as HTMLElement).focus();
          }

          if (e.key === 'Enter' || e.key === 'Escape') {
            e.preventDefault();
            setIsOpen(false);
          }
        }}
      >
        <div class="flex flex-col">
          {props.options?.[0] && (
            <DropdownItem
              value={props.options[0].value}
              icon={props.options[0].icon}
              label={props.options[0].label}
              selected={props.options[0].value === props.value}
              onClick={() => props.onChange?.(props.options[0].value)}
              onKeySelect={closeDropdown => {
                props.options[0].onClick?.();
                props.onChange?.(props.options[0].value);
                if (closeDropdown) setIsOpen(false);
              }}
            />
          )}

          <Switch>
            <Match when={props.options?.slice(1).every(opt => opt.label === '')}>
              <div class="grid grid-cols-2">
                <For each={props.options?.slice(1)}>
                  {option => (
                    <DropdownItem
                      value={option.value}
                      icon={option.icon}
                      label={option.label}
                      selected={option.value === props.value}
                      onClick={() => props.onChange?.(option.value)}
                      onKeySelect={closeDropdown => {
                        option.onClick?.();
                        props.onChange?.(option.value);
                        if (closeDropdown) setIsOpen(false);
                      }}
                    />
                  )}
                </For>
              </div>
            </Match>
            <Match when={props.options?.slice(1).some(opt => opt.label !== '')}>
              <For each={props.options?.slice(1)}>
                {option => (
                  <DropdownItem
                    value={option.value}
                    icon={option.icon}
                    label={option.label}
                    selected={option.value === props.value}
                    onClick={() => props.onChange?.(option.value)}
                    onKeySelect={closeDropdown => {
                      option.onClick?.();
                      props.onChange?.(option.value);
                      if (closeDropdown) setIsOpen(false);
                    }}
                  />
                )}
              </For>
            </Match>
          </Switch>
        </div>
      </div>
    </div>
  );
};

type DropdownItemProps = {
  value: string;
  icon?: JSX.Element;
  label: string;
  selected?: boolean;
  onClick: () => void;
  onKeySelect: (closeDropdown: boolean) => void;
};

const DropdownItem: ParentComponent<DropdownItemProps> = props => {
  return (
    <button
      type="button"
      class="flex items-center gap-3 w-full px-4 py-2 text-left text-foreground hover:text-background hover:bg-foreground focus:bg-foreground focus:text-background focus:outline-hidden bg-background"
      role="option"
      aria-selected={props.selected}
      onClick={() => {
        props.onKeySelect(true);
      }}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          props.onKeySelect(false);
        }
      }}
    >
      <Show when={props.icon}>
        <div class="w-6 h-6 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">{props.icon}</div>
      </Show>
      {props.label}
    </button>
  );
};
