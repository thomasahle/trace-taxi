<script lang="ts">
  import Button from "$lib/components/ui/button.svelte";
  import { theme } from '../lib/store';

  export let hasData: boolean;
  export let onToggleSidebar: () => void;
  export let onShare: () => void;

  function toggleTheme() {
    theme.set($theme === 'light' ? 'dark' : 'light');
  }
</script>

<header class="flex items-center justify-between h-12 px-4 border-b border-border/30 shrink-0 z-10" style="background-color: {$theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)'}; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
  <div class="flex items-center gap-3">
    <Button
      variant="outline"
      size="icon"
      class="w-8 h-8"
      on:click={onToggleSidebar}
      title="Toggle sidebar"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M1 2.75A.75.75 0 011.75 2h12.5a.75.75 0 010 1.5H1.75A.75.75 0 011 2.75zm0 5A.75.75 0 011.75 7h12.5a.75.75 0 010 1.5H1.75A.75.75 0 011 7.75zM1.75 12a.75.75 0 000 1.5h12.5a.75.75 0 000-1.5H1.75z"/>
      </svg>
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
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M7.823 1.677 4.927 4.573A.25.25 0 0 0 5.104 5H7.25v3.236a.75.75 0 1 0 1.5 0V5h2.146a.25.25 0 0 0 .177-.427L8.177 1.677a.25.25 0 0 0-.354 0ZM3.75 6.5a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5h-.5ZM3 3.75a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 3.75ZM3.75 9a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5h-.5ZM10 3.75a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Zm.75 2.75a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5h-.5ZM10 9a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 10 9ZM3.75 12a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5Z"></path>
        </svg>
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
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M9.598 1.591a.749.749 0 0 1 .785-.175 7.001 7.001 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786Zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.499 5.499 0 1 0 7.678-7.678Z"></path>
        </svg>
      {:else}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm5.657-8.157a.75.75 0 0 1 0 1.061l-.707.707a.75.75 0 1 1-1.061-1.061l.707-.707a.75.75 0 0 1 1.061 0Zm-9.193 9.193a.75.75 0 0 1 0 1.06l-.707.708a.75.75 0 0 1-1.061-1.06l.707-.708a.75.75 0 0 1 1.061 0ZM8 0a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1A.75.75 0 0 1 8 0ZM3 8a.75.75 0 0 1-.75.75h-1a.75.75 0 0 1 0-1.5h1A.75.75 0 0 1 3 8Zm13 0a.75.75 0 0 1-.75.75h-1a.75.75 0 0 1 0-1.5h1A.75.75 0 0 1 16 8Zm-8 5a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1A.75.75 0 0 1 8 13Zm3.536-1.464a.75.75 0 0 1 1.06 0l.708.707a.75.75 0 0 1-1.061 1.061l-.707-.708a.75.75 0 0 1 0-1.06ZM2.343 2.343a.75.75 0 0 1 1.061 0l.707.707A.75.75 0 1 1 3.05 4.111l-.707-.707a.75.75 0 0 1 0-1.06Z"></path>
        </svg>
      {/if}
    </Button>
    <a
      href="https://github.com/thomasahle/trace-taxi"
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent/50 transition-colors"
      title="View on GitHub"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
      </svg>
    </a>
  </div>
</header>
