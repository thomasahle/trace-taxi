import { describe, it, expect, beforeEach, vi } from 'vitest';
import { compressToHash, decompressFromHash, createShareLink, downloadTrace } from './share';

describe('compressToHash', () => {
  it('should compress and encode text to hash format', () => {
    const text = 'Hello, World!';
    const hash = compressToHash(text);

    expect(hash).toMatch(/^z=/);
    expect(hash.length).toBeGreaterThan(2); // More than just 'z='
  });

  it('should produce consistent output for same input', () => {
    const text = 'Consistent text';
    const hash1 = compressToHash(text);
    const hash2 = compressToHash(text);

    expect(hash1).toBe(hash2);
  });

  it('should handle empty string', () => {
    const hash = compressToHash('');
    expect(hash).toMatch(/^z=/);
    expect(hash.length).toBeGreaterThan(2);
  });

  it('should handle large text', () => {
    const largeText = 'A'.repeat(10000);
    const hash = compressToHash(largeText);

    expect(hash).toMatch(/^z=/);
    // Compression should reduce size significantly for repetitive content
    expect(hash.length).toBeLessThan(largeText.length);
  });

  it('should handle special characters', () => {
    const text = 'Special: 世界 🌍 \n\t\r';
    const hash = compressToHash(text);

    expect(hash).toMatch(/^z=/);
    expect(hash).not.toContain('+'); // Should use URL-safe base64
    expect(hash).not.toContain('/'); // Should use URL-safe base64
    expect(hash).not.toContain('='); // Should strip padding
  });

  it('should produce URL-safe output', () => {
    const text = 'A'.repeat(1000);
    const hash = compressToHash(text);

    // Check for URL-safe base64 characters only
    const hashContent = hash.slice(2); // Remove 'z='
    expect(hashContent).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('decompressFromHash', () => {
  it('should decompress hash created by compressToHash', () => {
    const originalText = 'Round trip test';
    const hash = compressToHash(originalText);
    const decompressed = decompressFromHash(hash);

    expect(decompressed).toBe(originalText);
  });

  it('should handle hash with # prefix', () => {
    const originalText = 'Test with hash prefix';
    const hash = compressToHash(originalText);
    const decompressed = decompressFromHash('#' + hash);

    expect(decompressed).toBe(originalText);
  });

  it('should return null for invalid hash', () => {
    expect(decompressFromHash('invalid')).toBeNull();
    expect(decompressFromHash('z=invalid-base64')).toBeNull();
    expect(decompressFromHash('')).toBeNull();
  });

  it('should return null for hash without z parameter', () => {
    expect(decompressFromHash('x=something')).toBeNull();
    expect(decompressFromHash('other=value')).toBeNull();
  });

  it('should handle empty compressed data', () => {
    const hash = compressToHash('');
    const decompressed = decompressFromHash(hash);

    expect(decompressed).toBe('');
  });

  it('should handle large compressed data', () => {
    const largeText = JSON.stringify({ data: 'A'.repeat(5000) });
    const hash = compressToHash(largeText);
    const decompressed = decompressFromHash(hash);

    expect(decompressed).toBe(largeText);
  });

  it('should handle special characters in round-trip', () => {
    const specialText = 'Unicode: 世界 🌍\nNewlines\tTabs\r\nSpecial: !@#$%^&*()';
    const hash = compressToHash(specialText);
    const decompressed = decompressFromHash(hash);

    expect(decompressed).toBe(specialText);
  });

  it('should handle JSON trace data', () => {
    const traceData = JSON.stringify([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' }
    ]);
    const hash = compressToHash(traceData);
    const decompressed = decompressFromHash(hash);

    expect(decompressed).toBe(traceData);
    expect(JSON.parse(decompressed!)).toEqual(JSON.parse(traceData));
  });

  it('should return null and log error for corrupted data', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create valid hash then corrupt it
    const hash = compressToHash('test');
    const corruptedHash = hash.slice(0, -5) + 'xxxxx';

    const result = decompressFromHash(corruptedHash);

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to decompress from hash:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});

describe('createShareLink', () => {
  beforeEach(() => {
    // Mock window.location
    delete (window as any).location;
    window.location = {
      href: 'http://example.com/trace-viewer',
      origin: 'http://example.com',
      pathname: '/trace-viewer'
    } as any;
  });

  it('should create share link with compressed data', () => {
    const text = 'Short trace data';
    const result = createShareLink(text);

    expect(result.compressed).toBe(true);
    expect(result.url).toContain('http://example.com');
    expect(result.url).toContain('#z=');
    expect(result.size).toBeGreaterThan(0);
  });

  it('should clear query params from URL', () => {
    window.location.href = 'http://example.com/trace-viewer?param=value';

    const text = 'Test data';
    const result = createShareLink(text);

    expect(result.url).not.toContain('?');
    expect(result.url).not.toContain('param=value');
    expect(result.url).toContain('#z=');
  });

  it('should return empty URL for data exceeding 8KB limit', () => {
    // Create text that will compress to >8KB
    const largeText = JSON.stringify({ data: 'X'.repeat(50000) });
    const result = createShareLink(largeText);

    expect(result.compressed).toBe(false);
    expect(result.url).toBe('');
    expect(result.size).toBeGreaterThan(8192);
  });

  it('should handle small trace data', () => {
    const text = '{"role":"user","content":"Hi"}';
    const result = createShareLink(text);

    expect(result.compressed).toBe(true);
    expect(result.url).toBeTruthy();
    expect(result.size).toBeLessThan(1000);
  });

  it('should calculate compression ratio correctly', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const text = 'A'.repeat(1000);
    const result = createShareLink(text);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Compressed trace:'),
      expect.anything()
    );
    expect(result.size).toBeLessThan(text.length);

    consoleSpy.mockRestore();
  });

  it('should produce decompressible URLs', () => {
    const originalText = JSON.stringify({
      messages: [
        { role: 'user', content: 'Test message' },
        { role: 'assistant', content: 'Response' }
      ]
    });

    const result = createShareLink(originalText);

    // Extract hash from URL
    const url = new URL(result.url);
    const hash = url.hash;

    const decompressed = decompressFromHash(hash);
    expect(decompressed).toBe(originalText);
  });

  it('should handle exactly 8KB edge case', () => {
    // Create text that compresses to approximately 8KB
    const text = 'B'.repeat(40000);
    const result = createShareLink(text);

    // Should either succeed or fail based on exact size
    if (result.size <= 8192) {
      expect(result.compressed).toBe(true);
      expect(result.url).toBeTruthy();
    } else {
      expect(result.compressed).toBe(false);
      expect(result.url).toBe('');
    }
  });
});

describe('downloadTrace', () => {
  let createElementSpy: any;
  let appendChildSpy: any;
  let removeChildSpy: any;
  let createObjectURLSpy: any;
  let revokeObjectURLSpy: any;
  let clickSpy: any;

  beforeEach(() => {
    // Mock DOM APIs
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn()
    };
    clickSpy = mockAnchor.click;

    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any);

    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  it('should create download with default filename', () => {
    const text = 'trace content';
    downloadTrace(text);

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(clickSpy).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });

  it('should use custom filename when provided', () => {
    const text = 'trace content';
    const filename = 'my-trace.jsonl';

    downloadTrace(text, filename);

    const anchor = createElementSpy.mock.results[0].value;
    expect(anchor.download).toBe(filename);
  });

  it('should create blob with correct type', () => {
    const text = '{"role":"user","content":"test"}';
    downloadTrace(text);

    expect(createObjectURLSpy).toHaveBeenCalled();
    // Blob is created with application/json type
    const blobCall = createObjectURLSpy.mock.calls[0][0];
    expect(blobCall.type).toBe('application/json');
  });

  it('should clean up resources after download', () => {
    const text = 'content';
    downloadTrace(text);

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    expect(removeChildSpy).toHaveBeenCalled();
  });

  it('should handle empty text', () => {
    downloadTrace('');

    expect(clickSpy).toHaveBeenCalled();
    expect(createObjectURLSpy).toHaveBeenCalled();
  });

  it('should handle large text content', () => {
    const largeText = 'X'.repeat(100000);
    downloadTrace(largeText);

    expect(clickSpy).toHaveBeenCalled();
    expect(createObjectURLSpy).toHaveBeenCalled();
  });

  it('should set correct anchor attributes', () => {
    const text = 'test';
    const filename = 'custom.jsonl';

    downloadTrace(text, filename);

    const anchor = createElementSpy.mock.results[0].value;
    expect(anchor.href).toBe('blob:mock-url');
    expect(anchor.download).toBe(filename);
  });
});
