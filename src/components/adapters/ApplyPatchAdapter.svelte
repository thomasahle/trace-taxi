<script lang="ts">
  import {
    File,
    FileCode2,
    FilePlus,
    FileMinus,
    FileEdit,
  } from "lucide-svelte";

  export let ctx: any;

  const patchText: string =
    ctx?.event?.input?.patchText ?? ctx?.event?.input?.patch_text ?? "";

  type FilePatch = {
    path: string;
    action: "add" | "update" | "delete";
    lines: { type: "added" | "removed" | "context"; text: string }[];
  };

  function parsePatch(text: string): FilePatch[] {
    const result: FilePatch[] = [];
    let current: FilePatch | null = null;

    for (const raw of text.split("\n")) {
      if (raw.startsWith("*** Begin Patch") || raw.startsWith("*** End Patch"))
        continue;

      const addMatch = raw.match(/^\*\*\* Add File:\s*(.+)/);
      const updateMatch = raw.match(/^\*\*\* Update File:\s*(.+)/);
      const deleteMatch = raw.match(/^\*\*\* Delete File:\s*(.+)/);

      if (addMatch || updateMatch || deleteMatch) {
        if (current) result.push(current);
        const path = (
          addMatch?.[1] ??
          updateMatch?.[1] ??
          deleteMatch?.[1] ??
          ""
        ).trim();
        const action = addMatch ? "add" : updateMatch ? "update" : "delete";
        current = { path, action, lines: [] };
        continue;
      }

      if (!current) continue;

      if (raw.startsWith("+")) {
        current.lines.push({ type: "added", text: raw.slice(1) });
      } else if (raw.startsWith("-")) {
        current.lines.push({ type: "removed", text: raw.slice(1) });
      } else if (raw.startsWith(" ")) {
        current.lines.push({ type: "context", text: raw.slice(1) });
      }
    }
    if (current) result.push(current);
    return result;
  }

  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function actionBadge(action: FilePatch["action"]) {
    if (action === "add")
      return {
        label: "New",
        classes:
          "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
      };
    if (action === "delete")
      return {
        label: "Deleted",
        classes: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
      };
    return {
      label: "Edit",
      classes:
        "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400",
    };
  }

  function actionIcon(action: FilePatch["action"]) {
    if (action === "add") return FilePlus;
    if (action === "delete") return FileMinus;
    return FileEdit;
  }

  $: patches = parsePatch(patchText);
</script>

{#each patches as patch}
  {@const badge = actionBadge(patch.action)}
  <div
    class="font-sans rounded-lg border border-border bg-card overflow-hidden my-2"
  >
    <div
      class="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border"
    >
      <div class="flex items-center gap-2">
        <svelte:component
          this={actionIcon(patch.action)}
          class="w-4 h-4 text-muted-foreground"
        />
        <span class="font-mono text-sm text-foreground font-medium"
          >{patch.path}</span
        >
      </div>
      <span
        class="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded {badge.classes}"
        >{badge.label}</span
      >
    </div>
    <div class="diff-view font-mono text-xs leading-relaxed bg-background">
      {#each patch.lines as line}
        <div class="diff-line {line.type}">
          <span class="diff-marker"
            >{line.type === "added"
              ? "+"
              : line.type === "removed"
                ? "-"
                : " "}</span
          >
          <span class="diff-content">{@html escapeHtml(line.text)}</span>
        </div>
      {/each}
    </div>
  </div>
{/each}

{#if patches.length === 0 && patchText}
  <pre class="font-mono text-xs p-3 bg-background rounded">{patchText}</pre>
{/if}

<style>
  .diff-view :global(.diff-line) {
    display: flex;
    padding: 0 16px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .diff-view :global(.diff-marker) {
    display: inline-block;
    width: 20px;
    flex-shrink: 0;
    user-select: none;
    font-weight: 600;
    opacity: 0.5;
  }

  .diff-view :global(.diff-content) {
    flex: 1;
    min-width: 0;
  }

  .diff-view :global(.diff-line.context) {
    color: var(--muted-foreground);
  }

  .diff-view :global(.diff-line.removed) {
    background: rgba(244, 63, 94, 0.1);
    color: var(--foreground);
  }

  .diff-view :global(.diff-line.removed .diff-marker) {
    color: rgb(244, 63, 94);
  }

  .diff-view :global(.diff-line.added) {
    background: rgba(34, 197, 94, 0.1);
    color: var(--foreground);
  }

  .diff-view :global(.diff-line.added .diff-marker) {
    color: rgb(34, 197, 94);
  }
</style>
