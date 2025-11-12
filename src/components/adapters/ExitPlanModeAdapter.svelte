<script lang="ts">
  export let ctx: any;

  let plan = '';

  // Extract the plan from input
  if (ctx?.event?.input?.plan) {
    plan = ctx.event.input.plan;
  }
</script>

<div class="exit-plan-container">
  <div class="plan-header">
    <span class="icon">📋</span>
    <span class="title">Implementation Plan</span>
  </div>

  {#if plan}
    <div class="plan-content">
      {@html plan.replace(/\n/g, '<br>')}
    </div>
  {/if}

  <div class="plan-footer">
    <span class="status-icon">✓</span>
    <span class="status-text">Ready to proceed with implementation</span>
  </div>
</div>

<style>
  .exit-plan-container {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 13px;
    padding: 12px;
    background: var(--panel-hover);
    border-radius: 6px;
    border: 1px solid var(--border-light);
  }

  .plan-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-weight: 600;
    color: var(--text);
  }

  .icon {
    font-size: 18px;
  }

  .plan-content {
    padding: 12px;
    background: var(--background);
    border-radius: 4px;
    border: 1px solid var(--border-light);
    margin-bottom: 12px;
    line-height: 1.6;
    color: var(--text);
    white-space: pre-wrap;
  }

  .plan-footer {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px;
    background: var(--success-bg);
    border-radius: 4px;
    font-size: 12px;
  }

  .status-icon {
    color: var(--success);
    font-weight: bold;
  }

  .status-text {
    color: var(--success);
    font-weight: 500;
  }
</style>
