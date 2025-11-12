<script lang="ts">
  import UploadPanel from "./components/UploadPanel.svelte";
  import TraceView from "./components/TraceView.svelte";
  import ThreadsList from "./components/ThreadsList.svelte";
  import TableOfContents from "./components/TableOfContents.svelte";
  import HeaderBar from "./components/HeaderBar.svelte";
  import {
    trace,
    loadTraceFromUrl,
    loadTraceFromFile,
    theme,
  } from "./lib/store";
  import { threads, activeThreadId, type Thread } from "./lib/threads";
  import {
    decompressFromHash,
    createShareLink,
    downloadTrace,
  } from "./lib/share";
  import { parseJsonl } from "./lib/parser";

  import { onMount } from "svelte";
  let dragging = false;
  let dragCounter = 0;
  let isMobile = false;
  let showThreadsList = true;
  let showTOC = true;
  let showShareNotification = false;
  let shareNotificationMessage = "";

  // Detect mobile viewport
  function checkMobile() {
    const wasMobile = isMobile;
    isMobile = window.innerWidth < 768;

    // When transitioning from desktop to mobile, hide sidebars
    if (!wasMobile && isMobile) {
      showThreadsList = false;
      showTOC = false;
    }
    // When transitioning from mobile to desktop, show sidebars
    else if (wasMobile && !isMobile) {
      showThreadsList = true;
      showTOC = true;
    }
  }

  onMount(async () => {
    // Check if mobile on mount
    checkMobile();

    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    // First, check for hash-based compressed trace
    const hashText = decompressFromHash(window.location.hash);
    if (hashText) {
      try {
        const data = parseJsonl(hashText);
        trace.set(data);
        return;
      } catch (error) {
        console.error("Failed to parse trace from hash:", error);
      }
    }

    // Fallback to URL parameter
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("file");
    if (urlParam) {
      loadTraceFromUrl(urlParam);
      return;
    }

    // If no threads exist, load the example love story trace
    if ($threads.length === 0) {
      try {
        const response = await fetch('/example-love-story.jsonl');
        const text = await response.text();
        const data = parseJsonl(text);
        data.title = "Love Story: Airport to Midnight Bridge";
        trace.set(data);
      } catch (error) {
        console.error("Failed to load example trace:", error);
      }
    }
  });

  // Apply theme to document root
  $: {
    if (typeof document !== "undefined") {
      if ($theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }

  $: hasData = $trace?.events?.length > 0;

  // Watch for trace changes and save to threads
  $: if (hasData && $trace) {
    // If there's an active thread, check by ID; otherwise check by title
    const existingThread = $activeThreadId
      ? $threads.find((t) => t.id === $activeThreadId)
      : $threads.find((t) => t.title === $trace.title);

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

  async function handleShare() {
    if (!hasData || !$trace.originalMessages) {
      return;
    }

    // Convert trace to JSONL format
    const jsonlText = $trace.originalMessages
      .map((msg) => JSON.stringify(msg))
      .join("\n");

    // Try compressed URL first
    const shareResult = createShareLink(jsonlText);

    if (shareResult.compressed) {
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareResult.url);
        showNotification("Link copied to clipboard!");
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
        showNotification("Failed to copy link");
      }
    } else {
      // Fallback to download
      showNotification("Trace too large for URL, downloading file...");
      downloadTrace(jsonlText, `${$trace.title || "trace"}.jsonl`);
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
    if (e.dataTransfer?.items?.[0]?.kind === "file") {
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
    e.dataTransfer!.dropEffect = "copy";
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragging = false;
    dragCounter = 0;

    const file = e.dataTransfer?.files?.[0];
    if (file && (file.name.endsWith(".jsonl") || file.name.endsWith(".json"))) {
      loadTraceFromFile(file);
    }
  }

  function clearTrace() {
    trace.set({ title: "", events: [], originalMessages: [] });
  }
</script>

<div
  class="flex h-screen overflow-hidden"
  style="background-image: url('/{$theme === 'dark'
    ? 'black-taxi.png'
    : 'white-taxi.png'}'); background-size: cover; background-position: center; background-repeat: no-repeat; background-attachment: fixed;"
>
  <!-- Backdrop for mobile overlays -->
  {#if isMobile && (showThreadsList || showTOC)}
    <div
      class="fixed inset-0 bg-black/50 z-40"
      on:click={() => {
        showThreadsList = false;
        showTOC = false;
      }}
    ></div>
  {/if}

  {#if showThreadsList}
    <ThreadsList
      {isMobile}
      onSelectThread={handleSelectThread}
      onNewThread={handleNewThread}
    />
  {/if}

  <div
    class="flex-1 flex flex-col overflow-hidden min-h-0 relative"
    on:dragenter={handleDragEnter}
    on:dragleave={handleDragLeave}
    on:dragover={handleDragOver}
    on:drop={handleDrop}
  >
    <HeaderBar
      {hasData}
      onToggleSidebar={toggleThreadsList}
      onShare={handleShare}
    />

    <div
      class="flex-1 flex flex-col min-w-0 overflow-y-scroll main-content {hasData &&
      showTOC && !isMobile
        ? 'pr-[280px]'
        : ''}"
      style="background-color: {$theme === 'dark'
        ? 'transparent'
        : hasData
          ? 'rgba(255, 255, 255, 0.1)'
          : 'transparent'}; backdrop-filter: {$theme === 'dark' || !hasData
        ? 'none'
        : 'blur(4px)'}; -webkit-backdrop-filter: {$theme === 'dark' || !hasData
        ? 'none'
        : 'blur(4px)'};"
    >
      {#if hasData}
        <TraceView />
      {:else}
        <div class="flex justify-center p-8 pt-16">
          <div class="w-full max-w-[800px]">
            <UploadPanel />
          </div>
        </div>
      {/if}
    </div>

    {#if hasData && showTOC}
      <TableOfContents {isMobile} />
    {/if}

    {#if dragging}
      <div
        class="fixed inset-0 bg-black/95 flex items-center justify-center z-[1000] pointer-events-none"
      >
        <div
          class="text-center p-8 border-[3px] border-dashed border-primary rounded-xl bg-card"
        >
          <h2 class="text-primary m-0 mb-2">Drop your trace file here</h2>
          <p class="text-muted-foreground m-0">
            Release to load the .jsonl or .json file
          </p>
        </div>
      </div>
    {/if}
  </div>

  {#if showShareNotification}
    <div
      class="fixed bottom-6 left-1/2 -translate-x-1/2 border border-border/30 rounded-lg px-6 py-3 text-sm shadow-lg z-[1001] animate-slide-up"
      style="background-color: {$theme === 'dark'
        ? 'rgba(0, 0, 0, 0.9)'
        : 'rgba(255, 255, 255, 0.9)'}; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);"
    >
      {shareNotificationMessage}
    </div>
  {/if}
</div>
