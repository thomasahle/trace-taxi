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
    <span class="pattern-label">Pattern:</span>
    <code class="pattern">{operation === 'grep' ? formatPattern(pattern) : pattern}</code>
  </div>

  <div class="search-meta">
    <span class="path-display">📁 {path}</span>
    {#if glob}
      <span class="param">· Files: {glob}</span>
    {/if}
    {#if operation === 'grep'}
      {#if caseInsensitive}<span class="flag">-i</span>{/if}
      {#if multiline}<span class="flag">multiline</span>{/if}
      {#if contextBefore}<span class="flag">-B {contextBefore}</span>{/if}
      {#if contextAfter}<span class="flag">-A {contextAfter}</span>{/if}
    {/if}
  </div>

  <div class="results-summary">
    {#if operation === 'grep'}
      {matchCount} {matchCount === 1 ? 'match' : 'matches'} found
    {:else}
      {matchCount} {matchCount === 1 ? 'file' : 'files'} found
    {/if}
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
  {:else if matchCount === 0}
    <div class="no-results">No matches found</div>
  {/if}
</div>

<style>
  .search-container {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 13px;
  }

  .search-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .operation-type {
    background: #ddf4ff;
    color: #0969da;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    flex-shrink: 0;
  }

  .pattern-label {
    font-size: 12px;
    color: var(--text);
  }

  .pattern {
    background: transparent;
    padding: 0;
    font-family: ui-monospace, monospace;
    font-size: 12px;
    color: #d1242f;
  }

  .search-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;
    font-size: 12px;
  }

  .path-display {
    color: var(--muted);
  }

  .param {
    color: var(--muted);
  }

  .flag {
    background: var(--chip);
    padding: 1px 4px;
    border-radius: 2px;
    font-family: ui-monospace, monospace;
    font-size: 10px;
    color: var(--text);
  }

  .results-summary {
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-light);
  }

  .results-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .file-result, .match-line {
    padding: 4px 0;
    font-size: 12px;
  }

  .file-result {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .file-result:hover {
    background: var(--panel-hover);
  }

  .file-icon {
    font-size: 13px;
    flex-shrink: 0;
  }

  .file-path {
    font-family: ui-monospace, monospace;
    color: var(--accent);
    font-size: 12px;
  }

  .match-line code {
    font-family: ui-monospace, monospace;
    font-size: 11px;
    line-height: 1.4;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .more-results {
    padding: 8px 0;
    text-align: center;
    color: var(--muted);
    font-size: 12px;
    font-style: italic;
  }

  .no-results {
    padding: 16px 0;
    text-align: center;
    color: var(--muted);
    font-style: italic;
  }
</style>