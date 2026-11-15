/** Keyboard-only use, the player controls, deep links and the lists on this device. */
import { expect, test } from '@playwright/test';
import { mockMedia, ownVisitor } from './helpers.ts';

test.beforeEach(async ({ page }) => { await ownVisitor(page); await mockMedia(page); });

test('skip link is the first stop and jumps to the content', async ({ page }) => {
  await page.goto('/huis');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Naar de inhoud' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#inhoud$/u);
});

test('search with the keyboard only: suggestions, arrows, Enter', async ({ page }) => {
  await page.goto('/');
  const box = page.getByRole('combobox', { name: 'Zoek een woord' });
  await box.focus();
  await page.keyboard.type('hu');
  const list = page.getByRole('listbox', { name: 'Woorden' });
  await expect(list).toBeVisible();
  await expect(box).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('ArrowDown');
  const active = await box.getAttribute('aria-activedescendant');
  expect(active).toBeTruthy();
  const word = (await page.locator(`#${active}`).textContent())?.trim() ?? '';
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(`/${encodeURIComponent(word)}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
});

test('typo-tolerant input: café without accent and dank je as one word', async ({ page }) => {
  for (const [typed, shown] of [['cafe', 'café'], ['dankje', 'dank je'], ['HUIS', 'huis']]) {
    await page.goto('/');
    await page.getByRole('combobox', { name: 'Zoek een woord' }).fill(typed!);
    await page.getByRole('button', { name: 'Zoek' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(shown!);
  }
});

test('empty search gives a clear message, not only a red border', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Zoek' }).click();
  await expect(page.getByText('Typ eerst een woord. Kies daarna Zoek.')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Zoek een woord' })).toHaveAttribute('aria-invalid', 'true');
});

test('player: Space pauses, speed and mirror are toggle buttons', async ({ page }) => {
  await page.goto('/huis');
  await expect(page.getByRole('button', { name: 'Pauze' })).toBeVisible();
  await page.locator('h1').click(); // focus out of any control
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Afspelen' })).toBeVisible();
  expect(await page.locator('video').evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);

  const slow = page.getByRole('button', { name: 'Heel langzaam' });
  await slow.click();
  await expect(slow).toHaveAttribute('aria-pressed', 'true');
  expect(await page.locator('video').evaluate((v: HTMLVideoElement) => v.playbackRate)).toBe(0.5);

  const mirror = page.getByRole('button', { name: 'Spiegel' });
  await mirror.click();
  await expect(mirror).toHaveAttribute('aria-pressed', 'true');
  expect(await page.locator('video').evaluate((v) => getComputedStyle(v).transform)).not.toBe('none');
});

test('touch only: the shortcuts help waits for a real keyboard', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'touch devices only');
  await page.goto('/huis');
  await expect(page.getByRole('button', { name: 'Pauze' })).toBeVisible();
  // Typing in the search field (an on-screen keyboard does that too) does not count.
  await page.getByRole('combobox', { name: 'Zoek een woord' }).pressSequentially('huis');
  await expect(page.getByRole('link', { name: 'Sneltoetsen' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Sneltoetsen' })).toHaveCount(0);
  // Tab only comes from a real keyboard (or switch software): now the help and the on/off switch are there.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Sneltoetsen' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Sneltoetsen aan' })).toBeAttached();
});

test('shortcuts can be switched off (WCAG 2.1.4)', async ({ page }) => {
  await page.goto('/huis');
  await page.keyboard.press('Tab'); // on touch devices, the switch appears after the first real key press
  await page.getByRole('checkbox', { name: 'Sneltoetsen aan' }).uncheck();
  await page.locator('h1').click();
  await page.keyboard.press('r');
  await page.keyboard.press('s');
  await expect(page.getByRole('button', { name: 'Spiegel' })).toHaveAttribute('aria-pressed', 'false');
});

test('variants are tabs: arrow keys switch the video', async ({ page }) => {
  await page.goto('/huis');
  const first = page.getByRole('tab', { name: 'Gebaar 1 van 2' });
  await expect(first).toHaveAttribute('aria-selected', 'true');
  const src1 = await page.locator('video').getAttribute('src');
  await first.focus();
  await page.keyboard.press('ArrowRight');
  const second = page.getByRole('tab', { name: 'Gebaar 2 van 2' });
  await expect(second).toBeFocused();
  await expect(second).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('video')).not.toHaveAttribute('src', src1 ?? '');
});

test('favourites and recent searches stay after a reload; the back button works', async ({ page }) => {
  await page.goto('/huis');
  await page.getByRole('button', { name: 'Bewaar' }).click();
  await expect(page.getByRole('button', { name: 'Bewaar' })).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/koffie');
  await page.reload();
  const bewaard = page.locator('#bewaard');
  await expect(bewaard.getByRole('link', { name: 'huis' })).toBeVisible();
  await expect(page.locator('#recent').getByRole('link', { name: 'koffie' })).toBeVisible();

  await bewaard.getByRole('link', { name: 'huis' }).click();
  await expect(page).toHaveURL('/huis');
  await page.goBack();
  await expect(page).toHaveURL('/koffie');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('koffie');
});

test('not found: suggestions are links that work', async ({ page }) => {
  await page.goto('/kinderopvangje');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('kinderopvangje');
  await page.getByRole('link', { name: 'kinderopvang' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('kinderopvang');
});

test('reduced motion: the video waits for Afspelen', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/huis');
  await expect(page.getByRole('button', { name: 'Afspelen' })).toBeVisible();
  expect(await page.locator('video').evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
});

test('status messages are announced in a live region', async ({ page }) => {
  await page.goto('/huis');
  await expect(page.getByRole('status')).toHaveText('Gevonden: 2 gebaren voor huis.');
});
