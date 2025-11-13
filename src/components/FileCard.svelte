<script lang="ts">
  import Card from "$lib/components/ui/card.svelte";

  export let ctx: any;
  let path =
    ctx?.event?.input?.path ??
    ctx?.event?.input?.file ??
    ctx?.event?.input?.name ??
    "";
  let content = "";
  const out =
    ctx?.pair?.output ??
    ctx?.event?.raw?.output ??
    ctx?.event?.input?.content ??
    "";
  if (typeof out === "string") content = out;
  else if (out && typeof out === "object")
    content = out.content ?? out.text ?? JSON.stringify(out, null, 2);
</script>

<Card class="p-4 border-b last:border-b-0 rounded-none border-x-0 border-t-0">
  <div
    class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2"
  >
    tool · file
  </div>
  <div class="mb-2 font-semibold">{path}</div>
  <pre
    class="bg-muted border border-border rounded-md p-3 overflow-x-auto text-xs">{content}</pre>
</Card>
