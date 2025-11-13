<script lang="ts">
  export let ctx: any;

  let questions: any[] = [];
  let answers: any = {};

  // Extract input (questions)
  if (ctx?.event?.input?.questions) {
    questions = ctx.event.input.questions;
  }

  // Extract output (answers)
  if (ctx?.pair?.output) {
    const out = ctx.pair.output;
    if (typeof out === "string") {
      try {
        const parsed = JSON.parse(out);
        answers = parsed.answers || parsed;
      } catch (e) {
        // If not JSON, treat as simple answer
        answers = { response: out };
      }
    } else if (out && typeof out === "object") {
      answers = out.answers || out;
    }
  }
</script>

<div class="font-sans text-sm">
  <div class="flex items-center gap-2 mb-3 font-semibold">
    <span class="text-base">❓</span>
    <span>User Questions</span>
  </div>

  {#if questions.length > 0}
    <div class="flex flex-col gap-4">
      {#each questions as q, i}
        <div
          class="p-3 rounded-md border border-border"
          style="background: var(--panel-hover)"
        >
          <div class="mb-2 text-foreground">
            {#if q.header}
              <span class="font-semibold text-accent-foreground mr-1"
                >{q.header}:</span
              >
            {/if}
            {q.question}
          </div>

          {#if q.options && q.options.length > 0}
            <div class="flex flex-col gap-1.5 my-2">
              {#each q.options as option}
                <div
                  class="p-2 bg-background rounded border {answers[q.header] ===
                  option.label
                    ? 'border-accent'
                    : 'border-border'}"
                  style={answers[q.header] === option.label
                    ? "background: var(--success)"
                    : ""}
                >
                  <span class="font-medium block mb-0.5">{option.label}</span>
                  {#if option.description}
                    <span class="text-xs text-muted-foreground block"
                      >{option.description}</span
                    >
                  {/if}
                </div>
              {/each}
            </div>
          {/if}

          {#if answers[q.header] || answers[i]}
            <div class="mt-2 pt-2 border-t border-border">
              <span class="font-semibold text-accent-foreground mr-1"
                >Answer:</span
              >
              <span class="text-foreground"
                >{answers[q.header] || answers[i]}</span
              >
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else if Object.keys(answers).length > 0}
    <div class="flex flex-col gap-2">
      {#each Object.entries(answers) as [key, value]}
        <div class="px-2 py-2 rounded" style="background: var(--panel-hover)">
          <span class="font-semibold text-accent-foreground mr-1">{key}:</span>
          <span class="text-foreground">{value}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>
