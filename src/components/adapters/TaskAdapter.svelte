<script lang="ts">
  export let ctx: any;

  let description = '';
  let prompt = '';
  let subagentType = '';
  let model = '';
  let result = '';

  // Extract input
  if (ctx?.event?.input) {
    const input = ctx.event.input;
    description = input.description || '';
    prompt = input.prompt || '';
    subagentType = input.subagent_type || input.subagentType || '';
    model = input.model || '';
  }

  // Extract output
  if (ctx?.pair?.output) {
    const out = ctx.pair.output;
    if (typeof out === 'string') {
      result = out;
    } else if (out && typeof out === 'object') {
      result = out.result || out.output || JSON.stringify(out, null, 2);
    }
  }
</script>

<div class="task-container">
  <div class="task-header">
    <span class="icon">🤖</span>
    <div class="header-content">
      <span class="title">Subagent Task</span>
      {#if subagentType}
        <span class="subagent-type">{subagentType}</span>
      {/if}
    </div>
  </div>

  {#if description}
    <div class="task-description">
      <span class="label">Description:</span>
      <span class="value">{description}</span>
    </div>
  {/if}

  {#if prompt}
    <div class="task-prompt">
      <div class="prompt-label">Prompt:</div>
      <div class="prompt-content">{prompt}</div>
    </div>
  {/if}

  {#if model}
    <div class="task-meta">
      <span class="meta-label">Model:</span>
      <span class="meta-value">{model}</span>
    </div>
  {/if}

  {#if result}
    <div class="task-result">
      <div class="result-label">Result:</div>
      <div class="result-content">{result}</div>
    </div>
  {/if}
</div>

<style>
  .task-container {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 13px;
  }

  .task-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .title {
    font-weight: 600;
    color: var(--text);
  }

  .subagent-type {
    font-size: 11px;
    padding: 2px 6px;
    background: var(--accent);
    color: white;
    border-radius: 3px;
    font-weight: 500;
  }

  .task-description {
    margin-bottom: 12px;
  }

  .label,
  .meta-label {
    font-weight: 600;
    color: var(--muted);
    margin-right: 4px;
  }

  .value,
  .meta-value {
    color: var(--text);
  }

  .task-prompt,
  .task-result {
    margin: 12px 0;
  }

  .prompt-label,
  .result-label {
    font-weight: 600;
    color: var(--muted);
    margin-bottom: 6px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .prompt-content {
    padding: 12px;
    background: var(--panel-hover);
    border-radius: 4px;
    border: 1px solid var(--border-light);
    white-space: pre-wrap;
    line-height: 1.5;
    color: var(--text);
  }

  .result-content {
    padding: 12px;
    background: var(--background);
    border-radius: 4px;
    border: 1px solid var(--border-light);
    white-space: pre-wrap;
    line-height: 1.5;
    color: var(--text);
    max-height: 400px;
    overflow-y: auto;
  }

  .task-meta {
    font-size: 12px;
    color: var(--muted);
    margin-bottom: 8px;
  }
</style>
