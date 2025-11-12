<script lang="ts">
  export let ctx: any;

  let operation = '';
  let pattern = '';
  let path = '';
  let glob = '';
  let outputMode = '';
  let results: string[] = [];
  let matchCount = 0;
  let caseInsensitive = false;
  let showLineNumbers = true;
  let multiline = false;
  let headLimit = null;
  let contextBefore = null;
  let contextAfter = null;

  // Detect operation type
  const toolName = ctx?.event?.name?.toLowerCase() || '';
  if (toolName.includes('grep')) {
    operation = 'grep';
  } else if (toolName.includes('glob') || toolName.includes('find')) {
    operation = 'glob';
  }

  // Extract input parameters
  if (ctx?.event?.input) {
    const input = ctx.event.input;
    pattern = input.pattern || input.regex || input.search || '';
    path = input.path || input.directory || input.dir || '.';
    glob = input.glob || input.include || '';
    outputMode = input.output_mode || input.outputMode || 'files_with_matches';

    // Grep specific options
    caseInsensitive = input['-i'] || input.ignoreCase || false;
    showLineNumbers = input['-n'] !== false;
    multiline = input.multiline || false;
    headLimit = input.head_limit || input.headLimit || null;
    contextBefore = input['-B'] || null;
    contextAfter = input['-A'] || null;
  }

  // Extract output
  if (ctx?.pair?.output) {
    const out = ctx.pair.output;
    if (typeof out === 'string') {
      // Parse output as list of file paths or matches
      results = out.split('\n').filter(line => line.trim());
      matchCount = results.length;
    } else if (Array.isArray(out)) {
      results = out;
      matchCount = out.length;
    } else if (out && typeof out === 'object') {
      results = out.results || out.files || out.matches || [];
      matchCount = out.count || results.length;
    }
  }

  // Format pattern for display
  function formatPattern(p: string): string {
    // Escape HTML but preserve regex structure
    return p.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
</script>

<div class="search-container">
  <div class="search-header">
    <span class="operation-type">{operation.toUpperCase()}</span>
    <span class="pattern-display">
      {#if operation === 'grep'}
        <span class="pattern-label">Pattern:</span>
        <code class="pattern">{formatPattern(pattern)}</code>
      {:else}
        <span class="pattern-label">Pattern:</span>
        <code class="pattern">{pattern}</code>
      {/if}
    </span>
  </div>

  <div class="search-params">
    <span class="param">📁 {path}</span>
    {#if glob}
      <span class="param">🎯 Files: {glob}</span>
    {/if}
    {#if operation === 'grep'}
      <span class="param">Mode: {outputMode}</span>
      {#if caseInsensitive}
        <span class="flag">-i</span>
      {/if}
      {#if multiline}
        <span class="flag">multiline</span>
      {/if}
      {#if contextBefore}
        <span class="flag">-B {contextBefore}</span>
      {/if}
      {#if contextAfter}
        <span class="flag">-A {contextAfter}</span>
      {/if}
    {/if}
    {#if headLimit}
      <span class="param">Limit: {headLimit}</span>
    {/if}
  </div>

  <div class="results-container">
    <div class="results-header">
      <span class="results-count">
        {#if operation === 'grep'}
          {matchCount} {matchCount === 1 ? 'match' : 'matches'} found
        {:else}
          {matchCount} {matchCount === 1 ? 'file' : 'files'} found
        {/if}
      </span>
    </div>

    {#if results.length > 0}
      <div class="results-list">
        {#each results.slice(0, 20) as result}
          {#if operation === 'grep' && outputMode === 'content'}
            <div class="match-line">
              <code>{result}</code>
            </div>
          {:else}
            <div class="file-result">
              <span class="file-icon">📄</span>
              <span class="file-path">{result}</span>
            </div>
          {/if}
        {/each}
        {#if results.length > 20}
          <div class="more-results">
            ... and {results.length - 20} more
          </div>
        {/if}
      </div>
    {:else}
      <div class="no-results">No matches found</div>
    {/if}
  </div>
</div>

<style>
  .search-container {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  }

  .search-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .operation-type {
    background: #ddf4ff;
    color: #0969da;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .pattern-display {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pattern-label {
    font-size: 13px;
    color: var(--muted);
  }

  .pattern {
    background: var(--code-bg);
    padding: 2px 6px;
    border-radius: 3px;
    font-family: ui-monospace, monospace;
    font-size: 12px;
    color: #d1242f;
    border: 1px solid var(--border-light);
  }

  .search-params {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
    font-size: 12px;
  }

  .param {
    color: var(--muted);
  }

  .flag {
    background: var(--chip);
    padding: 1px 6px;
    border-radius: 3px;
    font-family: ui-monospace, monospace;
    font-size: 11px;
    color: var(--text);
  }

  .results-container {
    background: var(--code-bg);
    border: 1px solid var(--border-light);
    border-radius: 6px;
    overflow: hidden;
  }

  .results-header {
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-light);
    background: var(--bg);
  }

  .results-count {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
  }

  .results-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .file-result, .match-line {
    padding: 6px 12px;
    border-bottom: 1px solid var(--border-light);
    font-size: 12px;
  }

  .file-result:last-child, .match-line:last-child {
    border-bottom: none;
  }

  .file-result {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .file-result:hover {
    background: var(--panel-hover);
  }

  .file-icon {
    font-size: 14px;
  }

  .file-path {
    font-family: ui-monospace, monospace;
    color: var(--accent);
  }

  .match-line code {
    font-family: ui-monospace, monospace;
    font-size: 11px;
    line-height: 1.4;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .more-results {
    padding: 8px 12px;
    text-align: center;
    color: var(--muted);
    font-size: 12px;
    font-style: italic;
  }

  .no-results {
    padding: 24px;
    text-align: center;
    color: var(--muted);
    font-style: italic;
  }
</style>