
import { writable } from 'svelte/store';
import type { TraceData } from './types';
import { parseJsonl } from './parser';

export const trace = writable<TraceData>({ title: '', events: [], originalMessages: [] });

export async function loadTraceFromUrl(url: string) {
  const res = await fetch(url);
  const text = await res.text();
  const data = parseJsonl(text);
  trace.set(data);
}

export async function loadTraceFromFile(file: File) {
  const text = await file.text();
  const data = parseJsonl(text);
  trace.set(data);
}

// Theme store
export type Theme = 'light' | 'dark';

function createThemeStore() {
  // Load theme from localStorage or default to 'light'
  const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') as Theme : null;
  const initial: Theme = stored || 'light';

  const { subscribe, set, update } = writable<Theme>(initial);

  return {
    subscribe,
    toggle: () => {
      update(current => current === 'light' ? 'dark' : 'light');
    },
    set: (value: Theme) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', value);
      }
      set(value);
    }
  };
}

export const theme = createThemeStore();
