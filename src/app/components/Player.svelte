<script lang="ts">
  /**
   * The video, as big as the screen allows, with our own large controls (all at least 44 px, icon plus text).
   * Muted, inline, looping. Autoplays unless the user asked for reduced motion (then it waits for "Afspelen").
   * mp4 videos use a <video> element; YouTube overrides use the privacy-friendly embed, steered with postMessage.
   *
   * Video mode (full screen, or a touch phone on its side): the video fills the screen and the controls float over it.
   * While the video plays they fade out after 3 seconds, like most video apps. A tap on the video, a mouse move,
   * a key press or keyboard focus brings them back; while paused, or while the keyboard is on them, they stay.
   * Hidden controls stay in the accessibility tree, so screen readers can always reach them.
   */
  import { untrack } from 'svelte';
  import type { SignResult } from '../../shared/types.ts';
  import { saved, setPref, type Speed } from '../lib/storage.svelte.ts';
  import { announce } from '../lib/status.svelte.ts';
  import { input } from '../lib/input.svelte.ts';
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
  let controls = $state<HTMLDivElement>();

  // Video mode: full screen, or a phone or tablet on its side with a low screen.
  // (A low window or a zoomed-in computer keeps the normal layout, with the controls beside the video.)
  const LOW_AND_WIDE = window.matchMedia('(orientation: landscape) and (max-height: 32rem)');
  const isSideways = (): boolean => input.touch && LOW_AND_WIDE.matches;
  const HIDE_AFTER_MS = 3000;
  let sideways = $state(isSideways());
  let isFullscreen = $state(false);
  let idle = $state(false);
  const videoMode = $derived(isFullscreen || sideways);
  const hideControls = $derived(videoMode && idle && !paused);
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  let mouse = false; // was the last pointer a mouse?
  let inView = false; // is the player on screen?

  /** Shows the controls, and in video mode starts the timer that fades them out again while the video plays. */
  function wake(): void {
    idle = false;
    clearTimeout(hideTimer);
    if (!videoMode || paused) return;
    hideTimer = setTimeout(() => {
      // Never hide them from under the keyboard or the mouse.
      if (controls?.querySelector(':focus-visible') || (mouse && controls?.matches(':hover'))) wake();
      else idle = true;
    }, HIDE_AFTER_MS);
  }

  // Entering or leaving video mode, play and pause: show the controls (again).
  $effect(() => {
    void videoMode;
    void paused;
    untrack(wake);
  });
  $effect(() => () => clearTimeout(hideTimer));

  $effect(() => {
    const onFullscreen = (): void => { isFullscreen = wrapper !== undefined && document.fullscreenElement === wrapper; };
    const onTurn = (): void => {
      const now = isSideways();
      const turned = now && !sideways;
      sideways = now;
      // Turned the phone while watching: show the whole video (its exact top, ignoring the page's scroll padding).
      if (turned && inView) requestAnimationFrame(() => { if (wrapper) scrollTo({ top: wrapper.getBoundingClientRect().top + scrollY }); });
    };
    document.addEventListener('fullscreenchange', onFullscreen);
    LOW_AND_WIDE.addEventListener('change', onTurn);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreen);
      LOW_AND_WIDE.removeEventListener('change', onTurn);
    };
  });

  $effect(() => {
    const el = wrapper;
    if (!el) return;
    const seen = new IntersectionObserver(([entry]) => { inView = entry?.isIntersecting ?? false; }, { threshold: 0.25 });
    seen.observe(el);
    // In video mode, a tap on the video shows the controls, or hides them again (like most video apps).
    const onPointerDown = (e: PointerEvent): void => {
      mouse = e.pointerType === 'mouse';
      if (!videoMode) return;
      if (hideControls || paused || mouse || controls?.contains(e.target as Node)) wake();
      else { clearTimeout(hideTimer); idle = true; }
    };
    const onPointerMove = (e: PointerEvent): void => {
      mouse = e.pointerType === 'mouse';
      if (mouse && videoMode) wake();
    };
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('focusin', wake);
    return () => {
      seen.disconnect();
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('focusin', wake);
    };
  });

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

  // Video mode has one speed button that steps through the speeds, so all controls fit on one row.
  const speedLabel = $derived(SPEEDS.find((s) => s.value === saved.prefs.speed)?.label ?? 'Normaal');
  function nextSpeed(): void {
    const i = SPEEDS.findIndex((s) => s.value === saved.prefs.speed);
    setSpeed(SPEEDS[(i + 1) % SPEEDS.length]!.value);
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
    if (videoMode) wake();
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

<div class="player" class:video-mode={videoMode} class:hide-controls={hideControls} bind:this={wrapper}>
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
      {#if videoMode}
        <!-- Taps on the embedded player never reach this page; this layer catches them (the embed has no controls). -->
        <div class="tap" aria-hidden="true"></div>
      {/if}
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

  <div class="controls" role="group" aria-label="Video bedienen" bind:this={controls}>
    <!-- .fit keeps room for the longest label, so the buttons do not jump when a label changes. -->
    <button type="button" class="btn btn--primary ctl--main" onclick={toggle}>
      <Icon name={paused ? 'play' : 'pause'} /><span class="fit" data-widest="Afspelen"><span>{paused ? 'Afspelen' : 'Pauze'}</span></span>
    </button>
    <button type="button" class="btn" onclick={replay}><Icon name="replay" />Opnieuw</button>
    {#if videoMode}
      <button type="button" class="btn" onclick={nextSpeed}>
        <Icon name="speed" /><span class="sr-only">Snelheid:&#32;</span><span class="fit" data-widest="Heel langzaam"><span>{speedLabel}</span></span>
      </button>
    {:else}
      <div class="speed" role="group" aria-labelledby="snelheid-label">
        <span class="speed__label" id="snelheid-label">Snelheid</span>
        {#each SPEEDS as s (s.value)}
          <button type="button" class="seg" aria-pressed={saved.prefs.speed === s.value} onclick={() => setSpeed(s.value)}>
            <Icon name="check" class="i i-on" />{s.label}
          </button>
        {/each}
      </div>
    {/if}
    <button type="button" class="btn" aria-pressed={saved.prefs.mirror} onclick={toggleMirror}>
      <Icon name="mirror" class="i i-off" /><Icon name="check" class="i i-on" />Spiegel
    </button>
    <button type="button" class="btn" aria-pressed={isFullscreen} onclick={fullscreen}>
      <Icon name="fullscreen" class="i i-off" /><Icon name="fullscreen-exit" class="i i-on" />Volledig scherm
    </button>
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
  .fit { display: inline-grid; justify-items: start; }
  .fit > span, .fit::after { grid-area: 1 / 1; }
  .fit::after { content: attr(data-widest); visibility: hidden; }

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

  /* Low and wide, not in video mode (a low window, or a computer zoomed in): video and controls side by side.
     (Phones on their side and full screen use video mode, below. Not keyed to hover/pointer: some phones claim a mouse.) */
  @media (orientation: landscape) and (max-height: 32rem) {
    .player:not(.video-mode) { display: grid; grid-template-columns: auto minmax(13rem, 1fr); gap: 1rem; align-items: start;
      padding-left: var(--gutter); padding-right: var(--gutter-r); }
    .player:not(.video-mode) .stage { width: auto; padding: 0; border-radius: 0.6rem; }
    .player:not(.video-mode) video, .player:not(.video-mode) .frame { width: min(100%, calc((100svh - 1.5rem) * 16 / 9)); }
    .player:not(.video-mode) .controls { display: grid; grid-template-columns: 1fr; margin-top: 0; padding: 0; }
    .player:not(.video-mode) .speed { display: grid; grid-template-columns: 1fr; }
    .player:not(.video-mode) .speed__label { border-right: 0; border-bottom: 1px solid var(--line); }
    .player:not(.video-mode) .seg + .seg { border-left: 0; border-top: 1px solid var(--line); }
    .player:not(.video-mode) .failed { grid-column: 1 / -1; }
  }

  /* Video mode: the video fills the screen (the browser sizes a full-screen element itself) and the controls
     float over the bottom edge as one slim row (two when upright), on a solid bar so every label keeps its contrast. */
  .player.video-mode { position: relative; display: flex; flex-direction: column; height: 100svh; padding: 0; background: var(--stage); }
  .video-mode .stage { position: relative; flex: 1; min-height: 0; width: 100%; padding: 0; border-radius: 0; }
  .video-mode video, .video-mode .frame { position: absolute; inset: 0; width: 100%; height: 100%; aspect-ratio: auto; border-radius: 0; }
  .tap { position: absolute; inset: 0; }
  .video-mode .failed { position: absolute; z-index: 2; top: 1rem; left: var(--gutter); right: var(--gutter-r); width: auto; margin: 0; }
  .video-mode .controls { position: absolute; z-index: 1; left: 0; right: 0; bottom: 0; display: flex; flex-wrap: wrap;
    justify-content: center; gap: 0.5rem; margin: 0;
    padding: 0.5rem max(0.75rem, env(safe-area-inset-right, 0px)) max(0.5rem, env(safe-area-inset-bottom, 0px)) max(0.75rem, env(safe-area-inset-left, 0px));
    background: var(--surface); border-top: 1px solid var(--line); transition: opacity 0.2s ease; }
  .video-mode .ctl--main { min-width: 0; }
  .video-mode .btn { min-height: 2.75rem; gap: 0.45rem; padding: 0.3rem 0.75rem; font-size: 0.9375rem; }
  /* Faded out: no longer in the way of taps (a tap brings them back), but still there for screen readers and keyboards. */
  .hide-controls .controls:not(:has(:focus-visible)) { opacity: 0; pointer-events: none; }
  .hide-controls { cursor: none; }
</style>
