/** One polite live region for status messages (searching, found, not found, errors, player changes). */
export const status = $state({ message: '' });

let timer: ReturnType<typeof setTimeout> | undefined;

/** Clears first, so the same message is announced again when it repeats. */
export function announce(message: string): void {
  clearTimeout(timer);
  status.message = '';
  timer = setTimeout(() => { status.message = message; }, 60);
}
