<script lang="ts">
  /**
   * The keyboard shortcuts, with a switch to turn them off (WCAG 2.1.4).
   * Shown on every device with a keyboard; on touch-only devices after the first real key press (see input.svelte.ts).
   */
  import { saved, setPref } from '../lib/storage.svelte.ts';
  import { announce } from '../lib/status.svelte.ts';
  import Icon from './Icon.svelte';

  function onchange(e: Event): void {
    const on = (e.currentTarget as HTMLInputElement).checked;
    setPref('shortcuts', on);
    announce(on ? 'Sneltoetsen staan aan.' : 'Sneltoetsen staan uit.');
  }
</script>

<section class="keys" id="sneltoetsen" aria-labelledby="keys-kop">
  <div class="keys__head">
    <h2 id="keys-kop"><Icon name="keyboard" />Sneltoetsen</h2>
    <label class="toggle"><input type="checkbox" checked={saved.prefs.shortcuts} {onchange} />Sneltoetsen aan</label>
  </div>
  <p class="intro">Werkt als je niet in het zoekveld typt.</p>
  <dl>
    <div><dt><kbd>Spatie</kbd></dt><dd>Pauze of afspelen</dd></div>
    <div><dt><kbd>R</kbd></dt><dd>Opnieuw afspelen</dd></div>
    <div><dt><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd></dt><dd>Normaal, langzaam, heel langzaam</dd></div>
    <div><dt><kbd>S</kbd></dt><dd>Spiegel aan of uit</dd></div>
    <div><dt><kbd>F</kbd></dt><dd>Volledig scherm</dd></div>
    <div><dt><kbd>/</kbd></dt><dd>Naar het zoekveld</dd></div>
  </dl>
</section>

<style>
  .keys { margin-top: 3rem; padding: 1.5rem; background: var(--surface); border: 1px solid var(--line); border-radius: calc(var(--radius) + 0.4rem); }
  .keys__head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem 2rem; }
  h2 { display: flex; align-items: center; gap: 0.6rem; }
  .toggle { display: inline-flex; align-items: center; gap: 0.75rem; min-height: 2.75rem; font-size: 1.0625rem; cursor: pointer; }
  .toggle input { width: 1.5rem; height: 1.5rem; margin: 0; accent-color: var(--accent); }
  .intro { margin-top: 0.25rem; color: var(--muted); font-size: 1.0625rem; }
  dl { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr)); gap: 0.6rem 2rem; margin-top: 1rem; }
  dl div { display: flex; align-items: center; gap: 1rem; }
  dt { flex: none; min-width: 5.5rem; }
  kbd { display: inline-block; min-width: 2rem; padding: 0.1rem 0.5rem; text-align: center; font: 700 1rem/1.5 var(--font);
    background: var(--bg); border: 2px solid var(--border); border-bottom-width: 4px; border-radius: 0.45rem; }
</style>
