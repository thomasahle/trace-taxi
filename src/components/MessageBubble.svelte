
<script lang="ts">
  import { onMount } from 'svelte';
  import { marked } from 'marked';
  import hljs from 'highlight.js';

  export let role: string;
  export let text: string;

  let html = '';

  // Get avatar initial and color based on role
  function getAvatarInfo(role: string) {
    const roleLower = role.toLowerCase();
    if (roleLower === 'user') {
      return { initial: 'U', bgClass: 'bg-green-600' };
    } else if (roleLower === 'assistant') {
      return { initial: 'A', bgClass: 'bg-primary' };
    } else if (roleLower.includes('tool')) {
      return { initial: 'T', bgClass: 'bg-blue-600' };
    }
    return { initial: role.charAt(0).toUpperCase(), bgClass: 'bg-gray-600' };
  }

  $: avatarInfo = getAvatarInfo(role);
  $: isAssistant = role.toLowerCase() === 'assistant';
  $: isUser = role.toLowerCase() === 'user';

  // Configure marked once on mount
  onMount(() => {
    marked.setOptions({
      highlight: (code, lang) => {
        try {
          if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
          }
        } catch {}
        return hljs.highlightAuto(code).value;
      }
    });
  });

  // Reactively parse markdown whenever text changes
  $: html = marked.parse(text || '');
</script>

<div class="flex gap-3 items-start {isUser ? 'bg-muted px-4 py-3 rounded-lg' : ''} {isAssistant ? 'gap-0' : ''}">
  {#if !isAssistant}
    <div class="w-8 h-8 rounded-full {avatarInfo.bgClass} text-white flex items-center justify-center font-semibold text-sm shrink-0">
      {avatarInfo.initial}
    </div>
  {/if}
  <div class="flex-1 min-w-0">
    {#if !isAssistant}
      <div class="text-sm font-semibold mb-1">{role}</div>
    {/if}
    <div class="prose prose-sm max-w-none dark:prose-invert" on:click|stopPropagation>
      {@html html}
    </div>
  </div>
</div>
