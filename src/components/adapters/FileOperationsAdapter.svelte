<script lang="ts">
  import { onMount } from 'svelte';
  import hljs from 'highlight.js';

  export let ctx: any;

  let operation = '';
  let filePath = '';
  let content = '';
  let oldString = '';
  let newString = '';
  let limit = null;
  let offset = null;
  let replaceAll = false;
  let output = '';
  let isSuccess = false;
  let highlightedContent = '';

  // Detect operation type
  const toolName = ctx?.event?.name?.toLowerCase() || '';
  if (toolName.includes('read')) {
    operation = 'read';
  } else if (toolName.includes('write')) {
    operation = 'write';
  } else if (toolName.includes('edit')) {
    operation = 'edit';
  }

  // Extract input parameters
  if (ctx?.event?.input) {
    const input = ctx.event.input;
    filePath = input.file_path || input.path || input.filename || '';
    content = input.content || input.text || '';
    oldString = input.old_string || input.old || '';
    newString = input.new_string || input.new || '';
    limit = input.limit || null;
    offset = input.offset || null;
    replaceAll = input.replace_all || input.replaceAll || false;
  }

  // Extract output
  if (ctx?.pair?.output) {
    const out = ctx.pair.output;
    if (typeof out === 'string') {
      output = out;
      isSuccess = out.toLowerCase().includes('success');
    } else if (out && typeof out === 'object') {
      output = out.message || out.result || JSON.stringify(out, null, 2);
      isSuccess = out.success || out.status === 'success' || false;
    }
  }

  // Get file extension for syntax highlighting
  function getLanguage(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'py': 'python',
      'rs': 'rust',
      'go': 'go',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'rb': 'ruby',
      'php': 'php',
      'swift': 'swift',
      'kt': 'kotlin',
      'md': 'markdown',
      'json': 'json',
      'xml': 'xml',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sql': 'sql',
      'yaml': 'yaml',
      'yml': 'yaml',
      'sh': 'bash',
      'bash': 'bash',
      'svelte': 'html',
      'sv': 'verilog',
      'v': 'verilog',
      'vh': 'verilog',
      'toml': 'ini',
      'ini': 'ini',
      'cfg': 'ini',
      'conf': 'ini',
      'txt': 'plaintext',
      'log': 'plaintext',
      'proto': 'protobuf',
      'graphql': 'graphql',
      'gql': 'graphql',
      'dockerfile': 'dockerfile',
      'tf': 'terraform',
      'vue': 'xml',
      'scala': 'scala',
      'r': 'r',
      'm': 'objectivec',
      'pl': 'perl',
      'lua': 'lua',
      'dart': 'dart',
      'elm': 'elm',
      'ex': 'elixir',
      'exs': 'elixir',
      'clj': 'clojure',
      'cljs': 'clojure',
      'hs': 'haskell',
      'erl': 'erlang',
      'fs': 'fsharp',
      'fsx': 'fsharp',
      'groovy': 'groovy',
      'jl': 'julia'
    };
    return langMap[ext] || 'plaintext';
  }

  // Create diff view for Edit operations
  function createDiffView(oldStr: string, newStr: string): string {
    const oldLines = oldStr.split('\n');
    const newLines = newStr.split('\n');

    let diffHtml = '';
    let i = 0, j = 0;

    // Simple diff algorithm: find matching and different lines
    while (i < oldLines.length || j < newLines.length) {
      const oldLine = i < oldLines.length ? oldLines[i] : null;
      const newLine = j < newLines.length ? newLines[j] : null;

      if (oldLine === newLine && oldLine !== null) {
        // Lines match - show as context
        const escaped = escapeHtml(oldLine);
        diffHtml += `<div class="diff-line context"><span class="diff-marker"> </span><span class="diff-content">${escaped}</span></div>`;
        i++;
        j++;
      } else {
        // Lines differ - show deletions and additions
        let foundMatch = false;

        // Look ahead to find if this is a modification or insertion/deletion
        for (let k = j; k < Math.min(j + 3, newLines.length); k++) {
          if (oldLine === newLines[k]) {
            foundMatch = true;
            break;
          }
        }

        if (oldLine !== null && (newLine === null || !foundMatch)) {
          // Deletion
          const escaped = escapeHtml(oldLine);
          diffHtml += `<div class="diff-line removed"><span class="diff-marker">-</span><span class="diff-content">${escaped}</span></div>`;
          i++;
        } else {
          if (newLine !== null) {
            // Addition
            const escaped = escapeHtml(newLine);
            diffHtml += `<div class="diff-line added"><span class="diff-marker">+</span><span class="diff-content">${escaped}</span></div>`;
            j++;
          }
        }
      }
    }

    return diffHtml;
  }

  function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Apply syntax highlighting reactively
  $: {
    if (content && operation === 'write') {
      try {
        const lang = getLanguage(filePath);
        highlightedContent = hljs.highlight(content, { language: lang }).value;
      } catch {
        highlightedContent = content;
      }
    } else if (output && operation === 'read') {
      // Apply syntax highlighting to Read output
      try {
        const lang = getLanguage(filePath);
        // Parse the output format: "1→content\n2→content\n..."
        const lines = output.split('\n');
        const highlightedLines = lines.map(line => {
          // Match line number prefix (e.g., "   1→" or " 123→")
          const match = line.match(/^(\s*)(\d+)→(.*)/);
          if (match) {
            const indent = match[1];
            const lineNum = match[2];
            const content = match[3];
            try {
              const highlighted = hljs.highlight(content, { language: lang, ignoreIllegals: true }).value;
              return `<span class="line-num">${lineNum}</span>${highlighted}`;
            } catch {
              return `<span class="line-num">${lineNum}</span>${content}`;
            }
          }
          return line;
        });
        highlightedContent = highlightedLines.join('\n');
      } catch {
        highlightedContent = output;
      }
    } else {
      highlightedContent = '';
    }
  }
