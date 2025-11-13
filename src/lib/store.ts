
import { writable } from 'svelte/store';
import type { TraceData } from './types';
import { parseJsonl } from './parser';
import { threads, activeThreadId } from './threads';

// Keep trace store for backwards compatibility but deprecate its use
export const trace = writable<TraceData>({ title: '', events: [], originalMessages: [] });
export const errorMessage = writable<string | null>(null);

export function clearTrace() {
  // Clear by setting no active thread
  activeThreadId.set(null);
}

export async function loadTraceFromUrl(url: string) {
  try {
    errorMessage.set(null);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
    }
    const text = await res.text();

    // Check if response is empty
    if (!text || text.trim().length === 0) {
      throw new Error('URL returned empty content. Please provide a valid JSONL trace file URL.');
    }

    const data = parseJsonl(text);

    // Provide specific error messages based on what we found
    if (!data || data.events.length === 0) {
      if (data.originalMessages.length === 0) {
        throw new Error('No messages found. The file may contain only metadata (snapshots, summaries) or be in an unsupported format.');
      } else {
        throw new Error('No conversation events found. The file contains messages but they may be system logs or an unsupported message type.');
      }
    }

    // Add directly to threads and activate it
    const newThreadId = threads.add(data);
    activeThreadId.set(newThreadId);
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

    // Check if file is empty
    if (!text || text.trim().length === 0) {
      throw new Error('File is empty. Please upload a valid JSONL trace file.');
    }

    const data = parseJsonl(text);

    // Provide specific error messages based on what we found
    if (!data || data.events.length === 0) {
      if (data.originalMessages.length === 0) {
        throw new Error('No messages found in file. The file may contain only metadata (snapshots, summaries) or be in an unsupported format.');
      } else {
        throw new Error('No conversation events found. The file contains messages but they may be system logs or an unsupported message type.');
      }
    }

    // Add directly to threads and activate it
    const newThreadId = threads.add(data);
    activeThreadId.set(newThreadId);
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
