'use client';

import type { CSSProperties } from 'react';
import { useTheme, type ThemeMode } from './theme-provider';

const OPTIONS: ReadonlyArray<{ value: ThemeMode; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Auto' },
];

const groupStyle: CSSProperties = {
  display: 'inline-flex',
  background: 'var(--surface-variant)',
  border: '1px solid var(--outline)',
  borderRadius: 'var(--radius-full)',
  padding: '3px',
  gap: '2px',
};

export function ThemeSwitch() {
  const { mode, setMode } = useTheme();

  return (
    <div role="group" aria-label="Theme" style={groupStyle}>
      {OPTIONS.map((option) => {
        const active = mode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => setMode(option.value)}
            style={{
              appearance: 'none',
              border: 0,
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              font: 'inherit',
              fontSize: 'var(--text-caption-size)',
              fontWeight: 600,
              background: active ? 'var(--surface)' : 'transparent',
              color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
              boxShadow: active ? 'var(--elevation-1)' : 'none',
              transition: 'all var(--duration-fast) var(--ease-standard)',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
