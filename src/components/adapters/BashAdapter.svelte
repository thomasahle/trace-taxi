<script lang="ts">
  import { onMount } from "svelte";
  import hljs from "highlight.js";

  export let ctx: any;

  let cmd = "";
  let description = "";
  let timeout = null;
  let stdout = "";
  let stderr = "";
  let exitCode: number | null = null;
  let duration = "";

  // Extract input parameters
  if (ctx?.event?.input) {
    const input = ctx.event.input;
    cmd = input.command || input.cmd || "";
    description = input.description || "";
    timeout = input.timeout || null;
  }

  // Extract output
  if (ctx?.pair?.output) {
    const out = ctx.pair.output;
    if (typeof out === "string") {
      // Simple string output
      stdout = out;
    } else if (out && typeof out === "object") {
      // Structured output
      stdout = out.stdout || out.output || "";
      stderr = out.stderr || "";
      exitCode = out.exit_code ?? out.exitCode ?? out.code ?? null;
      duration = out.duration || "";
    }
  }

  // Syntax highlighting for shell commands
  let highlightedCmd = "";
  onMount(() => {
    if (cmd) {
      highlightedCmd = hljs.highlight(cmd, { language: "bash" }).value;
    }
  });
</script>

<div class="font-mono text-sm">
  {#if description}
    <div class="text-muted-foreground italic mb-2 text-sm">{description}</div>
  {/if}

  <div class="terminal">
    {#if cmd}
      <div class="flex gap-2 mb-3 items-baseline">
        <span class="cmd select-none">$</span>
        <span class="cmd flex-1">{@html highlightedCmd || cmd}</span>
      </div>
    {/if}

    {#if stdout}
      <div class="output whitespace-pre-wrap break-all leading-relaxed">
        {stdout}
      </div>
    {/if}

    {#if stderr}
      <div class="stderr whitespace-pre-wrap break-all mt-2">{stderr}</div>
    {/if}

    <div class="flex gap-4 mt-3 text-xs">
      {#if exitCode !== null}
        <span class="font-semibold {exitCode === 0 ? 'exit-ok' : 'exit-bad'}">
          exit {exitCode}
        </span>
      {/if}
      {#if duration}
        <span class="text-muted-foreground">⏱ {duration}</span>
      {/if}
      {#if timeout}
        <span class="text-muted-foreground">⏲ timeout: {timeout}ms</span>
      {/if}
    </div>
  </div>
</div>
