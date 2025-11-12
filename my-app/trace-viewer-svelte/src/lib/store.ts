
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
