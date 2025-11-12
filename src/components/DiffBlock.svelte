
<script lang="ts">
  export let ctx: any;
  // Accepts raw unified diff as string or an object with 'diff' or 'patch' string.
  let patch = '';
  let filename = '';
  const out = ctx?.pair?.output ?? ctx?.event?.input ?? ctx?.event?.raw?.output ?? ctx?.event?.raw ?? {};
  if (typeof out === 'string') patch = out;
  else if (typeof out?.patch === 'string') patch = out.patch;
  else if (typeof out?.diff === 'string') patch = out.diff;
  if (typeof out?.file === 'string') filename = out.file;

  function classify(line: string) {
    if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) return 'hdr';
    if (line.startsWith('+')) return 'add';
    if (line.startsWith('-')) return 'del';
    return '';
  }

  let lines: string[] = (patch || '').split(/\r?\n/);
</script>

<div class="panel card">
  <div class="role">tool · diff</div>
  <div class="diff">
    <div class="diff-header">{filename || 'Patch'}</div>
    <div class="diff-body">
      {#each lines as ln}
        <span class={"diff-line " + classify(ln)}>{ln || ' '}</span>
      {/each}
    </div>
  </div>
</div>
