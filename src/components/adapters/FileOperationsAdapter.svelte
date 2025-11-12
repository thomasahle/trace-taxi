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
      <div class="edit-section">
        <div class="section-label">🔍 Find:</div>
        <pre class="code-block old">{oldString}</pre>
      </div>
      <div class="edit-section">
        <div class="section-label">✏️ Replace with:</div>
        <pre class="code-block new">{newString}</pre>
      </div>
      {#if replaceAll}
        <div class="replace-all">⚡ Replace all occurrences</div>
      {/if}
    </div>
    <div class="output-status" class:success={isSuccess}>
      {output}
    </div>
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

  .content-label, .section-label {
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

  .code-block.old {
    background: hsl(0 100% 96%);
    border-color: hsl(0 100% 88%);
  }

  :global(.dark) .code-block.old {
    background: hsl(0 40% 20%);
    border-color: hsl(0 40% 30%);
  }

  .code-block.new {
    background: hsl(140 50% 90%);
    border-color: hsl(140 50% 75%);
  }

  :global(.dark) .code-block.new {
    background: hsl(140 40% 20%);
    border-color: hsl(140 40% 30%);
  }

  .edit-container {
    margin-bottom: 12px;
  }

  .edit-section {
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
</style>