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

<div class="taxi-search-container">
  <div class="route-header">
    <span class="route-icon">🚕</span>
    <div class="route-details">
      <div class="route-line">
        <span class="location-label">From:</span>
        <span class="location">{pickup}</span>
      </div>
      <div class="route-line">
        <span class="location-label">To:</span>
        <span class="location">{dropoff}</span>
      </div>
      <div class="route-meta">
        {#if time && time !== "now"}⏰ {time}{/if}
        {#if seats > 1}· {seats} seats{/if}
      </div>
    </div>
  </div>

  {#if options.length > 0}
    <div class="options-title">
      {options.length}
      {options.length === 1 ? "option" : "options"} available:
    </div>
    <div class="options-list">
      {#each options as option, i}
        <div class="option-card">
          <div class="option-header">
            <span class="option-number">{i + 1}</span>
            <span class="service-name">{option.service}</span>
          </div>
          <div class="option-details">
            <div class="detail-item">
              <span class="detail-label">ETA</span>
              <span class="detail-value">{option.eta_minutes} min</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Fare</span>
              <span class="detail-value">${option.price_usd.toFixed(2)}</span>
            </div>
          </div>
          {#if option.song_hint}
            <div class="song-hint">🎵 {option.song_hint}</div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div class="no-options">No taxis available</div>
  {/if}
</div>

<style>
  .taxi-search-container {
    font-family:
      -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial,
      sans-serif;
    font-size: 13px;
  }

  .route-header {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
  }

  .route-icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  .route-details {
    flex: 1;
  }

  .route-line {
    display: flex;
    gap: 8px;
    margin-bottom: 4px;
  }

  .location-label {
    font-size: 11px;
    color: var(--muted);
    min-width: 40px;
  }

  .location {
    color: var(--text);
    font-weight: 500;
  }

  .route-meta {
    font-size: 11px;
    color: var(--muted);
    margin-top: 4px;
  }

  .options-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-light);
  }

  .options-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .option-card {
    padding: 12px;
    background: var(--panel-hover);
    border-radius: 6px;
    border: 1px solid var(--border-light);
  }

  .option-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .option-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: var(--accent);
    color: white;
    border-radius: 50%;
    font-size: 11px;
    font-weight: 600;
  }

  .service-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
  }

  .option-details {
    display: flex;
    gap: 16px;
    margin-bottom: 8px;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .detail-label {
    font-size: 10px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .detail-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--accent);
  }

  .song-hint {
    font-size: 11px;
    color: var(--muted);
    font-style: italic;
    padding-top: 4px;
    border-top: 1px solid var(--border-light);
  }

  .no-options {
    padding: 16px 0;
    text-align: center;
    color: var(--muted);
    font-style: italic;
  }
</style>
