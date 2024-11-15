import { Dynamic } from 'solid-js/web';
import { useTheme } from '../stores/theme';
import { Sun } from './icons/Sun';
import { Moon } from './icons/Moon';
import { Contrast } from './icons/Contrast';
import { createEffect } from 'solid-js';
import { IconButton } from './Button';

export default function ThemeSwitch() {
  const { theme, setTheme } = useTheme();

  createEffect(() => {
    document.documentElement.className = theme();
  });

  const nextTheme = {
    light: 'dark',
    dark: 'high-contrast',
    'high-contrast': 'light',
  } as const;

  const icons = {
    light: Sun,
    dark: Moon,
    'high-contrast': Contrast,
  } as const;

  return (
    <IconButton
      onClick={() => {
        const next = nextTheme[theme()];
        setTheme(next);
        localStorage.setItem('theme', next);
      }}
      title={`Switch to ${nextTheme[theme()]} theme`}
    >
      <Dynamic component={icons[theme()]} class="w-5 h-5" />
    </IconButton>
  );
}
