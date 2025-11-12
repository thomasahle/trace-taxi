<script lang="ts">
  import { trace } from '../lib/store';
  import type { MessageEvent } from '../lib/types';
  import { onMount, onDestroy } from 'svelte';

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

    const contentWrapper = document.querySelector('.content-wrapper');
    if (!contentWrapper) return;

    const messages = Array.from(document.querySelectorAll('.msg-list > *'));
    const containerRect = contentWrapper.getBoundingClientRect();

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
    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper) {
      contentWrapper.addEventListener('scroll', updateActiveMessage);
      updateActiveMessage();
    }
  });

  onDestroy(() => {
    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper) {
      contentWrapper.removeEventListener('scroll', updateActiveMessage);
    }
  });
</script>

<div class="toc-container">
  <div class="toc-header">
    <h3>Conversation</h3>
  </div>

  <div class="toc-list">
    {#each conversationMessages as item, index}
      {@const isUser = item.event.kind === 'user'}
      {@const isActive = index === activeIndex}
      <button
        class="toc-item"
        class:user={isUser}
        class:assistant={!isUser}
        class:active={isActive}
        on:click={() => {
          activeIndex = index;
          scrollToMessage(item.event, item.globalIndex);
        }}
        title={item.event.text}
      >
        <span class="toc-number">{index + 1}</span>
        <span class="toc-text">{truncateText(item.event.text)}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .toc-container {
    position: fixed;
    top: 0;
    right: 0;
    width: 280px;
    height: 100vh;
    border-left: 1px solid var(--border-light);
    background: var(--bg);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 10;
  }

  .toc-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-light);
  }

  .toc-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
  }

  .toc-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px 4px 100px 4px;
  }

  .toc-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 8px;
    margin-bottom: 1px;
    border-radius: 4px;
    border: none;
    background: var(--bg);
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;
  }

  .toc-item:hover {
    background: var(--panel-hover);
  }

  .toc-item.active {
    background: var(--panel);
  }

  .toc-item.active .toc-text {
    color: var(--text);
    font-weight: 500;
  }

  .toc-item.active .toc-number {
    color: var(--accent);
    font-weight: 600;
  }

  .toc-number {
    flex-shrink: 0;
    min-width: 20px;
    color: var(--muted);
    font-size: 13px;
    font-weight: 400;
    text-align: left;
  }

  .toc-item.user {
    background: var(--bg);
  }

  .toc-item.assistant {
    background: var(--bg);
  }

  .toc-item.user:hover {
    background: #f0f6fc;
  }

  .toc-text {
    flex: 1;
    font-size: 12px;
    color: var(--text);
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
