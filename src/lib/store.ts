
import { writable } from 'svelte/store';
import type { TraceData } from './types';
import { parseJsonl } from './parser';

export const trace = writable<TraceData>({ title: '', events: [], originalMessages: [] });
export const errorMessage = writable<string | null>(null);

export async function loadTraceFromUrl(url: string) {
  try {
    errorMessage.set(null);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
    }
    const text = await res.text();
    const data = parseJsonl(text);
    if (!data || data.events.length === 0) {
      throw new Error('No events found in trace file');
    }
    trace.set(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load trace from URL';
    errorMessage.set(message);
    console.error('Error loading trace from URL:', error);
  }
}

export async function loadTraceFromFile(file: File) {
  try {
    errorMessage.set(null);
    const text = await file.text();
    const data = parseJsonl(text);
    if (!data || data.events.length === 0) {
      throw new Error('No events found in trace file. Make sure it\'s a valid JSONL trace file.');
    }
    trace.set(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to parse trace file';
    errorMessage.set(message);
    console.error('Error loading trace from file:', error);
  }
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
