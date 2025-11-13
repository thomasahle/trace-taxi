<script lang="ts">
  export let ctx: any;

  let plan = "";

  // Extract the plan from input
  if (ctx?.event?.input?.plan) {
    plan = ctx.event.input.plan;
  }
</script>

<div
  class="font-sans text-sm p-3 rounded-md border border-border"
  style="background: var(--panel-hover)"
>
  <div class="flex items-center gap-2 mb-3 font-semibold text-foreground">
    <span class="text-lg">📋</span>
    <span>Implementation Plan</span>
  </div>

  {#if plan}
    <div
      class="p-3 bg-background rounded border border-border mb-3 leading-relaxed text-foreground whitespace-pre-wrap"
    >
      {@html plan.replace(/\n/g, "<br>")}
    </div>
  {/if}

  <div
    class="flex items-center gap-1.5 px-2 py-2 rounded text-xs"
    style="background: var(--success); color: var(--green)"
  >
    <span class="font-bold">✓</span>
    <span class="font-medium">Ready to proceed with implementation</span>
  </div>
</div>
