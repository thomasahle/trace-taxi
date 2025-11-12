<script lang="ts">
  import { trace, theme } from '../lib/store';
  import type { MessageEvent } from '../lib/types';
  import { onMount, onDestroy } from 'svelte';
  import ScrollArea from "$lib/components/ui/scroll-area.svelte";

  // Extract user and assistant messages for TOC with their original indices
  $: conversationMessages = $trace?.events?.map((event: MessageEvent, index: number) => ({
    event,
    globalIndex: index
  })).filter(item =>
    item.event.kind === 'user' || item.event.kind === 'assistant'
  ) || [];

  let activeIndex = -1;
  let isScrollingProgrammatically = false;
  let scrollTimeout: number | null = null;

  function scrollToMessage(message: MessageEvent, globalIndex: number) {
    // Use the data-event-index attribute to find the correct element
    const messageElement = document.querySelector(`[data-event-index="${globalIndex}"]`);
    if (messageElement) {
      isScrollingProgrammatically = true;

      // Clear any existing timeout
      if (scrollTimeout !== null) {
        clearTimeout(scrollTimeout);
      }

      messageElement.scrollIntoView({ behavior: 'instant', block: 'start' });

      // Reset flag after scroll completes (instant scroll completes immediately)
      scrollTimeout = setTimeout(() => {
        isScrollingProgrammatically = false;
        updateActiveMessage(); // Now update based on final position
      }, 50);
    }
  }

  function truncateText(text: string, maxLength: number = 40): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  function updateActiveMessage() {
    // Don't update if we're in the middle of a programmatic scroll
    if (isScrollingProgrammatically) return;

    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    const messages = Array.from(document.querySelectorAll('.msg-list > *'));
    const containerRect = mainContent.getBoundingClientRect();

    let mostVisibleIndex = -1;
    let maxVisibleArea = 0;

    // Find the message with the most visible area
    for (let i = 0; i < messages.length; i++) {
      const element = messages[i] as HTMLElement;
      const rect = element.getBoundingClientRect();

      // Calculate visible area of this message
      const visibleTop = Math.max(rect.top, containerRect.top);
      const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);

      if (visibleHeight > maxVisibleArea) {
        maxVisibleArea = visibleHeight;
        mostVisibleIndex = i;
      }
    }

    // Update active index based on most visible message
    if (mostVisibleIndex !== -1) {
      const element = messages[mostVisibleIndex];
      const eventIndexStr = element.getAttribute('data-event-index');

      if (eventIndexStr) {
        const eventIndex = parseInt(eventIndexStr, 10);
        const event = $trace?.events?.[eventIndex];

        if (event && (event.kind === 'user' || event.kind === 'assistant')) {
          const convIndex = conversationMessages.findIndex(item => item.globalIndex === eventIndex);
          if (convIndex !== -1) {
            activeIndex = convIndex;
          }
        }
      }
    }
  }

  onMount(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.addEventListener('scroll', updateActiveMessage);
      updateActiveMessage();
    }
  });

  onDestroy(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.removeEventListener('scroll', updateActiveMessage);
    }
  });
</script>

<div class="fixed top-12 right-0 w-[280px] h-[calc(100vh-3rem)] border-l border-border/30 flex flex-col overflow-hidden z-10" style="background-color: {$theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)'}; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
  <ScrollArea class="flex-1 p-1 pb-24 pt-3">
    {#each conversationMessages as item, index}
      {@const isUser = item.event.kind === 'user'}
      {@const isActive = index === activeIndex}
      <button
        class="flex items-center gap-2 w-full px-2 py-1.5 mb-px rounded border-0 bg-background cursor-pointer text-left transition-colors hover:bg-accent/50 {isActive ? 'bg-muted' : ''}"
        on:click={() => {
          activeIndex = index;
          scrollToMessage(item.event, item.globalIndex);
        }}
        title={item.event.text}
      >
        <span class="shrink-0 min-w-[20px] text-muted-foreground text-xs {isActive ? 'text-primary font-semibold' : ''}">{index + 1}</span>
        <span class="flex-1 text-xs leading-tight overflow-hidden text-ellipsis whitespace-nowrap {isActive ? 'font-medium' : ''}">{truncateText(item.event.text)}</span>
      </button>
    {/each}
  </ScrollArea>
</div>
