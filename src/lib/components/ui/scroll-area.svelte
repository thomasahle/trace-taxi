<script lang="ts">
  import { cn } from "$lib/utils";
  
  let className: string | undefined = undefined;
  export { className as class };
</script>

<div
  class={cn("relative overflow-auto", className)}
  {...$$restProps}
>
  <slot />
</div>
