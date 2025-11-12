
<script lang="ts">
  import UploadPanel from './components/UploadPanel.svelte';
  import TraceView from './components/TraceView.svelte';
  import ThreadsList from './components/ThreadsList.svelte';
  import TableOfContents from './components/TableOfContents.svelte';
  import { trace, loadTraceFromUrl, loadTraceFromFile, theme } from './lib/store';
  import { threads, activeThreadId, type Thread } from './lib/threads';
  import { decompressFromHash, createShareLink, downloadTrace } from './lib/share';
  import { parseJsonl } from './lib/parser';

  import { onMount } from 'svelte';
  let dragging = false;
  let dragCounter = 0;
  let showThreadsList = true;
  let showTOC = true;
  let showConfigDropdown = false;
  let showShareNotification = false;
  let shareNotificationMessage = '';

  onMount(() => {
    // First, check for hash-based compressed trace
    const hashText = decompressFromHash(window.location.hash);
    if (hashText) {
      try {
        const data = parseJsonl(hashText);
        trace.set(data);
        return;
      } catch (error) {
        console.error('Failed to parse trace from hash:', error);
      }
    }

    // Fallback to URL parameter
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('file');
    if (urlParam) {
      loadTraceFromUrl(urlParam);
    }
  });

  // Apply theme to document root
  $: {
    if (typeof document !== 'undefined') {
      if ($theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

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

  function toggleConfigDropdown() {
    showConfigDropdown = !showConfigDropdown;
  }

  function setTheme(newTheme: 'light' | 'dark') {
    theme.set(newTheme);
    showConfigDropdown = false;
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (showConfigDropdown && !target.closest('.config-button') && !target.closest('.config-dropdown')) {
      showConfigDropdown = false;
    }
  }

  async function handleShare() {
    if (!hasData || !$trace.originalMessages) {
      return;
    }

    // Convert trace to JSONL format
    const jsonlText = $trace.originalMessages.map(msg => JSON.stringify(msg)).join('\n');

    // Try compressed URL first
    const shareResult = createShareLink(jsonlText);

    if (shareResult.compressed) {
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareResult.url);
        showNotification('Link copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        showNotification('Failed to copy link');
      }
    } else {
      // Fallback to download
      showNotification('Trace too large for URL, downloading file...');
      downloadTrace(jsonlText, `${$trace.title || 'trace'}.jsonl`);
    }
  }

  function showNotification(message: string) {
    shareNotificationMessage = message;
    showShareNotification = true;
    setTimeout(() => {
      showShareNotification = false;
    }, 3000);
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

<svelte:window on:click={handleClickOutside} />

<div class="app-container">
  {#if showThreadsList}
    <ThreadsList
      onSelectThread={handleSelectThread}
      onNewThread={handleNewThread}
    />
  {/if}

  <button class="sidebar-toggle" class:sidebar-open={showThreadsList} on:click={toggleThreadsList} title="Toggle sidebar">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1 2.75A.75.75 0 011.75 2h12.5a.75.75 0 010 1.5H1.75A.75.75 0 011 2.75zm0 5A.75.75 0 011.75 7h12.5a.75.75 0 010 1.5H1.75A.75.75 0 011 7.75zM1.75 12a.75.75 0 000 1.5h12.5a.75.75 0 000-1.5H1.75z"/>
    </svg>
  </button>

  {#if hasData}
    <button class="share-button" on:click={handleShare} title="Share trace">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M7.823 1.677 4.927 4.573A.25.25 0 0 0 5.104 5H7.25v3.236a.75.75 0 1 0 1.5 0V5h2.146a.25.25 0 0 0 .177-.427L8.177 1.677a.25.25 0 0 0-.354 0ZM3.75 6.5a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5h-.5ZM3 3.75a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 3.75ZM3.75 9a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5h-.5ZM10 3.75a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Zm.75 2.75a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5h-.5ZM10 9a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 10 9ZM3.75 12a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5Z"></path>
      </svg>
    </button>
  {/if}

  <button class="config-button" on:click={toggleConfigDropdown} title="Settings">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path>
    </svg>
  </button>

  {#if showConfigDropdown}
    <div class="config-dropdown">
      <div class="dropdown-header">Theme</div>
      <button
        class="dropdown-item"
        class:active={$theme === 'light'}
        on:click={() => setTheme('light')}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm5.657-8.157a.75.75 0 0 1 0 1.061l-.707.707a.75.75 0 1 1-1.061-1.061l.707-.707a.75.75 0 0 1 1.061 0Zm-9.193 9.193a.75.75 0 0 1 0 1.06l-.707.708a.75.75 0 0 1-1.061-1.06l.707-.708a.75.75 0 0 1 1.061 0ZM8 0a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1A.75.75 0 0 1 8 0ZM3 8a.75.75 0 0 1-.75.75h-1a.75.75 0 0 1 0-1.5h1A.75.75 0 0 1 3 8Zm13 0a.75.75 0 0 1-.75.75h-1a.75.75 0 0 1 0-1.5h1A.75.75 0 0 1 16 8Zm-8 5a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1A.75.75 0 0 1 8 13Zm3.536-1.464a.75.75 0 0 1 1.06 0l.708.707a.75.75 0 0 1-1.061 1.061l-.707-.708a.75.75 0 0 1 0-1.06ZM2.343 2.343a.75.75 0 0 1 1.061 0l.707.707A.75.75 0 1 1 3.05 4.111l-.707-.707a.75.75 0 0 1 0-1.06Z"></path>
        </svg>
        Light
        {#if $theme === 'light'}
          <svg class="checkmark" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
          </svg>
        {/if}
      </button>
      <button
        class="dropdown-item"
        class:active={$theme === 'dark'}
        on:click={() => setTheme('dark')}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M9.598 1.591a.749.749 0 0 1 .785-.175 7.001 7.001 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786Zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.499 5.499 0 1 0 7.678-7.678Z"></path>
        </svg>
        Dark
        {#if $theme === 'dark'}
          <svg class="checkmark" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
          </svg>
        {/if}
      </button>
    </div>
  {/if}

  <div class="content-wrapper"
       on:dragenter={handleDragEnter}
       on:dragleave={handleDragLeave}
       on:dragover={handleDragOver}
       on:drop={handleDrop}>
    <div class="main-content">
      {#if hasData}
        <TraceView />
      {:else}
        <UploadPanel />
      {/if}
    </div>

    {#if hasData && showTOC}
      <TableOfContents />
    {/if}

    {#if dragging}
      <div class="drag-overlay">
        <div class="drag-message">
          <h2>Drop your trace file here</h2>
          <p>Release to load the .jsonl or .json file</p>
        </div>
      </div>
    {/if}
  </div>

  {#if showShareNotification}
    <div class="share-notification">
      {shareNotificationMessage}
    </div>
  {/if}
</div>

<style>
  .app-container {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  .content-wrapper {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
  }

  .main-content {
    flex: 0 0 auto;
    width: calc(100% - 280px); /* Reserve space for fixed TOC */
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow-y: scroll; /* Force scrollbar to always be visible */
  }

  /* Style scrollbar for better visibility */
  .main-content::-webkit-scrollbar {
    width: 14px;
    background: var(--panel);
  }

  .main-content::-webkit-scrollbar-track {
    background: var(--panel);
    border-left: 1px solid var(--border-light);
  }

  .main-content::-webkit-scrollbar-thumb {
    background: #c0c0c0;
    border-radius: 7px;
    border: 2px solid var(--panel);
  }

  .main-content::-webkit-scrollbar-thumb:hover {
    background: #a0a0a0;
  }

  .sidebar-toggle {
    position: fixed;
    top: 16px;
    left: 16px;
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
    transition: left 0.3s ease, background 0.2s;
    z-index: 100;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .sidebar-toggle.sidebar-open {
    left: 296px; /* 280px sidebar + 16px margin */
  }

  .sidebar-toggle:hover {
    background: var(--panel-hover);
  }

  .config-button {
    position: fixed;
    top: 12px;
    right: 296px; /* 280px TOC width + 16px margin */
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    z-index: 100;
  }

  .config-button:hover {
    background: var(--panel-hover);
  }

  .share-button {
    position: fixed;
    top: 12px;
    right: 336px; /* 280px TOC width + 16px margin + 32px config button + 8px gap */
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    z-index: 100;
  }

  .share-button:hover {
    background: var(--panel-hover);
  }

  .config-dropdown {
    position: fixed;
    top: 50px;
    right: 296px; /* Align with config button */
    min-width: 200px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    z-index: 101;
  }

  .dropdown-header {
    padding: 8px 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--muted);
    background: var(--chip);
    border-bottom: 1px solid var(--border-light);
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    background: transparent;
    border: none;
    color: var(--text);
    font-size: 14px;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s;
  }

  .dropdown-item:hover {
    background: var(--panel-hover);
  }

  .dropdown-item.active {
    font-weight: 600;
  }

  .dropdown-item svg {
    flex-shrink: 0;
    opacity: 0.7;
  }

  .dropdown-item .checkmark {
    margin-left: auto;
    opacity: 1;
    color: var(--accent);
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

  .share-notification {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 24px;
    font-size: 14px;
    color: var(--text);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1001;
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
</style>
