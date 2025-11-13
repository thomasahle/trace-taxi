<script lang="ts">
  import Progress from "$lib/components/ui/progress/progress.svelte";

  export let ctx: any;

  interface Todo {
    content: string;
    status: "pending" | "in_progress" | "completed";
    activeForm: string;
  }

  let todos: Todo[] = [];
  let output = "";
  let isSuccess = false;

  // Extract input todos
  if (ctx?.event?.input?.todos) {
    todos = ctx.event.input.todos;
  }

  // Extract output
  if (ctx?.pair?.output) {
    const out = ctx.pair.output;
    if (typeof out === "string") {
      output = out;
      isSuccess = out.toLowerCase().includes("success");
    } else if (out && typeof out === "object") {
      output = out.message || out.result || "";
      isSuccess = out.success || out.status === "success" || false;
    }
  }

  // Count todos by status
  const statusCounts = {
    completed: todos.filter((t) => t.status === "completed").length,
    in_progress: todos.filter((t) => t.status === "in_progress").length,
    pending: todos.filter((t) => t.status === "pending").length,
    total: todos.length,
  };

  // Calculate progress percentage
  const progressPercent =
    statusCounts.total > 0
      ? Math.round((statusCounts.completed / statusCounts.total) * 100)
      : 0;

  // Get status icon
  function getStatusIcon(status: string): string {
    switch (status) {
      case "completed":
        return "✅";
      case "in_progress":
        return "⏳";
      case "pending":
        return "⭕";
      default:
        return "❓";
    }
  }

  // Get status color class
  function getStatusClass(status: string): string {
    switch (status) {
      case "completed":
        return "completed";
      case "in_progress":
        return "in-progress";
      case "pending":
        return "pending";
      default:
        return "";
    }
  }
</script>

<div class="font-sans">
  <div class="flex justify-between items-center mb-3">
    <span class="text-sm font-semibold text-foreground">📋 Todo List</span>
    <span class="text-sm text-muted-foreground">
      {statusCounts.completed}/{statusCounts.total} completed ({progressPercent}%)
    </span>
  </div>

  <Progress value={progressPercent} max={100} class="h-1.5 mb-3" />

  <div class="flex gap-4 mb-4 text-xs">
    <span class="flex items-center gap-1" style="color: var(--green)">
      ✅ {statusCounts.completed} completed
    </span>
    <span class="flex items-center gap-1" style="color: var(--yellow)">
      ⏳ {statusCounts.in_progress} in progress
    </span>
    <span class="flex items-center gap-1 text-muted-foreground">
      ⭕ {statusCounts.pending} pending
    </span>
  </div>

  <div
    class="bg-[var(--code-bg)] border border-border rounded-md overflow-hidden"
  >
    {#each todos as todo, index}
      <div
        class="flex items-start gap-3 px-3 py-2.5 border-b border-border last:border-b-0 transition-colors hover:bg-[var(--panel-hover)] {todo.status ===
        'completed'
          ? 'opacity-70'
          : ''} {todo.status === 'in_progress'
          ? 'bg-[var(--todo-in-progress-bg)]'
          : ''}"
      >
        <span
          class="text-[11px] font-semibold text-muted-foreground min-w-[20px] text-center"
          >{index + 1}</span
        >
        <span class="text-base leading-none">{getStatusIcon(todo.status)}</span>
        <div class="flex-1">
          <div
            class="text-sm leading-relaxed {todo.status === 'completed'
              ? 'line-through text-muted-foreground'
              : 'text-foreground'}"
          >
            {todo.content}
          </div>
          {#if todo.status === "in_progress" && todo.activeForm}
            <div class="text-[11px] mt-1 italic" style="color: var(--yellow)">
              🔄 {todo.activeForm}
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  {#if output}
    <div
      class="mt-3 text-xs px-2.5 py-1.5 rounded {isSuccess
        ? 'bg-[var(--success)]'
        : 'bg-muted'}"
      style={isSuccess ? "color: var(--green)" : "color: var(--muted)"}
    >
      {output}
    </div>
  {/if}
</div>
