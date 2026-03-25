<script lang="ts">
  import { onMount } from "svelte";
  import hljs from "highlight.js";
  import { FileCode2, FileText, FileJson, FileType, File } from "lucide-svelte";

  export let ctx: any;

  let operation = "";
  let filePath = "";
  let content = "";
  let oldString = "";
  let newString = "";
  let limit = null;
  let offset = null;
  let replaceAll = false;
  let output = "";
  let isSuccess = false;
  let highlightedContent = "";

  // Detect operation type
  const toolName = ctx?.event?.name?.toLowerCase() || "";
  if (toolName.includes("read")) {
    operation = "read";
  } else if (toolName.includes("write")) {
    operation = "write";
  } else if (toolName.includes("edit")) {
    operation = "edit";
  }

  // Extract input parameters
  if (ctx?.event?.input) {
    const input = ctx.event.input;
    filePath =
      input.file_path || input.filePath || input.path || input.filename || "";
    content = input.content || input.text || "";
    oldString = input.old_string || input.old || "";
    newString = input.new_string || input.new || "";
    limit = input.limit || null;
    offset = input.offset || null;
    replaceAll = input.replace_all || input.replaceAll || false;
  }

  // Extract output
  if (ctx?.pair?.output) {
    const out = ctx.pair.output;
    if (typeof out === "string") {
      output = out;
      isSuccess = out.toLowerCase().includes("success");
    } else if (out && typeof out === "object") {
      output = out.message || out.result || JSON.stringify(out, null, 2);
      isSuccess = out.success || out.status === "success" || false;
    }
  }

  function getFileIcon(path: string) {
    const ext = path.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "js":
      case "ts":
      case "jsx":
      case "tsx":
      case "svelte":
      case "vue":
        return FileCode2;
      case "json":
      case "yaml":
      case "yml":
        return FileJson;
      case "css":
      case "scss":
      case "html":
        return FileType;
      case "md":
      case "txt":
        return FileText;
      default:
        return File;
    }
  }

  // Get file extension for syntax highlighting
  function getLanguage(path: string): string {
    const ext = path.split(".").pop()?.toLowerCase() ?? "";
    const langMap: Record<string, string> = {
      js: "javascript",
      ts: "typescript",
      jsx: "javascript",
      tsx: "typescript",
      py: "python",
      rs: "rust",
      go: "go",
      java: "java",
      cpp: "cpp",
      c: "c",
      cs: "csharp",
      rb: "ruby",
      php: "php",
      swift: "swift",
      kt: "kotlin",
      md: "markdown",
      json: "json",
      xml: "xml",
      html: "html",
      css: "css",
      scss: "scss",
      sql: "sql",
      yaml: "yaml",
      yml: "yaml",
      sh: "bash",
      bash: "bash",
      svelte: "html",
      sv: "verilog",
      v: "verilog",
      vh: "verilog",
      toml: "ini",
      ini: "ini",
      cfg: "ini",
      conf: "ini",
      txt: "plaintext",
      log: "plaintext",
      proto: "protobuf",
      graphql: "graphql",
      gql: "graphql",
      dockerfile: "dockerfile",
      tf: "terraform",
      vue: "xml",
      scala: "scala",
      r: "r",
      m: "objectivec",
      pl: "perl",
      lua: "lua",
      dart: "dart",
      elm: "elm",
      ex: "elixir",
      exs: "elixir",
      clj: "clojure",
      cljs: "clojure",
      hs: "haskell",
      erl: "erlang",
      fs: "fsharp",
      fsx: "fsharp",
      groovy: "groovy",
      jl: "julia",
    };
    return langMap[ext] || "plaintext";
  }

  // Create diff view for Edit operations
  function createDiffView(oldStr: string, newStr: string): string {
    const oldLines = oldStr.split("\n");
    const newLines = newStr.split("\n");

    let diffHtml = "";
    let i = 0,
      j = 0;

    // Simple diff algorithm: find matching and different lines
    while (i < oldLines.length || j < newLines.length) {
      const oldLine = i < oldLines.length ? oldLines[i] : null;
      const newLine = j < newLines.length ? newLines[j] : null;

      if (oldLine === newLine && oldLine !== null) {
        // Lines match - show as context
        const escaped = escapeHtml(oldLine);
        diffHtml += `<div class="diff-line context"><span class="diff-marker"> </span><span class="diff-content">${escaped}</span></div>`;
        i++;
        j++;
      } else {
        // Lines differ - show deletions and additions
        let foundMatch = false;

        // Look ahead to find if this is a modification or insertion/deletion
        for (let k = j; k < Math.min(j + 3, newLines.length); k++) {
          if (oldLine === newLines[k]) {
            foundMatch = true;
            break;
          }
        }

        if (oldLine !== null && (newLine === null || !foundMatch)) {
          // Deletion
          const escaped = escapeHtml(oldLine);
          diffHtml += `<div class="diff-line removed"><span class="diff-marker">-</span><span class="diff-content">${escaped}</span></div>`;
          i++;
        } else {
          if (newLine !== null) {
            // Addition
            const escaped = escapeHtml(newLine);
            diffHtml += `<div class="diff-line added"><span class="diff-marker">+</span><span class="diff-content">${escaped}</span></div>`;
            j++;
          }
        }
      }
    }

    return diffHtml;
  }

  function escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Apply syntax highlighting reactively
  $: {
    if (content && operation === "write") {
      try {
        const lang = getLanguage(filePath);
        highlightedContent = hljs.highlight(content, { language: lang }).value;
      } catch {
        highlightedContent = content;
      }
    } else if (output && operation === "read") {
      // Apply syntax highlighting to Read output
      try {
        const lang = getLanguage(filePath);
        // Extract content from opencode XML wrapper: <content>...</content>
        const xmlMatch = output.match(/<content>([\s\S]*?)<\/content>/);
        const rawContent = xmlMatch ? xmlMatch[1] : output;
        // Parse both "1→content" (Claude Code) and "1: content" (opencode)
        const lines = rawContent.split("\n");
        const highlightedLines = lines
          .map((line) => {
            const match = line.match(/^(\s*)(\d+)[→:] ?(.*)/);
            if (match) {
              const lineNum = match[2];
              const code = match[3];
              try {
                const highlighted = hljs.highlight(code, {
                  language: lang,
                  ignoreIllegals: true,
                }).value;
                return `<span class="line-num">${lineNum}</span>${highlighted}`;
              } catch {
                return `<span class="line-num">${lineNum}</span>${escapeHtml(code)}`;
              }
            }
            // Skip metadata lines (footer like "(End of file...)")
            if (line.startsWith("(") || line === "") return null;
            return null;
          })
          .filter((l) => l !== null);
        highlightedContent = highlightedLines.join("\n");
      } catch {
        highlightedContent = output;
      }
    } else {
      highlightedContent = "";
    }
  }
