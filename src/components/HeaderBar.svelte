<script lang="ts">
  import Button from "$lib/components/ui/button.svelte";
  import { theme } from '../lib/store';
  import { Menu, Upload, Moon, Sun, Github } from 'lucide-svelte';

  export let hasData: boolean;
  export let onToggleSidebar: () => void;
  export let onShare: () => void;

  function toggleTheme() {
    theme.set($theme === 'light' ? 'dark' : 'light');
  }
</script>

<header class="flex items-center justify-between h-12 px-4 border-b border-border/30 shrink-0 z-10" style="background-color: {$theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.3)'}; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
  <div class="flex items-center gap-3">
    <Button
      variant="outline"
      size="icon"
      class="w-8 h-8"
      on:click={onToggleSidebar}
      title="Toggle sidebar"
    >
      <Menu size={16} />
    </Button>
    <h1 class="m-0 text-lg font-semibold tracking-tight">Trace Taxi</h1>
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
        on:click={onShare}
        title="Share trace"
      >
        <Upload size={16} />
      </Button>
    {/if}
    <Button
      variant="ghost"
      size="icon"
      class="w-8 h-8"
      on:click={toggleTheme}
      title="Toggle theme"
    >
      {#if $theme === 'light'}
        <Moon size={16} />
      {:else}
        <Sun size={16} />
      {/if}
    </Button>
    <a
      href="https://github.com/thomasahle/trace-taxi"
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent/50 transition-colors"
      title="View on GitHub"
    >
      <Github size={16} />
    </a>
  </div>
</header>
