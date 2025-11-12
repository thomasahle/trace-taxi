
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

<div class="message-container">
  <div class="avatar {avatarInfo.class}">
    {avatarInfo.initial}
  </div>
  <div class="message-content">
    <div class="message-role">{role}</div>
    <div class="message-text" on:click|stopPropagation>
      {@html html}
    </div>
  </div>
</div>
