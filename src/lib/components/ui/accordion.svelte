<script lang="ts">
  import { cn } from "$lib/utils";

  let className: string | undefined = undefined;
  export { className as class };
  export let open: boolean = false;
  export let title: string = "";
</script>

<div
  class={cn(
    "border border-border rounded-lg overflow-hidden",
    className
  )}
  {...$$restProps}
>
  <button
    class="flex w-full items-center justify-between bg-muted px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
    on:click={() => (open = !open)}
  >
    <span>{title}</span>
    <svg
      class={cn("h-4 w-4 transition-transform", open && "rotate-180")}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </button>
  {#if open}
    <div class="px-4 py-3 bg-background">
      <slot />
    </div>
  {/if}
</div>
