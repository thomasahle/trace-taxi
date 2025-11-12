<script lang="ts">
  import { trace } from '../lib/store';
  import type { MessageEvent } from '../lib/types';
  import { onMount, onDestroy } from 'svelte';

  // Extract user and assistant messages for TOC
  $: conversationMessages = $trace?.events?.filter((event: MessageEvent) =>
    event.kind === 'user' || event.kind === 'assistant'
  ) || [];

  let activeIndex = -1;

  function scrollToMessage(message: MessageEvent, globalIndex: number) {
    // For user messages, use the data-message-index attribute
    if (message.kind === 'user') {
      const userIndex = $trace?.events.filter((e, i) => i <= globalIndex && e.kind === 'user').length - 1;
      const messageElement = document.querySelector(`[data-message-index="${userIndex}"]`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    // For assistant messages, find the element by matching content
    const allMessages = Array.from(document.querySelectorAll('.msg-list > *'));
    let currentIndex = 0;
    for (const element of allMessages) {
      const event = $trace?.events[currentIndex];
      if (event && currentIndex === globalIndex) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      currentIndex++;
    }
  }

  function truncateText(text: string, maxLength: number = 40): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  function updateActiveMessage() {
    const contentWrapper = document.querySelector('.content-wrapper');
    if (!contentWrapper) return;

    const scrollTop = contentWrapper.scrollTop;
    const messages = Array.from(document.querySelectorAll('.msg-list > *'));

    // Find the first visible message
    for (let i = 0; i < messages.length; i++) {
      const element = messages[i] as HTMLElement;
      const rect = element.getBoundingClientRect();
      const containerRect = contentWrapper.getBoundingClientRect();

      // Check if message is in viewport
      if (rect.top >= containerRect.top && rect.top <= containerRect.bottom) {
        // Find which conversation message index this corresponds to
        const eventIndex = Array.from(element.parentElement?.children || []).indexOf(element);
        const event = $trace?.events?.[eventIndex];

        if (event && (event.kind === 'user' || event.kind === 'assistant')) {
          const convIndex = conversationMessages.findIndex(m => m === event);
          if (convIndex !== -1) {
            activeIndex = convIndex;
            return;
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
    {#each conversationMessages as message, index}
      {@const globalIndex = $trace?.events.findIndex(e => e === message) ?? index}
      {@const isUser = message.kind === 'user'}
      {@const isActive = index === activeIndex}
      <button
        class="toc-item"
        class:user={isUser}
        class:assistant={!isUser}
        class:active={isActive}
        on:click={() => scrollToMessage(message, globalIndex)}
        title={message.text}
      >
        <span class="toc-number" class:user={isUser}>{isUser ? 'U' : 'A'}</span>
        <span class="toc-text">{truncateText(message.text)}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .toc-container {
    width: 280px;
    height: 100vh;
    border-left: 1px solid var(--border-light);
    background: var(--bg);
    display: flex;
    flex-direction: column;
    overflow: hidden;
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
    padding: 4px;
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
    background: #e8f4f8;
    border-left: 3px solid #0969da;
    padding-left: 5px;
  }

  .toc-item.active .toc-text {
    color: #0969da;
    font-weight: 500;
  }

  .toc-number {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--chip);
    color: var(--muted);
    font-size: 11px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toc-number.user {
    background: #ddf4ff;
    color: #0969da;
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
