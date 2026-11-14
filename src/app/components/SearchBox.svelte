<script lang="ts">
  /**
   * Search field with suggestions: the ARIA combobox pattern (list autocomplete, manual selection).
   * Arrow keys move through the list, Enter picks, Escape closes the list (or clears the field when it is closed).
   */
  import { loadWords, suggest } from '../lib/words.ts';
  import { announce } from '../lib/status.svelte.ts';
  import Icon from './Icon.svelte';

  let { value = $bindable(''), onsearch }: { value?: string; onsearch: (word: string) => void } = $props();

  const DEFAULT_HINT = 'Bijvoorbeeld: huis, dank je of koffie.';
  let options = $state<string[]>([]);
  let active = $state(-1);
  let open = $state(false);
  let showError = $state(false);
  let hint = $state(DEFAULT_HINT);
  let focused = false;
  let announceTimer: ReturnType<typeof setTimeout> | undefined;

  const optionId = (i: number): string => `suggestie-${i}`;

  async function refresh(): Promise<void> {
    const typed = value;
    await loadWords();
    if (typed !== value) return; // a newer keystroke will refresh
    options = suggest(typed);
    active = -1;
    open = focused && options.length > 0;
    hint = !typed.trim() ? DEFAULT_HINT
      : options.length ? `${options.length} ${options.length === 1 ? 'woord' : 'woorden'}. Kies met de pijltjes en Enter.`
      : 'Geen woord gevonden dat zo begint. Druk op Enter om toch te zoeken.';
    clearTimeout(announceTimer);
    if (typed.trim()) announceTimer = setTimeout(() => announce(hint), 700);
  }

  function close(): void {
    open = false;
    active = -1;
  }

  function choose(word: string): void {
    const w = word.trim();
    if (!w) {
      showError = true;
      announce('Typ eerst een woord.');
      return;
    }
    showError = false;
    value = w;
    close();
    hint = DEFAULT_HINT;
    onsearch(w);
  }

  function oninput(): void {
    if (value.trim()) showError = false;
    void refresh();
  }

  function onkeydown(e: KeyboardEvent): void {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open && options.length) open = true;
      if (options.length) active = (active + 1) % options.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open && options.length) open = true;
      if (options.length) active = active <= 0 ? options.length - 1 : active - 1;
    } else if (e.key === 'Escape') {
      if (open) { e.preventDefault(); close(); } else if (value) { e.preventDefault(); value = ''; hint = DEFAULT_HINT; }
    } else if (e.key === 'Enter' && open && active >= 0 && options[active]) {
      e.preventDefault();
      choose(options[active]!);
    } else if (e.key === 'Tab') {
      close();
    }
  }

  $effect(() => {
    if (active >= 0) document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
  });
</script>

<form class="search" role="search" novalidate onsubmit={(e) => { e.preventDefault(); choose(value); }}>
  <label class="search__label" for="q">Zoek een woord</label>
  <div class="search__row">
    <div class="combo">
      <Icon name="search" />
      <input
        id="q"
        name="q"
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="suggesties"
        aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
        aria-describedby={showError ? 'q-fout q-hint' : 'q-hint'}
        aria-invalid={showError ? 'true' : undefined}
        autocomplete="off"
        autocapitalize="none"
        spellcheck="false"
        enterkeyhint="search"
        maxlength="60"
        bind:value
        {oninput}
        {onkeydown}
        onfocus={() => { focused = true; void loadWords(); if (value && options.length) open = true; }}
        onblur={() => { focused = false; close(); }}
      />
    </div>
    <button class="btn btn--primary search__go" type="submit">Zoek</button>
  </div>
  <ul id="suggesties" role="listbox" aria-label="Woorden" hidden={!open}>
    {#each options as option, i (option)}
      {@const typedLength = Math.min(value.trim().length, option.length)}
      <!-- Keyboard use goes through the input (aria-activedescendant), as the ARIA combobox pattern prescribes;
           the options themselves are not focusable. The click is for mouse and touch. -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <li
        id={optionId(i)}
        role="option"
        aria-selected={i === active}
        onmousedown={(e) => e.preventDefault()}
        onclick={() => choose(option)}
      ><span>{option.slice(0, typedLength)}</span><b>{option.slice(typedLength)}</b></li>
    {/each}
  </ul>
  {#if showError}
    <p class="search__error" id="q-fout"><Icon name="alert" />Typ eerst een woord. Kies daarna Zoek.</p>
  {/if}
  <p class="search__hint" id="q-hint">{hint}</p>
</form>

<style>
  .search__label { display: block; font-weight: 700; font-size: 1.125rem; margin-bottom: 0.4rem; }
  .search__row { display: flex; gap: 0.75rem; }
  .combo { position: relative; flex: 1; min-width: 0; }
  .combo :global(.i) { position: absolute; left: 1rem; top: 50%; translate: 0 -50%; width: 1.5rem; height: 1.5rem; color: var(--muted); pointer-events: none; }
  input { width: 100%; min-height: 3.6rem; padding: 0.5rem 1rem 0.5rem 3.25rem; font-size: 1.375rem; background: var(--surface);
    color: var(--text); border: 2px solid var(--border); border-radius: var(--radius); }
  input:focus-visible { outline-offset: 0.125rem; }
  input[aria-invalid='true'] { border-width: 3px; border-color: var(--focus); }
  .search__go { min-height: 3.6rem; padding-inline: 1.4rem; font-size: 1.25rem; }
  .search__hint { margin-top: 0.4rem; font-size: 1rem; color: var(--muted); }
  .search__error { display: flex; gap: 0.5rem; align-items: center; margin-top: 0.4rem; font-weight: 700; font-size: 1.0625rem; }
  .search__error :global(.i) { color: var(--focus); }
  #suggesties { margin-top: 0.5rem; padding: 0.35rem; background: var(--surface); border: 2px solid var(--border);
    border-radius: var(--radius); max-height: 21rem; overflow: auto; }
  [role='option'] { display: flex; align-items: center; min-height: 3rem; padding: 0.35rem 0.9rem; border-radius: 0.6rem;
    font-size: 1.3125rem; cursor: pointer; }
  [role='option']:hover { background: var(--weak); }
  [role='option'][aria-selected='true'] { background: var(--weak); box-shadow: inset 0 0 0 2px var(--accent); }
  @media (max-width: 40rem) {
    .search__go { padding-inline: 1rem; }
  }
</style>
