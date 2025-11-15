<script lang="ts">
  import UploadPanel from "./components/UploadPanel.svelte";
  import TraceView from "./components/TraceView.svelte";
  import ThreadsList from "./components/ThreadsList.svelte";
  import TableOfContents from "./components/TableOfContents.svelte";
  import HeaderBar from "./components/HeaderBar.svelte";
  import { Toaster } from "$lib/components/ui/sonner";
  import { loadTraceFromUrl, loadTraceFromFile, theme } from "./lib/store";
  import { threads, activeThreadId, activeThread } from "./lib/threads";
  import { decompressFromHash } from "./lib/share";
  import { parseJsonl } from "./lib/parser";
  import * as Sidebar from "$lib/components/ui/sidebar";

  import { onMount } from "svelte";
  let dragging = false;
  let dragCounter = 0;
  import { showThreadsList } from "./lib/ui";

  let mainContent: HTMLElement | null = null;

  onMount(async () => {
    // First, check for hash-based compressed trace
    const hashText = decompressFromHash(window.location.hash);
    if (hashText) {
      try {
        const data = parseJsonl(hashText);
        // Add directly to threads and activate it
        const newThreadId = threads.add(data);
        activeThreadId.set(newThreadId);
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

    // If no threads exist, add the example trace to the threads list but don't activate it
    if ($threads.length === 0) {
      try {
        const response = await fetch("/example-love-story.jsonl");
        const text = await response.text();
        const data = parseJsonl(text);
        data.title = "Love Story - Airport to Midnight Bridge";
        threads.add(data);
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

  // Check if there's data from the active thread
  $: hasData = $activeThread?.data?.events?.length > 0;

  // Sidebar visibility handled via store in src/lib/ui.ts

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

    // Check if a child component already handled this drop
    if ((e as any).__uploadPanelHandled) {
      return; // Already processed by UploadPanel
    }

    const file = e.dataTransfer?.files?.[0];
    if (file && (file.name.endsWith(".jsonl") || file.name.endsWith(".json"))) {
      loadTraceFromFile(file);
    }
  }
</script>

<div
  class="bg-taxi"
  role="region"
  aria-label="File drop area"
  on:dragenter={handleDragEnter}
  on:dragleave={handleDragLeave}
  on:dragover={handleDragOver}
  on:drop={handleDrop}
>
  <Sidebar.Provider bind:open={$showThreadsList}>
    <Sidebar.Sidebar
      variant="inset"
      class="bg-glass box-border border-e border-border !m-0 !p-0"
    >
      <Sidebar.SidebarContent>
        <ThreadsList />
      </Sidebar.SidebarContent>
    </Sidebar.Sidebar>

    <Sidebar.SidebarInset
      class="!bg-transparent flex flex-col h-screen overflow-hidden !m-0 !p-0 !shadow-none"
    >
      <HeaderBar />

      <div
        bind:this={mainContent}
        class="main-content flex justify-center overflow-y-auto flex-1 p-0"
        class:main-backdrop={hasData}
      >
        {#if hasData}
          <div class="w-full xl:w-3xl flex-initial">
            <TraceView />
          </div>
          <aside
            class="w-xs hidden md:block flex-initial self-start sticky top-2 overflow-x-hidden"
          >
            <div class="max-h-[calc(100vh-3rem)] overflow-y-auto">
              <TableOfContents {mainContent} />
            </div>
          </aside>
        {:else}
          <UploadPanel />
        {/if}
      </div>

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
    </Sidebar.SidebarInset>
  </Sidebar.Provider>

  <Toaster />
</div>
