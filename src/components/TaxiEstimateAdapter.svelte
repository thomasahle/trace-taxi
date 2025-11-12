<script lang="ts">
  export let ctx: any;

  let pickup = '';
  let dropoff = '';
  let when = '';
  let etaMinutes = 0;
  let priceUsd = 0;
  let note = '';

  // Extract input parameters
  if (ctx?.event?.input) {
    const input = ctx.event.input;
    pickup = input.pickup || '';
    dropoff = input.dropoff || '';
    when = input.when || 'now';
  }

  // Extract output
  if (ctx?.pair?.output) {
    const out = ctx.pair.output;
    if (typeof out === 'string') {
      try {
        const parsed = JSON.parse(out);
        etaMinutes = parsed.eta_minutes || 0;
        priceUsd = parsed.price_usd || 0;
        note = parsed.note || '';
      } catch (e) {
        // If parsing fails, try to extract values from string
        console.error('Failed to parse taxi estimate output:', e);
      }
    } else if (out && typeof out === 'object') {
      etaMinutes = out.eta_minutes || 0;
      priceUsd = out.price_usd || 0;
      note = out.note || '';
    }
  }
</script>

<div class="taxi-estimate-container">
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
      {#if when && when !== 'now'}
        <div class="route-meta">⏰ {when}</div>
      {/if}
    </div>
  </div>

  <div class="estimate-results">
    <div class="estimate-item">
      <span class="estimate-label">ETA</span>
      <span class="estimate-value">{etaMinutes} min</span>
    </div>
    <div class="estimate-item">
      <span class="estimate-label">Fare</span>
      <span class="estimate-value">${priceUsd.toFixed(2)}</span>
    </div>
  </div>

  {#if note}
    <div class="note">💭 {note}</div>
  {/if}
</div>

<style>
  .taxi-estimate-container {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
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

  .estimate-results {
    display: flex;
    gap: 20px;
    padding: 12px;
    background: var(--panel-hover);
    border-radius: 6px;
    margin-bottom: 8px;
  }

  .estimate-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .estimate-label {
    font-size: 11px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .estimate-value {
    font-size: 16px;
    font-weight: 600;
    color: var(--accent);
  }

  .note {
    font-size: 12px;
    color: var(--muted);
    font-style: italic;
    padding: 8px 12px;
    background: var(--panel-hover);
    border-radius: 4px;
  }
</style>
