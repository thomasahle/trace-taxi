
<script lang="ts">
  import UploadPanel from './components/UploadPanel.svelte';
  import TraceView from './components/TraceView.svelte';
  import ThreadsList from './components/ThreadsList.svelte';
  import TableOfContents from './components/TableOfContents.svelte';
  import { trace, loadTraceFromUrl, loadTraceFromFile } from './lib/store';
  import { threads, activeThreadId, type Thread } from './lib/threads';

  import { onMount } from 'svelte';
  let dragging = false;
  let dragCounter = 0;
  let showThreadsList = true;
  let showTOC = true;

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('file');
    if (urlParam) {
      loadTraceFromUrl(urlParam);
    }
  });

  $: hasData = $trace?.events?.length > 0;

  // Watch for trace changes and save to threads
  $: if (hasData && $trace) {
    // Check if this is a new trace (not already in threads with the same title)
    const existingThread = $threads.find(t => t.title === $trace.title);
    if (!existingThread) {
      threads.add($trace);
    }
  }

  function handleSelectThread(thread: Thread) {
    trace.set(thread.data);
  }

  function handleNewThread() {
    activeThreadId.set(null);
    clearTrace();
  }

  function toggleThreadsList() {
    showThreadsList = !showThreadsList;
  }

  // Global drag and drop handlers
  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    dragCounter++;
    if (e.dataTransfer?.items?.[0]?.kind === 'file') {
      dragging = true;
    }
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
      dragging = false;
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'copy';
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragging = false;
    dragCounter = 0;

    const file = e.dataTransfer?.files?.[0];
    if (file && (file.name.endsWith('.jsonl') || file.name.endsWith('.json'))) {
      loadTraceFromFile(file);
    }
  }

  function clearTrace() {
    trace.set({ title: '', events: [] });
  }
</script>

<div class="app-container">
  {#if showThreadsList}
    <ThreadsList
      onSelectThread={handleSelectThread}
      onNewThread={handleNewThread}
    />
  {/if}

  <div class="main-content"
       on:dragenter={handleDragEnter}
       on:dragleave={handleDragLeave}
       on:dragover={handleDragOver}
       on:drop={handleDrop}>

    <div class="header">
      <div class="header-left">
        <button class="sidebar-toggle" on:click={toggleThreadsList} title="Toggle sidebar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 2.75A.75.75 0 011.75 2h12.5a.75.75 0 010 1.5H1.75A.75.75 0 011 2.75zm0 5A.75.75 0 011.75 7h12.5a.75.75 0 010 1.5H1.75A.75.75 0 011 7.75zM1.75 12a.75.75 0 000 1.5h12.5a.75.75 0 000-1.5H1.75z"/>
          </svg>
        </button>
        <div>
          <div class="title">Agent Trace Viewer</div>
          <div class="subtitle">Load a JSONL trace (OpenAI messages) and inspect tools, diffs, and terminal output.</div>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      {#if hasData}
        <TraceView />
      {:else}
        <UploadPanel />
      {/if}
    </div>

    {#if dragging}
      <div class="drag-overlay">
        <div class="drag-message">
          <h2>Drop your trace file here</h2>
          <p>Release to load the .jsonl or .json file</p>
        </div>
      </div>
    {/if}
  </div>

  {#if hasData && showTOC}
    <TableOfContents />
  {/if}
</div>

<style>
  .app-container {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .content-wrapper {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .sidebar-toggle {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    border: 1px solid var(--border-light);
    background: var(--bg);
    color: var(--text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .sidebar-toggle:hover {
    background: var(--panel-hover);
  }

  .drag-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(11, 13, 16, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    pointer-events: none;
  }

  .drag-message {
    text-align: center;
    padding: 2rem;
    border: 3px dashed var(--accent);
    border-radius: 12px;
    background: var(--panel);
  }

  .drag-message h2 {
    color: var(--accent);
    margin: 0 0 0.5rem 0;
  }

  .drag-message p {
    color: var(--muted);
    margin: 0;
  }
</style>
