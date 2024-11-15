import { createSignal, createContext, useContext, type ParentProps } from 'solid-js';

type Theme = 'light' | 'dark' | 'high-contrast';
type ThemeContextType = { theme: () => Theme; setTheme: (t: Theme) => void };

const ThemeContext = createContext<ThemeContextType>();

export function ThemeProvider(props: ParentProps) {
  const [theme, setTheme] = createSignal<Theme>(
    (typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : 'dark') as Theme || 'dark'
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {props.children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
