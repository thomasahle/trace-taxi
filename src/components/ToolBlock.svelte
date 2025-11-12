
<script lang="ts">
  import { getTool } from '../lib/tool-registry';
  import type { ToolRenderContext } from '../lib/types';

  export let ctx: ToolRenderContext;

  $: renderer = getTool(ctx.event?.name || 'tool');
  $: label = (renderer.label ? renderer.label(ctx) : ctx.event?.name);
  $: status = ctx.pair ? 'completed' : 'pending';

  let open = true;
</script>

<div class="tool-container">
  <div class="tool-header" on:click={() => open = !open}>
    <div class="tool-title">
      <span class="tool-name">{label}</span>
      <span class="tool-status">· {status}</span>
    </div>
    <span class="tool-chevron" class:open>▸</span>
  </div>
  {#if open}
    <div class="tool-body">
      <svelte:component this={renderer.component} {ctx} />
    </div>
  {/if}
</div>
