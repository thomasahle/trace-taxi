<script lang="ts">
  import { threads, activeThreadId, type Thread } from '../lib/threads';
  import { trace, theme } from '../lib/store';
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import ScrollArea from "$lib/components/ui/scroll-area.svelte";

  export let onSelectThread: (thread: Thread) => void;
  export let onNewThread: () => void;
  export let isMobile: boolean = false;

  let editingId: string | null = null;
  let editingTitle: string = '';

  function selectThread(thread: Thread) {
    activeThreadId.set(thread.id);
    onSelectThread(thread);
  }

  function startEdit(thread: Thread, event: MouseEvent) {
    event.stopPropagation();
    editingId = thread.id;
    editingTitle = thread.title;
  }

  function saveEdit(thread: Thread) {
    if (editingTitle.trim() && editingTitle !== thread.title) {
      threads.rename(thread.id, editingTitle.trim());
    }
    editingId = null;
    editingTitle = '';
  }

  function cancelEdit() {
    editingId = null;
    editingTitle = '';
  }

  function deleteThread(thread: Thread, event: MouseEvent) {
    event.stopPropagation();
    if (confirm(`Delete "${thread.title}"?`)) {
      threads.delete(thread.id);
      if ($activeThreadId === thread.id) {
        activeThreadId.set(null);
        trace.set({ title: '', events: [] });
      }
    }
  }

  function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // Less than 1 minute
    if (diff < 60000) return 'Just now';
    // Less than 1 hour
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    // Less than 24 hours
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    // Less than 7 days
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

    // Format as date
    return date.toLocaleDateString();
  }

  function handleKeydown(event: KeyboardEvent, thread: Thread) {
    if (event.key === 'Enter') {
      saveEdit(thread);
    } else if (event.key === 'Escape') {
      cancelEdit();
    }
  }
</script>

<div class="w-[280px] h-screen border-r border-border/30 flex flex-col {isMobile ? 'fixed top-0 left-0 z-50' : ''}" style="background-color: {$theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)'}; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
  <div class="flex items-center justify-between h-12 px-4 border-b border-border">
    <h3 class="m-0 text-sm font-semibold">Traces</h3>
    <Button
      size="icon"
      class="w-8 h-8"
      on:click={onNewThread}
      title="Load new trace"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M7.75 2a.75.75 0 01.75.75V7h4.25a.75.75 0 010 1.5H8.5v4.25a.75.75 0 01-1.5 0V8.5H2.75a.75.75 0 010-1.5H7V2.75A.75.75 0 017.75 2z"/>
      </svg>
    </Button>
  </div>

  <ScrollArea class="flex-1 p-2">
    {#if $threads.length === 0}
      <div class="text-center py-10 px-5 text-muted-foreground">
        <p class="mb-2">No saved traces</p>
        <p class="text-sm">Load a trace file to get started</p>
      </div>
    {:else}
      {#each $threads as thread (thread.id)}
        <div
          class="flex items-center gap-2 px-3 py-3 mb-1 rounded-md cursor-pointer transition-colors border border-transparent hover:bg-accent/50 {$activeThreadId === thread.id ? 'bg-muted border-primary' : ''}"
          on:click={() => selectThread(thread)}
        >
          <div class="flex-1 min-w-0">
            {#if editingId === thread.id}
              <Input
                bind:value={editingTitle}
                on:blur={() => saveEdit(thread)}
                on:keydown={(e) => handleKeydown(e, thread)}
                class="h-8 text-sm"
                autofocus
              />
            {:else}
              <div class="text-sm font-medium truncate mb-1">{thread.title}</div>
              <div class="flex gap-3 text-xs text-muted-foreground">
                <span class="whitespace-nowrap">{thread.eventCount} events</span>
                <span class="whitespace-nowrap">{formatTimestamp(thread.timestamp)}</span>
              </div>
            {/if}
          </div>

          {#if editingId !== thread.id}
            <div class="flex gap-1 opacity-0 hover:opacity-100 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                class="w-6 h-6 hover:bg-muted"
                on:click={(e) => startEdit(thread, e)}
                title="Rename"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z"/>
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="w-6 h-6 hover:bg-destructive/10 hover:text-destructive"
                on:click={(e) => deleteThread(thread, e)}
                title="Delete"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11 1.75V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.405 15h5.19c.9 0 1.652-.681 1.741-1.576l.66-6.6a.75.75 0 00-1.492-.149l-.66 6.6a.25.25 0 01-.249.225h-5.19a.25.25 0 01-.249-.225l-.66-6.6z"/>
                </svg>
              </Button>
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </ScrollArea>
</div>