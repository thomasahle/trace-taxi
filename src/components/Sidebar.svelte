<script lang="ts">
  import type { TraceData } from "../lib/types";
  import { groupToolPairs } from "../lib/utils";
  import Badge from "$lib/components/ui/badge.svelte";
  import Card from "$lib/components/ui/card.svelte";

  export let data: TraceData;

  $: pairs = groupToolPairs(data.events);
  $: tools = Array.from(new Set(pairs.map((p) => p.use?.name).filter(Boolean)));
</script>

<Card class="sticky top-6 h-[calc(100vh-3rem)] overflow-auto pr-1">
  <div class="p-3.5 border-b border-border">
    <div
      class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5"
    >
      Trace
    </div>
    <h4 class="m-0 font-semibold">{data.title}</h4>
  </div>
  <div class="p-3.5 border-b border-border">
    <div
      class="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
    >
      Tools
    </div>
    <div class="flex flex-wrap gap-2 mt-2">
      {#each tools as t}
        <Badge variant="secondary">{t}</Badge>
      {/each}
      {#if tools.length === 0}
        <div class="text-sm text-muted-foreground">No tools detected</div>
      {/if}
    </div>
  </div>
  <div class="p-3.5">
    <div
      class="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
    >
      Events
    </div>
    <div class="text-sm text-muted-foreground mt-2">
      {data?.events?.length ?? 0} total
    </div>
  </div>
</Card>
