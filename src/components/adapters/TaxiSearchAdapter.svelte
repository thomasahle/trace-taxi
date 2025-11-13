<script lang="ts">
  export let ctx: any;

  let pickup = "";
  let dropoff = "";
  let time = "";
  let seats = 1;
  let options: any[] = [];

  // Extract input parameters
  if (ctx?.event?.input) {
    const input = ctx.event.input;
    pickup = input.pickup || "";
    dropoff = input.dropoff || "";
    time = input.time || "now";
    seats = input.seats || 1;
  }

  // Extract output
  if (ctx?.pair?.output) {
    const out = ctx.pair.output;
    if (typeof out === "string") {
      try {
        const parsed = JSON.parse(out);
        options = parsed.options || [];
      } catch (e) {
        console.error("Failed to parse taxi search output:", e);
      }
    } else if (out && typeof out === "object") {
      options = out.options || [];
    }
  }
</script>

<div class="font-sans text-sm">
  <div class="flex gap-3 mb-3">
    <span class="text-xl shrink-0">🚕</span>
    <div class="flex-1">
      <div class="flex gap-2 mb-1">
        <span class="text-xs text-muted-foreground min-w-[40px]">From:</span>
        <span class="text-foreground font-medium">{pickup}</span>
      </div>
      <div class="flex gap-2 mb-1">
        <span class="text-xs text-muted-foreground min-w-[40px]">To:</span>
        <span class="text-foreground font-medium">{dropoff}</span>
      </div>
      <div class="text-xs text-muted-foreground mt-1">
        {#if time && time !== "now"}⏰ {time}{/if}
        {#if seats > 1}· {seats} seats{/if}
      </div>
    </div>
  </div>

  {#if options.length > 0}
    <div
      class="text-xs font-semibold text-foreground mb-2 pb-2 border-b border-border"
    >
      {options.length}
      {options.length === 1 ? "option" : "options"} available:
    </div>
    <div class="flex flex-col gap-2">
      {#each options as option, i}
        <div
          class="p-3 rounded-md border border-border"
          style="background: var(--panel-hover)"
        >
          <div class="flex items-center gap-2 mb-2">
            <span
              class="inline-flex items-center justify-center w-5 h-5 bg-accent text-white rounded-full text-[11px] font-semibold"
            >
              {i + 1}
            </span>
            <span class="text-sm font-semibold text-foreground"
              >{option.service}</span
            >
          </div>
          <div class="flex gap-4 mb-2">
            <div class="flex flex-col gap-0.5">
              <span
                class="text-[10px] text-muted-foreground uppercase tracking-wide"
                >ETA</span
              >
              <span class="text-sm font-semibold text-accent-foreground"
                >{option.eta_minutes} min</span
              >
            </div>
            <div class="flex flex-col gap-0.5">
              <span
                class="text-[10px] text-muted-foreground uppercase tracking-wide"
                >Fare</span
              >
              <span class="text-sm font-semibold text-accent-foreground"
                >${option.price_usd.toFixed(2)}</span
              >
            </div>
          </div>
          {#if option.song_hint}
            <div
              class="text-xs text-muted-foreground italic pt-1 border-t border-border"
            >
              🎵 {option.song_hint}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div class="py-4 text-center text-muted-foreground italic">
      No taxis available
    </div>
  {/if}
</div>
