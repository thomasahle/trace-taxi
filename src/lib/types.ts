export type AnyRecord = Record<string, any>;

export type OpenAIMessage = {
  id?: string;
  type?: string; // for response/message streams
  object?: string; // for streaming chunks
  role: "system" | "user" | "assistant" | "tool" | string;
  content: any; // text or array of content blocks
  name?: string; // tool name when role === 'tool' (older formats)
  tool_name?: string; // newer format
  tool_call_id?: string;
  tool_calls?: any[]; // legacy OpenAI format
  output?: any; // tool output in newer format
  metadata?: AnyRecord;
  created_at?: number;
  _originalEntry?: any; // preserved original JSONL entry
};

export type TraceEvent =
  | { kind: "system"; text: string; raw: AnyRecord; created_at?: number }
  | {
      kind: "user";
      text: string;
      content?: any;
      raw: AnyRecord;
      created_at?: number;
    }
  | { kind: "assistant"; text: string; raw: AnyRecord; created_at?: number }
  | { kind: "thinking"; text: string; raw: AnyRecord; created_at?: number }
  | {
      kind: "tool-use";
      id: string;
      name: string;
      input: AnyRecord;
      raw: AnyRecord;
      created_at?: number;
    }
  | {
      kind: "tool-result";
      tool_call_id: string;
      name: string;
      output: AnyRecord;
      raw: AnyRecord;
      created_at?: number;
    };

export type TraceData = {
  title: string;
  events: TraceEvent[];
  originalMessages: OpenAIMessage[];
};

export type ToolRenderContext = {
  event: TraceEvent;
  pair?: TraceEvent | null; // e.g., tool-use paired with tool-result
};
