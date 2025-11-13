<script lang="ts">
  export let title: string;
  export let subtitle: string = "";
  let open = true;
</script>

<div class="border border-border rounded-lg overflow-hidden my-3">
  <button
    class="flex w-full items-center justify-between bg-muted px-3 py-2 text-sm hover:bg-accent transition-colors border-b border-border"
    on:click={() => (open = !open)}
  >
    <div class="flex items-center gap-2">
      <span class="font-semibold">{title}</span>
      {#if subtitle}
        <span class="text-xs text-muted-foreground">· {subtitle}</span>
      {/if}
    </div>
    <div class="text-xs">{open ? "▾" : "▸"}</div>
  </button>
  {#if open}
    <div class="px-3 py-3 bg-background">
      <slot />
    </div>
  {/if}
</div>
