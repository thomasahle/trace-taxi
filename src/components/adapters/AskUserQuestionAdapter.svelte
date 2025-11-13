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

<div class="ask-question-container">
  <div class="question-header">
    <span class="icon">❓</span>
    <span class="title">User Questions</span>
  </div>

  {#if questions.length > 0}
    <div class="questions-list">
      {#each questions as q, i}
        <div class="question-item">
          <div class="question-text">
            {#if q.header}
              <span class="question-label">{q.header}:</span>
            {/if}
            {q.question}
          </div>

          {#if q.options && q.options.length > 0}
            <div class="options-list">
              {#each q.options as option}
                <div
                  class="option-item {answers[q.header] === option.label
                    ? 'selected'
                    : ''}"
                >
                  <span class="option-label">{option.label}</span>
                  {#if option.description}
                    <span class="option-desc">{option.description}</span>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}

          {#if answers[q.header] || answers[i]}
            <div class="answer">
              <span class="answer-label">Answer:</span>
              <span class="answer-value">{answers[q.header] || answers[i]}</span
              >
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else if Object.keys(answers).length > 0}
    <div class="answers-only">
      {#each Object.entries(answers) as [key, value]}
        <div class="answer-item">
          <span class="answer-key">{key}:</span>
          <span class="answer-value">{value}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .ask-question-container {
    font-family:
      -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial,
      sans-serif;
    font-size: 13px;
  }

  .question-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-weight: 600;
  }

  .icon {
    font-size: 16px;
  }

  .questions-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .question-item {
    padding: 12px;
    background: var(--panel-hover);
    border-radius: 6px;
    border: 1px solid var(--border-light);
  }

  .question-text {
    margin-bottom: 8px;
    color: var(--text);
  }

  .question-label {
    font-weight: 600;
    color: var(--accent);
    margin-right: 4px;
  }

  .options-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 8px 0;
  }

  .option-item {
    padding: 8px;
    background: var(--background);
    border-radius: 4px;
    border: 1px solid var(--border-light);
  }

  .option-item.selected {
    background: var(--accent-bg);
    border-color: var(--accent);
  }

  .option-label {
    font-weight: 500;
    display: block;
    margin-bottom: 2px;
  }

  .option-desc {
    font-size: 11px;
    color: var(--muted);
    display: block;
  }

  .answer {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--border-light);
  }

  .answer-label,
  .answer-key {
    font-weight: 600;
    color: var(--accent);
    margin-right: 4px;
  }

  .answer-value {
    color: var(--text);
  }

  .answers-only {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .answer-item {
    padding: 8px;
    background: var(--panel-hover);
    border-radius: 4px;
  }
</style>