</script>

<div class="file-op-container">
  <div class="file-header">
    <span class="file-path">{filePath}</span>
  </div>

  {#if operation === 'read'}
    <div class="file-metadata">
      {#if limit}
        <span class="meta-item">📖 Limit: {limit} lines</span>
      {/if}
      {#if offset}
        <span class="meta-item">📍 Offset: line {offset}</span>
      {/if}
    </div>
    <pre class="code-block read-output"><code>{@html highlightedContent || output}</code></pre>
  {/if}

  {#if operation === 'write'}
    <div class="file-content">
      <div class="content-label">Content:</div>
      <pre class="code-block"><code>{@html highlightedContent || content}</code></pre>
    </div>
    <div class="output-status" class:success={isSuccess}>
      {output}
    </div>
  {/if}

  {#if operation === 'edit'}
    <div class="edit-container">
      <div class="diff-view">
        {@html createDiffView(oldString, newString)}
      </div>
      {#if replaceAll}
        <div class="replace-all">⚡ Replace all occurrences</div>
      {/if}
    </div>
    {#if output && !isSuccess}
      <div class="output-status">
        {output}
      </div>
    {/if}
  {/if}
</div>

<style>
  .file-op-container {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  }

  .file-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .file-path {
    font-family: ui-monospace, monospace;
    font-size: 13px;
    color: var(--text);
    font-weight: 600;
  }

  .file-metadata {
    display: flex;
    gap: 16px;
    margin-bottom: 12px;
  }

  .meta-item {
    font-size: 12px;
    color: var(--muted);
  }

  .file-content {
    margin-bottom: 12px;
  }

  .content-label {
    font-size: 12px;
    color: var(--muted);
    margin-bottom: 6px;
    font-weight: 500;
  }

  .code-block {
    background: var(--code-bg);
    border: 1px solid var(--border-light);
    border-radius: 6px;
    padding: 12px;
    font-family: ui-monospace, monospace;
    font-size: 12px;
    line-height: 1.6;
    overflow-x: auto;
    margin: 0;
    max-height: 400px;
    overflow-y: auto;
  }

  .code-block.read-output {
    background: var(--code-bg);
  }

  .code-block.read-output code {
    display: block;
    white-space: pre;
  }

  .code-block :global(.line-num) {
    display: inline-block;
    min-width: 3em;
    margin-right: 1em;
    text-align: right;
    color: var(--muted);
    user-select: none;
    font-weight: 400;
  }

  .edit-container {
    margin-bottom: 12px;
  }

  .replace-all {
    font-size: 12px;
    color: var(--yellow);
    font-weight: 500;
    margin-top: 8px;
  }

  .output-status {
    font-size: 13px;
    padding: 8px 12px;
    background: var(--chip);
    border-radius: 6px;
    color: var(--muted);
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: ui-monospace, monospace;
  }

  .output-status.success {
    background: transparent;
    color: var(--muted);
    font-size: 11px;
    padding: 4px 8px;
    opacity: 0.7;
  }

  .diff-view {
    font-family: ui-monospace, monospace;
    font-size: 12px;
    line-height: 1.6;
    border: 1px solid var(--border-light);
    border-radius: 6px;
    overflow: hidden;
    background: var(--code-bg);
  }

  .diff-view :global(.diff-line) {
    display: flex;
    padding: 2px 8px;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .diff-view :global(.diff-marker) {
    display: inline-block;
    width: 20px;
    flex-shrink: 0;
    user-select: none;
    font-weight: 600;
  }

  .diff-view :global(.diff-content) {
    flex: 1;
    min-width: 0;
  }

  .diff-view :global(.diff-line.context) {
    background: var(--code-bg);
    color: var(--text);
  }

  .diff-view :global(.diff-line.removed) {
    background: hsl(0 100% 95%);
    color: hsl(0 70% 30%);
  }

  .diff-view :global(.diff-line.removed .diff-marker) {
    color: hsl(0 70% 40%);
  }

  :global(.dark) .diff-view :global(.diff-line.removed) {
    background: hsl(0 40% 22%);
    color: hsl(0 60% 80%);
  }

  :global(.dark) .diff-view :global(.diff-line.removed .diff-marker) {
    color: hsl(0 70% 70%);
  }

  .diff-view :global(.diff-line.added) {
    background: hsl(140 50% 92%);
    color: hsl(140 70% 25%);
  }

  .diff-view :global(.diff-line.added .diff-marker) {
    color: hsl(140 70% 35%);
  }

  :global(.dark) .diff-view :global(.diff-line.added) {
    background: hsl(140 40% 22%);
    color: hsl(140 60% 80%);
  }

  :global(.dark) .diff-view :global(.diff-line.added .diff-marker) {
    color: hsl(140 70% 70%);
  }
</style>