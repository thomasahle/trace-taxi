import { describe, it, expect, beforeEach, vi } from "vitest";
import { get } from "svelte/store";
import type { TraceData } from "./types";
import type { Thread } from "./threads";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

globalThis.localStorage = localStorageMock as any;

describe("threads store", () => {
  let createThreadsStore: any;
  let threads: any;

  beforeEach(async () => {
    // Clear localStorage before each test
    localStorageMock.clear();

    // Reset Date.now mock
    vi.restoreAllMocks();

    // Re-import to get fresh store
    vi.resetModules();
    const module = await import("./threads");
    createThreadsStore = () => module.threads;
    threads = createThreadsStore();
  });

  const createMockTraceData = (
    title: string = "Test Trace",
    eventCount: number = 5,
  ): TraceData => ({
    title,
    events: Array(eventCount).fill({ kind: "user", text: "test" }),
    originalMessages: [],
  });

  describe("initialization", () => {
    it("should initialize with empty array when no stored data", () => {
      const threadList = get(threads) as Thread[];
      expect(threadList).toEqual([]);
    });

    it("should load threads from localStorage on initialization", async () => {
      const storedThreads = [
        {
          id: "thread-1",
          title: "Stored Thread",
          data: createMockTraceData("Stored"),
          timestamp: Date.now(),
          eventCount: 3,
        },
      ];

      localStorageMock.setItem(
        "trace-viewer-threads",
        JSON.stringify(storedThreads),
      );

      // Re-import to trigger initialization
      vi.resetModules();
      const module = await import("./threads");
      const newThreads = module.threads;

      const loaded = get(newThreads);
      expect(loaded).toHaveLength(1);
      expect(loaded[0].title).toBe("Stored Thread");
    });

    it("should handle corrupted localStorage data gracefully", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      localStorageMock.setItem("trace-viewer-threads", "invalid json");

      // Re-import to trigger initialization
      vi.resetModules();
      const module = await import("./threads");
      const newThreads = module.threads;

      const loaded = get(newThreads);
      expect(loaded).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("add", () => {
    it("should add new thread to the store", () => {
      const data = createMockTraceData("New Thread", 10);
      threads.add(data);

      const threadList = get(threads) as Thread[];
      expect(threadList).toHaveLength(1);
      expect(threadList[0].title).toBe("New Thread");
      expect(threadList[0].eventCount).toBe(10);
    });

    it("should generate unique thread ID", () => {
      threads.add(createMockTraceData("Thread 1"));
      threads.add(createMockTraceData("Thread 2"));

      const threadList = get(threads) as Thread[];
      expect(threadList).toHaveLength(2);
      expect(threadList[0].id).not.toBe(threadList[1].id);
      expect(threadList[0].id).toMatch(/^thread-\d+-[a-z0-9]+$/);
    });

    it("should add new threads to the beginning", () => {
      threads.add(createMockTraceData("First"));
      threads.add(createMockTraceData("Second"));

      const threadList = get(threads) as Thread[];
      expect(threadList[0].title).toBe("Second");
      expect(threadList[1].title).toBe("First");
    });

    it('should use "Untitled Trace" for threads without title', () => {
      const data = createMockTraceData("", 5);
      data.title = "";
      threads.add(data);

      const threadList = get(threads) as Thread[];
      expect(threadList[0].title).toBe("Untitled Trace");
    });

    it("should set timestamp when adding thread", () => {
      const mockTime = 1234567890;
      vi.spyOn(Date, "now").mockReturnValue(mockTime);

      threads.add(createMockTraceData("Test"));

      const threadList = get(threads) as Thread[];
      expect(threadList[0].timestamp).toBe(mockTime);
    });

    it("should persist to localStorage", () => {
      threads.add(createMockTraceData("Persisted Thread"));

      const stored = localStorageMock.getItem("trace-viewer-threads");
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].title).toBe("Persisted Thread");
    });

    it("should enforce MAX_THREADS limit (50)", () => {
      // Add 60 threads
      for (let i = 0; i < 60; i++) {
        threads.add(createMockTraceData(`Thread ${i}`));
      }

      const threadList = get(threads) as Thread[];
      expect(threadList).toHaveLength(50);
      // Most recent should be first
      expect(threadList[0].title).toBe("Thread 59");
      // Oldest kept should be 51st from end
      expect(threadList[49].title).toBe("Thread 10");
    });

    it("should handle events array being undefined", () => {
      const data = {
        title: "No Events",
        events: undefined,
        originalMessages: [],
      } as any;
      threads.add(data);

      const threadList = get(threads) as Thread[];
      expect(threadList[0].eventCount).toBe(0);
    });
  });

  describe("update", () => {
    it("should update existing thread", () => {
      threads.add(createMockTraceData("Original"));
      const threadList = get(threads) as Thread[];
      const threadId = threadList[0].id;

      threads.update(threadId, { title: "Updated" });

      const updated = get(threads) as Thread[];
      expect(updated[0].title).toBe("Updated");
    });

    it("should update timestamp when updating thread", () => {
      threads.add(createMockTraceData("Test"));
      const threadList = get(threads) as Thread[];
      const threadId = threadList[0].id;
      const originalTimestamp = threadList[0].timestamp;

      const newTime = originalTimestamp + 1000;
      vi.spyOn(Date, "now").mockReturnValue(newTime);

      threads.update(threadId, { title: "Updated" });

      const updated = get(threads) as Thread[];
      expect(updated[0].timestamp).toBe(newTime);
      expect(updated[0].timestamp).toBeGreaterThan(originalTimestamp);
    });

    it("should persist updates to localStorage", () => {
      threads.add(createMockTraceData("Original"));
      const threadId = get(threads)[0].id;

      threads.update(threadId, { title: "Updated Title" });

      const stored = JSON.parse(
        localStorageMock.getItem("trace-viewer-threads")!,
      );
      expect(stored[0].title).toBe("Updated Title");
    });

    it("should not affect other threads", () => {
      threads.add(createMockTraceData("Thread 1"));
      threads.add(createMockTraceData("Thread 2"));

      const threadList = get(threads) as Thread[];
      const thread1Id = threadList.find((t) => t.title === "Thread 1")!.id;

      threads.update(thread1Id, { title: "Updated Thread 1" });

      const updated = get(threads) as Thread[];
      expect(updated.find((t) => t.id === thread1Id)!.title).toBe(
        "Updated Thread 1",
      );
      expect(updated.find((t) => t.title === "Thread 2")).toBeTruthy();
    });

    it("should do nothing if thread ID not found", () => {
      threads.add(createMockTraceData("Test"));

      threads.update("non-existent-id", { title: "Should Not Apply" });

      const threadList = get(threads) as Thread[];
      expect(threadList[0].title).toBe("Test");
    });
  });

  describe("delete", () => {
    it("should remove thread from store", () => {
      threads.add(createMockTraceData("To Delete"));
      const threadId = get(threads)[0].id;

      threads.delete(threadId);

      const threadList = get(threads) as Thread[];
      expect(threadList).toHaveLength(0);
    });

    it("should persist deletion to localStorage", () => {
      threads.add(createMockTraceData("To Delete"));
      const threadId = get(threads)[0].id;

      threads.delete(threadId);

      const stored = JSON.parse(
        localStorageMock.getItem("trace-viewer-threads")!,
      );
      expect(stored).toHaveLength(0);
    });

    it("should only delete specified thread", () => {
      threads.add(createMockTraceData("Keep"));
      threads.add(createMockTraceData("Delete"));

      const threadList = get(threads) as Thread[];
      const deleteId = threadList.find((t) => t.title === "Delete")!.id;

      threads.delete(deleteId);

      const remaining = get(threads) as Thread[];
      expect(remaining).toHaveLength(1);
      expect(remaining[0].title).toBe("Keep");
    });

    it("should do nothing if thread ID not found", () => {
      threads.add(createMockTraceData("Test"));

      threads.delete("non-existent-id");

      const threadList = get(threads) as Thread[];
      expect(threadList).toHaveLength(1);
    });
  });

  describe("get", () => {
    it("should return specific thread by ID", () => {
      threads.add(createMockTraceData("Thread 1"));
      threads.add(createMockTraceData("Thread 2"));

      const threadList = get(threads) as Thread[];
      const thread2Id = threadList.find((t) => t.title === "Thread 2")!.id;

      const retrieved = threads.get(thread2Id);

      expect(retrieved).toBeTruthy();
      expect(retrieved!.title).toBe("Thread 2");
    });

    it("should return undefined if thread not found", () => {
      threads.add(createMockTraceData("Test"));

      const retrieved = threads.get("non-existent-id");

      expect(retrieved).toBeUndefined();
    });

    it("should return undefined for empty store", () => {
      const retrieved = threads.get("any-id");
      expect(retrieved).toBeUndefined();
    });
  });

  describe("clear", () => {
    it("should remove all threads", () => {
      threads.add(createMockTraceData("Thread 1"));
      threads.add(createMockTraceData("Thread 2"));
      threads.add(createMockTraceData("Thread 3"));

      threads.clear();

      const threadList = get(threads) as Thread[];
      expect(threadList).toHaveLength(0);
    });

    it("should persist clear to localStorage", () => {
      threads.add(createMockTraceData("Test"));

      threads.clear();

      const stored = JSON.parse(
        localStorageMock.getItem("trace-viewer-threads")!,
      );
      expect(stored).toHaveLength(0);
    });

    it("should work on already empty store", () => {
      threads.clear();

      const threadList = get(threads) as Thread[];
      expect(threadList).toHaveLength(0);
    });
  });

  describe("rename", () => {
    it("should rename thread", () => {
      threads.add(createMockTraceData("Old Name"));
      const threadId = get(threads)[0].id;

      threads.rename(threadId, "New Name");

      const threadList = get(threads) as Thread[];
      expect(threadList[0].title).toBe("New Name");
    });

    it("should update timestamp when renaming", () => {
      threads.add(createMockTraceData("Test"));
      const threadId = get(threads)[0].id;
      const originalTimestamp = get(threads)[0].timestamp;

      const newTime = originalTimestamp + 1000;
      vi.spyOn(Date, "now").mockReturnValue(newTime);

      threads.rename(threadId, "Renamed");

      const updated = get(threads) as Thread[];
      expect(updated[0].timestamp).toBe(newTime);
    });

    it("should persist rename to localStorage", () => {
      threads.add(createMockTraceData("Original"));
      const threadId = get(threads)[0].id;

      threads.rename(threadId, "Renamed Thread");

      const stored = JSON.parse(
        localStorageMock.getItem("trace-viewer-threads")!,
      );
      expect(stored[0].title).toBe("Renamed Thread");
    });

    it("should not affect other threads", () => {
      threads.add(createMockTraceData("Thread 1"));
      threads.add(createMockTraceData("Thread 2"));

      const threadList = get(threads) as Thread[];
      const thread1Id = threadList.find((t) => t.title === "Thread 1")!.id;

      threads.rename(thread1Id, "Renamed Thread 1");

      const updated = get(threads) as Thread[];
      expect(updated.find((t) => t.title === "Thread 2")).toBeTruthy();
    });

    it("should do nothing if thread ID not found", () => {
      threads.add(createMockTraceData("Test"));

      threads.rename("non-existent-id", "Should Not Apply");

      const threadList = get(threads) as Thread[];
      expect(threadList[0].title).toBe("Test");
    });
  });

  describe("localStorage error handling", () => {
    it("should handle localStorage.setItem errors gracefully", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const setItemSpy = vi
        .spyOn(localStorageMock, "setItem")
        .mockImplementation(() => {
          throw new Error("Storage quota exceeded");
        });

      threads.add(createMockTraceData("Test"));

      // Should not throw, just log error
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to save threads to storage:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
      setItemSpy.mockRestore();
    });
  });
});

describe("activeThreadId store", () => {
  it("should export activeThreadId writable store", async () => {
    const module = await import("./threads");
    expect(module.activeThreadId).toBeDefined();
    expect(typeof module.activeThreadId.subscribe).toBe("function");
  });
});

describe("activeThread derived store", () => {
  beforeEach(async () => {
    localStorageMock.clear();
    vi.resetModules();
  });

  it("should return null when no active thread ID", async () => {
    const module = await import("./threads");
    const active = get(module.activeThread);
    expect(active).toBeNull();
  });

  it("should return active thread when ID is set", async () => {
    const module = await import("./threads");

    module.threads.add({
      title: "Active Thread",
      events: [],
      originalMessages: [],
    });

    const threads = get(module.threads);
    const threadId = threads[0].id;

    module.activeThreadId.set(threadId);

    const active = get(module.activeThread);
    expect(active).not.toBeNull();
    expect(active!.title).toBe("Active Thread");
  });

  it("should return null for non-existent thread ID", async () => {
    const module = await import("./threads");

    module.activeThreadId.set("non-existent-id");

    const active = get(module.activeThread);
    expect(active).toBeNull();
  });
});
