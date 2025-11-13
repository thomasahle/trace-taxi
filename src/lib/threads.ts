import { writable, derived, get } from "svelte/store";
import type { TraceData } from "./types";

export interface Thread {
  id: string;
  title: string;
  data: TraceData;
  timestamp: number;
  eventCount: number;
}

const STORAGE_KEY = "trace-viewer-threads";
const MAX_THREADS = 50;

// Load threads from local storage
function loadThreadsFromStorage(): Thread[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load threads from storage:", e);
  }
  return [];
}

// Save threads to local storage
function saveThreadsToStorage(threads: Thread[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch (e) {
    console.error("Failed to save threads to storage:", e);
  }
}

// Create the threads store
function createThreadsStore() {
  const { subscribe, set, update } = writable<Thread[]>(
    loadThreadsFromStorage(),
  );

  return {
    subscribe,

    // Add a new thread
    add: (data: TraceData): string => {
      const id = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      update((threads) => {
        const newThread: Thread = {
          id,
          title: data.title || "Untitled Trace",
          data,
          timestamp: Date.now(),
          eventCount: data.events?.length || 0,
        };

        // Add to beginning and limit to MAX_THREADS
        const updated = [newThread, ...threads].slice(0, MAX_THREADS);
        saveThreadsToStorage(updated);
        return updated;
      });
      return id;
    },

    // Update an existing thread
    update: (id: string, updates: Partial<Thread>) => {
      update((threads) => {
        const updated = threads.map((thread) =>
          thread.id === id
            ? { ...thread, ...updates, timestamp: Date.now() }
            : thread,
        );
        saveThreadsToStorage(updated);
        return updated;
      });
    },

    // Delete a thread
    delete: (id: string) => {
      update((threads) => {
        const updated = threads.filter((thread) => thread.id !== id);
        saveThreadsToStorage(updated);
        return updated;
      });
    },

    // Get a specific thread
    get: (id: string): Thread | undefined => {
      const threads = get({ subscribe });
      return threads.find((thread) => thread.id === id);
    },

    // Clear all threads
    clear: () => {
      set([]);
      saveThreadsToStorage([]);
    },

    // Rename a thread
    rename: (id: string, newTitle: string) => {
      update((threads) => {
        const updated = threads.map((thread) =>
          thread.id === id
            ? { ...thread, title: newTitle, timestamp: Date.now() }
            : thread,
        );
        saveThreadsToStorage(updated);
        return updated;
      });
    },
  };
}

export const threads = createThreadsStore();

// Current active thread ID
export const activeThreadId = writable<string | null>(null);

// Derived store for the active thread
export const activeThread = derived(
  [threads, activeThreadId],
  ([$threads, $activeThreadId]) => {
    if (!$activeThreadId) return null;
    return $threads.find((t) => t.id === $activeThreadId) || null;
  },
);
