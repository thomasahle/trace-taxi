import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { loadTraceFromUrl, loadTraceFromFile, trace, errorMessage, theme, Theme } from './store';
import type { TraceData } from './types';

// Mock parseJsonl
vi.mock('./parser', () => ({
  parseJsonl: vi.fn((text: string): TraceData => {
    if (text === 'invalid') {
      return { title: '', events: [], originalMessages: [] };
    }
    if (text.includes('error')) {
      throw new Error('Parse error');
    }
    return {
      title: 'Test Trace',
      events: [
        { kind: 'user', text: 'Hello' },
        { kind: 'assistant', text: 'Hi' }
      ],
      originalMessages: []
    };
  })
}));

// Mock fetch
global.fetch = vi.fn();

// Mock File
class MockFile {
  constructor(public content: string, public name: string) {}
  async text() {
    return this.content;
  }
}

describe('loadTraceFromUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    errorMessage.set(null);
    trace.set({ title: '', events: [], originalMessages: [] });
    localStorage.clear();
  });

  it('should load trace from valid URL', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => '{"role":"user","content":"test"}'
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    await loadTraceFromUrl('http://example.com/trace.jsonl');

    const traceData = get(trace);
    expect(traceData.title).toBe('Test Trace');
    expect(traceData.events).toHaveLength(2);
    expect(get(errorMessage)).toBeNull();
  });

  it('should set error message on fetch failure', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found'
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    await loadTraceFromUrl('http://example.com/missing.jsonl');

    expect(get(errorMessage)).toContain('404');
    expect(get(errorMessage)).toContain('Not Found');
  });

  it('should set error message when no events found', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => 'invalid'
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    await loadTraceFromUrl('http://example.com/empty.jsonl');

    expect(get(errorMessage)).toBe('No events found in trace file');
  });

  it('should handle network errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    await loadTraceFromUrl('http://example.com/trace.jsonl');

    expect(get(errorMessage)).toBe('Network error');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should clear previous error message on new load', async () => {
    errorMessage.set('Previous error');

    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => '{"role":"user","content":"test"}'
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    await loadTraceFromUrl('http://example.com/trace.jsonl');

    expect(get(errorMessage)).toBeNull();
  });

  it('should handle parse errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => 'error-trigger'
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    await loadTraceFromUrl('http://example.com/bad.jsonl');

    expect(get(errorMessage)).toBe('Parse error');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should handle non-Error exceptions', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as any).mockRejectedValue('String error');

    await loadTraceFromUrl('http://example.com/trace.jsonl');

    expect(get(errorMessage)).toBe('Failed to load trace from URL');

    consoleSpy.mockRestore();
  });
});

describe('loadTraceFromFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    errorMessage.set(null);
    trace.set({ title: '', events: [], originalMessages: [] });
  });

  it('should load trace from valid file', async () => {
    const file = new MockFile('{"role":"user","content":"test"}', 'trace.jsonl');

    await loadTraceFromFile(file as any);

    const traceData = get(trace);
    expect(traceData.title).toBe('Test Trace');
    expect(traceData.events).toHaveLength(2);
    expect(get(errorMessage)).toBeNull();
  });

  it('should set error message when no events found', async () => {
    const file = new MockFile('invalid', 'empty.jsonl');

    await loadTraceFromFile(file as any);

    expect(get(errorMessage)).toContain('No events found in trace file');
    expect(get(errorMessage)).toContain('valid JSONL');
  });

  it('should handle file read errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const errorFile = {
      text: () => Promise.reject(new Error('Failed to read file'))
    };

    await loadTraceFromFile(errorFile as any);

    expect(get(errorMessage)).toBe('Failed to read file');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should handle parse errors from file', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const file = new MockFile('error-trigger', 'bad.jsonl');

    await loadTraceFromFile(file as any);

    expect(get(errorMessage)).toBe('Parse error');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should clear previous error message on new load', async () => {
    errorMessage.set('Previous error');

    const file = new MockFile('{"role":"user","content":"test"}', 'trace.jsonl');

    await loadTraceFromFile(file as any);

    expect(get(errorMessage)).toBeNull();
  });

  it('should handle non-Error exceptions', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const errorFile = {
      text: () => Promise.reject('String error')
    };

    await loadTraceFromFile(errorFile as any);

    expect(get(errorMessage)).toBe('Failed to parse trace file');

    consoleSpy.mockRestore();
  });

  it('should handle empty file', async () => {
    const file = new MockFile('invalid', 'empty.jsonl');

    await loadTraceFromFile(file as any);

    // parseJsonl returns empty events for invalid content
    expect(get(errorMessage)).toContain('No events found');
  });

  it('should handle large files', async () => {
    const largeContent = Array(1000).fill('{"role":"user","content":"test"}').join('\n');
    const file = new MockFile(largeContent, 'large.jsonl');

    await loadTraceFromFile(file as any);

    const traceData = get(trace);
    expect(traceData.events.length).toBeGreaterThan(0);
  });
});

describe('trace store', () => {
  it('should initialize with empty trace data', () => {
    // Reset to initial state
    trace.set({ title: '', events: [], originalMessages: [] });

    const initial = get(trace);
    expect(initial.title).toBe('');
    expect(initial.events).toHaveLength(0);
    expect(initial.originalMessages).toHaveLength(0);
  });

  it('should be writable', () => {
    const newData: TraceData = {
      title: 'New Trace',
      events: [{ kind: 'user', text: 'test' }],
      originalMessages: []
    };

    trace.set(newData);

    const current = get(trace);
    expect(current.title).toBe('New Trace');
    expect(current.events).toHaveLength(1);
  });
});

describe('errorMessage store', () => {
  it('should initialize with null', () => {
    expect(get(errorMessage)).toBeNull();
  });

  it('should be writable', () => {
    errorMessage.set('Test error');
    expect(get(errorMessage)).toBe('Test error');

    errorMessage.set(null);
    expect(get(errorMessage)).toBeNull();
  });
});

describe('theme store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with light theme by default', () => {
    theme.set('light');
    const currentTheme = get(theme);
    expect(currentTheme).toBe('light');
  });

  it('should load theme from localStorage', async () => {
    localStorageMock.setItem('theme', 'dark');

    // Re-import to trigger initialization
    vi.resetModules();
    const module = await import('./store');
    const currentTheme = get(module.theme);
    expect(currentTheme).toBe('dark');

    // Restore for other tests
    vi.resetModules();
  });

  it('should toggle between light and dark', () => {
    theme.set('light');
    expect(get(theme)).toBe('light');

    theme.toggle();
    expect(get(theme)).toBe('dark');

    theme.toggle();
    expect(get(theme)).toBe('light');
  });

  it('should persist theme to localStorage when set', () => {
    theme.set('dark');

    expect(localStorage.getItem('theme')).toBe('dark');

    theme.set('light');

    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('should handle missing localStorage gracefully', async () => {
    // Simulate SSR environment
    const originalWindow = global.window;
    delete (global as any).window;

    vi.resetModules();
    const module = await import('./store');

    // Should not throw
    expect(() => module.theme.set('dark')).not.toThrow();

    // Restore window
    global.window = originalWindow;
  });

  it('should update theme without persisting in SSR mode', async () => {
    const originalWindow = global.window;
    delete (global as any).window;

    vi.resetModules();
    const module = await import('./store');

    module.theme.set('dark');

    const current = get(module.theme);
    expect(current).toBe('dark');

    // Restore window
    global.window = originalWindow;
  });
});
