<script lang="ts">
  import Button from "$lib/components/ui/button.svelte";
  import { theme } from "../lib/store";
  import { Menu, Share2, Moon, Sun, Github } from "lucide-svelte";
  import { onMount } from "svelte";
  import { toggleThreadsList } from "../lib/ui";
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
  class="flex items-center justify-between h-12 px-4 border-b border-border/30 shrink-0 z-10 bg-glass-header"
>
  <div class="flex items-center gap-3">
    <Button
      variant="outline"
      size="icon"
      class="w-8 h-8"
      on:click={toggleThreadsList}
      title="Toggle sidebar"
    >
      <Menu size={16} />
    </Button>
    <h1
      class="m-0 text-2xl font-semibold tracking-tight uppercase leading-none pt-1 cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2"
      on:click={() => activeThreadId.set(null)}
    >
      <img src="/favicon.png" alt="Taxi" class="w-6 h-6 -mt-1" />
      Trace Taxi
    </h1>
  </div>

  <div class="flex-1">
    <!-- Reserved for future features -->
  </div>

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
