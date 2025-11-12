
import type { OpenAIMessage, TraceData, TraceEvent } from './types';
import { isObject, textFromContent, guessTitle } from './utils';

function parseLine(line: string): any | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith('{')) return null;
  try { return JSON.parse(trimmed); }
  catch { return null; }
}

// Supports both legacy ChatCompletion logging and the new Responses API style (messages with tool_use/tool_result blocks).
export function parseJsonl(text: string): TraceData {
  const lines = text.split(/\r?\n/);
  const raw: any[] = [];
  for (const ln of lines) {
    const o = parseLine(ln);
    if (o) raw.push(o);
  }

  // If a single JSON array was provided instead of JSONL, allow it.
  if (raw.length === 0) {
    try {
      const arr = JSON.parse(text);
      if (Array.isArray(arr)) raw.push(...arr);
    } catch {}
  }

  // If wrapper objects exist (e.g. {type:'message', message:{...}}) normalize.
  const messages: OpenAIMessage[] = raw.map((r) => {
    // Claude Code format: {type: 'user'|'assistant', message: {...}}
    if ((r?.type === 'user' || r?.type === 'assistant') && r?.message) {
      return r.message;
    }
    // Skip file history snapshots and other non-message types
    if (r?.type === 'file-history-snapshot') return null;

    if (r?.type === 'message' && r?.message) return r.message;
    if (r?.object === 'chat.completion.chunk' && r?.choices) return r; // ignore streaming chunks later
    return r;
  }).filter(Boolean);

  const events: TraceEvent[] = [];

  for (const m of messages) {
    // Streaming chunks are ignored; expect full messages in trace.
    if (m?.object === 'chat.completion.chunk') continue;

    // New format: assistant content can contain tool_use blocks.
    if (m.role === 'assistant' && Array.isArray(m.content)) {
      let assistantText = '';
      for (const block of m.content) {
        const t = block?.type || block?.role;
        if (t === 'text') {
          const txt = (block.text?.value ?? block.text ?? block?.content ?? block?.value ?? '');
          assistantText += (assistantText ? '\n' : '') + (txt || '');
        } else if (t === 'tool_use') {
          events.push({
            kind: 'tool-use',
            id: block.id || block.tool_call_id || cryptoId(),
            name: block.name || block.tool_name || m?.tool_name || 'tool',
            input: block.input ?? block.arguments ?? {},
            raw: m,
            created_at: m.created_at
          });
        }
      }
      if (assistantText.trim()) {
        events.push({ kind: 'assistant', text: assistantText.trim(), raw: m, created_at: m.created_at });
      }
      continue;
    }

    // Tool result (new format): role 'tool'
    if (m.role === 'tool') {
      const name = m.tool_name || m.name || 'tool';
      // Tool content may be string or array with output_text blocks
      let output = m.output ?? m.content ?? '';
      if (Array.isArray(output)) {
        const txt = output.map((b: any) => b?.text ?? b?.output_text ?? b?.value ?? '').join('\n');
        output = txt.trim() || output;
      }
      events.push({
        kind: 'tool-result',
        tool_call_id: m.tool_call_id || m.id || '',
        name,
        output,
        raw: m,
        created_at: m.created_at
      });
      continue;
    }

    // Legacy assistant with tool_calls
    if (m.role === 'assistant' && Array.isArray(m.tool_calls)) {
      const text = textFromContent(m.content);
      if (text) {
        events.push({ kind: 'assistant', text, raw: m, created_at: m.created_at });
      }
      for (const tc of m.tool_calls) {
        events.push({
          kind: 'tool-use',
          id: tc.id || cryptoId(),
          name: tc.function?.name || 'tool',
          input: safeJsonParse(tc.function?.arguments) ?? {},
          raw: m,
          created_at: m.created_at
        });
      }
      continue;
    }

    // Plain text messages
    if (m.role === 'system') {
      const text = textFromContent(m.content);
      if (text) events.push({ kind: 'system', text, raw: m, created_at: m.created_at });
      continue;
    }
    if (m.role === 'user') {
      const text = textFromContent(m.content);
      if (text) events.push({ kind: 'user', text, raw: m, created_at: m.created_at });
      continue;
    }
    if (m.role === 'assistant') {
      const text = textFromContent(m.content);
      if (text) events.push({ kind: 'assistant', text, raw: m, created_at: m.created_at });
      continue;
    }
  }

  const title = guessTitle(messages);
  return { title, events, originalMessages: messages };
}

function safeJsonParse(s?: string) {
  if (!s || typeof s !== 'string') return null;
  try { return JSON.parse(s); } catch { return null; }
}

function cryptoId() {
  // not cryptographically strong; just a readable id for pairing attempts
  return 'evt_' + Math.random().toString(36).slice(2, 10);
}
