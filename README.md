
# Agent Trace Viewer (Svelte)

![Trace Taxi](https://raw.githubusercontent.com/thomasahle/trace-taxi/refs/heads/main/public/trace-taxi.png)

A lightweight, extensible viewer for agent traces. Drop in a `.jsonl` file with OpenAI-style messages and get a clean, two‑column view with tool blocks (terminal output, diffs, files) rendered using custom components.

https://github.com/

---

## Quick start (dev)

```bash
npm install
npm run dev
# open http://localhost:5173
```

Drag & drop a JSONL trace or pass a URL via `?file=/api/trace`.

## Build

```bash
npm run build
```

This produces `dist/` with a static build.

## CLI — `view-trace trace.jsonl`

After building, you can serve a trace in one command:

```bash
npm run build
npx view-trace ./path/to/trace.jsonl
# or, if installed globally:
npm link
view-trace ./trace.jsonl
```

The CLI starts a tiny server, exposes your file at `/api/trace`, and opens the viewer pointing at `?file=/api/trace`.

> If your environment cannot auto‑open the browser, copy the printed URL.

## JSONL format

Each line should be a JSON object representing a message. The viewer understands both the new Responses API style and the older Chat Completions style.

### New style (messages with tool_use / tool result)

```
{"role":"user","content":[{"type":"text","text":{"value":"help me debug this issue"}}]}
{"role":"assistant","content":[{"type":"tool_use","id":"abc123","name":"bash","input":{"command":"uv run eval-weave --help"}}]}
{"role":"tool","tool_name":"bash","tool_call_id":"abc123","content":[{"type":"output_text","text":"Weave evaluation with deterministic scoring\n..."}]}
{"role":"assistant","content":[{"type":"text","text":{"value":"Perfect. The Makefile is updated."}}]}
```

### Legacy style (tool_calls)

```
{"role":"assistant","content":"Running the command…","tool_calls":[{"id":"call_1","type":"function","function":{"name":"bash","arguments":"{\"command\": \"uv run eval-weave --help\"}"}}]}
{"role":"tool","name":"bash","tool_call_id":"call_1","content":"Weave evaluation with deterministic scoring\n..."}
```

## Extending tool renderers

Tool rendering is handled by a registry in `src/lib/tool-registry.ts`. Three renderers ship by default:

- **Terminal** — for `bash`, `shell`, `process.run`, `terminal`.
- **Diff** — for `file.diff`, `git.diff`, `code_diff`.
- **File** — for `file.show`, `fs.read`, `open_file`.

Register your own:

```ts
// src/lib/tool-registry.ts
import MyCustomBlock from '../components/MyCustomBlock.svelte';
registerTool('browser.search', { component: MyCustomBlock });
```

Then structure your tool result so that the component can read it from `ctx`:

```ts
type ToolRenderContext = {
  event: { name: string, input: any };
  pair?: { output: any } | null;
};
```

## Structure & styling

- Two‑column layout with a sticky sidebar (trace info + list of tools)
- Messages and tools appear chronologically in the main column
- Terminal blocks show command, stdout/stderr, and exit code
- Diffs display unified patches with green additions and red deletions
- File blocks show a filename header and file contents

The visual style is dark, compact, and high‑contrast, similar to the screenshots.

## Notes

- The viewer purposefully does **not** execute anything — it only renders what’s in your trace.
- If your tool names/data differ, either register renderers or fall back to the JSON view shown by `ToolUnknown.svelte`.
- The parser is tolerant to common logging variations but you can tweak `src/lib/parser.ts` if needed.
