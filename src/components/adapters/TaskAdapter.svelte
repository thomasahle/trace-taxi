<script lang="ts">
  export let ctx: any;

  let description = "";
  let prompt = "";
  let subagentType = "";
  let model = "";
  let result = "";

  // Extract input
  if (ctx?.event?.input) {
    const input = ctx.event.input;
    description = input.description || "";
    prompt = input.prompt || "";
    subagentType = input.subagent_type || input.subagentType || "";
    model = input.model || "";
  }

  // Extract output
  if (ctx?.pair?.output) {
    const out = ctx.pair.output;
    if (typeof out === "string") {
      result = out;
    } else if (out && typeof out === "object") {
      result = out.result || out.output || JSON.stringify(out, null, 2);
    }
  }
</script>

<div class="font-sans text-sm">
  <div class="flex items-center gap-2 mb-3">
    <span class="text-xl shrink-0">🤖</span>
    <div class="flex items-center gap-2 flex-wrap">
      <span class="font-semibold text-foreground">Subagent Task</span>
      {#if subagentType}
        <span
          class="text-xs px-1.5 py-0.5 bg-accent text-white rounded font-medium"
        >
          {subagentType}
        </span>
      {/if}
    </div>
  </div>

  {#if description}
    <div class="mb-3">
      <span class="font-semibold text-muted-foreground mr-1">Description:</span>
      <span class="text-foreground">{description}</span>
    </div>
  {/if}

  {#if prompt}
    <div class="my-3">
      <div
        class="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide"
      >
        Prompt:
      </div>
      <div
        class="p-3 rounded border border-border whitespace-pre-wrap leading-relaxed text-foreground"
        style="background: var(--panel-hover)"
      >
        {prompt}
      </div>
    </div>
  {/if}

  {#if model}
    <div class="text-xs text-muted-foreground mb-2">
      <span class="font-semibold mr-1">Model:</span>
      <span>{model}</span>
    </div>
  {/if}

  {#if result}
    <div class="my-3">
      <div
        class="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide"
      >
        Result:
      </div>
      <div
        class="p-3 bg-background rounded border border-border whitespace-pre-wrap leading-relaxed text-foreground max-h-[400px] overflow-y-auto"
      >
        {result}
      </div>
    </div>
  {/if}
</div>
