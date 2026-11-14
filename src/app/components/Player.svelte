<script lang="ts">
  /**
   * The video, as big as the screen allows, with our own large controls (all at least 44 px, icon plus text).
   * Muted, inline, looping. Autoplays unless the user asked for reduced motion (then it waits for "Afspelen").
   * mp4 videos use a <video> element; YouTube overrides use the privacy-friendly embed, steered with postMessage.
   */
  import type { SignResult } from '../../shared/types.ts';
  import { saved, setPref, type Speed } from '../lib/storage.svelte.ts';
  import { announce } from '../lib/status.svelte.ts';
  import Icon from './Icon.svelte';

  let { result, word, describedby }: { result: SignResult; word: string; describedby: string } = $props();

  const SPEEDS: Array<{ value: Speed; label: string }> = [
    { value: 1, label: 'Normaal' },
    { value: 0.75, label: 'Langzaam' },
    { value: 0.5, label: 'Heel langzaam' },
  ];
  const YT_ORIGIN = 'https://www.youtube-nocookie.com';

  let wrapper = $state<HTMLDivElement>();
  let video = $state<HTMLVideoElement>();
  let frame = $state<HTMLIFrameElement>();
  let paused = $state(true);
  let failed = $state(false);

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduce = $state(motion.matches);
  $effect(() => {
    const update = (): void => { reduce = motion.matches; };
    motion.addEventListener('change', update);
    return () => motion.removeEventListener('change', update);
  });

  const isYoutube = $derived(result.kind === 'youtube');
  const ytSrc = $derived(isYoutube
    ? `${result.videoUrl}?${new URLSearchParams({
      autoplay: reduce ? '0' : '1', mute: '1', loop: '1', playlist: result.sourceId ?? '', playsinline: '1',
      controls: '0', rel: '0', enablejsapi: '1', origin: location.origin,
    })}`
    : '');
  const label = $derived(`Video van het gebaar voor ${word}. De video heeft geen geluid.`);

  function yt(func: string, args: unknown[] = []): void {
    frame?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), YT_ORIGIN);
  }

  function onYtLoad(): void {
    frame?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), YT_ORIGIN);
    yt('mute');
    yt('setPlaybackRate', [saved.prefs.speed]);
    paused = reduce;
  }

  $effect(() => {
    if (!isYoutube) return;
    const onMessage = (e: MessageEvent): void => {
      if (e.origin !== YT_ORIGIN || e.source !== frame?.contentWindow || typeof e.data !== 'string') return;
      try {
        const data = JSON.parse(e.data) as { event?: string; info?: unknown };
        const info = data.info as { playerState?: number } | number | undefined;
        const state = data.event === 'onStateChange' ? info : data.event === 'infoDelivery' && typeof info === 'object' ? info?.playerState : undefined;
        if (typeof state === 'number') paused = state !== 1 && state !== 3; // 1 = playing, 3 = buffering
      } catch { /* not a player message */ }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  });

  function start(): void {
    if (!video) return;
    video.muted = true;
    video.defaultPlaybackRate = saved.prefs.speed;
    video.playbackRate = saved.prefs.speed;
    failed = false;
    if (!reduce) video.play().catch(() => { paused = true; });
  }

  // Reduced motion switched on while the video plays: stop it.
  $effect(() => {
    if (!reduce) return;
    video?.pause();
    if (isYoutube) { yt('pauseVideo'); paused = true; }
  });

  function toggle(): void {
    if (isYoutube) {
      yt(paused ? 'playVideo' : 'pauseVideo');
      paused = !paused;
      return;
    }
    if (!video) return;
    if (video.paused) video.play().catch(() => announce('De video kan nu niet afspelen.'));
    else video.pause();
  }

  function replay(): void {
    if (isYoutube) { yt('seekTo', [0, true]); yt('playVideo'); paused = false; }
    else if (video) { video.currentTime = 0; video.play().catch(() => { paused = true; }); }
    announce('De video begint opnieuw.');
  }

  function setSpeed(value: Speed): void {
    setPref('speed', value);
    if (video) { video.defaultPlaybackRate = value; video.playbackRate = value; }
    if (isYoutube) yt('setPlaybackRate', [value]);
    announce(`Snelheid: ${SPEEDS.find((s) => s.value === value)?.label ?? ''}.`);
  }

  function toggleMirror(): void {
    const on = !saved.prefs.mirror;
    setPref('mirror', on);
    announce(on ? 'Spiegel staat aan.' : 'Spiegel staat uit.');
  }

  async function fullscreen(): Promise<void> {
    if (document.fullscreenElement) { await document.exitFullscreen().catch(() => {}); return; }
    if (wrapper?.requestFullscreen) {
      try { await wrapper.requestFullscreen(); return; } catch { /* try the video itself below */ }
    }
    const v = video as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | undefined;
    if (v?.webkitEnterFullscreen) v.webkitEnterFullscreen(); // iPhone
    else announce('Volledig scherm werkt niet in deze browser.');
  }

  function onkeydown(e: KeyboardEvent): void {
    if (!saved.prefs.shortcuts || e.ctrlKey || e.metaKey || e.altKey) return;
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const key = e.key.toLowerCase();
    if (key === ' ') {
      if (target.closest('button, a, summary, [role="tab"]')) return; // Space already activates these
      e.preventDefault();
      toggle();
    } else if (key === 'r') replay();
    else if (key === 's') toggleMirror();
    else if (key === 'f') void fullscreen();
    else if (key === '1') setSpeed(1);
    else if (key === '2') setSpeed(0.75);
    else if (key === '3') setSpeed(0.5);
  }
</script>

<svelte:window {onkeydown} />

<div class="player" bind:this={wrapper}>
  <div class="stage" class:mirrored={saved.prefs.mirror}>
    {#if isYoutube}
      <div class="frame">
        <iframe
          bind:this={frame}
          src={ytSrc}
          title={label}
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerpolicy="strict-origin-when-cross-origin"
          onload={onYtLoad}
        ></iframe>
      </div>
    {:else}
      <video
        bind:this={video}
        bind:paused
        src={result.videoUrl}
        poster={result.posterUrl}
        muted
        loop
        playsinline
        preload="auto"
        disableremoteplayback
        aria-label={label}
        aria-describedby={describedby}
        onloadedmetadata={start}
        onerror={() => { failed = true; paused = true; }}
      ></video>
    {/if}
  </div>

  {#if failed}
    <p class="failed" role="alert">
      <Icon name="alert" />
      <span>Deze video laadt nu niet.
        <button type="button" class="linkbtn" onclick={() => { failed = false; video?.load(); }}>Probeer het opnieuw</button>
      </span>
    </p>
  {/if}

  <div class="controls" role="group" aria-label="Video bedienen">
    <button type="button" class="btn btn--primary ctl--main" onclick={toggle}>
      <Icon name={paused ? 'play' : 'pause'} />{paused ? 'Afspelen' : 'Pauze'}
    </button>
    <button type="button" class="btn" onclick={replay}><Icon name="replay" />Opnieuw</button>
    <div class="speed" role="group" aria-labelledby="snelheid-label">
      <span class="speed__label" id="snelheid-label">Snelheid</span>
      {#each SPEEDS as s (s.value)}
        <button type="button" class="seg" aria-pressed={saved.prefs.speed === s.value} onclick={() => setSpeed(s.value)}>
          <Icon name="check" class="i i-on" />{s.label}
        </button>
      {/each}
    </div>
    <button type="button" class="btn" aria-pressed={saved.prefs.mirror} onclick={toggleMirror}>
      <Icon name="mirror" class="i i-off" /><Icon name="check" class="i i-on" />Spiegel
    </button>
    <button type="button" class="btn" onclick={fullscreen}><Icon name="fullscreen" />Volledig scherm</button>
  </div>
</div>

<style>
  .stage {
    --vmax: clamp(15rem, calc(100svh - 24.5rem), 76vh);
    width: min(100% - 2rem, 70rem);
    margin-inline: auto;
    padding: clamp(0.5rem, 1vw, 0.75rem);
    background: var(--stage);
    border-radius: calc(var(--radius) + 0.4rem);
  }
  video, .frame {
    width: min(100%, calc(var(--vmax) * 16 / 9));
    aspect-ratio: 16 / 9;
    height: auto;
    margin-inline: auto;
    object-fit: contain;
    background: var(--stage);
    border-radius: 0.6rem;
    filter: var(--video-filter);
  }
  .frame { overflow: hidden; }
  iframe { width: 100%; height: 100%; border: 0; }
  .mirrored video, .mirrored iframe { transform: scaleX(-1); }

  .failed { display: flex; gap: 0.6rem; align-items: flex-start; width: min(100% - 2rem, 70rem); margin: 0.75rem auto 0;
    padding: 0.75rem 1rem; background: var(--surface); border: 2px solid var(--focus); border-radius: var(--radius); }
  .failed :global(.i) { color: var(--focus); margin-top: 0.25rem; }

  .controls { display: flex; flex-wrap: wrap; justify-content: center; align-items: stretch; gap: 0.75rem; margin-top: 1rem;
    padding-left: var(--gutter); padding-right: var(--gutter-r); }
  .ctl--main { min-width: 10rem; }
  .speed { display: inline-flex; flex-wrap: wrap; align-items: stretch; max-width: 100%; border: 2px solid var(--border);
    border-radius: var(--radius); background: var(--surface); overflow: hidden; }
  .speed > * { flex: 1 1 auto; }
  .speed__label { display: flex; align-items: center; padding-inline: 1rem; font-size: 1.0625rem; color: var(--muted);
    border-right: 1px solid var(--line); }
  .seg { display: inline-flex; align-items: center; gap: 0.35rem; min-height: 2.75rem; padding: 0.4rem 0.95rem; border: 0;
    background: transparent; font-weight: 700; font-size: 1.0625rem; }
  .seg + .seg { border-left: 1px solid var(--line); }
  .seg:hover { background: var(--weak); }
  .seg[aria-pressed='true'] { background: var(--weak); box-shadow: inset 0 -0.25rem 0 var(--accent); }
  .seg :global(.i) { width: 1.1rem; height: 1.1rem; }

  .player:fullscreen { display: flex; flex-direction: column; justify-content: center; gap: 1rem; padding: 1rem;
    background: var(--bg); overflow: auto; }
  .player:fullscreen .stage { width: 100%; max-width: none; }
  .player:fullscreen video, .player:fullscreen .frame { width: min(100%, calc((100vh - 10rem) * 16 / 9)); }

  /* Phones: video edge to edge, controls in a grid. */
  @media (max-width: 40rem) {
    .stage { width: 100%; padding: 0; border-radius: 0; }
    video, .frame { border-radius: 0; }
    .controls { display: grid; grid-template-columns: 1fr 1fr; }
    .ctl--main { min-width: 0; }
    .speed { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3, 1fr); }
    .speed__label { grid-column: 1 / -1; padding: 0.35rem 0.9rem; border-right: 0; border-bottom: 1px solid var(--line); }
    .seg { justify-content: center; padding-inline: 0.4rem; font-size: 1rem; }
    .seg:nth-child(2) { border-left: 0; }
  }

  /* Phone on its side: the video fills the height, controls beside it. */
  @media (orientation: landscape) and (max-height: 32rem) {
    .player { display: grid; grid-template-columns: auto minmax(13rem, 1fr); gap: 1rem; align-items: start;
      padding-left: var(--gutter); padding-right: var(--gutter-r); }
    .stage { width: auto; padding: 0; border-radius: 0.6rem; }
    video, .frame { width: min(100%, calc((100svh - 1.5rem) * 16 / 9)); }
    .controls { display: grid; grid-template-columns: 1fr; margin-top: 0; padding: 0; }
    .speed { display: grid; grid-template-columns: 1fr; }
    .speed__label { border-right: 0; border-bottom: 1px solid var(--line); }
    .seg + .seg { border-left: 0; border-top: 1px solid var(--line); }
    .failed { grid-column: 1 / -1; }
  }
</style>
