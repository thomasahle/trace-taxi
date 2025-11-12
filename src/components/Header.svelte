
<script lang="ts">
  import Badge from "$lib/components/ui/badge.svelte";

  export let title: string;
  export let badges: string[] = [];
</script>

<div class="rounded-lg border border-border bg-card px-4 py-3.5 mb-4">
  <div class="font-semibold mb-1.5">{title}</div>
  {#if badges.length}
    <div class="flex flex-wrap gap-2">
      {#each badges as b}
        <Badge variant="secondary">{b}</Badge>
      {/each}
    </div>
  {/if}
</div>
