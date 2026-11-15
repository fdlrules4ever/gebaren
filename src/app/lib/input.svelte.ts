/**
 * Is there a real keyboard? On a phone or tablet without one, the shortcuts help is just clutter.
 *
 * - A device with a mouse or trackpad counts as having a keyboard (desktops, laptops, tablets with a keyboard cover).
 * - On a touch-only device, the help appears with the first key that an on-screen keyboard does not send:
 *   Tab, arrows, Escape, a key with Ctrl/Alt/Cmd, or any key pressed outside a text field.
 *   That covers Bluetooth keyboards, and switch or speech software that sends keys (they need the on/off switch most).
 *
 * The shortcuts themselves always work; only the help text and the "Sneltoetsen" link wait.
 */
const pointer = window.matchMedia('(any-hover: hover), (any-pointer: fine)');

export const input = $state({ keyboard: pointer.matches });

const NAV_KEYS = new Set(['Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown']);

function inTextField(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"]') !== null;
}

function onKey(e: KeyboardEvent): void {
  // On-screen keyboards on Android report most keys as "Unidentified" or "Process".
  if (e.isComposing || e.key === 'Unidentified' || e.key === 'Process') return;
  if (NAV_KEYS.has(e.key) || e.ctrlKey || e.altKey || e.metaKey || !inTextField(e.target)) found();
}

function onPointer(): void {
  if (pointer.matches) found();
}

function found(): void {
  input.keyboard = true;
  window.removeEventListener('keydown', onKey, true);
  pointer.removeEventListener('change', onPointer);
}

if (!input.keyboard) {
  window.addEventListener('keydown', onKey, true);
  pointer.addEventListener('change', onPointer);
}
