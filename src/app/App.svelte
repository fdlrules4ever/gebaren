<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { ABOUT_PATH, go, interceptLinks, router, wordPath } from './lib/router.svelte.ts';
  import { lookupSign, type Lookup } from './lib/api.ts';
  import { addRecent, saved } from './lib/storage.svelte.ts';
  import { input } from './lib/input.svelte.ts';
  import { announce, status } from './lib/status.svelte.ts';
  import Icon from './components/Icon.svelte';
  import SearchBox from './components/SearchBox.svelte';
  import StartView from './components/StartView.svelte';
  import ResultView from './components/ResultView.svelte';
  import NotFound from './components/NotFound.svelte';
  import ErrorView from './components/ErrorView.svelte';
  import Lists from './components/Lists.svelte';
  import Shortcuts from './components/Shortcuts.svelte';
  import About from './components/About.svelte';

  type View = { kind: 'idle' } | { kind: 'loading'; word: string } | { kind: 'done'; word: string; lookup: Lookup };

  let view = $state<View>({ kind: 'idle' });
  let query = $state(router.route.name === 'word' ? router.route.word : '');
  let attempt = $state(0);

  async function focusHeading(): Promise<void> {
    await tick();
    document.getElementById('woord')?.focus();
  }

  $effect(() => {
    const route = router.route;
    void attempt; // "Zoek opnieuw" runs this again
    const byUser = untrack(() => router.byUser);
    document.documentElement.dataset.route = route.name;

    if (route.name !== 'word') {
      view = { kind: 'idle' };
      if (route.name === 'start') query = '';
      document.title = route.name === 'about' ? 'Over Gebaren' : 'Gebaren · Zoek een gebaar in NGT';
      if (byUser && !location.hash) void focusHeading();
      return;
    }

    const word = route.word;
    query = word;
    document.title = `${word} · Gebaren`;
    view = { kind: 'loading', word };
    announce(`Even zoeken naar ${word}.`);

    const controller = new AbortController();
    lookupSign(word, controller.signal)
      .then(async (lookup) => {
        view = { kind: 'done', word, lookup };
        if (lookup.state === 'found') {
          const shown = lookup.data.results[0]?.word ?? word;
          addRecent(shown);
          const n = lookup.data.results.length;
          announce(n > 1 ? `Gevonden: ${n} gebaren voor ${shown}.` : `Gevonden: het gebaar voor ${shown}.`);
        } else if (lookup.state === 'notfound') {
          announce(`Geen gebaar gevonden voor ${word}.`);
        } else {
          announce(lookup.message);
        }
        if (byUser) await focusHeading();
      })
      .catch(() => { /* a newer search replaced this one */ });
    return () => controller.abort();
  });

  /** "/" jumps to the search field (unless shortcuts are switched off or you are typing). */
  function onkeydown(e: KeyboardEvent): void {
    if (e.key !== '/' || !saved.prefs.shortcuts || e.ctrlKey || e.metaKey || e.altKey) return;
    if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return;
    const input = document.getElementById('q') as HTMLInputElement | null;
    if (!input) return;
    e.preventDefault();
    input.focus();
    input.select();
  }

  const showLists = $derived(router.route.name !== 'about');
</script>

<svelte:window {onkeydown} />
<svelte:document onclick={interceptLinks} />

<a class="skip" href="#inhoud">Naar de inhoud</a>

