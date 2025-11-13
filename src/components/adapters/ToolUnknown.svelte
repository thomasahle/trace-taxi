<script lang="ts">
  export let ctx: any;
  let name = ctx?.event?.name ?? "tool";
  let input = ctx?.event?.input;
  let output = ctx?.pair?.output;

  // Try to parse and reformat output
  function formatOutput(output: any): string {
    if (!output) return "";

    let textToFormat = "";

    // Extract text from various formats
    if (typeof output === "string") {
      textToFormat = output;
    } else if (Array.isArray(output)) {
      // Handle array of content blocks - join without adding extra newlines
      textToFormat = output
        .map((item: any) => {
          if (typeof item === "string") return item;
          if (item?.text) return item.text;
          if (item?.type === "text" && item?.text) return item.text;
          return JSON.stringify(item);
        })
        .join("");
    } else {
      // Already an object
      textToFormat = JSON.stringify(output);
    }

    // Try to parse and reformat as JSON with single-space indent
    const trimmed = textToFormat.trim();
    try {
      const parsed = JSON.parse(trimmed);
      const formatted = JSON.stringify(parsed, null, 1);
      return formatted;
    } catch (e) {
      // Not valid JSON, return as-is
      return textToFormat;
    }
  }

  $: formattedOutput = formatOutput(output);
</script>

<div class="panel card">
  {#if input && Object.keys(input).length > 0}
    <div class="section">
      <div class="section-title">Input</div>
      <pre class="code">{JSON.stringify(input, null, 1)}</pre>
    </div>
  {/if}

  {#if output}
    <div class="section">
      <div class="section-title">Output</div>
      <pre class="code">{formattedOutput}</pre>
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
