<script lang="ts">
  import { trace, theme } from '../lib/store';
  import type { MessageEvent } from '../lib/types';
  import { onMount, onDestroy } from 'svelte';
  import ScrollArea from "$lib/components/ui/scroll-area.svelte";

  export let isMobile: boolean = false;
  export let mainContent: HTMLElement | null = null;

  // Extract user and assistant messages for TOC with their original indices
  $: conversationMessages = $trace?.events?.map((event: MessageEvent, index: number) => ({
    event,
    globalIndex: index
  })).filter(item =>
    item.event.kind === 'user' || item.event.kind === 'assistant'
  ) || [];

  // Precompute a map from globalIndex -> conversation index for O(1) lookups
  $: indexByGlobalIndex = new Map(
    conversationMessages.map((item, i) => [item.globalIndex, i] as const)
  );

  let activeIndex = -1;
  let observer: IntersectionObserver | null = null;
  let mounted = false;

  // Tracks which message indices are currently visible
  const visibleGlobalIndices = new Set<number>();

  function setupObserver() {
    if (!mounted || !mainContent) return;
    if (typeof IntersectionObserver === 'undefined') return;

    // Reset current visibility state
    visibleGlobalIndices.clear();

    // Disconnect any existing observer
    if (observer) observer.disconnect();

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const target = entry.target as HTMLElement;
          const eventIndexStr = target.getAttribute('data-event-index');
          if (!eventIndexStr) continue;

          const eventIndex = parseInt(eventIndexStr, 10);
          if (Number.isNaN(eventIndex)) continue;

          if (entry.isIntersecting) {
            visibleGlobalIndices.add(eventIndex);
          } else {
            visibleGlobalIndices.delete(eventIndex);
          }
        }

        // Now pick the *last* visible conversation message
        let newActive = -1;
        for (let i = 0; i < conversationMessages.length; i++) {
          const globalIndex = conversationMessages[i].globalIndex;
          if (visibleGlobalIndices.has(globalIndex)) {
            newActive = i; // keep updating so we end up with the last visible
          }
        }

        if (newActive !== -1 && newActive !== activeIndex) {
          activeIndex = newActive;
        }
      },
      {
        root: mainContent,
        threshold: 0.1
      }
    );

    // Only observe elements that correspond to conversation messages (scoped to mainContent)
    const conversationIndices = new Set(conversationMessages.map(item => item.globalIndex));
    const nodes = mainContent.querySelectorAll<HTMLElement>('.msg-list > *[data-event-index]');

    nodes.forEach((node) => {
      const indexStr = node.getAttribute('data-event-index');
      if (indexStr && conversationIndices.has(parseInt(indexStr, 10))) {
        observer!.observe(node);
      }
    });
  }

  function scrollToMessage(globalIndex: number) {
    const el = document.querySelector<HTMLElement>(`[data-event-index="${globalIndex}"]`);
    if (!el) return;

    el.scrollIntoView({ behavior: 'auto', block: 'start' });
  }

  function truncateText(text: string, maxLength: number = 40): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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

<div class="fixed top-12 right-0 w-[280px] h-[calc(100vh-3rem)] flex flex-col overflow-hidden {isMobile ? 'z-50' : 'z-10'}" style="background-color: {$theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)'}; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
  <ScrollArea class="flex-1 p-1 pb-24 pt-3">
    {#each conversationMessages as item, index}
      {@const isUser = item.event.kind === 'user'}
      {@const isActive = index === activeIndex}
      <button
        class="flex items-center gap-2 w-full px-2 py-1.5 mb-px rounded border-0 bg-background cursor-pointer text-left transition-colors {isActive ? 'bg-active' : 'hover:bg-accent/50'}"
        on:click={() => {
          activeIndex = index;
          scrollToMessage(item.globalIndex);
        }}
        title={item.event.text}
      >
        <span class="shrink-0 min-w-[20px] text-muted-foreground text-xs {isActive ? 'text-primary font-semibold' : ''}">{index + 1}</span>
        <span class="flex-1 text-xs leading-tight overflow-hidden text-ellipsis whitespace-nowrap {isActive ? 'font-medium' : ''}">{truncateText(item.event.text)}</span>
      </button>
    {/each}
  </ScrollArea>
</div>
