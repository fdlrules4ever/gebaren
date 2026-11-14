<script lang="ts">
  /** Decorative icons. Every icon in the app sits next to a visible text label. */
  export type IconName =
    | 'search' | 'play' | 'pause' | 'replay' | 'mirror' | 'fullscreen' | 'star' | 'clock' | 'keyboard' | 'external'
    | 'info' | 'notfound' | 'alert' | 'check' | 'hands' | 'retry' | 'wifi-off';

  let { name, class: className = 'i' }: { name: IconName; class?: string } = $props();
</script>

<svg class={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  {#if name === 'search'}
    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" />
  {:else if name === 'play'}
    <path d="M7.5 4.6v14.8a.9.9 0 0 0 1.37.77l11.8-7.4a.9.9 0 0 0 0-1.54L8.87 3.83A.9.9 0 0 0 7.5 4.6z" fill="currentColor" stroke="none" />
  {:else if name === 'pause'}
    <rect x="6" y="4.5" width="4.2" height="15" rx="1.2" fill="currentColor" stroke="none" />
    <rect x="13.8" y="4.5" width="4.2" height="15" rx="1.2" fill="currentColor" stroke="none" />
  {:else if name === 'replay'}
    <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" /><path d="M3.5 4v5h5" />
  {:else if name === 'mirror'}
    <path d="M12 3v18" stroke-dasharray="2.5 2.5" /><path d="M9 7v10l-6-5z" /><path d="M15 7v10l6-5z" fill="currentColor" />
  {:else if name === 'fullscreen'}
    <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
  {:else if name === 'star'}
    <path d="m12 3.6 2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.9l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z" />
  {:else if name === 'clock'}
    <circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" />
  {:else if name === 'keyboard'}
    <rect x="2.5" y="6" width="19" height="12" rx="2" /><path d="M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M7.5 14h9" />
  {:else if name === 'external'}
    <path d="M14 4h6v6M20 4l-8.5 8.5" /><path d="M18.5 14v4.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18.5V7a1.5 1.5 0 0 1 1.5-1.5H10" />
  {:else if name === 'info'}
    <circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 7.6h.01" />
  {:else if name === 'notfound'}
    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6M8.6 8.6l4.8 4.8M13.4 8.6l-4.8 4.8" />
  {:else if name === 'alert'}
    <path d="M12 3.5 2.8 19.5h18.4z" /><path d="M12 10v4.5M12 17h.01" />
  {:else if name === 'check'}
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  {:else if name === 'retry'}
    <path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" /><path d="M20.5 4v5h-5" />
  {:else if name === 'wifi-off'}
    <path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5.2-2.8M19 13a10 10 0 0 0-2.2-1.6M2 9.5a15 15 0 0 1 4.3-2.9M22 9.5A15 15 0 0 0 11 5.6M12 20h.01" />
  {:else if name === 'hands'}
    <path d="M7.5 20.5c-2.2-1.4-3.5-3.7-3.5-6.5V9.5a1.5 1.5 0 0 1 3 0V12" /><path d="M7 12V5.5a1.5 1.5 0 0 1 3 0V11" />
    <path d="M10 11V4a1.5 1.5 0 0 1 3 0v7" /><path d="M13 11V5.5a1.5 1.5 0 0 1 3 0V13c0 1 .4 1.7 1 2.2" />
    <path d="M16 9.5a1.5 1.5 0 0 1 3 0V14c0 3.6-2.6 6.5-6.5 6.5h-1" />
  {/if}
</svg>
