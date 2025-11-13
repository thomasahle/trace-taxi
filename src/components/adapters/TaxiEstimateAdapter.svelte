<script lang="ts">
  export let ctx: any;

  let pickup = "";
  let dropoff = "";
  let when = "";
  let etaMinutes = 0;
  let priceUsd = 0;
  let note = "";

  // Extract input parameters
  if (ctx?.event?.input) {
    const input = ctx.event.input;
    pickup = input.pickup || "";
    dropoff = input.dropoff || "";
    when = input.when || "now";
  }

  // Extract output
  if (ctx?.pair?.output) {
    const out = ctx.pair.output;
    if (typeof out === "string") {
      try {
        const parsed = JSON.parse(out);
        etaMinutes = parsed.eta_minutes || 0;
        priceUsd = parsed.price_usd || 0;
        note = parsed.note || "";
      } catch (e) {
        // If parsing fails, try to extract values from string
        console.error("Failed to parse taxi estimate output:", e);
      }
    } else if (out && typeof out === "object") {
      etaMinutes = out.eta_minutes || 0;
      priceUsd = out.price_usd || 0;
      note = out.note || "";
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
      {#if when && when !== "now"}
        <div class="text-xs text-muted-foreground mt-1">⏰ {when}</div>
      {/if}
    </div>
  </div>

  <div
    class="flex gap-5 p-3 rounded-md mb-2"
    style="background: var(--panel-hover)"
  >
    <div class="flex flex-col gap-1">
      <span class="text-[11px] text-muted-foreground uppercase tracking-wide"
        >ETA</span
      >
      <span class="text-base font-semibold text-accent-foreground"
        >{etaMinutes} min</span
      >
    </div>
    <div class="flex flex-col gap-1">
      <span class="text-[11px] text-muted-foreground uppercase tracking-wide"
        >Fare</span
      >
      <span class="text-base font-semibold text-accent-foreground"
        >${priceUsd.toFixed(2)}</span
      >
    </div>
  </div>

  {#if note}
    <div
      class="text-xs text-muted-foreground italic px-3 py-2 rounded"
      style="background: var(--panel-hover)"
    >
      💭 {note}
    </div>
  {/if}
</div>
