<script lang="ts">
  /** Something went wrong: say what happened and what to do next, in plain words. */
  import type { ErrorCode } from '../lib/api.ts';
  import { wordPath } from '../lib/router.svelte.ts';
  import Icon from './Icon.svelte';

  let { code, message, query, suggestions, parts, onretry }: {
    code: ErrorCode; message: string; query: string; suggestions: string[]; parts: string[]; onretry: () => void;
  } = $props();

  function textFor(c: ErrorCode, msg: string): { title: string; next: string } {
    switch (c) {
      case 'offline': return { title: 'Je bent offline', next: 'Zoek opnieuw als je weer internet hebt.' };
      case 'timeout': return { title: 'Het zoeken duurde te lang', next: 'Probeer het opnieuw. Lukt het niet? Probeer het dan later.' };
      case 'rate_limited': return { title: 'Even rustig aan', next: 'Wacht een minuut. Zoek daarna opnieuw.' };
      case 'source_unavailable': return { title: 'Een bron reageert niet', next: 'We konden niet overal zoeken. Probeer het later opnieuw.' };
      case 'invalid_query': return { title: 'Dit woord kunnen we niet zoeken', next: msg };
      case 'not_found': return { title: 'Geen gebaar gevonden', next: 'Probeer een ander woord.' };
      default: return { title: 'Er ging iets mis', next: 'Dat ligt aan ons, niet aan jou. Probeer het later opnieuw.' };
    }
  }
  const text = $derived(textFor(code, message));
  const canRetry = $derived(code !== 'invalid_query');
  const words = $derived([...new Set([...suggestions, ...parts])]);
</script>

<section class="wrap" aria-labelledby="woord">
  <div class="err">
    <div class="notice">
      <span class="notice__icon"><Icon name={code === 'offline' ? 'wifi-off' : 'alert'} /></span>
      <div>
        <h1 id="woord" tabindex="-1">{text.title}</h1>
        <p>{text.next}</p>
        <p class="searched">Je zocht: <strong>{query}</strong></p>
      </div>
    </div>
    {#if canRetry}
      <button type="button" class="btn btn--primary retry" onclick={onretry}><Icon name="retry" />Zoek opnieuw</button>
    {/if}
    {#if words.length}
      <section aria-labelledby="err-woorden">
        <h2 id="err-woorden">Deze woorden hebben wel een gebaar</h2>
        <ul class="chips">{#each words as w (w)}<li><a class="chip" href={wordPath(w)}>{w}</a></li>{/each}</ul>
      </section>
    {/if}
  </div>
</section>

<style>
  .err { display: grid; gap: 1.5rem; max-width: 52rem; justify-items: start; }
  .err section { display: grid; gap: 0.75rem; }
  .notice { display: flex; gap: 1.25rem; align-items: flex-start; }
  .notice__icon { display: grid; place-items: center; flex: none; width: 4rem; height: 4rem; border-radius: 50%;
    background: var(--surface); border: 3px solid var(--focus); color: var(--text); }
  .notice__icon :global(.i) { width: 2rem; height: 2rem; }
  h1 { font-size: clamp(2rem, 1.4rem + 2.4vw, 3rem); line-height: 1.1; }
  .notice p { margin-top: 0.4rem; font-size: 1.25rem; }
  .searched { color: var(--muted); }
  .searched strong { color: var(--text); overflow-wrap: anywhere; }
</style>
