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
  class="copy-raw-button absolute -top-4 -left-4 p-0.5 border rounded cursor-pointer opacity-0 transition-all duration-200 flex items-center justify-center z-10 text-muted-foreground group-hover:opacity-100 hover:text-foreground"
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
    background: rgba(0, 0, 0, 0.05);
    border-color: rgba(0, 0, 0, 0.1);
  }

  .copy-raw-button:hover {
    background: var(--accent);
  }

  :global(.dark) .copy-raw-button {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }
</style>
