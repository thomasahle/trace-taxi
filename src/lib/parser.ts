import type { OpenAIMessage, TraceData, TraceEvent } from "./types";
import { isObject, textFromContent, guessTitle } from "./utils";

function parseLine(line: string): any | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith("{")) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

// Detect trace format by examining the first few entries
function detectTraceFormat(raw: any[]): "openai" | "claude-code" {
  // Check first few message entries (skip summaries and snapshots)
  let checked = 0;
  for (const entry of raw) {
    if (!entry) continue;
    // Skip non-message entries for detection
    if (entry.type === "summary" || entry.type === "file-history-snapshot")
      continue;

    // Claude Code traces have a specific structure with type + message
    if (entry.type && entry.message && entry.uuid && entry.timestamp) {
      // Further validate it's Claude Code format
      if (
        entry.type === "user" ||
        entry.type === "assistant" ||
        entry.type === "system"
      ) {
        return "claude-code";
      }
    }

    // Stop after checking 10 actual message entries
    checked++;
    if (checked >= 10) break;
  }

  // Default to OpenAI format
  return "openai";
}

// Parse Claude Code format traces
function parseClaudeCodeFormat(raw: any[]): OpenAIMessage[] {
  // First, merge messages with the same message.id (streaming responses)
  const messageMap = new Map<string, any>();

  for (const entry of raw) {
    // Skip file history snapshots and non-message types
    if (!entry.type || !entry.message) continue;
    if (entry.type === "file-history-snapshot") continue;
    if (entry.type === "summary") continue;

    // Only process recognized message types
    if (
      entry.type !== "user" &&
      entry.type !== "assistant" &&
      entry.type !== "system"
    )
      continue;

    const msg = entry.message;
    const msgId = msg.id || `${entry.type}-${entry.uuid}`;

    if (messageMap.has(msgId)) {
      // Merge content arrays
      const existing = messageMap.get(msgId);
      if (Array.isArray(existing.content) && Array.isArray(msg.content)) {
        existing.content.push(...msg.content);
      }
      // Update stop_reason if it exists (last chunk has the final stop_reason)
      if (msg.stop_reason) {
        existing.stop_reason = msg.stop_reason;
      }
    } else {
      // First time seeing this message - store the full original entry as _originalEntry
      const msgWithOriginal = { ...msg, _originalEntry: entry };
      messageMap.set(msgId, msgWithOriginal);
    }
  }

  return Array.from(messageMap.values());
}

