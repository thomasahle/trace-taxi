
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
      return { initial: 'U', class: 'user' };
    } else if (roleLower === 'assistant') {
      return { initial: 'A', class: 'assistant' };
    } else if (roleLower.includes('tool')) {
      return { initial: 'T', class: 'tool' };
    }
    return { initial: role.charAt(0).toUpperCase(), class: 'default' };
  }

  $: avatarInfo = getAvatarInfo(role);

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
    html = marked.parse(text || '');
  });
</script>

<div class="message-container"
     class:no-avatar={role.toLowerCase() === 'assistant'}
     class:user-message={role.toLowerCase() === 'user'}>
  {#if role.toLowerCase() !== 'assistant'}
    <div class="avatar {avatarInfo.class}">
      {avatarInfo.initial}
    </div>
  {/if}
  <div class="message-content">
    {#if role.toLowerCase() !== 'assistant'}
      <div class="message-role">{role}</div>
    {/if}
    <div class="message-text" on:click|stopPropagation>
      {@html html}
    </div>
  </div>
</div>
