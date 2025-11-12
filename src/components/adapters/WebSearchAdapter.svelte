<script lang="ts">
  export let ctx: any;

  let query = '';
  let allowedDomains: string[] = [];
  let blockedDomains: string[] = [];
  let results: any[] = [];

  // Extract input
  if (ctx?.event?.input) {
    const input = ctx.event.input;
    query = input.query || '';
    allowedDomains = input.allowed_domains || input.allowedDomains || [];
    blockedDomains = input.blocked_domains || input.blockedDomains || [];
  }

  // Extract output
  if (ctx?.pair?.output) {
    const out = ctx.pair.output;
    if (typeof out === 'string') {
      try {
        const parsed = JSON.parse(out);
        results = parsed.results || parsed.items || [parsed];
      } catch (e) {
        // Plain text result
        results = [{ content: out }];
      }
    } else if (out && typeof out === 'object') {
      results = out.results || out.items || [out];
    }
  }
</script>

<div class="websearch-container">
  <div class="websearch-header">
    <span class="icon">🔍</span>
    <span class="title">Web Search</span>
  </div>

  {#if query}
    <div class="query-section">
      <span class="query-label">Query:</span>
      <span class="query-text">{query}</span>
    </div>
  {/if}

  {#if allowedDomains.length > 0 || blockedDomains.length > 0}
    <div class="filters-section">
      {#if allowedDomains.length > 0}
        <div class="filter-item">
          <span class="filter-label">Allowed:</span>
          <span class="filter-value">{allowedDomains.join(', ')}</span>
        </div>
      {/if}
      {#if blockedDomains.length > 0}
        <div class="filter-item">
          <span class="filter-label">Blocked:</span>
          <span class="filter-value">{blockedDomains.join(', ')}</span>
        </div>
      {/if}
    </div>
  {/if}

  {#if results.length > 0}
    <div class="results-section">
      <div class="results-count">{results.length} {results.length === 1 ? 'result' : 'results'} found</div>
      <div class="results-list">
        {#each results as result, i}
          <div class="result-item">
            <div class="result-header">
              <span class="result-number">{i + 1}</span>
              {#if result.title}
                <span class="result-title">{result.title}</span>
              {/if}
            </div>
            {#if result.url}
              <a href={result.url} target="_blank" rel="noopener noreferrer" class="result-url">
                {result.url}
              </a>
            {/if}
            {#if result.snippet || result.content}
              <div class="result-snippet">
                {result.snippet || result.content}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="no-results">No results found</div>
  {/if}
</div>

<style>
  .websearch-container {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 13px;
  }

  .websearch-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-weight: 600;
  }

  .icon {
    font-size: 18px;
  }

  .query-section {
    padding: 10px 12px;
    background: var(--panel-hover);
    border-radius: 4px;
    margin-bottom: 12px;
  }

  .query-label {
    font-weight: 600;
    color: var(--muted);
    margin-right: 8px;
    font-size: 11px;
    text-transform: uppercase;
  }

  .query-text {
    color: var(--text);
    font-weight: 500;
  }

  .filters-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
    font-size: 12px;
  }

  .filter-item {
    display: flex;
    gap: 6px;
  }

  .filter-label {
    font-weight: 600;
    color: var(--muted);
  }

  .filter-value {
    color: var(--text);
  }

  .results-section {
    margin-top: 12px;
  }

  .results-count {
    font-weight: 600;
    color: var(--text);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-light);
  }

  .results-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .result-item {
    padding: 12px;
    background: var(--panel-hover);
    border-radius: 6px;
    border: 1px solid var(--border-light);
  }

  .result-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .result-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    background: var(--accent);
    color: white;
    border-radius: 50%;
    font-size: 11px;
    font-weight: 600;
    padding: 0 6px;
  }

  .result-title {
    font-weight: 600;
    color: var(--text);
    font-size: 14px;
  }

  .result-url {
    display: block;
    color: var(--accent);
    text-decoration: none;
    font-size: 12px;
    margin-bottom: 8px;
    word-break: break-all;
  }

  .result-url:hover {
    text-decoration: underline;
  }

  .result-snippet {
    color: var(--text);
    line-height: 1.5;
    font-size: 12px;
  }

  .no-results {
    padding: 20px;
    text-align: center;
    color: var(--muted);
    font-style: italic;
  }
</style>
