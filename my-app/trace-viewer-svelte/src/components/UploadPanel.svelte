
<script lang="ts">
  import { loadTraceFromFile } from '../lib/store';

  let dragging = false;
  let fileInput: HTMLInputElement;

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) {
      loadTraceFromFile(f);
    }
  }
  function onDragOver(e: DragEvent) { e.preventDefault(); dragging = true; }
  function onDragLeave() { dragging = false; }
  function pick() { fileInput.click(); }
  async function onPick() {
    const f = fileInput.files?.[0];
    if (f) await loadTraceFromFile(f);
  }
</script>

<div class="upload panel" on:dragover={onDragOver} on:dragleave={onDragLeave} on:drop={onDrop} style="border-color:{dragging ? '#6ea8fe' : 'var(--border)'}">
  <input bind:this={fileInput} type="file" accept=".jsonl,.json" on:change={onPick} />
  <h2>Drop your <code>.jsonl</code> trace here</h2>
  <p class="small">Each line should be a JSON message in the OpenAI format. You can also pass <code>?file=URL</code> to load by URL.</p>
  <button class="btn" on:click={pick}>Select file…</button>
</div>
