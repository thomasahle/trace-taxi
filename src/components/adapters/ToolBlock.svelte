
<script lang="ts">
  import { getTool } from '../../lib/tool-registry';
  import type { ToolRenderContext } from '../../lib/types';

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
                     toolName.includes('ls') ||
                     toolName.includes('webfetch') ||
                     toolName.includes('websearch');

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
    } else if (name.includes('askuserquestion')) {
      // Show first question
      const questions = input.questions || [];
      if (questions.length > 0 && questions[0].question) {
        const q = questions[0].question;
        return q.length > 60 ? q.slice(0, 57) + '...' : q;
      }
      return questions.length > 1 ? `${questions.length} questions` : '';
    } else if (name.includes('exitplanmode')) {
      // Show first line of plan
      const plan = input.plan || '';
      const firstLine = plan.split('\n')[0];
      return firstLine.length > 60 ? firstLine.slice(0, 57) + '...' : firstLine;
    } else if (name.includes('task')) {
      // Show subagent type and description
      const subagentType = input.subagent_type || '';
      const desc = input.description || '';
      if (subagentType && desc) {
        return `${subagentType}: ${desc}`;
      }
      return subagentType || desc;
    } else if (name.includes('webfetch')) {
      // Show URL
      const url = input.url || '';
      return url.length > 60 ? url.slice(0, 57) + '...' : url;
    } else if (name.includes('websearch')) {
      // Show search query
      const query = input.query || '';
      return query.length > 60 ? query.slice(0, 57) + '...' : query;
    } else if (name.includes('todowrite') || name.includes('todo')) {
      // Show todo count and status
      const todos = input.todos || [];
      if (todos.length === 0) return '';
      const completed = todos.filter((t: any) => t.status === 'completed').length;
      const inProgress = todos.filter((t: any) => t.status === 'in_progress').length;
      const pending = todos.filter((t: any) => t.status === 'pending').length;

      const parts = [];
      if (completed > 0) parts.push(`${completed} done`);
      if (inProgress > 0) parts.push(`${inProgress} active`);
      if (pending > 0) parts.push(`${pending} pending`);
      return parts.join(', ') || `${todos.length} tasks`;
    } else if (name.includes('taxi_estimate') || name === 'get_taxi_estimate') {
      // Show route
      const pickup = input.pickup || '';
      const dropoff = input.dropoff || '';
      if (pickup && dropoff) {
        return `${pickup} → ${dropoff}`;
      }
      return pickup || dropoff;
    } else if (name.includes('taxi_search') || name.includes('search_taxis')) {
      // Show route
      const pickup = input.pickup || '';
      const dropoff = input.dropoff || '';
      if (pickup && dropoff) {
        return `${pickup} → ${dropoff}`;
      }
      return pickup || dropoff;
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
