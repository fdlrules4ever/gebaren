<script lang="ts">
  /** A found word: the word big, the variants as tabs, the player, the meaning and the source. */
  import type { SignResponse } from '../../shared/types.ts';
  import { isFavourite, toggleFavourite } from '../lib/storage.svelte.ts';
  import { announce } from '../lib/status.svelte.ts';
  import Icon from './Icon.svelte';
  import Player from './Player.svelte';

  let { data }: { data: SignResponse } = $props();

  let selected = $state(0);
  const results = $derived(data.results);
  const word = $derived(results[0]?.word ?? data.query);
  const current = $derived(results[Math.min(selected, results.length - 1)]!);
  const favourite = $derived(isFavourite(word));
  const many = $derived(results.length > 1);
  const isSignbank = $derived(current.sourceName === 'NGT Signbank');

  // A new word starts at the first sign.
  $effect.pre(() => { void data; selected = 0; });

  function select(i: number, focus: boolean): void {
    selected = i;
    if (focus) document.getElementById(`gebaar-tab-${i}`)?.focus();
  }

  function onTabKey(e: KeyboardEvent, i: number): void {
    const last = results.length - 1;
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = i === last ? 0 : i + 1;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = i === 0 ? last : i - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    if (next >= 0) { e.preventDefault(); select(next, true); }
  }

  function fav(): void {
    const on = toggleFavourite(word);
    announce(on ? `${word} staat nu bij Bewaard.` : `${word} staat niet meer bij Bewaard.`);
  }
</script>

<section aria-labelledby="woord">
  <div class="wrap">
    <div class="head">
      <div class="head__word">
        <p class="eyebrow">Gebaar in NGT voor</p>
        <h1 id="woord" class="word" tabindex="-1">{word}</h1>
      </div>
      {#if many}
        <div class="variants">
          <p class="variants__note">Er zijn {results.length} gebaren voor dit woord.</p>
          <div class="tabs" role="tablist" aria-label="Gebaren voor {word}">
            {#each results as r, i (r.videoUrl)}
              <button
                type="button"
                role="tab"
                id="gebaar-tab-{i}"
                aria-selected={i === selected}
                aria-controls="gebaar-paneel"
                tabindex={i === selected ? 0 : -1}
                onclick={() => select(i, false)}
                onkeydown={(e) => onTabKey(e, i)}
              ><span class="tab__word">Gebaar</span>&#32;{i + 1}<span class="sr-only">&#32;van {results.length}</span></button>
            {/each}
          </div>
        </div>
      {/if}
      <button type="button" class="btn fav" aria-pressed={favourite} onclick={fav}>
        <Icon name="star" class="i star" />Bewaar
      </button>
    </div>
  </div>

  <div
    id="gebaar-paneel"
    role={many ? 'tabpanel' : undefined}
    aria-labelledby={many ? `gebaar-tab-${selected}` : undefined}
  >
    {#key current.videoUrl}
      <Player result={current} {word} describedby="betekenis" />
    {/key}
    <div class="wrap">
      <div class="meta">
        {#if current.senses.length <= 1}
          <p class="meaning" id="betekenis"><strong>Dit gebaar betekent:</strong> {current.senses[0]?.join(', ') ?? word}</p>
        {:else}
          <div class="meaning" id="betekenis">
            <strong>Dit gebaar heeft meer betekenissen:</strong>
            <ol>{#each current.senses as group, gi (gi)}<li>{group.join(', ')}</li>{/each}</ol>
          </div>
        {/if}
        <p class="note"><Icon name="info" /><span>Met <strong>Spiegel</strong> zie je het gebaar zoals in een spiegel. Dat is handig als je het gebaar wilt nadoen.</span></p>
        <p class="credit">
          Video: <a href={current.sourcePageUrl} target="_blank" rel="noopener">{current.sourceName}<Icon name="external" class="i ext" /><span class="sr-only"> (opent in een nieuw tabblad)</span></a>{#if isSignbank}, Radboud Universiteit en Universiteit van Amsterdam{/if}.
          Licentie <a href={current.licenceUrl} target="_blank" rel="noopener">{current.licence}<span class="sr-only"> (opent in een nieuw tabblad)</span></a>.
        </p>
      </div>
    </div>
  </div>
</section>

<style>
  .head { display: grid; grid-template-columns: 1fr auto; grid-template-areas: "word fav" "variants variants";
    align-items: end; gap: 1rem 1.5rem; margin-bottom: 1.25rem; }
  .head__word { grid-area: word; min-width: 0; }
  .fav { grid-area: fav; }
  .fav :global(.star) { width: 1.4rem; height: 1.4rem; }
  .fav[aria-pressed='true'] :global(.star) { fill: currentColor; }
  .eyebrow { font-size: 1.0625rem; color: var(--muted); }
  .word { font-size: clamp(2.75rem, 1.6rem + 4.6vw, 5rem); line-height: 1.02; letter-spacing: -0.02em; font-weight: 700;
    overflow-wrap: anywhere; }
  .variants { grid-area: variants; display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1rem; }
  .variants__note { font-size: 1.0625rem; color: var(--muted); }
  .tabs { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  [role='tab'] { min-height: 3rem; padding: 0.4rem 1.25rem; border-radius: 999px; border: 2px solid var(--border);
    background: var(--surface); color: var(--text); font-weight: 700; font-size: 1.125rem; }
  [role='tab']:hover { background: var(--weak); }
  [role='tab'][aria-selected='true'] { background: var(--text); border-color: var(--text); color: var(--bg); }
  .meta { display: grid; gap: 0.6rem; margin-top: 1.5rem; max-width: 50rem; }
  .meaning { font-size: 1.375rem; }
  .meaning ol { margin: 0.25rem 0 0; padding-left: 1.4em; }
  .credit { font-size: 1rem; color: var(--muted); }
  /* Phones with many variants: number-only tabs on one row ("Gebaar 3 van 6" stays the accessible name). */
  @media (max-width: 40rem) {
    .tabs:has(> :nth-child(4)) [role='tab'] { min-width: 3rem; padding-inline: 0.9rem; }
    .tabs:has(> :nth-child(4)) .tab__word { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  }
  @media (min-width: 56rem) {
    .head { grid-template-columns: auto 1fr auto; grid-template-areas: "word variants fav"; column-gap: 2.5rem; }
    .variants { padding-bottom: 0.35rem; }
    .word { font-size: clamp(2.75rem, 1.5rem + 2.6vw, 4rem); }
  }
</style>
