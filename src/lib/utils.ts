import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { HTMLAttributes } from "svelte/elements";

export type WithoutChildrenOrChild<T> = Omit<T, "child" | "children">;
export type WithoutChildren<T> = Omit<T, "children">;
export type WithElementRef<T, E extends HTMLElement = HTMLElement> = T & {
  ref?: E | null;
};

export function isObject(x: any): x is Record<string, any> {
  return x && typeof x === "object" && !Array.isArray(x);
}

export function textFromContent(content: any): string {
  // Handles both string and new-format [{type:'text', text: { value: '...'}}]
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((c: any) => {
        if (typeof c === "string") return c;
        if (typeof c?.text === "string") return c.text;
        if (isObject(c?.text) && typeof c.text?.value === "string")
          return c.text.value;
        if (typeof c?.value === "string") return c.value;
        if (typeof c?.content === "string") return c.content;
        return "";
      })
      .join("\n")
      .trim();
  }
  // Some SDKs put the text at content[0].text.value
  if (isObject(content) && typeof content?.text === "string")
    return content.text;
  if (
    isObject(content) &&
    isObject(content?.text) &&
    typeof content.text.value === "string"
  )
    return content.text.value;
  return "";
}

export function guessTitle(messages: any[]): string {
  // Use the first user message or metadata.title
  const metaTitle = messages.find((m) => m?.metadata?.title)?.metadata?.title;
  if (metaTitle) return metaTitle;
  const firstUser = messages.find((m) => m.role === "user");
  if (firstUser) {
    const raw = textFromContent(firstUser.content);
    return raw.slice(0, 64) || "Trace";
  }
  return "Trace";
}

export function groupToolPairs(
  events: any[],
): Array<{ use: any; result?: any }> {
  // Pair tool-use with tool-result (by id / tool_call_id)
  const uses = events.filter((e) => e.kind === "tool-use");
  const results = events.filter((e) => e.kind === "tool-result");

  // Build a map for O(1) lookups - key is tool_call_id, value is the result
  const resultMap = new Map<string, any>();
  const partialMatchResults: any[] = [];

  for (const r of results) {
    if (r.tool_call_id) {
      // Store exact matches in the map (only if not already present - keep first match)
      if (!resultMap.has(r.tool_call_id)) {
        resultMap.set(r.tool_call_id, r);
      }
      // Keep track of results for potential partial matching
      partialMatchResults.push(r);
    }
  }

  const out: Array<{ use: any; result?: any }> = [];
  for (const u of uses) {
    if (u.id) {
      // First try exact match (O(1))
      let r = resultMap.get(u.id);

      // If no exact match, check for partial matches (only when needed)
      if (!r) {
        r = partialMatchResults.find((x: any) =>
          x.tool_call_id?.includes?.(u.id),
        );
      }

      out.push({ use: u, result: r });
    } else {
      // If use has no id, it can't be paired
      out.push({ use: u, result: undefined });
    }
  }
  return out;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
