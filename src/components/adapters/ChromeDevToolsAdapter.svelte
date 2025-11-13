<script lang="ts">
  import type { ToolRenderContext } from '../../lib/types';
  import { Camera, Globe, MousePointer, Monitor, FileText, AlertCircle } from 'lucide-svelte';

  export let ctx: ToolRenderContext;

  $: input = ctx.event?.input || {};
  $: rawOutput = ctx.pair?.output || '';
  $: toolName = ctx.event?.name || '';

  // Parse output if it's a JSON string
  $: output = (() => {
    if (!rawOutput) return '';

    // If it's already an array or object, use it as-is
    if (typeof rawOutput !== 'string') return rawOutput;

    // Check if output contains stringified JSON with image data
    if (rawOutput.includes('{"type":"image"')) {
      try {
        // Try to parse the entire string as an array
        const parsed = JSON.parse(`[${rawOutput}]`);
        return parsed;
      } catch {
        // If that fails, try to extract just the image JSON
        const match = rawOutput.match(/\{"type":"image"[^}]+\}\}/);
        if (match) {
          try {
            return [JSON.parse(match[0])];
          } catch {
            return rawOutput;
          }
        }
      }
    }

    return rawOutput;
  })();

  // Helper to detect if output contains image data
  function hasImageContent(output: any): boolean {
    if (!output) return false;
    if (typeof output === 'string') return false;

    // Check if it's an array with image blocks
    if (Array.isArray(output)) {
      return output.some(item =>
        item?.type === 'image' &&
        item?.source?.type === 'base64'
      );
    }

    // Check if it's an object with image data
    if (output?.type === 'image' && output?.source?.type === 'base64') {
      return true;
    }

    return false;
  }

  // Extract image data from output
  function extractImages(output: any): Array<{mediaType: string, data: string}> {
    const images: Array<{mediaType: string, data: string}> = [];

    if (Array.isArray(output)) {
      for (const item of output) {
        if (item?.type === 'image' && item?.source?.type === 'base64') {
          images.push({
            mediaType: item.source.media_type || 'image/png',
            data: item.source.data
          });
        }
      }
    } else if (output?.type === 'image' && output?.source?.type === 'base64') {
      images.push({
        mediaType: output.source.media_type || 'image/png',
        data: output.source.data
      });
    }

    return images;
  }

  // Extract text content from output
  function extractText(output: any): string {
    if (typeof output === 'string') {
      // Check if it's a JSON string that needs parsing
      if (output.includes('{"type":"image"')) {
        return ''; // Don't show stringified image data as text
      }
      return output;
    }

    if (Array.isArray(output)) {
      const textParts = output
        .filter(item => item?.type === 'text')
        .map(item => item.text || '');
      return textParts.join('\n');
    }

    return '';
  }

  // Get icon based on tool name
  function getIcon(name: string) {
    if (name.includes('screenshot')) return Camera;
    if (name.includes('navigate')) return Globe;
    if (name.includes('click')) return MousePointer;
    if (name.includes('snapshot')) return FileText;
    return Monitor;
  }

  $: Icon = getIcon(toolName);
  $: images = hasImageContent(output) ? extractImages(output) : [];
  $: textContent = extractText(output);

  // Format input for display
  function formatInput(input: any): string {
    const parts = [];

    if (input.url) parts.push(`URL: ${input.url}`);
    if (input.uid) parts.push(`Element: ${input.uid}`);
    if (input.selector) parts.push(`Selector: ${input.selector}`);
    if (input.fullPage) parts.push('Full page');
    if (input.format) parts.push(`Format: ${input.format}`);
    if (input.quality) parts.push(`Quality: ${input.quality}`);
    if (input.text) parts.push(`Text: "${input.text}"`);
    if (input.value) parts.push(`Value: "${input.value}"`);
    if (input.key) parts.push(`Key: ${input.key}`);
    if (input.pageIdx !== undefined) parts.push(`Page: ${input.pageIdx}`);

    return parts.join(' • ') || JSON.stringify(input, null, 2);
  }
</script>

<div class="chrome-devtools-adapter">
  <div class="tool-header">
    <Icon size={14} class="tool-icon" />
    <span class="tool-name">{toolName.replace('mcp__chrome-devtools__', '').replace(/_/g, ' ')}</span>
  </div>

  {#if Object.keys(input).length > 0}
    <div class="tool-input">
      <div class="label">Input:</div>
      <div class="content">{formatInput(input)}</div>
    </div>
  {/if}

  {#if images.length > 0}
    <div class="tool-images">
      {#each images as image}
        <div class="image-container">
          <img
            src="data:{image.mediaType};base64,{image.data}"
            alt="Screenshot from {toolName}"
            class="screenshot"
          />
        </div>
      {/each}
    </div>
  {/if}

  {#if textContent && textContent.trim()}
    <div class="tool-output">
      <div class="label">Output:</div>
      <pre class="content">{textContent}</pre>
    </div>
  {/if}

  {#if !textContent && images.length === 0 && output}
    <div class="tool-output">
      <div class="label">Raw Output:</div>
      <pre class="content">{JSON.stringify(output, null, 2)}</pre>
    </div>
  {/if}
</div>

<style>
  .chrome-devtools-adapter {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .tool-header {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--primary);
    font-weight: 500;
    font-size: 12px;
    text-transform: capitalize;
  }

  :global(.tool-icon) {
    color: var(--primary);
  }

  .tool-input,
  .tool-output {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--muted);
    letter-spacing: 0.5px;
  }

  .content {
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 12px;
    color: var(--text);
    white-space: pre-wrap;
    word-wrap: break-word;
    line-height: 1.5;
    margin: 0;
    padding: 8px;
    background: var(--panel);
    border-radius: 4px;
    border: 1px solid var(--border-light);
  }

  .tool-images {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 8px;
  }

  .image-container {
    border: 1px solid var(--border-light);
    border-radius: 8px;
    overflow: hidden;
    background: var(--panel);
    padding: 8px;
  }

  .screenshot {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 4px;
    max-width: 100%;
    object-fit: contain;
  }

  /* Limit screenshot height for very tall images */
  .screenshot {
    max-height: 600px;
    object-fit: contain;
  }
</style>