<header class="top">
  <div class="wrap top__in">
    <a class="brand" href="/"><span class="brand__mark"><Icon name="hands" /></span>Gebaren</a>
    {#if input.keyboard}
      <a class="help" href={showLists ? '#sneltoetsen' : '/#sneltoetsen'}><Icon name="keyboard" />Sneltoetsen</a>
    {/if}
    <div class="search-slot">
      <SearchBox bind:value={query} onsearch={(w) => go(wordPath(w))} />
    </div>
  </div>
</header>

<main id="inhoud" tabindex="-1">
  {#if router.route.name === 'about'}
    <About />
  {:else if router.route.name === 'start'}
    <StartView />
  {:else if view.kind === 'loading'}
    <section class="wrap" aria-labelledby="woord" aria-busy="true">
      <p class="eyebrow">Gebaar in NGT voor</p>
      <h1 id="woord" class="loading-word" tabindex="-1">{view.word}</h1>
      <p class="loading">Even zoeken…</p>
    </section>
  {:else if view.kind === 'done'}
    {#if view.lookup.state === 'found'}
      <ResultView data={view.lookup.data} />
    {:else if view.lookup.state === 'notfound'}
      <NotFound query={view.word} suggestions={view.lookup.data.suggestions} parts={view.lookup.data.parts} />
    {:else}
      <ErrorView
        code={view.lookup.code}
        message={view.lookup.message}
        query={view.word}
        suggestions={view.lookup.suggestions}
        parts={view.lookup.parts}
        onretry={() => { attempt += 1; }}
      />
    {/if}
  {/if}

  {#if showLists}
    <div class="wrap">
      <Lists />
      {#if input.keyboard}<Shortcuts />{/if}
    </div>
  {/if}
</main>

<footer>
  <div class="wrap footer__in">
    <p>Gebaren is gratis. Wat je zoekt, blijft op dit apparaat.</p>
    <nav aria-label="Over deze site">
      <a href={ABOUT_PATH}>Over Gebaren</a>
      <a href="{ABOUT_PATH}#bronnen">Bronnen</a>
      <a href="{ABOUT_PATH}#toegankelijkheid">Toegankelijkheid</a>
    </nav>
  </div>
</footer>

<p class="sr-only" role="status" aria-live="polite">{status.message}</p>

<style>
  .top { background: var(--surface); border-bottom: 1px solid var(--line); }
  /* Narrow: logo and shortcuts link share a row (and wrap at very small widths or large text), search below. */
  .top__in { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.25rem 1.5rem;
    padding-block: 0.6rem 1rem; }
  .search-slot { flex: 1 1 100%; min-width: 0; margin-top: 0.25rem; }
  .brand { grid-area: brand; display: inline-flex; align-items: center; gap: 0.6rem; min-height: 2.75rem; color: var(--text);
    text-decoration: none; font-weight: 700; font-size: 1.5rem; letter-spacing: -0.01em; }
  .brand__mark { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; border-radius: 50%; background: var(--accent); color: var(--on-accent); }
  .brand__mark :global(.i) { width: 1.5rem; height: 1.5rem; stroke-width: 1.8; }
  .help { grid-area: help; display: inline-flex; align-items: center; gap: 0.5rem; min-height: 2.75rem; font-size: 1.0625rem;
    font-weight: 700; color: var(--text); text-decoration: none; }
  .help:hover { text-decoration: underline; }
  main { display: block; padding-block: clamp(1.25rem, 3vw, 2.25rem) 3rem; }
  .eyebrow { font-size: 1.0625rem; color: var(--muted); }
  .loading-word { font-size: clamp(2.75rem, 1.5rem + 2.6vw, 4rem); line-height: 1.02; overflow-wrap: anywhere; }
  .loading { margin-top: 1rem; font-size: 1.25rem; color: var(--muted); }
  footer { border-top: 1px solid var(--line); background: var(--surface); }
  .footer__in { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.75rem 2rem; padding-block: 1.5rem 2.5rem;
    font-size: 1rem; color: var(--muted); }
  footer nav { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; }
  footer a { color: var(--text); display: inline-flex; align-items: center; min-height: 2.75rem; }
  @media (min-width: 56rem) {
    .top__in { display: grid; grid-template-columns: auto minmax(0, 46rem) 1fr auto; grid-template-areas: "brand search . help"; align-items: start; }
    .search-slot { grid-area: search; margin-top: 0; }
    .brand, .help { margin-top: 2.1rem; }
  }
  /* On a phone (upright or on its side), the example hint makes way for the video once a word is shown. */
  @media (max-width: 40rem), (orientation: landscape) and (max-height: 32rem) {
    :global([data-route='word']) .search-slot :global(.search__hint) { display: none; }
  }
</style>
