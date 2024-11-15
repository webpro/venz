import type { ParentProps } from 'solid-js';

type InputProps = {
  className?: string;
};

export const Input = (props: ParentProps<InputProps & { value?: string }>) => {
  const { className = '', value, ...rest } = props;
  return (
    <input
      type="text"
      value={props.value}
      class={`flex-1 p-2 border-none bg-gray-50 text-gray-700 high-contrast:text-gray-900 ${className}`}
      {...rest}
    />
  );
};

export const CommandInput = (props: ParentProps) => (
  <input type="text" class="flex-1 p-2 bg-gray-50 text-gray-700 text-mono border-none mb-px" {...props} />
);

export const ColorInput = (props: ParentProps) => {
  return (
    <input
      type="color"
      aria-label="color"
      class="w-full h-[39px] cursor-pointer appearance-none bg-transparent border-0"
      {...props}
    />
  );
};

export const Select = (props: ParentProps) => {
  return (
    <select
      class="flex-1 p-2 border-none rounded-none bg-gray-50 text-gray-700 high-contrast:text-gray-900 appearance-none"
      {...props}
    />
  );
};
