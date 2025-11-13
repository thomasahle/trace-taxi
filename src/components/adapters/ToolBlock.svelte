<script lang="ts">
  import { getTool } from "../../lib/tool-registry";
  import type { ToolRenderContext } from "../../lib/types";
  import { ChevronDown, ChevronRight } from "lucide-svelte";

  export let ctx: ToolRenderContext;

  $: renderer = getTool(ctx.event?.name || "tool");
  $: label = renderer.label ? renderer.label(ctx) : ctx.event?.name;
  $: summary = getSummary(ctx);

  // Determine if tool should be open by default
  // Read-only tools (Read, Grep, Glob, etc.) are collapsed by default
  // Modifying tools (Write, Edit, Bash, etc.) are open by default
  // TodoWrite is collapsed by default to save vertical space
  const toolName = ctx.event?.name?.toLowerCase() || "";
  const isReadOnly =
    toolName.includes("read") ||
    toolName.includes("grep") ||
    toolName.includes("glob") ||
    toolName.includes("find") ||
    toolName.includes("search") ||
    toolName.includes("ls") ||
    toolName.includes("webfetch") ||
    toolName.includes("websearch") ||
    toolName.includes("mcp__chrome-devtools__list") ||
    toolName.includes("mcp__chrome-devtools__get");
  const isCollapsedByDefault =
    isReadOnly || toolName.includes("todo") || toolName === "todowrite";

  let open = !isCollapsedByDefault;

  function getSummary(ctx: ToolRenderContext): string {
    const input = ctx.event?.input || {};
    const name = ctx.event?.name?.toLowerCase() || "";

    // Extract key parameters based on tool type
    if (name.includes("glob")) {
      return input.pattern || "";
    } else if (name.includes("grep")) {
      return input.pattern || "";
    } else if (name.includes("read")) {
      const path = input.file_path || "";
      return path.split("/").pop() || path;
    } else if (name.includes("write")) {
      const path = input.file_path || "";
      return path.split("/").pop() || path;
    } else if (name.includes("edit")) {
      const path = input.file_path || "";
      return path.split("/").pop() || path;
    } else if (name.includes("bash") || name.includes("shell")) {
      const cmd = input.command || "";
      return cmd.length > 50 ? cmd.slice(0, 47) + "..." : cmd;
    } else if (name.includes("notebookedit")) {
      const path = input.notebook_path || "";
      return path.split("/").pop() || path;
    } else if (name.includes("askuserquestion")) {
      // Show first question
      const questions = input.questions || [];
      if (questions.length > 0 && questions[0].question) {
        const q = questions[0].question;
        return q.length > 60 ? q.slice(0, 57) + "..." : q;
      }
      return questions.length > 1 ? `${questions.length} questions` : "";
    } else if (name.includes("exitplanmode")) {
      // Show first line of plan
      const plan = input.plan || "";
      const firstLine = plan.split("\n")[0];
      return firstLine.length > 60 ? firstLine.slice(0, 57) + "..." : firstLine;
    } else if (name.includes("task")) {
      // Show subagent type and description
      const subagentType = input.subagent_type || "";
      const desc = input.description || "";
      if (subagentType && desc) {
        return `${subagentType}: ${desc}`;
      }
      return subagentType || desc;
    } else if (name.includes("webfetch")) {
      // Show URL
      const url = input.url || "";
      return url.length > 60 ? url.slice(0, 57) + "..." : url;
    } else if (name.includes("websearch")) {
      // Show search query
      const query = input.query || "";
      return query.length > 60 ? query.slice(0, 57) + "..." : query;
    } else if (name.includes("todowrite") || name.includes("todo")) {
      // Show todo count and status
      const todos = input.todos || [];
      if (todos.length === 0) return "";
      const completed = todos.filter(
        (t: any) => t.status === "completed",
      ).length;
      const inProgress = todos.filter(
        (t: any) => t.status === "in_progress",
      ).length;
      const pending = todos.filter((t: any) => t.status === "pending").length;

      const parts = [];
      if (completed > 0) parts.push(`${completed} done`);
      if (inProgress > 0) parts.push(`${inProgress} active`);
      if (pending > 0) parts.push(`${pending} pending`);
      return parts.join(", ") || `${todos.length} tasks`;
    } else if (name.includes("taxi_estimate") || name === "get_taxi_estimate") {
      // Show route
      const pickup = input.pickup || "";
      const dropoff = input.dropoff || "";
      if (pickup && dropoff) {
        return `${pickup} → ${dropoff}`;
      }
      return pickup || dropoff;
    } else if (name.includes("taxi_search") || name.includes("search_taxis")) {
      // Show route
      const pickup = input.pickup || "";
      const dropoff = input.dropoff || "";
      if (pickup && dropoff) {
        return `${pickup} → ${dropoff}`;
      }
      return pickup || dropoff;
    } else if (name.includes("mcp__chrome-devtools")) {
      // Chrome DevTools specific summaries
      if (name.includes("screenshot")) {
        if (input.fullPage) return "Full page screenshot";
        if (input.uid) return `Element: ${input.uid}`;
        return "Screenshot";
      } else if (name.includes("navigate")) {
        return input.url || "";
      } else if (name.includes("click")) {
        return input.uid || "";
      } else if (name.includes("fill")) {
        if (input.value) return `"${input.value}"`;
        return "";
      } else if (name.includes("wait")) {
        return input.text || "";
      } else if (name.includes("press")) {
        return input.key || "";
      } else if (name.includes("evaluate")) {
        const func = input.function || "";
        const firstLine = func.split("\n")[0];
        return firstLine.length > 50
          ? firstLine.slice(0, 47) + "..."
          : firstLine;
      }
      return "";
    }

    // Fallback: show first meaningful value
    const firstKey = Object.keys(input).find(
      (k) =>
        !k.includes("description") && typeof input[k] === "string" && input[k],
    );
    if (firstKey) {
      const val = String(input[firstKey]);
      return val.length > 60 ? val.slice(0, 57) + "..." : val;
    }

    return "";
  }
</script>

<div
  class="border rounded-md overflow-hidden {!open
    ? 'inline-block max-w-fit'
    : ''}"
  style="border-color: var(--border-light);"
>
  <div
    class="tool-header flex justify-between items-center px-3 py-2 cursor-pointer select-none"
    style="background: var(--tool-header-bg);"
    on:click={() => (open = !open)}
  >
    <div class="flex items-center gap-1.5 flex-1 min-w-0">
      <span class="font-medium text-[13px]" style="color: var(--text);"
        >{label}</span
      >
      {#if summary}
        <span
          class="font-mono text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[400px]"
          style="color: var(--muted);">{summary}</span
        >
      {/if}
    </div>
    <span class="flex items-center shrink-0 ml-2" style="color: var(--muted);">
      {#if open}
        <ChevronDown size={16} />
      {:else}
        <ChevronRight size={16} />
      {/if}
    </span>
  </div>
  {#if open}
    <div class="p-3.5" style="background: var(--bg);">
      <svelte:component this={renderer.component} {ctx} />
    </div>
  {/if}
</div>

<style>
  .tool-header:hover {
    background: var(--tool-header-hover-bg) !important;
  }
</style>
