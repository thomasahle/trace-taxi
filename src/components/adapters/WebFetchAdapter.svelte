<script lang="ts">
  export let ctx: any;

  let url = "";
  let prompt = "";
  let content = "";

  // Extract input
  if (ctx?.event?.input) {
    const input = ctx.event.input;
    url = input.url || "";
    prompt = input.prompt || "";
  }

  // Extract output
  if (ctx?.pair?.output) {
    const out = ctx.pair.output;
    if (typeof out === "string") {
      content = out;
    } else if (out && typeof out === "object") {
      content = out.content || out.text || JSON.stringify(out, null, 2);
    }
  }

  // Truncate long content for display
  function truncate(text: string, maxLength: number = 500): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }
</script>

<div class="font-sans text-sm">
  <div class="flex items-center gap-2 mb-3 font-semibold">
    <span class="text-lg">🌐</span>
    <span>Web Fetch</span>
  </div>

  {#if url}
    <div
      class="flex items-center gap-2 flex-wrap px-3 py-2 mb-3 rounded"
      style="background: var(--panel-hover)"
    >
      <span class="text-xs font-semibold text-muted-foreground uppercase"
        >URL:</span
      >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs text-accent-foreground break-all no-underline hover:underline"
      >
        {url}
      </a>
    </div>
  {/if}

  {#if prompt}
    <div class="mb-3">
      <div class="text-xs font-semibold text-muted-foreground mb-1.5 uppercase">
        Query:
      </div>
      <div
        class="px-2.5 py-2 rounded border border-border text-foreground leading-relaxed"
        style="background: var(--panel-hover)"
      >
        {prompt}
      </div>
    </div>
  {/if}

  {#if content}
    <div class="mt-3">
      <div class="text-xs font-semibold text-muted-foreground mb-1.5 uppercase">
        Fetched Content:
      </div>
      <div
        class="p-3 bg-background rounded border border-border text-foreground leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto text-xs"
      >
        {truncate(content)}
      </div>
      {#if content.length > 500}
        <div class="mt-1.5 text-xs text-muted-foreground italic">
          Content truncated ({content.length} characters total)
        </div>
      {/if}
    </div>
  {/if}
</div>
