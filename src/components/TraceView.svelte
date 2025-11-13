<script lang="ts">
  import { activeThread } from "../lib/threads";
  import MessageBubble from "./MessageBubble.svelte";
  import ToolBlock from "./adapters/ToolBlock.svelte";
  import ThinkingBlock from "./ThinkingBlock.svelte";
  import CopyRawButton from "./CopyRawButton.svelte";
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

<div class="max-w-[800px] m-0 p-5">
  <div class="msg-list flex flex-col gap-4">
    {#each events as e, i}
      {#if e.kind === "system"}
        <div data-event-index={i} class="hoverable-block group relative">
          <MessageBubble role="System" text={e.text} />
          <CopyRawButton rawData={e.raw} />
        </div>
      {:else if e.kind === "user"}
        <div
          data-event-index={i}
          data-message-index={userMessageIndices.get(i)}
          class="hoverable-block group relative"
        >
          <MessageBubble role="User" text={e.text} content={e.content} />
          <CopyRawButton rawData={e.raw} />
        </div>
      {:else if e.kind === "assistant"}
        <div data-event-index={i} class="hoverable-block group relative">
          <MessageBubble role="Assistant" text={e.text} />
          <CopyRawButton rawData={e.raw} />
        </div>
      {:else if e.kind === "thinking"}
        <div data-event-index={i} class="hoverable-block group relative">
          <ThinkingBlock text={e.text} />
          <CopyRawButton rawData={e.raw} />
        </div>
      {:else if e.kind === "tool-use"}
        <div data-event-index={i} class="hoverable-block group relative">
          <ToolBlock ctx={{ event: e, pair: pairFor(e) }} />
          <CopyRawButton rawData={e.raw} />
        </div>
      {:else if e.kind === "tool-result"}
        <!-- Results are rendered alongside their tool-use; skip paired results -->
        {#if !pairs.find((p) => p.result === e)}
          <div data-event-index={i} class="hoverable-block group relative">
            <MessageBubble
              role={"Tool · " + e.name}
              text={typeof e.output === "string"
                ? e.output
                : JSON.stringify(e.output, null, 2)}
            />
            <CopyRawButton rawData={e.raw} />
          </div>
        {/if}
      {/if}
    {/each}
  </div>
</div>
