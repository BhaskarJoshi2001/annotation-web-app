'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
type Resolved = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: Resolved;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'as-theme';

function systemPref(): Resolved {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function resolve(mode: ThemeMode): Resolved {
  return mode === 'system' ? systemPref() : mode;
}

// Suppress transitions for one frame during a theme flip. Without this, engines
// can leave background/color (whose value comes from a var() changed via an
// ancestor attribute) stuck at the old value.
let killEl: HTMLStyleElement | null = null;
function suppressTransitions(): void {
  if (typeof document === 'undefined' || !document.head) return;
  if (!killEl) {
    killEl = document.createElement('style');
    killEl.textContent = '*,*::before,*::after{transition:none !important}';
  }
  if (!killEl.isConnected) document.head.appendChild(killEl);
  void document.documentElement.offsetWidth; // force reflow
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (killEl && killEl.isConnected) killEl.remove();
    });
  });
}

function applyTheme(mode: ThemeMode, animate: boolean): void {
  if (typeof document === 'undefined') return;
  if (animate) suppressTransitions();
  const root = document.documentElement;
  const res = resolve(mode);
  root.setAttribute('data-theme', res);
  root.setAttribute('data-theme-mode', mode);
  root.classList.toggle('dark', res === 'dark');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [resolved, setResolved] = useState<Resolved>('light');

  // Sync React state from storage on mount. The DOM is already themed by the
  // pre-paint script in the root layout, so this only aligns state (no flash).
  useEffect(() => {
    const stored =
      (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) || 'system';
    setModeState(stored);
    setResolved(resolve(stored));
  }, []);

  // Follow the OS preference while in system mode.
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (): void => {
      if (mode === 'system') {
        applyTheme('system', true);
        setResolved(systemPref());
      }
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next, true);
    setModeState(next);
    setResolved(resolve(next));
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
