<script lang="ts">
  /** Recent searches and favourites as large tappable chips. Kept on this device only. */
  import { clearRecent, saved } from '../lib/storage.svelte.ts';
  import { wordPath } from '../lib/router.svelte.ts';
  import { announce } from '../lib/status.svelte.ts';
  import Icon from './Icon.svelte';

  let confirming = $state(false);

  function clear(): void {
    clearRecent();
    confirming = false;
    announce('De lijst Laatst gezocht is leeg.');
    document.getElementById('recent-kop')?.focus();
  }
</script>

<div class="lists">
  <section id="recent" aria-labelledby="recent-kop">
    <h2 id="recent-kop" tabindex="-1"><Icon name="clock" />Laatst gezocht</h2>
    {#if saved.recent.length}
      <ul class="chips">{#each saved.recent as w (w)}<li><a class="chip" href={wordPath(w)}>{w}</a></li>{/each}</ul>
      {#if confirming}
        <div class="confirm" role="group" aria-labelledby="wis-vraag">
          <p id="wis-vraag">Wil je deze lijst wissen?</p>
          <div class="confirm__buttons">
            <button type="button" class="btn" onclick={clear}>Ja, wis de lijst</button>
            <button type="button" class="btn" onclick={() => (confirming = false)}>Nee</button>
          </div>
        </div>
      {:else}
        <button type="button" class="linkbtn wis" onclick={() => (confirming = true)}>Wis deze lijst</button>
      {/if}
    {:else}
      <p class="empty">Hier zie je de woorden die je hebt gezocht.</p>
    {/if}
  </section>
  <section id="bewaard" aria-labelledby="bewaard-kop">
    <h2 id="bewaard-kop"><Icon name="star" />Bewaard</h2>
    {#if saved.favourites.length}
      <ul class="chips">{#each saved.favourites as w (w)}<li><a class="chip" href={wordPath(w)}>{w}</a></li>{/each}</ul>
    {:else}
      <p class="empty">Nog niets bewaard. Kies <strong>Bewaar</strong> bij een gebaar. Dan vind je het hier snel terug.</p>
    {/if}
  </section>
</div>

<style>
  .lists { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr)); gap: 2rem 3rem; margin-top: 3rem;
    padding-top: 2rem; border-top: 1px solid var(--line); }
  section { display: grid; gap: 0.75rem; align-content: start; }
  h2 { display: flex; align-items: center; gap: 0.6rem; }
  .wis { justify-self: start; }
  .empty { color: var(--muted); font-size: 1.125rem; }
  .confirm { display: grid; gap: 0.6rem; padding: 1rem; background: var(--surface); border: 2px solid var(--border); border-radius: var(--radius); }
  .confirm__buttons { display: flex; flex-wrap: wrap; gap: 0.6rem; }
</style>
