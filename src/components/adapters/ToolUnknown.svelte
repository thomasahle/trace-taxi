
<script lang="ts">
  export let ctx: any;
  let name = ctx?.event?.name ?? 'tool';
  let input = ctx?.event?.input;
  let output = ctx?.pair?.output;

  // Try to parse output if it's a string containing JSON
  function formatOutput(output: any): { formatted: string; isJson: boolean } {
    if (!output) return { formatted: '', isJson: false };

    // If output is a string, try to parse it as JSON
    if (typeof output === 'string') {
      try {
        const parsed = JSON.parse(output);
        return { formatted: JSON.stringify(parsed, null, 2), isJson: true };
      } catch {
        return { formatted: output, isJson: false };
      }
    }

    // If output is already an object, stringify it
    return { formatted: JSON.stringify(output, null, 2), isJson: true };
  }

  $: formattedOutput = formatOutput(output);
</script>

<div class="panel card">
  <div class="role">tool · {name}</div>
  <div class="small">No custom renderer registered. Showing raw JSON.</div>

  {#if input && Object.keys(input).length > 0}
    <div class="section">
      <div class="section-title">Input</div>
      <pre class="code">{JSON.stringify(input, null, 2)}</pre>
    </div>
  {/if}

  {#if output}
    <div class="section">
      <div class="section-title">Output</div>
      <pre class="code">{formattedOutput.formatted}</pre>
    </div>
  {/if}
</div>

<style>
  .section {
    margin-top: 12px;
  }

  .section-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--muted-foreground);
    margin-bottom: 6px;
    letter-spacing: 0.5px;
  }

  .section + .section {
    margin-top: 16px;
  }
</style>
