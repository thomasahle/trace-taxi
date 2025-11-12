
<script lang="ts">
  import type { TraceData } from '../lib/types';
  import { groupToolPairs } from '../lib/utils';
  export let data: TraceData;

  $: pairs = groupToolPairs(data.events);
  $: tools = Array.from(new Set(pairs.map(p => p.use?.name).filter(Boolean)));
</script>

<div class="panel sidebar">
  <div class="card"><div class="role">Trace</div><h4>{data.title}</h4></div>
  <div class="card">
    <div class="role">Tools</div>
    <div class="chips" style="margin-top:8px;">
      {#each tools as t}
        <span class="badge">{t}</span>
      {/each}
      {#if tools.length === 0}
        <div class="small">No tools detected</div>
      {/if}
    </div>
  </div>
  <div class="card">
    <div class="role">Events</div>
    <div class="small" style="margin-top:8px;">{data?.events?.length ?? 0} total</div>
  </div>
</div>
