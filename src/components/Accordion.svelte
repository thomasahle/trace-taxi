
<script lang="ts">
  export let title: string;
  export let subtitle: string = '';
  let open = true;
</script>

<div class="accordion">
  <div class="acc-header" on:click={() => open = !open}>
    <div class="acc-title">
      <span style="font-weight:600;">{title}</span>
      {#if subtitle}<span class="small">· {subtitle}</span>{/if}
    </div>
    <div class="small">{open ? '▾' : '▸'}</div>
  </div>
  {#if open}
  <div class="acc-body">
    <slot />
  </div>
  {/if}
</div>
