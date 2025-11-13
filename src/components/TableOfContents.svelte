<script lang="ts">
  import { activeThread } from "../lib/threads";
  import { theme } from "../lib/store";
  import type { MessageEvent } from "../lib/types";
  import { onMount, onDestroy } from "svelte";
  import ScrollArea from "$lib/components/ui/scroll-area.svelte";

  export let isMobile: boolean = false;
  export let mainContent: HTMLElement | null = null;

  // Extract user and assistant messages for TOC with their original indices
  $: conversationMessages =
    $activeThread?.data?.events
      ?.map((event: MessageEvent, index: number) => ({
        event,
        globalIndex: index,
      }))
      .filter(
        (item) => item.event.kind === "user" || item.event.kind === "assistant",
      ) || [];

  let selectedIndex = -1; // User's clicked selection (persistent)
  let scrollspyIndex = -1; // Auto-detected visible item (dynamic)
  let observer: IntersectionObserver | null = null;
  let mounted = false;
  let isScrollingProgrammatically = false;

  // Tracks which message indices are currently visible
  const visibleGlobalIndices = new Set<number>();

  function setupObserver() {
    if (!mounted || !mainContent) return;
    if (typeof IntersectionObserver === "undefined") return;

    // Reset current visibility state
    visibleGlobalIndices.clear();

    // Disconnect any existing observer
    if (observer) observer.disconnect();

    observer = new IntersectionObserver(
      (entries) => {
        // Allways update visibility set
        for (const entry of entries) {
          const target = entry.target as HTMLElement;
          const eventIndexStr = target.getAttribute("data-event-index");
          if (!eventIndexStr) continue;

          const eventIndex = parseInt(eventIndexStr, 10);
          if (Number.isNaN(eventIndex)) continue;

          if (entry.isIntersecting) {
            visibleGlobalIndices.add(eventIndex);
          } else {
            visibleGlobalIndices.delete(eventIndex);
          }
        }

        // Don't update scrollspy during programmatic scrolling
        if (isScrollingProgrammatically) return;

        // Pick the visible conversation message that's highest in the viewport
        for (let i = 0; i < conversationMessages.length; i++) {
          const globalIndex = conversationMessages[i].globalIndex;
          if (visibleGlobalIndices.has(globalIndex)) {
            scrollspyIndex = i;
            break;
          }
        }
      },
      {
        root: mainContent,
        threshold: 0.1,
      },
    );

    // Only observe elements that correspond to conversation messages (scoped to mainContent)
    const conversationIndices = new Set(
      conversationMessages.map((item) => item.globalIndex),
    );
    const nodes = mainContent.querySelectorAll<HTMLElement>(
      ".msg-list > *[data-event-index]",
    );

    nodes.forEach((node) => {
      const indexStr = node.getAttribute("data-event-index");
      if (indexStr && conversationIndices.has(parseInt(indexStr, 10))) {
        observer!.observe(node);
      }
    });
  }

  function scrollToMessage(globalIndex: number) {
    // Scope the query to mainContent to avoid unexpected behavior
    const el = mainContent?.querySelector<HTMLElement>(
      `[data-event-index="${globalIndex}"]`,
    );
    if (!el) return;

    el.scrollIntoView({ behavior: "auto", block: "start" });
  }

  function truncateText(text: string, maxLength: number = 40): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  onMount(() => {
    mounted = true;
  });

  // Rerun only when these dependencies change
  $: {
    if (mounted && mainContent && conversationMessages.length) {
      setupObserver();
    } else if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  onDestroy(() => {
    observer?.disconnect();
  });
</script>

<div
  class="fixed top-12 right-4 w-[260px] max-h-[calc(100vh-3rem)] flex flex-col overflow-hidden bg-glass pointer-events-none {isMobile
    ? 'z-50'
    : 'z-10'}"
>
  <ScrollArea class="flex-1 p-1 pb-24 pt-3 pointer-events-auto">
    {#each conversationMessages as item, index}
      {@const isUser = item.event.kind === "user"}
      {@const isSelected = index === selectedIndex}
      {@const isScrollspy = index === scrollspyIndex}
      <button
        class="flex items-center gap-2 w-full px-2 py-1.5 mb-px rounded border-0 bg-background cursor-pointer text-left transition-colors {isSelected
          ? 'bg-active'
          : 'hover:bg-accent/50'}"
        on:click={() => {
          selectedIndex = index;
          scrollspyIndex = index;
          isScrollingProgrammatically = true;
          scrollToMessage(item.globalIndex);

          // Re-enable scrollspy after a short delay
          setTimeout(() => {
            isScrollingProgrammatically = false;
          }, 100);
        }}
        title={item.event.text}
      >
        <div class="shrink-0 w-6 flex items-center justify-end">
          {#if isUser}
            <div
              class="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px] font-semibold"
            >
              {index + 1}
            </div>
          {:else}
            <span
              class="w-5 text-center text-xs text-muted-foreground {isScrollspy
                ? 'font-semibold'
                : ''}">{index + 1}</span
            >
          {/if}
        </div>
        <span
          class="flex-1 text-xs leading-tight overflow-hidden text-ellipsis whitespace-nowrap {isScrollspy
            ? 'font-semibold'
            : ''}">{truncateText(item.event.text)}</span
        >
      </button>
    {/each}
  </ScrollArea>
</div>
