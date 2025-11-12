
import type { OpenAIMessage, TraceData, TraceEvent } from './types';
import { isObject, textFromContent, guessTitle } from './utils';

function parseLine(line: string): any | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith('{')) return null;
  try { return JSON.parse(trimmed); }
  catch { return null; }
}

// Detect trace format by examining the first few entries
function detectTraceFormat(raw: any[]): 'openai' | 'claude-code' {
  // Check first few non-empty entries
  for (const entry of raw.slice(0, 10)) {
    if (!entry) continue;

    // Claude Code traces have a specific structure with type + message
    if (entry.type && entry.message && entry.uuid && entry.timestamp) {
      // Further validate it's Claude Code format
      if (entry.type === 'user' || entry.type === 'assistant' ||
          entry.type === 'system' || entry.type === 'file-history-snapshot') {
        return 'claude-code';
      }
    }
  }

  // Default to OpenAI format
  return 'openai';
}

// Parse Claude Code format traces
function parseClaudeCodeFormat(raw: any[]): OpenAIMessage[] {
  const messages: OpenAIMessage[] = [];

  for (const entry of raw) {
    // Skip file history snapshots and non-message types
    if (!entry.type || !entry.message) continue;
    if (entry.type === 'file-history-snapshot') continue;
    if (entry.type === 'summary') continue;

    // Handle user messages - these can be either actual user messages or tool results
    if (entry.type === 'user' && entry.message) {
      const msg = entry.message;

      // Check if this is a tool result (has tool_result in content array)
      if (Array.isArray(msg.content)) {
        const hasToolResult = msg.content.some((block: any) => block?.type === 'tool_result');
        if (hasToolResult) {
          // This is a tool result, keep the message structure as-is
          messages.push(msg);
          continue;
        }
      }

      // Regular user message
      messages.push(msg);
      continue;
    }

    // Handle assistant messages
    if (entry.type === 'assistant' && entry.message) {
      messages.push(entry.message);
      continue;
    }

    // Handle system messages
    if (entry.type === 'system' && entry.message) {
      messages.push(entry.message);
      continue;
    }
  }

  return messages;
}

// Parse OpenAI format traces
function parseOpenAIFormat(raw: any[]): OpenAIMessage[] {
  const messages: OpenAIMessage[] = raw.map((r) => {
    // If wrapper objects exist (e.g. {type:'message', message:{...}}) normalize.
    if (r?.type === 'message' && r?.message) return r.message;
    if (r?.object === 'chat.completion.chunk' && r?.choices) return r; // ignore streaming chunks later
    return r;
  }).filter(Boolean);

  return messages;
}

// Supports both OpenAI and Claude Code trace formats with automatic detection
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

  // Detect format and parse accordingly
  const format = detectTraceFormat(raw);
  const messages: OpenAIMessage[] = format === 'claude-code'
    ? parseClaudeCodeFormat(raw)
    : parseOpenAIFormat(raw);

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

    // Check for Claude Code tool results (come as user messages with tool_result blocks)
    if (m.role === 'user' && Array.isArray(m.content)) {
      const toolResults = m.content.filter((block: any) => block?.type === 'tool_result');
      if (toolResults.length > 0) {
        // Process each tool result
        for (const block of toolResults) {
          let output = block.content || '';
          // Handle array content in tool results
          if (Array.isArray(output)) {
            output = output.map((item: any) => {
              if (typeof item === 'string') return item;
              if (item?.text) return item.text;
              if (item?.type === 'text' && item?.text) return item.text;
              return JSON.stringify(item);
            }).join('\n');
          }
          events.push({
            kind: 'tool-result',
            tool_call_id: block.tool_use_id || '',
            name: '', // Name will be inferred from tool-use pairing
            output,
            raw: m,
            created_at: m.created_at
          });
        }
        continue;
      }
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
