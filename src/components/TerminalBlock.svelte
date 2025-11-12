
<script lang="ts">
  export let ctx: any;

  // Support several shapes:
  // ctx.pair?.output could be {stdout, stderr, exit_code} or string
  let cmd = ctx?.event?.input?.command ?? ctx?.event?.input?.cmd ?? ctx?.event?.input?.args ?? '';
  let out = ctx?.pair?.output ?? ctx?.event?.raw?.output ?? ctx?.event?.input?.output ?? '';
  let stdout = '';
  let stderr = '';
  let exit_code: number | null = null;

  if (typeof out === 'string') {
    stdout = out;
  } else if (out && typeof out === 'object') {
    stdout = out.stdout ?? '';
    stderr = out.stderr ?? '';
    exit_code = typeof out.exit_code === 'number' ? out.exit_code : (out.code ?? null);
  }
</script>

<div class="panel card">
  <div class="role">tool · terminal</div>
  {#if cmd}<div class="terminal"><div class="cmd">$ {cmd}</div>
  {#if stdout}<pre class="code">{stdout}</pre>{/if}
  {#if stderr}<pre class="code stderr">{stderr}</pre>{/if}
  {#if exit_code !== null}
    <div class="{exit_code === 0 ? 'exit-ok' : 'exit-bad'}">exit {exit_code}</div>
  {/if}
  </div>
  {:else}
  <div class="terminal">
    {#if stdout}<pre class="code">{stdout}</pre>{/if}
    {#if stderr}<pre class="code stderr">{stderr}</pre>{/if}
  </div>
  {/if}
</div>
