/** Video mode: full screen, or a touch phone on its side. The video fills the screen and the controls float over it. */
import { expect, test, type Page } from '@playwright/test';
import { axe, mockMedia, ownVisitor } from './helpers.ts';

const SIDEWAYS = { width: 863, height: 360 }; // Pixel 7 on its side

test.beforeEach(async ({ page }) => { await ownVisitor(page); await mockMedia(page); });

/** Tabs until the keyboard focus is on one of the player controls. */
async function tabIntoControls(page: Page): Promise<void> {
  for (let i = 0; i < 40; i++) {
    if (await page.evaluate(() => document.activeElement?.closest('.controls') !== null && document.activeElement !== null)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error('Tab never reached the player controls');
}

test('full screen: the video fills the screen and the controls float over it', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop browser');
  await page.goto('/huis');
  const button = page.getByRole('button', { name: 'Volledig scherm' });
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.player')).toHaveClass(/video-mode/u);
  const screen = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
  const video = await page.locator('video').boundingBox();
  expect(Math.round(video?.height ?? 0)).toBe(screen.h);
  expect(Math.round(video?.width ?? 0)).toBe(screen.w);
  expect((await page.locator('.controls').boundingBox())?.height ?? 999).toBeLessThan(70); // one slim row
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.player')).not.toHaveClass(/video-mode/u);
});

// Samsung Internet on Galaxy phones claims a mouse that can hover. The desktop browser (without touch emulation, which
// would switch hover off) really has hover and a fine pointer, so with an Android identity it recreates that phone.
const SAMSUNG_INTERNET = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36';

test.describe('a phone that claims a mouse', () => {
  test.use({ viewport: SIDEWAYS, userAgent: SAMSUNG_INTERNET });
  test.beforeEach(({}, testInfo) => { test.skip(testInfo.project.name !== 'desktop', 'needs a browser that reports hover'); });

  test('still gets video mode with one slim row of controls, and no shortcuts help', async ({ page }) => {
    await page.goto('/huis');
    expect(await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)).toBe(true);
    await expect(page.locator('.player')).toHaveClass(/video-mode/u);
    const bar = await page.locator('.controls').boundingBox();
    expect(bar?.height ?? 999).toBeLessThan(70);
    expect(bar?.width ?? 0).toBeLessThanOrEqual(SIDEWAYS.width);
    await expect(page.getByRole('link', { name: 'Sneltoetsen' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Sneltoetsen' })).toHaveCount(0);
  });
});

test.describe('phone on its side', () => {
  test.use({ viewport: SIDEWAYS });
  test.beforeEach(({}, testInfo) => { test.skip(testInfo.project.name !== 'mobile', 'touch phone only'); });

  test('the video fills the screen; the controls fade out while it plays and a tap brings them back', async ({ page }) => {
    await page.goto('/huis');
    const player = page.locator('.player');
    const controls = page.locator('.controls');
    await expect(player).toHaveClass(/video-mode/u);
    await player.evaluate((el) => scrollTo({ top: el.getBoundingClientRect().top + scrollY }));
    const video = await page.locator('video').boundingBox();
    expect(Math.round(video?.y ?? -1)).toBe(0);
    expect(Math.round(video?.height ?? 0)).toBe(SIDEWAYS.height);
    const bar = await controls.boundingBox();
    expect((bar?.y ?? 0) + (bar?.height ?? 0)).toBeLessThanOrEqual(SIDEWAYS.height + 1); // the controls are on screen too
    expect(bar?.y ?? 0).toBeGreaterThan(SIDEWAYS.height / 2); // a bar along the bottom, not a column over the video
    expect(bar?.height ?? 999).toBeLessThan(70); // one slim row

    await expect(page.getByRole('button', { name: 'Pauze' })).toBeVisible();
    await expect(controls).toHaveCSS('opacity', '0', { timeout: 6000 }); // faded out after 3 s of playing
    await page.locator('video').tap();
    await expect(controls).toHaveCSS('opacity', '1');
    await page.locator('video').tap();
    await expect(controls).toHaveCSS('opacity', '0');
  });

  test('controls stay while paused and while the keyboard is on them', async ({ page }) => {
    await page.goto('/huis');
    const controls = page.locator('.controls');
    await expect(page.getByRole('button', { name: 'Pauze' })).toBeVisible();
    await tabIntoControls(page);
    await page.waitForTimeout(3500);
    await expect(controls).toHaveCSS('opacity', '1');

    await page.getByRole('button', { name: 'Pauze' }).tap();
    await page.locator('h1').evaluate((h: HTMLElement) => h.focus());
    await page.waitForTimeout(3500);
    await expect(controls).toHaveCSS('opacity', '1');
  });

  test('speed is one button that steps through the speeds', async ({ page }) => {
    await page.goto('/huis');
    await page.getByRole('button', { name: 'Pauze' }).tap(); // paused: the controls stay visible
    await page.getByRole('button', { name: 'Snelheid: Normaal' }).tap();
    await expect(page.getByRole('button', { name: 'Snelheid: Langzaam' })).toBeVisible();
    expect(await page.locator('video').evaluate((v: HTMLVideoElement) => v.playbackRate)).toBe(0.75);
    await page.getByRole('button', { name: 'Snelheid: Langzaam' }).tap();
    await page.getByRole('button', { name: 'Snelheid: Heel langzaam' }).tap();
    await expect(page.getByRole('button', { name: 'Snelheid: Normaal' })).toBeVisible();
  });

  test('axe: no violations in video mode', async ({ page }) => {
    await page.goto('/huis');
    await page.getByRole('button', { name: 'Pauze' }).tap(); // paused: the controls stay visible
    await expect(page.getByRole('button', { name: 'Afspelen' })).toBeVisible();
    expect((await axe(page)).violations).toEqual([]);
  });
});

test('turning the phone while watching shows the whole video', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'touch phone only');
  await page.goto('/huis');
  await expect(page.getByRole('button', { name: 'Pauze' })).toBeVisible();
  await expect(page.locator('.player')).not.toHaveClass(/video-mode/u);
  await page.setViewportSize(SIDEWAYS);
  await expect(page.locator('.player')).toHaveClass(/video-mode/u);
  await expect.poll(async () => Math.round((await page.locator('.player').boundingBox())?.y ?? -1)).toBe(0);
});
