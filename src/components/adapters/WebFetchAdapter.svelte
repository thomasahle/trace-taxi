<script lang="ts">
  export let ctx: any;

  let url = "";
  let prompt = "";
  let content = "";

  // Extract input
  if (ctx?.event?.input) {
    const input = ctx.event.input;
    url = input.url || "";
    prompt = input.prompt || "";
  }

  // Extract output
  if (ctx?.pair?.output) {
    const out = ctx.pair.output;
    if (typeof out === "string") {
      content = out;
    } else if (out && typeof out === "object") {
      content = out.content || out.text || JSON.stringify(out, null, 2);
    }
  }

  // Truncate long content for display
  function truncate(text: string, maxLength: number = 500): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }
</script>

<div class="webfetch-container">
  <div class="webfetch-header">
    <span class="icon">🌐</span>
    <span class="title">Web Fetch</span>
  </div>

  {#if url}
    <div class="url-section">
      <span class="url-label">URL:</span>
      <a href={url} target="_blank" rel="noopener noreferrer" class="url-link">
        {url}
      </a>
    </div>
  {/if}

  {#if prompt}
    <div class="prompt-section">
      <div class="prompt-label">Query:</div>
      <div class="prompt-content">{prompt}</div>
    </div>
  {/if}

  {#if content}
    <div class="content-section">
      <div class="content-label">Fetched Content:</div>
      <div class="content-body">
        {truncate(content)}
      </div>
      {#if content.length > 500}
        <div class="content-truncated">
          Content truncated ({content.length} characters total)
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .webfetch-container {
    font-family:
      -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial,
      sans-serif;
    font-size: 13px;
  }

  .webfetch-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-weight: 600;
  }

  .icon {
    font-size: 18px;
  }

  .url-section {
    margin-bottom: 12px;
    padding: 8px 12px;
    background: var(--panel-hover);
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .url-label {
    font-weight: 600;
    color: var(--muted);
    font-size: 11px;
    text-transform: uppercase;
  }

  .url-link {
    color: var(--accent);
    text-decoration: none;
    word-break: break-all;
    font-size: 12px;
  }

  .url-link:hover {
    text-decoration: underline;
  }

  .prompt-section {
    margin-bottom: 12px;
  }

  .prompt-label {
    font-weight: 600;
    color: var(--muted);
    margin-bottom: 6px;
    font-size: 11px;
    text-transform: uppercase;
  }

  .prompt-content {
    padding: 10px;
    background: var(--panel-hover);
    border-radius: 4px;
    border: 1px solid var(--border-light);
    color: var(--text);
    line-height: 1.5;
  }

  .content-section {
    margin-top: 12px;
  }

  .content-label {
    font-weight: 600;
    color: var(--muted);
    margin-bottom: 6px;
    font-size: 11px;
    text-transform: uppercase;
  }

  .content-body {
    padding: 12px;
    background: var(--background);
    border-radius: 4px;
    border: 1px solid var(--border-light);
    color: var(--text);
    line-height: 1.6;
    white-space: pre-wrap;
    max-height: 300px;
    overflow-y: auto;
    font-size: 12px;
  }

  .content-truncated {
    margin-top: 6px;
    font-size: 11px;
    color: var(--muted);
    font-style: italic;
  }
</style>
