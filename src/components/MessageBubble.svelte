
<script lang="ts">
  import { marked } from '$lib/markdown';

  export let role: string;
  export let text: string;
  export let content: any = null; // For messages with structured content (images, etc.)

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

  // Process content with images - simple version
  function processContent(content: any, text: string) {
    if (!content || !Array.isArray(content)) {
      return { html: marked.parse(text || ''), parts: [] };
    }

    let parts: Array<{type: 'text' | 'image', content: any}> = [];

    // Process content in the order it appears
    for (const item of content) {
      if (item?.type === 'text' && item.text) {
        parts.push({ type: 'text', content: marked.parse(item.text) });
      } else if (item?.type === 'image' && item.source?.type === 'base64') {
        parts.push({
          type: 'image',
          content: {
            data: item.source.data,
            mediaType: item.source.media_type || 'image/png'
          }
        });
      }
    }

    // Fallback to simple text if no parts
    if (parts.length === 0 && text) {
      parts.push({ type: 'text', content: marked.parse(text) });
    }

    return {
      html: marked.parse(text || ''),
      parts
    };
  }

  // Reactively parse content whenever it changes
  $: processed = processContent(content, text);
  $: html = processed.html;
  $: parts = processed.parts || [];
</script>

<div class="flex gap-3 items-start {isAssistant ? 'gap-0' : ''}">
  {#if !isAssistant}
    <div class="w-8 h-8 rounded-full {avatarInfo.bgClass} text-white flex items-center justify-center font-semibold text-sm shrink-0">
      {avatarInfo.initial}
    </div>
  {/if}
  <div class="flex-1 min-w-0">
    {#if !isAssistant}
      <div class="text-sm font-semibold mb-1">{role}</div>
    {/if}
    <div class="prose prose-sm max-w-none dark:prose-invert {isUser ? 'bg-accent/50 px-4 py-3 rounded-lg border border-border/30' : ''}" on:click|stopPropagation>
      {#if parts && parts.length > 0}
        {#each parts as part}
          {#if part.type === 'text'}
            {@html part.content}
          {:else if part.type === 'image'}
            <div class="my-3">
              <img
                src="data:{part.content.mediaType};base64,{part.content.data}"
                alt="User uploaded image"
                class="rounded-lg max-w-full"
                style="max-height: 400px; object-fit: contain;"
              />
            </div>
          {/if}
        {/each}
      {:else}
        {@html html}
      {/if}
    </div>
  </div>
</div>
