import { gzipSync, decompressSync, strToU8, strFromU8 } from 'fflate';

const toB64url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromB64url = (s: string): Uint8Array => {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

export function compressToHash(text: string): string {
  const gz = gzipSync(strToU8(text));
  const b64 = toB64url(gz);
  return 'z=' + b64;
}

export function decompressFromHash(hash: string): string | null {
  try {
    const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
    if (!params.has('z')) return null;
    const bytes = fromB64url(params.get('z')!);
    const text = strFromU8(decompressSync(bytes));
    return text;
  } catch (error) {
    console.error('Failed to decompress from hash:', error);
    return null;
  }
}

export function createShareLink(text: string): { url: string; size: number; compressed: boolean } {
  const hash = compressToHash(text);
  const url = new URL(window.location.href);
  url.search = ''; // Clear query params
  url.hash = hash;
  const fullUrl = url.toString();

  const originalSize = text.length;
  const compressedSize = hash.length;
  const compressionRatio = ((compressedSize / originalSize) * 100).toFixed(0);

  console.log(`Compressed trace: ${originalSize} bytes → ${compressedSize} bytes (${compressionRatio}%)`);

  // Conservative limit: 8KB for the hash
  const MAX_HASH_SIZE = 8192;

  if (hash.length > MAX_HASH_SIZE) {
    return {
      url: '',
      size: hash.length,
      compressed: false
    };
  }

  return {
    url: fullUrl,
    size: hash.length,
    compressed: true
  };
}

export function downloadTrace(text: string, filename: string = 'trace.jsonl') {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
