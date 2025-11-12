<script lang="ts">
  export let ctx: any;

  interface Todo {
    content: string;
    status: 'pending' | 'in_progress' | 'completed';
    activeForm: string;
  }

  let todos: Todo[] = [];
  let output = '';
  let isSuccess = false;

  // Extract input todos
  if (ctx?.event?.input?.todos) {
    todos = ctx.event.input.todos;
  }

  // Extract output
  if (ctx?.pair?.output) {
    const out = ctx.pair.output;
    if (typeof out === 'string') {
      output = out;
      isSuccess = out.toLowerCase().includes('success');
    } else if (out && typeof out === 'object') {
      output = out.message || out.result || '';
      isSuccess = out.success || out.status === 'success' || false;
    }
  }

  // Count todos by status
  const statusCounts = {
    completed: todos.filter(t => t.status === 'completed').length,
    in_progress: todos.filter(t => t.status === 'in_progress').length,
    pending: todos.filter(t => t.status === 'pending').length,
    total: todos.length
  };

  // Calculate progress percentage
  const progressPercent = statusCounts.total > 0
    ? Math.round((statusCounts.completed / statusCounts.total) * 100)
    : 0;

  // Get status icon
  function getStatusIcon(status: string): string {
    switch(status) {
      case 'completed': return '✅';
      case 'in_progress': return '⏳';
      case 'pending': return '⭕';
      default: return '❓';
    }
  }

  // Get status color class
  function getStatusClass(status: string): string {
    switch(status) {
      case 'completed': return 'completed';
      case 'in_progress': return 'in-progress';
      case 'pending': return 'pending';
      default: return '';
    }
  }
</script>

<div class="todo-container">
  <div class="todo-header">
    <span class="todo-title">📋 Todo List</span>
    <span class="todo-stats">
      {statusCounts.completed}/{statusCounts.total} completed ({progressPercent}%)
    </span>
  </div>

  <div class="progress-bar">
    <div class="progress-fill" style="width: {progressPercent}%"></div>
  </div>

  <div class="status-summary">
    <span class="status-item completed">
      ✅ {statusCounts.completed} completed
    </span>
    <span class="status-item in-progress">
      ⏳ {statusCounts.in_progress} in progress
    </span>
    <span class="status-item pending">
      ⭕ {statusCounts.pending} pending
    </span>
  </div>

  <div class="todo-list">
    {#each todos as todo, index}
      <div class="todo-item {getStatusClass(todo.status)}">
        <span class="todo-number">{index + 1}</span>
        <span class="todo-icon">{getStatusIcon(todo.status)}</span>
        <div class="todo-content">
          <div class="todo-text">{todo.content}</div>
          {#if todo.status === 'in_progress' && todo.activeForm}
            <div class="active-form">🔄 {todo.activeForm}</div>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  {#if output}
    <div class="output-status" class:success={isSuccess}>
      {output}
    </div>
  {/if}
</div>

<style>
  .todo-container {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  }

  .todo-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .todo-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
  }

  .todo-stats {
    font-size: 13px;
    color: var(--muted);
  }

  .progress-bar {
    height: 6px;
    background: var(--border-light);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 12px;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #46c876 0%, #1a7f37 100%);
    transition: width 0.3s ease;
  }

  .status-summary {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    font-size: 12px;
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .status-item.completed {
    color: var(--green);
  }

  .status-item.in-progress {
    color: var(--yellow);
  }

  .status-item.pending {
    color: var(--muted);
  }

  .todo-list {
    background: var(--code-bg);
    border: 1px solid var(--border-light);
    border-radius: 6px;
    overflow: hidden;
  }

  .todo-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border-light);
    transition: background 0.2s ease;
  }

  .todo-item:last-child {
    border-bottom: none;
  }

  .todo-item:hover {
    background: var(--panel-hover);
  }

  .todo-item.completed {
    opacity: 0.7;
  }

  .todo-item.in-progress {
    background: #fff8c5;
  }

  .todo-number {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    min-width: 20px;
    text-align: center;
  }

  .todo-icon {
    font-size: 16px;
    line-height: 1;
  }

  .todo-content {
    flex: 1;
  }

  .todo-text {
    font-size: 13px;
    color: var(--text);
    line-height: 1.5;
  }

  .todo-item.completed .todo-text {
    text-decoration: line-through;
    color: var(--muted);
  }

  .active-form {
    font-size: 11px;
    color: var(--yellow);
    margin-top: 4px;
    font-style: italic;
  }

  .output-status {
    margin-top: 12px;
    font-size: 12px;
    padding: 6px 10px;
    background: var(--chip);
    border-radius: 4px;
    color: var(--muted);
  }

  .output-status.success {
    background: var(--success);
    color: var(--green);
  }
</style>