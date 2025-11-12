
<script lang="ts">
  export let ctx: any;
  let name = ctx?.event?.name ?? 'tool';
  let input = ctx?.event?.input;
  let output = ctx?.pair?.output;
</script>

<div class="panel card">
  <div class="role">tool · {name}</div>
  <div class="small">No custom renderer registered. Showing raw JSON.</div>
  <pre class="code">{JSON.stringify({input, output}, null, 2)}</pre>
</div>
