import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const video = readFileSync(new URL('../../design/media/huis-a.mp4', import.meta.url));
const poster = readFileSync(new URL('../../design/media/huis-a.png', import.meta.url));

/** Serves every sign video and poster from a local fixture, so tests do not depend on Signbank being up. */
export async function mockMedia(page: Page): Promise<void> {
  await page.route('**/video/**', (route) => route.fulfill({ status: 200, contentType: 'video/mp4', body: video }));
  await page.route('**/poster/**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: poster }));
}

/** axe-core with the WCAG 2.0, 2.1 and 2.2 A/AA rules plus best practices. */
export async function axe(page: Page): Promise<{ violations: Array<{ id: string; impact?: string | null; nodes: Array<{ target: unknown }> }> }> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  return { violations: results.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => ({ target: n.target })) })) };
}

/** True when the page scrolls sideways (WCAG 1.4.10 reflow). */
export async function scrollsSideways(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
}

/** Elements that stick out on the right, for a readable failure message. */
export async function overflowing(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    return [...document.querySelectorAll('body *')]
      .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > w + 1; })
      .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].filter((c) => !c.startsWith('svelte-')).join('.')} "${(el.textContent ?? '').trim().slice(0, 20)}" right=${Math.round(el.getBoundingClientRect().right)}/${w}`)
      .slice(0, 10);
  });
}
