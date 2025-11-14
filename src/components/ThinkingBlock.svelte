<script lang="ts">
  import { ChevronDown, ChevronRight, Brain } from "lucide-svelte";
  import { marked } from "$lib/markdown";

  export let text: string;

  // Thinking blocks should be collapsed by default to save space
  let open = false;

  // Get the first line as preview (CSS text-ellipsis handles truncation)
  $: preview = text.split("\n")[0];
  $: html = marked.parse(text || "");
</script>

<div
  class="border-0 rounded-md overflow-hidden bg-transparent {!open
    ? 'inline-block max-w-full'
    : ''}"
>
  <div
    class="flex justify-between items-center px-3 py-2 bg-transparent cursor-pointer select-none min-h-[36px] hover:bg-accent"
    on:click={() => (open = !open)}
  >
    <div class="flex items-center gap-2 flex-1 min-w-0">
      <Brain size={16} class="text-foreground shrink-0" />
      <span class="text-sm font-semibold text-foreground shrink-0"
        >Thinking</span
      >
      {#if !open && preview}
        <span
          class="text-xs text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap flex-1"
          >{preview}</span
        >
      {/if}
    </div>
    <span class="flex items-center text-muted-foreground shrink-0">
      {#if open}
        <ChevronDown size={16} />
      {:else}
        <ChevronRight size={16} />
      {/if}
    </span>
  </div>
  {#if open}
    <div class="prose-sm px-3 py-3 border-t-0 bg-background text-xs">
      {@html html}
    </div>
  {/if}
</div>
