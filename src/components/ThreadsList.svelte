<script lang="ts">
  import { threads, activeThreadId, type Thread } from '../lib/threads';
  import { trace, theme } from '../lib/store';
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import ScrollArea from "$lib/components/ui/scroll-area.svelte";
  import { Plus, Pencil, Trash2 } from 'lucide-svelte';

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
        // No need to manually clear trace - TraceView reads from activeThread
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
    <h1 class="m-0 text-2xl font-semibold tracking-tight uppercase leading-none pt-1">Traces</h1>
    <Button
      size="icon"
      class="w-8 h-8"
      on:click={onNewThread}
      title="Load new trace"
    >
      <Plus size={16} />
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
          class="flex items-center gap-2 px-3 py-3 mb-1 rounded-md cursor-pointer transition-colors border border-transparent {$activeThreadId === thread.id ? 'bg-active border-primary' : 'hover:bg-accent/50'}"
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

          {#if editingId !== thread.id && $activeThreadId === thread.id}
            <div class="flex gap-1 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                class="w-6 h-6 hover:bg-accent"
                on:click={(e) => startEdit(thread, e)}
                title="Rename"
              >
                <Pencil size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="w-6 h-6 hover:bg-destructive/10 hover:text-destructive"
                on:click={(e) => deleteThread(thread, e)}
                title="Delete"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </ScrollArea>
</div>