// Parse OpenAI format traces
function parseOpenAIFormat(raw: any[]): OpenAIMessage[] {
  const messages: OpenAIMessage[] = raw
    .map((r) => {
      // If wrapper objects exist (e.g. {type:'message', message:{...}}) normalize.
      if (r?.type === "message" && r?.message) return r.message;
      if (r?.object === "chat.completion.chunk" && r?.choices) return r; // ignore streaming chunks later
      return r;
    })
    .filter(Boolean);

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
  const messages: OpenAIMessage[] =
    format === "claude-code"
      ? parseClaudeCodeFormat(raw)
      : parseOpenAIFormat(raw);

  const events: TraceEvent[] = [];

  for (const m of messages) {
    // Streaming chunks are ignored; expect full messages in trace.
    if (m?.object === "chat.completion.chunk") continue;

    // New format: assistant content can contain tool_use blocks.
    if (m.role === "assistant" && Array.isArray(m.content)) {
      let assistantText = "";
      for (const block of m.content) {
        const t = block?.type || block?.role;
        if (t === "text") {
          const txt =
            block.text?.value ??
            block.text ??
            block?.content ??
            block?.value ??
            "";
          assistantText += (assistantText ? "\n" : "") + (txt || "");
        } else if (t === "thinking") {
          // Push any accumulated assistant text first
          if (assistantText.trim()) {
            events.push({
              kind: "assistant",
              text: assistantText.trim(),
              raw: m,
              created_at: m.created_at,
            });
            assistantText = "";
          }
          // Create separate thinking event
          const thinkingText = block.thinking || "";
          if (thinkingText) {
            events.push({
              kind: "thinking",
              text: thinkingText,
              raw: m,
              created_at: m.created_at,
            });
          }
        } else if (t === "tool_use") {
          // Push any accumulated assistant text first
          if (assistantText.trim()) {
            events.push({
              kind: "assistant",
              text: assistantText.trim(),
              raw: m,
              created_at: m.created_at,
            });
            assistantText = "";
          }
          events.push({
            kind: "tool-use",
            id: block.id || block.tool_call_id || cryptoId(),
            name: block.name || block.tool_name || m?.tool_name || "tool",
            input: block.input ?? block.arguments ?? {},
            raw: m,
            created_at: m.created_at,
          });
        }
      }
      if (assistantText.trim()) {
        events.push({
          kind: "assistant",
          text: assistantText.trim(),
          raw: m,
          created_at: m.created_at,
        });
      }
      continue;
    }

    // Tool result (new format): role 'tool'
    if (m.role === "tool") {
      const name = m.tool_name || m.name || "tool";
      // Keep the original structure to preserve images and other content types
      const output = m.output ?? m.content ?? "";
      events.push({
        kind: "tool-result",
        tool_call_id: m.tool_call_id || m.id || "",
        name,
        output,
        raw: m,
        created_at: m.created_at,
      });
      continue;
    }

    // Legacy assistant with tool_calls
    if (m.role === "assistant" && Array.isArray(m.tool_calls)) {
      const text = textFromContent(m.content);
      if (text) {
        events.push({
          kind: "assistant",
          text,
          raw: m,
          created_at: m.created_at,
        });
      }
      for (const tc of m.tool_calls) {
        events.push({
          kind: "tool-use",
          id: tc.id || cryptoId(),
          name: tc.function?.name || "tool",
          input: safeJsonParse(tc.function?.arguments) ?? {},
          raw: m,
          created_at: m.created_at,
        });
      }
      continue;
    }

    // Check for Claude Code tool results (come as user messages with tool_result blocks)
    if (m.role === "user" && Array.isArray(m.content)) {
      const toolResults = m.content.filter(
        (block: any) => block?.type === "tool_result",
      );
      if (toolResults.length > 0) {
        // Process each tool result
        for (const block of toolResults) {
          let output = block.content || "";
          // Handle array content in tool results
          if (Array.isArray(output)) {
            output = output
              .map((item: any) => {
                if (typeof item === "string") return item;
                if (item?.text) return item.text;
                if (item?.type === "text" && item?.text) return item.text;
                return JSON.stringify(item);
              })
              .join("\n");
          }
          events.push({
            kind: "tool-result",
            tool_call_id: block.tool_use_id || "",
            name: "", // Name will be inferred from tool-use pairing
            output,
            raw: m,
            created_at: m.created_at,
          });
        }
        continue;
      }
    }

    // Plain text messages
    if (m.role === "system") {
      const text = textFromContent(m.content);
      if (text)
        events.push({ kind: "system", text, raw: m, created_at: m.created_at });
      continue;
    }
    if (m.role === "user") {
      // Check if content has images
      let hasImages = false;
      if (Array.isArray(m.content)) {
        hasImages = m.content.some(
          (item: any) =>
            item?.type === "image" ||
            (item?.type === "text" && item?.text?.includes("[Image #")), // Handle "[Image #n]" style references
        );
      }

      if (hasImages) {
        // Preserve full content structure for messages with images
        events.push({
          kind: "user",
          text: "",
          content: m.content,
          raw: m,
          created_at: m.created_at,
        });
      } else {
        // Extract just text for regular messages
        const text = textFromContent(m.content);
        if (text)
          events.push({ kind: "user", text, raw: m, created_at: m.created_at });
      }
      continue;
    }
    if (m.role === "assistant") {
      const text = textFromContent(m.content);
      if (text)
        events.push({
          kind: "assistant",
          text,
          raw: m,
          created_at: m.created_at,
        });
      continue;
    }
  }

  const title = guessTitle(messages);
  return { title, events, originalMessages: messages };
}

function safeJsonParse(s?: string) {
  if (!s || typeof s !== "string") return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function cryptoId() {
  // not cryptographically strong; just a readable id for pairing attempts
  return "evt_" + Math.random().toString(36).slice(2, 10);
}
