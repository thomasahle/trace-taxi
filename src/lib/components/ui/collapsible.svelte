<script lang="ts">
  import { cn } from "$lib/utils";

  let className: string | undefined = undefined;
  export { className as class };
  export let open: boolean = false;
</script>

<div class={cn("", className)} {...$$restProps}>
  <slot name="trigger" {open} />
  {#if open}
    <slot />
  {/if}
</div>
