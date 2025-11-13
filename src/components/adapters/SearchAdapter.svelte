<script lang="ts">
  export let ctx: any;

  let operation = "";
  let pattern = "";
  let path = "";
  let glob = "";
  let outputMode = "";
  let results: string[] = [];
  let matchCount = 0;
  let caseInsensitive = false;
  let showLineNumbers = true;
  let multiline = false;
  let headLimit = null;
  let contextBefore = null;
  let contextAfter = null;

  // Detect operation type
  const toolName = ctx?.event?.name?.toLowerCase() || "";
  if (toolName.includes("grep")) {
    operation = "grep";
  } else if (toolName.includes("glob") || toolName.includes("find")) {
    operation = "glob";
  }

  // Extract input parameters
  if (ctx?.event?.input) {
    const input = ctx.event.input;
    pattern = input.pattern || input.regex || input.search || "";
    path = input.path || input.directory || input.dir || ".";
    glob = input.glob || input.include || "";
    outputMode = input.output_mode || input.outputMode || "files_with_matches";

    // Grep specific options
    caseInsensitive = input["-i"] || input.ignoreCase || false;
    showLineNumbers = input["-n"] !== false;
    multiline = input.multiline || false;
    headLimit = input.head_limit || input.headLimit || null;
    contextBefore = input["-B"] || null;
    contextAfter = input["-A"] || null;
  }

  // Extract output
  if (ctx?.pair?.output) {
    const out = ctx.pair.output;
    if (typeof out === "string") {
      // Parse output as list of file paths or matches
      results = out.split("\n").filter((line) => line.trim());
      matchCount = results.length;
    } else if (Array.isArray(out)) {
      results = out;
      matchCount = out.length;
    } else if (out && typeof out === "object") {
      results = out.results || out.files || out.matches || [];
      matchCount = out.count || results.length;
    }
  }

  // Format pattern for display
  function formatPattern(p: string): string {
    // Escape HTML but preserve regex structure
    return p.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
</script>

<div class="text-sm">
  <div class="adapter-header">
    <span class="text-xs text-foreground">Pattern:</span>
    <code class="bg-transparent p-0 font-mono text-xs text-red-600"
      >{operation === "grep" ? formatPattern(pattern) : pattern}</code
    >
  </div>

  <div class="flex items-center gap-1.5 mb-2.5 text-xs">
    <span class="text-muted-foreground">📁 {path}</span>
    {#if glob}
      <span class="text-muted-foreground">· Files: {glob}</span>
    {/if}
    {#if operation === "grep"}
      {#if caseInsensitive}<span
          class="bg-muted px-1 py-0.5 rounded-sm font-mono text-[10px] text-foreground"
          >-i</span
        >{/if}
      {#if multiline}<span
          class="bg-muted px-1 py-0.5 rounded-sm font-mono text-[10px] text-foreground"
          >multiline</span
        >{/if}
      {#if contextBefore}<span
          class="bg-muted px-1 py-0.5 rounded-sm font-mono text-[10px] text-foreground"
          >-B {contextBefore}</span
        >{/if}
      {#if contextAfter}<span
          class="bg-muted px-1 py-0.5 rounded-sm font-mono text-[10px] text-foreground"
          >-A {contextAfter}</span
        >{/if}
    {/if}
  </div>

  <div
    class="text-sm font-medium text-foreground mb-2 pb-2 border-b border-border"
  >
    {#if operation === "grep"}
      {matchCount} {matchCount === 1 ? "match" : "matches"} found
    {:else}
      {matchCount} {matchCount === 1 ? "file" : "files"} found
    {/if}
  </div>

  {#if results.length > 0}
    <div class="max-h-[400px] overflow-y-auto">
      {#each results as result}
        {#if operation === "grep" && outputMode === "content"}
          <div class="py-1 text-xs">
            <code
              class="font-mono text-[11px] leading-tight whitespace-pre-wrap break-all"
              >{result}</code
            >
          </div>
        {:else}
          <div
            class="flex items-center gap-1.5 py-1 text-xs hover:bg-accent/50 transition-colors"
          >
            <span class="text-sm shrink-0">📄</span>
            <span class="font-mono text-accent-foreground text-xs"
              >{result}</span
            >
          </div>
        {/if}
      {/each}
    </div>
  {:else if matchCount === 0}
    <div class="py-4 text-center text-muted-foreground italic">
      No matches found
    </div>
  {/if}
</div>
