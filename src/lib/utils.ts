import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function isObject(x: any): x is Record<string, any> {
  return x && typeof x === 'object' && !Array.isArray(x);
}

export function textFromContent(content: any): string {
  // Handles both string and new-format [{type:'text', text: { value: '...'}}]
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((c: any) => {
      if (typeof c === 'string') return c;
      if (typeof c?.text === 'string') return c.text;
      if (isObject(c?.text) && typeof c.text?.value === 'string') return c.text.value;
      if (typeof c?.value === 'string') return c.value;
      if (typeof c?.content === 'string') return c.content;
      return '';
    }).join('\n').trim();
  }
  // Some SDKs put the text at content[0].text.value
  if (isObject(content) && typeof content?.text === 'string') return content.text;
  if (isObject(content) && isObject(content?.text) && typeof content.text.value === 'string') return content.text.value;
  return '';
}

export function guessTitle(messages: any[]): string {
  // Use the first user message or metadata.title
  const metaTitle = messages.find(m => m?.metadata?.title)?.metadata?.title;
  if (metaTitle) return metaTitle;
  const firstUser = messages.find(m => m.role === 'user');
  if (firstUser) {
    const raw = textFromContent(firstUser.content);
    return raw.slice(0, 64) || 'Trace';
  }
  return 'Trace';
}

export function groupToolPairs(events: any[]): Array<{use: any, result?: any}> {
  // Pair tool-use with tool-result (by id / tool_call_id)
  const uses = events.filter(e => e.kind === 'tool-use');
  const results = events.filter(e => e.kind === 'tool-result');
  const out: Array<{use: any, result?: any}> = [];
  for (const u of uses) {
    const r = results.find((x: any) => (x.tool_call_id === u.id) || (x.tool_call_id?.includes?.(u.id)));
    out.push({ use: u, result: r });
  }
  return out;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
