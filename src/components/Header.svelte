
<script lang="ts">
  export let title: string;
  export let badges: string[] = [];
</script>

<div class="panel" style="padding:14px 16px; margin-bottom: 16px;">
  <div class="title" style="margin-bottom:6px;">{title}</div>
  {#if badges.length}
  <div class="chips">
    {#each badges as b}
      <span class="badge">{b}</span>
    {/each}
  </div>
  {/if}
</div>
