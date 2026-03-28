<script lang="ts">
  export let ctx: any;

  let message = "";

  if (ctx?.event?.input) {
    const input = ctx.event.input;
    message =
      input.message || input.result || input.summary || input.text || "";
  }
</script>

<div
  class="font-sans text-sm p-3 rounded-md border border-border"
  style="background: var(--panel-hover)"
>
  <div class="flex items-center gap-2 mb-2 font-semibold text-foreground">
    <span class="text-lg">✅</span>
    <span>Task Complete</span>
  </div>

  {#if message}
    <div class="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
      {message}
    </div>
  {/if}
</div>
