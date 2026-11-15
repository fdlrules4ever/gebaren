/**
 * What kind of device is this? Two questions the interface needs:
 *
 * - `touch`: a phone or tablet (touch first). Used for video mode when the phone is held sideways.
 *   This looks at the device type, not at the `hover`/`pointer` media features: some phones
 *   (Samsung Internet on Galaxy phones, for example) claim a mouse that can hover.
 * - `keyboard`: is there a real keyboard? Without one, the shortcuts help is just clutter.
 *   Computers count as having one. On a phone or tablet, the help appears with the first key that an
 *   on-screen keyboard does not send: Tab, arrows, Escape, a key with Ctrl/Alt/Cmd, or any key outside a text field.
 *   That covers Bluetooth keyboards, and switch or speech software that sends keys (they need the on/off switch most).
 *
 * The shortcuts themselves always work; only the help text and the "Sneltoetsen" link wait.
 */
function isTouchFirst(): boolean {
  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  if (nav.userAgentData?.mobile) return true;
  const ua = nav.userAgent;
  if (/Android|iPhone|iPad|iPod/iu.test(ua)) return true;
  return /Macintosh/iu.test(ua) && nav.maxTouchPoints > 1; // an iPad asks for the desktop site by default
}

const touch = isTouchFirst();

export const input = $state({ touch, keyboard: !touch });

const NAV_KEYS = new Set(['Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown']);

function inTextField(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"]') !== null;
}

function onKey(e: KeyboardEvent): void {
  // On-screen keyboards on Android report most keys as "Unidentified" or "Process".
  if (e.isComposing || e.key === 'Unidentified' || e.key === 'Process') return;
  if (NAV_KEYS.has(e.key) || e.ctrlKey || e.altKey || e.metaKey || !inTextField(e.target)) {
    input.keyboard = true;
    window.removeEventListener('keydown', onKey, true);
  }
}

if (!input.keyboard) window.addEventListener('keydown', onKey, true);
