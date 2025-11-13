<script lang="ts">
  export let ctx: any;

  let query = "";
  let allowedDomains: string[] = [];
  let blockedDomains: string[] = [];
  let results: any[] = [];

  // Extract input
  if (ctx?.event?.input) {
    const input = ctx.event.input;
    query = input.query || "";
    allowedDomains = input.allowed_domains || input.allowedDomains || [];
    blockedDomains = input.blocked_domains || input.blockedDomains || [];
  }

  // Extract output
  let isPlainText = false;
  let plainTextContent = "";

  if (ctx?.pair?.output) {
    const out = ctx.pair.output;
    if (typeof out === "string") {
      try {
        const parsed = JSON.parse(out);
        results = parsed.results || parsed.items || [parsed];
      } catch (e) {
        // Plain text result - likely a summary from Claude
        isPlainText = true;
        plainTextContent = out;
      }
    } else if (out && typeof out === "object") {
      results = out.results || out.items || [out];
    }
  }
</script>

<div class="font-sans text-sm">
  <div class="flex items-center gap-2 mb-3 font-semibold">
    <span class="text-lg">🔍</span>
    <span>Web Search</span>
  </div>

  {#if query}
    <div
      class="px-3 py-2.5 mb-3 rounded"
      style="background: var(--panel-hover)"
    >
      <span class="text-xs font-semibold text-muted-foreground uppercase mr-2"
        >Query:</span
      >
      <span class="text-foreground font-medium">{query}</span>
    </div>
  {/if}

  {#if allowedDomains.length > 0 || blockedDomains.length > 0}
    <div class="flex flex-col gap-1.5 mb-3 text-xs">
      {#if allowedDomains.length > 0}
        <div class="flex gap-1.5">
          <span class="font-semibold text-muted-foreground">Allowed:</span>
          <span class="text-foreground">{allowedDomains.join(", ")}</span>
        </div>
      {/if}
      {#if blockedDomains.length > 0}
        <div class="flex gap-1.5">
          <span class="font-semibold text-muted-foreground">Blocked:</span>
          <span class="text-foreground">{blockedDomains.join(", ")}</span>
        </div>
      {/if}
    </div>
  {/if}

  {#if isPlainText}
    <div
      class="mt-3 p-4 rounded-md border border-border"
      style="background: var(--panel-hover)"
    >
      <div
        class="text-foreground leading-relaxed whitespace-pre-wrap break-words"
      >
        {plainTextContent}
      </div>
    </div>
  {:else if results.length > 0}
    <div class="mt-3">
      <div
        class="font-semibold text-foreground mb-3 pb-2 border-b border-border"
      >
        {results.length}
        {results.length === 1 ? "result" : "results"} found
      </div>
      <div class="flex flex-col gap-3">
        {#each results as result, i}
          <div
            class="p-3 rounded-md border border-border"
            style="background: var(--panel-hover)"
          >
            <div class="flex items-center gap-2 mb-1.5">
              <span
                class="inline-flex items-center justify-center min-w-[20px] h-5 bg-accent text-white rounded-full text-xs font-semibold px-1.5"
              >
                {i + 1}
              </span>
              {#if result.title}
                <span class="font-semibold text-foreground text-sm"
                  >{result.title}</span
                >
              {/if}
            </div>
            {#if result.url}
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                class="block text-accent-foreground no-underline hover:underline text-xs mb-2 break-all"
              >
                {result.url}
              </a>
            {/if}
            {#if result.snippet || result.content}
              <div class="text-foreground leading-relaxed text-xs">
                {result.snippet || result.content}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="py-5 text-center text-muted-foreground italic">
      No results found
    </div>
  {/if}
</div>
