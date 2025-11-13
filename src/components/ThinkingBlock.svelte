<script lang="ts">
  import { ChevronDown, ChevronRight, Brain } from "lucide-svelte";
  import { marked } from "$lib/markdown";

  export let text: string;

  // Thinking blocks should be collapsed by default to save space
  let open = false;

  // Get a preview of the thinking content
  function getPreview(text: string): string {
    const firstLine = text.split("\n")[0];
    const maxLength = 80;
    if (firstLine.length <= maxLength) return firstLine;
    return firstLine.substring(0, maxLength - 3) + "...";
  }

  $: preview = getPreview(text);
  $: html = marked.parse(text || "");
</script>

<div class="thinking-container" class:collapsed={!open}>
  <div class="thinking-header" on:click={() => (open = !open)}>
    <div class="thinking-title">
      <Brain size={16} class="thinking-icon" />
      <span class="thinking-label">Thinking</span>
      {#if !open && preview}
        <span class="thinking-preview">{preview}</span>
      {/if}
    </div>
    <span class="thinking-chevron">
      {#if open}
        <ChevronDown size={16} />
      {:else}
        <ChevronRight size={16} />
      {/if}
    </span>
  </div>
  {#if open}
    <div class="thinking-body text-xs">
      {@html html}
    </div>
  {/if}
</div>

<style>
  .thinking-container {
    border: 1px solid var(--border-light);
    border-radius: 6px;
    overflow: hidden;
    background: var(--thinking-bg, rgba(139, 92, 246, 0.05));
  }

  .thinking-container.collapsed {
    display: inline-block;
    max-width: 100%;
  }

  .thinking-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--thinking-header-bg, rgba(139, 92, 246, 0.1));
    cursor: pointer;
    user-select: none;
    min-height: 36px;
  }

  .thinking-header:hover {
    background: var(--thinking-header-hover-bg, rgba(139, 92, 246, 0.15));
  }

  .thinking-title {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  :global(.thinking-icon) {
    color: var(--thinking-icon-color, rgb(139, 92, 246));
    flex-shrink: 0;
  }

  .thinking-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--thinking-label-color, rgb(139, 92, 246));
    flex-shrink: 0;
  }

  .thinking-preview {
    font-size: 12px;
    color: var(--muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .thinking-chevron {
    display: flex;
    align-items: center;
    color: var(--muted);
    flex-shrink: 0;
  }

  .thinking-body {
    padding: 12px;
    border-top: 1px solid var(--border-light);
    background: var(--background);
  }

  .thinking-content {
    margin: 0;
    padding: 12px;
    background: var(--panel-hover);
    border-radius: 4px;
    border: 1px solid var(--border-light);
    white-space: pre-wrap;
    word-wrap: break-word;
    line-height: 1.5;
    font-size: 13px;
    font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas,
      "Courier New", monospace;
    color: var(--text);
    max-height: 400px;
    overflow-y: auto;
  }

  /* Scrollbar styling */
  .thinking-content::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .thinking-content::-webkit-scrollbar-track {
    background: var(--background);
    border-radius: 4px;
  }

  .thinking-content::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 4px;
  }

  .thinking-content::-webkit-scrollbar-thumb:hover {
    background: var(--border-light);
  }
</style>
