<script lang="ts">
  /** The start screen: what Gebaren does, in three steps. */
</script>

<section class="wrap" aria-labelledby="woord">
  <div class="intro">
    <h1 id="woord" tabindex="-1">Zoek een gebaar</h1>
    <p>Typ een woord. Je ziet meteen het gebaar in Nederlandse Gebarentaal (NGT).</p>
    <ol class="steps" aria-label="Zo werkt het">
      <li>Typ een woord</li>
      <li>Kies uit de lijst</li>
      <li>Bekijk het gebaar</li>
    </ol>
  </div>
</section>

<style>
  .intro { display: grid; gap: 1rem; max-width: 46rem; }
  h1 { font-size: clamp(2.25rem, 1.6rem + 2.6vw, 3.5rem); line-height: 1.08; }
  p { font-size: 1.375rem; }
  .steps { display: flex; flex-wrap: wrap; gap: 0.75rem 1.75rem; margin-top: 0.5rem; counter-reset: stap; }
  .steps li { display: flex; align-items: center; gap: 0.6rem; font-size: 1.125rem; counter-increment: stap; }
  .steps li::before { content: counter(stap); display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: 50%;
    background: var(--surface); border: 2px solid var(--border); font-weight: 700; font-size: 1rem; }
</style>
