/** Automated accessibility: axe (0 violations), reflow at 320 px, text at 200 %, target sizes, themes. */
import { expect, test } from '@playwright/test';
import { axe, mockMedia, overflowing, ownVisitor, scrollsSideways } from './helpers.ts';

const PAGES = [
  { name: 'start', path: '/' },
  { name: 'sign with variants', path: '/huis' },
  { name: 'not found', path: '/kinderopvangje' },
  { name: 'about', path: '/over-deze-site' },
];

test.beforeEach(async ({ page }) => { await ownVisitor(page); await mockMedia(page); });

for (const scheme of ['light', 'dark'] as const) {
  for (const p of PAGES) {
    test(`axe: ${p.name}, ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(p.path);
      await expect(page.locator('h1')).toBeVisible();
      await page.waitForLoadState('networkidle');
      expect((await axe(page)).violations).toEqual([]);
    });
  }

  test(`axe: suggestions open, ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');
    await page.getByRole('combobox', { name: 'Zoek een woord' }).fill('hu');
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    expect((await axe(page)).violations).toEqual([]);
  });
}

test('axe: error state (source unavailable)', async ({ page }) => {
  await page.route('**/api/sign**', (route) => route.fulfill({
    status: 502, contentType: 'application/json',
    body: JSON.stringify({ error: 'source_unavailable', message: 'x', suggestions: ['huis'], parts: [] }),
  }));
  await page.goto('/iets');
  await expect(page.getByRole('heading', { level: 1, name: 'Een bron reageert niet' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Zoek opnieuw' })).toBeVisible();
  expect((await axe(page)).violations).toEqual([]);
});

test('axe: more contrast and reduced motion', async ({ page }) => {
  await page.emulateMedia({ contrast: 'more', reducedMotion: 'reduce' });
  await page.goto('/huis');
  await expect(page.getByRole('button', { name: 'Afspelen' })).toBeVisible();
  expect((await axe(page)).violations).toEqual([]);
});

test('reflow: no sideways scrolling at 320 px (same as 400 % zoom on a 1280 px screen)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const p of [...PAGES, { name: 'six variants', path: '/koffie' }]) {
    await page.goto(p.path);
    await expect(page.locator('h1')).toBeVisible();
    expect(await scrollsSideways(page), p.path).toBe(false);
  }
});

test('text at 200 %: still no sideways scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  for (const path of ['/huis', '/koffie', '/kinderopvangje', '/']) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    // Through the CSSOM: our CSP (rightly) blocks injected <style> tags.
    await page.evaluate(() => document.documentElement.style.setProperty('font-size', '200%', 'important'));
    await page.waitForTimeout(200);
    expect(await overflowing(page), path).toEqual([]);
  }
});

test('targets: every button, tab, chip and field is at least 44 × 44 px', async ({ page }) => {
  await page.goto('/huis');
  await expect(page.getByRole('tab').first()).toBeVisible();
  // A checkbox counts with its label: the whole label is the target.
  const small = await page.$$eval('button, [role="tab"], .chip, input, .brand, .help', (els) =>
    els.map((el) => (el instanceof HTMLInputElement && el.type === 'checkbox' ? el.closest('label') ?? el : el))
      .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.width < 44 || r.height < 44); })
      .map((el) => `${el.tagName} ${el.textContent?.trim().slice(0, 30)} ${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`));
  expect(small).toEqual([]);
});

test('page language, title and landmarks', async ({ page }) => {
  await page.goto('/huis');
  await expect(page.locator('html')).toHaveAttribute('lang', 'nl');
  await expect(page).toHaveTitle('huis · Gebaren');
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();
  await expect(page.getByRole('search')).toBeVisible();
});
