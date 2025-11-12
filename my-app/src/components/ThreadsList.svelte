<script lang="ts">
  import { threads, activeThreadId, type Thread } from '../lib/threads';
  import { trace } from '../lib/store';

  export let onSelectThread: (thread: Thread) => void;
  export let onNewThread: () => void;

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

<div class="threads-container">
  <div class="threads-header">
    <h3>Traces</h3>
    <button class="new-thread-btn" on:click={onNewThread} title="Load new trace">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M7.75 2a.75.75 0 01.75.75V7h4.25a.75.75 0 010 1.5H8.5v4.25a.75.75 0 01-1.5 0V8.5H2.75a.75.75 0 010-1.5H7V2.75A.75.75 0 017.75 2z"/>
      </svg>
    </button>
  </div>

  <div class="threads-list">
    {#if $threads.length === 0}
      <div class="empty-state">
        <p>No saved traces</p>
        <p class="small">Load a trace file to get started</p>
      </div>
    {:else}
      {#each $threads as thread (thread.id)}
        <div
          class="thread-item"
          class:active={$activeThreadId === thread.id}
          on:click={() => selectThread(thread)}
        >
          <div class="thread-content">
            {#if editingId === thread.id}
              <input
                type="text"
                class="thread-title-input"
                bind:value={editingTitle}
                on:blur={() => saveEdit(thread)}
                on:keydown={(e) => handleKeydown(e, thread)}
                autofocus
              />
            {:else}
              <div class="thread-title">{thread.title}</div>
              <div class="thread-meta">
                <span class="thread-events">{thread.eventCount} events</span>
                <span class="thread-time">{formatTimestamp(thread.timestamp)}</span>
              </div>
            {/if}
          </div>

          {#if editingId !== thread.id}
            <div class="thread-actions">
              <button
                class="thread-action-btn"
                on:click={(e) => startEdit(thread, e)}
                title="Rename"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z"/>
                </svg>
              </button>
              <button
                class="thread-action-btn delete"
                on:click={(e) => deleteThread(thread, e)}
                title="Delete"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11 1.75V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.405 15h5.19c.9 0 1.652-.681 1.741-1.576l.66-6.6a.75.75 0 00-1.492-.149l-.66 6.6a.25.25 0 01-.249.225h-5.19a.25.25 0 01-.249-.225l-.66-6.6z"/>
                </svg>
              </button>
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .threads-container {
    width: 280px;
    height: 100vh;
    border-right: 1px solid var(--border-light);
    background: var(--bg);
    display: flex;
    flex-direction: column;
  }

  .threads-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid var(--border-light);
  }

  .threads-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text);
  }

  .new-thread-btn {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: none;
    background: var(--accent);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.2s;
  }

  .new-thread-btn:hover {
    opacity: 0.9;
  }

  .threads-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--muted);
  }

  .empty-state p {
    margin: 0 0 8px 0;
  }

  .thread-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    margin-bottom: 4px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
    border: 1px solid transparent;
  }

  .thread-item:hover {
    background: var(--panel-hover);
  }

  .thread-item.active {
    background: var(--chip);
    border-color: var(--accent);
  }

  .thread-content {
    flex: 1;
    min-width: 0;
  }

  .thread-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
  }

  .thread-title-input {
    width: 100%;
    padding: 4px 6px;
    border: 1px solid var(--accent);
    border-radius: 4px;
    font-size: 14px;
    font-family: inherit;
    outline: none;
  }

  .thread-meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: var(--muted);
  }

  .thread-events, .thread-time {
    white-space: nowrap;
  }

  .thread-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .thread-item:hover .thread-actions {
    opacity: 1;
  }

  .thread-action-btn {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    border: none;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .thread-action-btn:hover {
    background: var(--border-light);
    color: var(--text);
  }

  .thread-action-btn.delete:hover {
    background: var(--danger);
    color: var(--red);
  }
</style>