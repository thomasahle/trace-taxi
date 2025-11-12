
<script lang="ts">
  import { trace } from '../lib/store';
  import MessageBubble from './MessageBubble.svelte';
  import ToolBlock from './ToolBlock.svelte';
  import type { TraceEvent } from '../lib/types';
  import { groupToolPairs } from '../lib/utils';

  // Use Svelte's store subscription pattern
  $: traceData = $trace;

  // Build the chronological list while pairing tool-use with tool-result.
  $: events = traceData?.events ?? [];
  $: pairs = groupToolPairs(events);

  // Track user message indices for TOC navigation
  let userMessageCounter = 0;
  $: {
    userMessageCounter = 0; // Reset counter when events change
  }

  function pairFor(useEvt: TraceEvent) {
    return pairs.find(p => p.use === useEvt)?.result ?? null;
  }

  function getUserMessageIndex(e: TraceEvent): number {
    if (e.kind === 'user') {
      return userMessageCounter++;
    }
    return -1;
  }
</script>

<div class="main-container">
  <div class="msg-list">
    {#each events as e, i}
      {#if e.kind === 'system'}
        <div data-event-index={i}>
          <MessageBubble role="System" text={e.text} />
        </div>
      {:else if e.kind === 'user'}
        <div data-event-index={i} data-message-index={events.filter((ev, idx) => idx <= i && ev.kind === 'user').length - 1}>
          <MessageBubble role="User" text={e.text} />
        </div>
      {:else if e.kind === 'assistant'}
        <div data-event-index={i}>
          <MessageBubble role="Assistant" text={e.text} />
        </div>
      {:else if e.kind === 'tool-use'}
        <div data-event-index={i}>
          <ToolBlock ctx={{ event: e, pair: pairFor(e) }} />
        </div>
      {:else if e.kind === 'tool-result'}
        <!-- Results are rendered alongside their tool-use; skip lone results -->
        {#if !pairs.find(p => p.result === e)}
          <div data-event-index={i}>
            <MessageBubble role={"Tool · " + e.name} text={typeof e.output === 'string' ? e.output : JSON.stringify(e.output, null, 2)} />
          </div>
        {/if}
      {/if}
    {/each}
  </div>
</div>

<style>
  .main-container {
    max-width: 800px;
    margin: 0;
    padding: 20px;
  }

  .msg-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
</style>