</script>

{#if operation === "read"}
  <div class="relative">
    {#if limit || offset}
      <div class="absolute top-0 right-0 p-2 z-10 flex gap-2">
        {#if limit}<span
            class="text-[10px] bg-background/80 backdrop-blur px-1.5 py-0.5 rounded border border-border text-muted-foreground"
            >Limit: {limit}</span
          >{/if}
        {#if offset}<span
            class="text-[10px] bg-background/80 backdrop-blur px-1.5 py-0.5 rounded border border-border text-muted-foreground"
            >Offset: {offset}</span
          >{/if}
      </div>
    {/if}
    <pre
      class="font-mono text-xs leading-relaxed overflow-x-auto m-0 max-h-[400px] overflow-y-auto p-3 read-code !border-0 !rounded-none !bg-transparent"><code
        class="block whitespace-pre">{@html highlightedContent || output}</code
      ></pre>
  </div>
{/if}

{#if operation === "write"}
  <pre
    class="font-mono text-xs leading-relaxed overflow-x-auto m-0 max-h-[400px] overflow-y-auto p-3 bg-background"><code
      class="block whitespace-pre">{@html highlightedContent || content}</code
    ></pre>
{/if}

{#if operation === "edit"}
  <div class="diff-view font-mono text-xs leading-relaxed bg-background">
    {@html createDiffView(oldString, newString)}
  </div>
  {#if replaceAll}
    <div
      class="px-3 py-2 border-t border-border bg-amber-50/50 dark:bg-amber-900/10 text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2"
    >
      <span class="text-lg leading-none">⚡</span> Replace all occurrences
    </div>
  {/if}
  {#if output && !isSuccess}
    <div
      class="px-3 py-2 border-t border-border bg-muted/10 text-xs font-mono text-muted-foreground"
    >
      {output}
    </div>
  {/if}
{/if}

<style>
  /* Override global pre styles so read content fills the card with no inner box */
  .read-code {
    border: none !important;
    border-radius: 0 !important;
    background: transparent !important;
    margin: 0 !important;
  }

  .read-code :global(.line-num),
  .diff-view :global(.line-num) {
    display: inline-block;
    min-width: 2.5em;
    margin-right: 1em;
    text-align: right;
    color: var(--muted);
    user-select: none;
    font-weight: 400;
    opacity: 0.5;
  }

  .diff-view :global(.diff-line) {
    display: flex;
    padding: 0 16px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .diff-view :global(.diff-marker) {
    display: inline-block;
    width: 20px;
    flex-shrink: 0;
    user-select: none;
    font-weight: 600;
    opacity: 0.5;
  }

  .diff-view :global(.diff-content) {
    flex: 1;
    min-width: 0;
  }

  .diff-view :global(.diff-line.context) {
    color: var(--muted-foreground);
  }

  .diff-view :global(.diff-line.removed) {
    background: rgba(244, 63, 94, 0.1);
    color: var(--foreground);
  }

  .diff-view :global(.diff-line.removed .diff-marker) {
    color: rgb(244, 63, 94);
  }

  .diff-view :global(.diff-line.added) {
    background: rgba(34, 197, 94, 0.1);
    color: var(--foreground);
  }

  .diff-view :global(.diff-line.added .diff-marker) {
    color: rgb(34, 197, 94);
  }
</style>
