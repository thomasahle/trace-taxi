<script lang="ts">
  import { trace, theme } from '../lib/store';
  import type { MessageEvent } from '../lib/types';
  import { onMount, onDestroy, afterUpdate } from 'svelte';
  import ScrollArea from "$lib/components/ui/scroll-area.svelte";

  export let isMobile: boolean = false;

  // Extract user and assistant messages for TOC with their original indices
  $: conversationMessages = $trace?.events?.map((event: MessageEvent, index: number) => ({
    event,
    globalIndex: index
  })).filter(item =>
    item.event.kind === 'user' || item.event.kind === 'assistant'
  ) || [];

  let activeIndex = -1;
  let observer: IntersectionObserver | null = null;
  let mounted = false;

  function setupObserver() {
    if (!mounted) return;

    const mainContent = document.querySelector<HTMLElement>('.main-content');
    if (!mainContent) return;

    // Disconnect any existing observer
    if (observer) observer.disconnect();

    observer = new IntersectionObserver(
      (entries) => {
        // Find the intersecting entry with the biggest intersection ratio
        let best: IntersectionObserverEntry | null = null;

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (!best || entry.intersectionRatio > best.intersectionRatio) {
            best = entry;
          }
        }

        if (!best) return;

        const target = best.target as HTMLElement;
        const eventIndexStr = target.getAttribute('data-event-index');
        if (!eventIndexStr) return;

        const eventIndex = parseInt(eventIndexStr, 10);
        const convIndex = conversationMessages.findIndex(
          (item) => item.globalIndex === eventIndex
        );

        if (convIndex !== -1) {
          activeIndex = convIndex;
        }
      },
      {
        root: mainContent,
        threshold: [0.25, 0.5, 0.75]
      }
    );

    // Only observe elements that correspond to conversation messages
    const conversationIndices = new Set(conversationMessages.map(item => item.globalIndex));
    const nodes = document.querySelectorAll<HTMLElement>('.msg-list > *[data-event-index]');

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

    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function truncateText(text: string, maxLength: number = 40): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  onMount(() => {
    mounted = true;
    setupObserver();
  });

  // Re-wire the observer when the DOM for messages changes
  afterUpdate(() => {
    setupObserver();
  });

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
