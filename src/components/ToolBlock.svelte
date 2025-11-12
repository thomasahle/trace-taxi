
<script lang="ts">
  import { getTool } from '../lib/tool-registry';
  import type { ToolRenderContext } from '../lib/types';

  export let ctx: ToolRenderContext;

  $: renderer = getTool(ctx.event?.name || 'tool');
  $: label = (renderer.label ? renderer.label(ctx) : ctx.event?.name);
  $: summary = getSummary(ctx);

  // Determine if tool should be open by default
  // Read-only tools (Read, Grep, Glob, etc.) are collapsed by default
  // Modifying tools (Write, Edit, Bash, etc.) are open by default
  const toolName = ctx.event?.name?.toLowerCase() || '';
  const isReadOnly = toolName.includes('read') ||
                     toolName.includes('grep') ||
                     toolName.includes('glob') ||
                     toolName.includes('find') ||
                     toolName.includes('search') ||
                     toolName.includes('ls');

  let open = !isReadOnly;

  function getSummary(ctx: ToolRenderContext): string {
    const input = ctx.event?.input || {};
    const name = ctx.event?.name?.toLowerCase() || '';

    // Extract key parameters based on tool type
    if (name.includes('glob')) {
      return input.pattern || '';
    } else if (name.includes('grep')) {
      return input.pattern || '';
    } else if (name.includes('read')) {
      const path = input.file_path || '';
      return path.split('/').pop() || path;
    } else if (name.includes('write')) {
      const path = input.file_path || '';
      return path.split('/').pop() || path;
    } else if (name.includes('edit')) {
      const path = input.file_path || '';
      return path.split('/').pop() || path;
    } else if (name.includes('bash') || name.includes('shell')) {
      const cmd = input.command || '';
      return cmd.length > 50 ? cmd.slice(0, 47) + '...' : cmd;
    } else if (name.includes('notebookedit')) {
      const path = input.notebook_path || '';
      return path.split('/').pop() || path;
    }

    // Fallback: show first meaningful value
    const firstKey = Object.keys(input).find(k =>
      !k.includes('description') && typeof input[k] === 'string' && input[k]
    );
    if (firstKey) {
      const val = String(input[firstKey]);
      return val.length > 60 ? val.slice(0, 57) + '...' : val;
    }

    return '';
  }
</script>

<div class="tool-container" class:collapsed={!open}>
  <div class="tool-header" on:click={() => open = !open}>
    <div class="tool-title">
      <span class="tool-name">{label}</span>
      {#if summary}
        <span class="tool-summary">{summary}</span>
      {/if}
    </div>
    <span class="tool-chevron" class:open>▸</span>
  </div>
  {#if open}
    <div class="tool-body">
      <svelte:component this={renderer.component} {ctx} />
    </div>
  {/if}
</div>

<style>
  .tool-container {
    border: 1px solid var(--border-light);
    border-radius: 6px;
    overflow: hidden;
  }

  .tool-container.collapsed {
    display: inline-block;
    max-width: fit-content;
  }

  .tool-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--tool-header-bg);
    cursor: pointer;
    user-select: none;
  }

  .tool-header:hover {
    background: var(--tool-header-hover-bg);
  }

  .tool-title {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
  }

  .tool-name {
    font-weight: 500;
    font-size: 13px;
    color: var(--text);
  }

  .tool-summary {
    color: var(--muted);
    font-size: 12px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 400px;
  }

  .tool-chevron {
    color: var(--muted);
    font-size: 12px;
    transition: transform 0.15s ease;
    flex-shrink: 0;
  }

  .tool-chevron.open {
    transform: rotate(90deg);
  }

  .tool-body {
    padding: 14px;
    background: var(--bg);
  }
</style>
