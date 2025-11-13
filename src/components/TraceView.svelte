<script lang="ts">
  import { activeThread } from "../lib/threads";
  import MessageBubble from "./MessageBubble.svelte";
  import ToolBlock from "./adapters/ToolBlock.svelte";
  import ThinkingBlock from "./ThinkingBlock.svelte";
  import type { TraceEvent } from "../lib/types";
  import { groupToolPairs } from "../lib/utils";

  // Use Svelte's store subscription pattern
  $: traceData = $activeThread?.data;

  // Build the chronological list while pairing tool-use with tool-result.
  $: events = traceData?.events ?? [];
  $: pairs = groupToolPairs(events);

  // Precompute user message indices for efficient lookup
  $: userMessageIndices = events.reduce((acc, e, i) => {
    if (e.kind === "user") {
      acc.set(i, acc.size);
    }
    return acc;
  }, new Map<number, number>());

  function pairFor(useEvt: TraceEvent) {
    return pairs.find((p) => p.use === useEvt)?.result ?? null;
  }
</script>

<div class="main-container">
  <div class="msg-list">
    {#each events as e, i}
      {#if e.kind === "system"}
        <div data-event-index={i}>
          <MessageBubble role="System" text={e.text} />
        </div>
      {:else if e.kind === "user"}
        <div
          data-event-index={i}
          data-message-index={userMessageIndices.get(i)}
        >
          <MessageBubble role="User" text={e.text} content={e.content} />
        </div>
      {:else if e.kind === "assistant"}
        <div data-event-index={i}>
          <MessageBubble role="Assistant" text={e.text} />
        </div>
      {:else if e.kind === "thinking"}
        <div data-event-index={i}>
          <ThinkingBlock text={e.text} />
        </div>
      {:else if e.kind === "tool-use"}
        <div data-event-index={i}>
          <ToolBlock ctx={{ event: e, pair: pairFor(e) }} />
        </div>
      {:else if e.kind === "tool-result"}
        <!-- Results are rendered alongside their tool-use; skip paired results -->
        {#if !pairs.find(p => p.result === e)}
          <div data-event-index={i}>
            <MessageBubble
              role={"Tool · " + e.name}
              text={typeof e.output === "string"
                ? e.output
                : JSON.stringify(e.output, null, 2)}
            />
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
