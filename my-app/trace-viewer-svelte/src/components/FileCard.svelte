
<script lang="ts">
  export let ctx: any;
  let path = ctx?.event?.input?.path ?? ctx?.event?.input?.file ?? ctx?.event?.input?.name ?? '';
  let content = '';
  const out = ctx?.pair?.output ?? ctx?.event?.raw?.output ?? ctx?.event?.input?.content ?? '';
  if (typeof out === 'string') content = out;
  else if (out && typeof out === 'object') content = out.content ?? out.text ?? JSON.stringify(out, null, 2);
</script>

<div class="panel card">
  <div class="role">tool · file</div>
  <div style="margin-bottom:8px; font-weight:600;">{path}</div>
  <pre class="code">{content}</pre>
</div>
