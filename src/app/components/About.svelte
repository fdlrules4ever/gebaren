<script lang="ts">
  import Icon from './Icon.svelte';
</script>

<article class="wrap about" aria-labelledby="woord">
  <h1 id="woord" tabindex="-1">Over Gebaren</h1>
  <p class="lead">Met Gebaren zoek je snel een gebaar in Nederlandse Gebarentaal (NGT). Je typt een Nederlands woord. Dan zie je meteen een video van het gebaar.</p>

  <section aria-labelledby="bronnen">
    <h2 id="bronnen">Bronnen</h2>
    <p>Gebaren maakt zelf geen video's. Bij elke video staat waar hij vandaan komt.</p>
    <ul>
      <li><strong>NGT Signbank</strong> van de Radboud Universiteit en de Universiteit van Amsterdam. Licentie
        <a href="https://creativecommons.org/licenses/by/4.0/deed.nl" target="_blank" rel="noopener">CC BY 4.0<span class="sr-only"> (opent in een nieuw tabblad)</span></a>.
        <a href="https://signbank.cls.ru.nl/datasets/NGT/" target="_blank" rel="noopener">Naar NGT Signbank<Icon name="external" class="i ext" /><span class="sr-only"> (opent in een nieuw tabblad)</span></a></li>
      <li><strong>LerenGebaren.nl</strong>, voor woorden die niet in Signbank staan. Licentie
        <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.nl" target="_blank" rel="noopener">CC BY-SA 4.0<span class="sr-only"> (opent in een nieuw tabblad)</span></a>.</li>
      <li><strong>Het gebaar van de dag</strong> op YouTube, voor een paar woorden.</li>
    </ul>
    <p>Wil je meer gebaren? Kijk dan ook bij het
      <a href="https://ow.gebarencentrum.nl/" target="_blank" rel="noopener">Nederlands Gebarencentrum<Icon name="external" class="i ext" /><span class="sr-only"> (opent in een nieuw tabblad)</span></a>.</p>
  </section>

  <section aria-labelledby="privacy">
    <h2 id="privacy">Privacy</h2>
    <ul>
      <li>Gebaren gebruikt geen cookies en volgt je niet.</li>
      <li>Laatst gezocht, Bewaard en je instellingen blijven op dit apparaat. Wis ze met <strong>Wis deze lijst</strong> of via je browser.</li>
      <li>De website draait bij Cloudflare. Die houdt kort technische gegevens bij, zoals je IP-adres, om de site veilig te houden.</li>
    </ul>
  </section>

  <section aria-labelledby="toegankelijkheid">
    <h2 id="toegankelijkheid">Toegankelijkheid</h2>
    <p>Gebaren is gemaakt voor iedereen: voor doven en slechthorenden, en voor mensen die NGT leren.</p>
    <ul>
      <li>We volgen de richtlijnen WCAG 2.2 op niveau AA. Waar het kan, gaan we verder.</li>
      <li>Alles werkt met het toetsenbord. Knoppen zijn groot en hebben altijd tekst.</li>
      <li>De video's hebben geen geluid. De betekenis staat er altijd in tekst bij.</li>
      <li>Wil je minder beweging? Zet dat aan op je apparaat. Dan start de video pas als jij op <strong>Afspelen</strong> drukt.</li>
    </ul>
    <p>Werkt iets niet goed voor jou? Meld het op
      <a href="https://github.com/fdlrules4ever/gebaren/issues" target="_blank" rel="noopener">GitHub<Icon name="external" class="i ext" /><span class="sr-only"> (opent in een nieuw tabblad)</span></a>.</p>
  </section>

  <p><a href="/">Terug naar zoeken</a></p>
</article>

<style>
  .about { display: grid; gap: 2rem; max-width: 48rem; }
  h1 { font-size: clamp(2.25rem, 1.6rem + 2.6vw, 3.5rem); }
  .lead { font-size: 1.375rem; }
  section { display: grid; gap: 0.75rem; }
  ul { display: grid; gap: 0.5rem; padding-left: 1.25em; }
</style>
