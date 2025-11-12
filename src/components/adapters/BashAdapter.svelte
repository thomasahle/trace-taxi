<script lang="ts">
  import { onMount } from 'svelte';
  import hljs from 'highlight.js';

  export let ctx: any;

  let cmd = '';
  let description = '';
  let timeout = null;
  let stdout = '';
  let stderr = '';
  let exitCode: number | null = null;
  let duration = '';

  // Extract input parameters
  if (ctx?.event?.input) {
    const input = ctx.event.input;
    cmd = input.command || input.cmd || '';
    description = input.description || '';
    timeout = input.timeout || null;
  }

  // Extract output
  if (ctx?.pair?.output) {
    const out = ctx.pair.output;
    if (typeof out === 'string') {
      // Simple string output
      stdout = out;
    } else if (out && typeof out === 'object') {
      // Structured output
      stdout = out.stdout || out.output || '';
      stderr = out.stderr || '';
      exitCode = out.exit_code ?? out.exitCode ?? out.code ?? null;
      duration = out.duration || '';
    }
  }

  // Syntax highlighting for shell commands
  let highlightedCmd = '';
  onMount(() => {
    if (cmd) {
      highlightedCmd = hljs.highlight(cmd, { language: 'bash' }).value;
    }
  });
</script>

<div class="bash-container">
  {#if description}
    <div class="description">{description}</div>
  {/if}

  <div class="terminal">
    {#if cmd}
      <div class="command-line">
        <span class="prompt">$</span>
        <span class="command">{@html highlightedCmd || cmd}</span>
      </div>
    {/if}

    {#if stdout}
      <div class="output">{stdout}</div>
    {/if}

    {#if stderr}
      <div class="stderr">{stderr}</div>
    {/if}

    <div class="metadata">
      {#if exitCode !== null}
        <span class="exit-code" class:success={exitCode === 0} class:error={exitCode !== 0}>
          exit {exitCode}
        </span>
      {/if}
      {#if duration}
        <span class="duration">⏱ {duration}</span>
      {/if}
      {#if timeout}
        <span class="timeout">⏲ timeout: {timeout}ms</span>
      {/if}
    </div>
  </div>
</div>

<style>
  .bash-container {
    font-family: ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, monospace;
    font-size: 13px;
  }

  .description {
    color: var(--muted);
    font-style: italic;
    margin-bottom: 8px;
    font-size: 13px;
  }

  .terminal {
    background: #1c2128;
    color: #adbac7;
    border-radius: 6px;
    padding: 12px;
    overflow-x: auto;
  }

  .command-line {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    align-items: baseline;
  }

  .prompt {
    color: #96d0ff;
    font-weight: 600;
    user-select: none;
  }

  .command {
    color: #96d0ff;
    flex: 1;
  }

  .output {
    white-space: pre-wrap;
    word-break: break-all;
    color: #adbac7;
    line-height: 1.5;
  }

  .stderr {
    white-space: pre-wrap;
    word-break: break-all;
    color: #ff938a;
    margin-top: 8px;
  }

  .metadata {
    display: flex;
    gap: 16px;
    margin-top: 12px;
    font-size: 12px;
  }

  .exit-code {
    font-weight: 600;
  }

  .exit-code.success {
    color: #46c876;
  }

  .exit-code.error {
    color: #ff938a;
  }

  .duration, .timeout {
    color: #768390;
  }

  :global(.bash-container .hljs-keyword) {
    color: #f47067;
  }

  :global(.bash-container .hljs-string) {
    color: #96d0ff;
  }

  :global(.bash-container .hljs-variable) {
    color: #dcbdfb;
  }
</style>