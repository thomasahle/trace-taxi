<script lang="ts">
  import { Copy, Check } from "lucide-svelte";

  export let rawData: any;

  let copied = false;
  let timeoutId: number | null = null;

  async function copyToClipboard() {
    try {
      // Use _originalEntry if available (for Claude Code format), otherwise use rawData
      const dataToStringify = rawData?._originalEntry || rawData;
      const jsonString = JSON.stringify(dataToStringify, null, 2);
      await navigator.clipboard.writeText(jsonString);
      copied = true;

      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        copied = false;
        timeoutId = null;
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }
</script>

<button
  class="copy-raw-button"
  on:click|stopPropagation={copyToClipboard}
  title="Copy raw source to clipboard"
  aria-label="Copy raw source"
>
  {#if copied}
    <Check size={14} />
  {:else}
    <Copy size={14} />
  {/if}
</button>

<style>
  .copy-raw-button {
    position: absolute;
    top: -1rem;
    left: -1rem;
    padding: 2px;
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    cursor: pointer;
    opacity: 0;
    transition:
      opacity 0.2s,
      background-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--muted-foreground);
    z-index: 10;
  }

  :global(.dark) .copy-raw-button {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .copy-raw-button:hover {
    background: var(--accent);
    color: var(--foreground);
  }

  :global(.hoverable-block:hover) .copy-raw-button {
    opacity: 1;
  }
</style>
