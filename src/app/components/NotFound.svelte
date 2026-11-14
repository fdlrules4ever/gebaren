<script lang="ts">
  /** No sign for this word: what to try next, never a dead end. */
  import { wordPath } from '../lib/router.svelte.ts';
  import Icon from './Icon.svelte';

  let { query, suggestions, parts }: { query: string; suggestions: string[]; parts: string[] } = $props();
</script>

<section class="wrap" aria-labelledby="woord">
  <div class="nf">
    <div class="notice">
      <span class="notice__icon"><Icon name="notfound" /></span>
      <div>
        <h1 id="woord" tabindex="-1">Geen gebaar voor ‘{query}’</h1>
        <p>Dit woord staat niet in onze lijst.</p>
      </div>
    </div>

    {#if suggestions.length}
      <section aria-labelledby="nf-bedoel">
        <h2 id="nf-bedoel">Bedoel je misschien {suggestions.length === 1 ? 'dit woord' : 'een van deze woorden'}?</h2>
        <ul class="chips">{#each suggestions as s (s)}<li><a class="chip" href={wordPath(s)}>{s}</a></li>{/each}</ul>
      </section>
    {/if}

    {#if parts.length}
      <section aria-labelledby="nf-delen">
        <h2 id="nf-delen">Of zoek de delen van het woord</h2>
        <ul class="chips">{#each parts as p (p)}<li><a class="chip" href={wordPath(p)}>{p}</a></li>{/each}</ul>
      </section>
    {/if}

    <section aria-labelledby="nf-tips">
      <h2 id="nf-tips">Tips</h2>
      <ul class="tips">
        <li>Kijk of het woord goed geschreven is.</li>
        <li>Zoek zonder lidwoord: ‘huis’ en niet ‘het huis’.</li>
        <li>Probeer een woord dat ongeveer hetzelfde betekent.</li>
      </ul>
    </section>

    <p class="elsewhere">
      Staat het gebaar er niet bij? Kijk dan in het
      <a href="https://ow.gebarencentrum.nl/" target="_blank" rel="noopener">Gebarenwoordenboek van het Nederlands Gebarencentrum<Icon name="external" class="i ext" /><span class="sr-only"> (opent in een nieuw tabblad)</span></a>.
      Voor sommige gebaren heb je daar een abonnement nodig.
    </p>
  </div>
</section>

<style>
  .nf { display: grid; gap: 2rem; max-width: 52rem; }
  .nf section { display: grid; gap: 0.75rem; }
  .notice { display: flex; gap: 1.25rem; align-items: flex-start; }
  .notice__icon { display: grid; place-items: center; flex: none; width: 4rem; height: 4rem; border-radius: 50%; background: var(--weak); color: var(--accent); }
  .notice__icon :global(.i) { width: 2.1rem; height: 2.1rem; }
  h1 { font-size: clamp(2rem, 1.4rem + 2.4vw, 3rem); line-height: 1.1; overflow-wrap: anywhere; }
  .notice p { margin-top: 0.4rem; font-size: 1.25rem; }
  ul.tips { display: grid; gap: 0.5rem; padding-left: 1.25em; list-style: disc; }
  .elsewhere { padding: 1.1rem 1.25rem; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); }
</style>
