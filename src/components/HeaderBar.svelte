<script lang="ts">
  import Button from "$lib/components/ui/button.svelte";
  import { theme } from "../lib/store";
  import { Share2, Moon, Sun, Github } from "lucide-svelte";
  import { onMount } from "svelte";
  import { SidebarTrigger } from "$lib/components/ui/sidebar";
  import { activeThread, activeThreadId } from "../lib/threads";
  import { createShareLink, downloadTrace } from "../lib/share";
  import { toast } from "svelte-sonner";

  let starCount: number | null = null;

  $: hasData = $activeThread?.data?.events?.length > 0;

  function toggleTheme() {
    theme.set($theme === "light" ? "dark" : "light");
  }

  async function handleShare() {
    const current = $activeThread;
    if (!current?.data?.originalMessages) return;

    const jsonlText = current.data.originalMessages
      .map((msg) => JSON.stringify(msg))
      .join("\n");

    const shareResult = createShareLink(jsonlText);

    if (shareResult.compressed) {
      try {
        await navigator.clipboard.writeText(shareResult.url);
        toast.success("Link copied to clipboard!");
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
        toast.success("Failed to copy link");
      }
    } else {
      toast.success("Trace too large for URL, downloading file...");
      downloadTrace(jsonlText, `${current.data.title || "trace"}.jsonl`);
    }
  }

  async function fetchGitHubStars() {
    try {
      const response = await fetch(
        "https://api.github.com/repos/thomasahle/trace-taxi",
      );
      if (response.ok) {
        const data = await response.json();
        starCount = data.stargazers_count;
      }
    } catch (error) {
      console.error("Failed to fetch GitHub stars:", error);
    }
  }

  onMount(() => {
    fetchGitHubStars();
  });
</script>

<header
  class="flex justify-between h-12 px-4 border-b border-border/30 bg-glass-header"
>
  <!-- Left side: Sidebar trigger and title -->
  <div class="flex items-center gap-3">
    <SidebarTrigger class="w-8 h-8" />
    <h1 class="m-0 text-2xl font-semibold pt-1">
      <button
        type="button"
        class="w-full text-left bg-transparent border-0 p-0 m-0 cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2"
        on:click={() => activeThreadId.set(null)}
        aria-label="Clear active trace"
      >
        <img src="/favicon.png" alt="Taxi" class="w-6 h-6 -mt-1" />
        Trace Taxi
      </button>
    </h1>
  </div>

  <!-- Right side: Theme toggle, share button, GitHub link -->
  <div class="flex items-center gap-2">
    {#if hasData}
      <Button
        variant="ghost"
        size="icon"
        class="w-8 h-8"
        on:click={handleShare}
        title="Share trace"
      >
        <Share2 size={16} />
      </Button>
    {/if}
    <Button
      variant="ghost"
      size="icon"
      class="w-8 h-8"
      on:click={toggleTheme}
      title="Toggle theme"
    >
      {#if $theme === "light"}
        <Moon size={16} />
      {:else}
        <Sun size={16} />
      {/if}
    </Button>
    <a
      href="https://github.com/thomasahle/trace-taxi"
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center gap-1.5 px-2.5 h-8 rounded-md hover:bg-accent/50 transition-colors border border-border/30"
      title={starCount
        ? `View on GitHub - ${starCount} stars`
        : "View on GitHub - Loading..."}
    >
      <Github size={14} />
      {#if starCount !== null}
        <div class="flex items-center gap-1">
          <span class="text-xs font-medium">{starCount}</span>
        </div>
      {/if}
    </a>
  </div>
</header>
