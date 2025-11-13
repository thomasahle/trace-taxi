<script lang="ts">
  import { loadTraceFromFile, errorMessage } from "../lib/store";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import { Github } from "lucide-svelte";

  let dragging = false;
  let fileInput: HTMLInputElement;

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) {
      loadTraceFromFile(f);
      // Mark that we handled this drop so parent doesn't process it again
      (e as any).__uploadPanelHandled = true;
    }
  }
  function onDragOver(e: DragEvent) {
    e.preventDefault();
    dragging = true;
  }
  function onDragLeave() {
    dragging = false;
  }
  function pick() {
    fileInput.click();
  }
  async function onPick() {
    const f = fileInput.files?.[0];
    if (f) await loadTraceFromFile(f);
  }

  function dismissError() {
    errorMessage.set(null);
  }
</script>

<div
  role="button"
  tabindex="0"
  class="border-2 border-dashed rounded-xl p-12 text-center bg-glass transition-all bg-opacity-50 hover:opacity-100 {dragging
    ? 'border-primary bg-primary/10'
    : 'border-border'}"
  on:dragover={onDragOver}
  on:dragleave={onDragLeave}
  on:drop={onDrop}
  on:keydown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick();
    }
  }}
>
  <input
    bind:this={fileInput}
    type="file"
    accept=".jsonl,.json"
    on:change={onPick}
    class="hidden"
  />
  <h2 class="text-xl font-semibold mb-2">Drop your trace.jsonl here</h2>
  <p class="text-sm text-muted-foreground mb-7">
    Drop a trace file in OpenAI or Claude format.<br />
    See your <code>~/.claude/projects/*.jsonl</code> folder for examples.
  </p>

  <Button on:click={pick} class="m-10">
    <svg
      class="w-4 h-4 mr-2"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
    Select file…
  </Button>

  <p class="text-sm text-muted-foreground">
    Nothing leaves your computer! All processing is done locally in your
    browser.
  </p>

  {#if $errorMessage}
    <div
      class="flex items-center justify-between gap-3 mt-4 px-4 py-3 bg-destructive/10 border border-destructive rounded-md text-destructive text-sm"
    >
      <span>{$errorMessage}</span>
      <button
        class="bg-transparent border-0 text-destructive text-2xl leading-none cursor-pointer p-0 w-6 h-6 flex items-center justify-center shrink-0 hover:opacity-70"
        on:click={dismissError}
      >
        ×
      </button>
    </div>
    <div class="mt-4 text-sm text-muted-foreground">
      If this is a bug, please report it on
      <a
        href="https://github.com/thomasahle/trace-taxi/issues"
        class="inline-flex items-center gap-1 underline hover:opacity-80"
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub
      </a>.
    </div>
  {/if}
</div>
