import { A, type AnchorProps } from '@solidjs/router';
import { splitProps, type ParentProps } from 'solid-js';

type ButtonProps = {
  className?: string;
  title?: string;
  onClick: () => void;
};

const defaultStyles = 'px-1 py-1 text-xs cursor-pointer [&>svg]:w-5 [&>svg]:h-5';

const buttonColorStyles = ['text-foreground', 'border', 'border-foreground', 'rounded-lg'].join(' ');

const buttonLinkColorStyles = [
  'text-foreground',
  'light:text-background',
  'bg-blue-600',
  'hover:bg-blue-700',
  'focus:bg-blue-700',
  'border',
  'border-transparent',
  'rounded-sm',
  'high-contrast:text-background!',
  'high-contrast:bg-foreground',
  'hover:high-contrast:bg-background!',
  'hover:high-contrast:text-foreground!',
  'hover:high-contrast:border-foreground',
].join(' ');

const buttonLinkInvertedColorStyles = [
  'text-foreground',
  'border',
  'border-foreground',
  'light:border-neutral-500',
  'hover:light:border-foreground',
  'rounded-sm',
  'hover:text-background',
  'hover:bg-foreground',
  'high-contrast:border-foreground',
].join(' ');

export const Button = (props: ParentProps<ButtonProps>) => {
  const [own, rest] = splitProps(props, ['children', 'className']);
  const classNames = ['p-2', buttonLinkColorStyles, own.className ?? ''].join(' ');
  return (
    <button type="button" class={classNames} {...rest}>
      {own.children}
    </button>
  );
};

export const DangerButton = (props: ParentProps<ButtonProps>) => {
  return (
    <button
      type="button"
      class="px-4 py-2 bg-red-500 text-white rounded-sm hover:bg-red-600 high-contrast:bg-red-700 hover:high-contrast:bg-red-800"
      {...props}
    />
  );
};

export const IconButton = (props: ParentProps<ButtonProps>) => {
  const [own, rest] = splitProps(props, ['children', 'className']);
  const classNames = [defaultStyles, buttonColorStyles, own.className ?? ''].join(' ');
  return (
    <button type="button" class={classNames} {...rest}>
      {own.children}
    </button>
  );
};

export const ButtonLink = (props: ParentProps<AnchorProps>) => {
  const [own, rest] = splitProps(props, ['class']);
  const classNames = ['block', 'p-2', 'text-center', buttonLinkColorStyles, own.class ?? ''].join(' ');
  return <A class={classNames} {...rest} />;
};

export const ButtonLinkInverted = (props: ParentProps<AnchorProps>) => {
  return <A class={`block p-2 truncate ${buttonLinkInvertedColorStyles}`} {...props} />;
};

export const Link = (props: ParentProps<AnchorProps>) => <A class="underline" {...props} />;
