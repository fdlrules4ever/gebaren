# Plan: Gebaren v2

Status: **approved** (2026-11-14). Design: **direction A "Stilte"** was chosen (see `design/`). Project type: lightweight production.

Background research: [research-sources.md](research-sources.md) and [research-design.md](research-design.md).

## 1. Sources (recommended)

Lookup order for a query:

1. **Own overrides**, `data/overrides.json`. These always come first.
   - `schep` and `rietje` → YouTube "Het gebaar van de dag" (embedded via `youtube-nocookie.com`).
   - `sticker` is a Facebook embed today. **Proposal:** drop it, because Signbank now has STICKER. Facebook embeds track visitors, can't be operated by our controls, and fall outside `kind: "mp4" | "youtube"`.
2. **NGT Signbank** (Radboud + UvA, **CC BY 4.0**). This is the primary source: 6,708 signs with video and about 8,400 Dutch words, including variants.
   - **Index:** built from Signbank's public bulk package by a script (`pnpm update-index`). The result is committed to the repo, so builds are deterministic and don't depend on Signbank being up.
   - **Videos:** served by our Worker through **Cloudflare's edge cache (Cache API)**, so there is **no R2 or KV storage and no storage quota**.
     - On the first request in a data centre, the Worker fetches the clip from Signbank. It uses a fixed host and a path from our own index, never anything taken from user input.
     - The Worker keeps the clip in the edge cache for 30 days, and Cloudflare evicts it earlier if nobody watches it.
     - It answers `Range` requests with `206`. `cache.match()` does that for cached clips. On a cache miss (and on `*.workers.dev`, where the Cache API may not work) the Worker slices the bytes itself.
     - This is needed because Signbank ignores `Range`, so iPhones won't play hotlinked clips.
     - It works the same for every device, so there is no iOS detection. (iPadOS pretends to be a Mac, so detection would be unreliable anyway.)
     - It also spares Signbank's server. CC BY 4.0 explicitly allows redistribution with attribution.
     - Why not R2: if every clip were ever viewed, it would hold about 5–6 GB. That is more than half of the free 10 GB, which is shared with your other projects.
3. **lerengebaren.nl, old dictionary** (CC BY-SA 4.0). This is an *optional fallback*, used only when 1 and 2 have no exact match.
   - Parsed with `HTMLRewriter` and cached for 7 days, with a 3 s timeout.
   - Their site is about to migrate. When it does, this fallback quietly turns into "not found".
4. **Nederlands Gebarencentrum:** a link only, on the "not found" screen ("Zoek ook bij het Gebarencentrum"). Their dictionary is paid, and no open licence was found.

Each result shows its source name, licence and a link to the source page (for example the Signbank gloss page). This attribution is required by CC BY / BY-SA.

## 2. Design principles

The evidence is in [research-design.md](research-design.md). In short:

1. **Video first and large.** The word appears as a large heading next to it.
2. **Autoplay, muted and looping**, with a large "Pauze" button that is always visible.
3. **Reduced motion means the video starts paused**, with a large "Afspelen" button.
4. **Speed as visible text buttons** (1× / 0.75× / 0.5×) with `aria-pressed`.
5. **"Spiegel" (mirror) as a switch**, off by default, with one line of explanation.
6. **One card per sign, with its Dutch meanings as text.** Variants are labelled "Gebaar 1 van 3". Codes like HUIS-B are never shown as the main label.
7. **Forgiving search.** Suggestions start from the first letter, the exact match comes first, and "Bedoel je …?" handles typos.
8. **B1 Dutch.** Every icon has a text label, and the page uses `lang="nl"`.
9. **A calm page.** No pop-ups, adverts or cookies, and body text at 7:1 contrast.
10. **A calm video stage.** Low glare, and no text or controls over the signer.
11. **Sources visible but quiet.** Each video has a credit line with a link.
12. **Test with deaf NGT users** before switching the domain over.

## 3. Architecture

```
Browser (Svelte 5 SPA + service worker)
  │  /, /huis, /dank%20je  → static assets (SPA fallback: not_found_handling)
  │  /words.json           → static, generated at build (suggestions, instant & offline)
  ▼
Cloudflare Worker "gebaren" (plain TypeScript, run_worker_first: ["/api/*", "/video/*"])
  ├─ GET /api/sign?q=…   validate → normalise → overrides → Signbank index → (lerengebaren) → "did you mean"
  │                       Cache API (1 day; not-found 1 hour) · rate limit (Workers Rate Limiting binding)
  ├─ GET /video/sb/<id>.mp4   id must exist in index → edge cache (206 on Range) → miss: fetch Signbank, cache 30 days, slice Range
  └─ GET /poster/sb/<id>.png  same pattern, for the still image (poster/LCP)
Bindings: ASSETS, API_LIMIT (ratelimit). No storage bindings.
```

- **API:** `GET /api/sign?q=<word>` returns
  `{ query, normalized, results: [{ word, videoUrl, kind, sourceName, sourcePageUrl, … }], suggestions: [] }`.
  - It adds optional fields: `glossId`, `senses` (the Dutch meanings), `posterUrl`, `licence` and `licenceUrl`.
  - Errors use JSON `{ error: "not_found" | "source_unavailable" | "timeout" | "invalid_query" | "rate_limited" }` with the matching HTTP status.
- **Normalisation:** NFC, then lower case, strip diacritics, collapse whitespace and hyphens, and allow only letters, digits, spaces, `-` and `'`. Maximum 60 characters. The same code runs in the Worker and in the client.
- **Fuzzy search:** prefix matches plus a bounded Damerau-Levenshtein distance (1 for short words, 2 for longer ones). It is implemented in about 60 lines, with no dependency.
- **Variants:** signs whose name matches the word come first (SCHOOL-A…G). Related signs come after them, under "Ook gebruikt voor …" (for example LEREN-A).
- **Client:**
  - An accessible combobox (APG pattern).
  - The player component (custom controls: play/pause, replay, speed, mirror, fullscreen).
  - A variant switcher.
  - Recent searches and favourites in `localStorage`.
  - A small hand-written service worker (app shell only, no Workbox).
- **Font:** Atkinson Hyperlegible Next (SIL OFL), self-hosted as woff2, with no third-party requests.
- **Dependencies (dev only):**
  - `svelte`, `vite`, `@sveltejs/vite-plugin-svelte` (the official integration, required)
  - `typescript`, `wrangler`
  - `svelte-check` (type-checks `.svelte` files under strict TS)
  - `@playwright/test` + `@axe-core/playwright` (automated axe scan and keyboard/E2E tests in a real browser; there is no platform alternative)
  - **No runtime dependencies.**
  - Unit tests use `node:test`. Lighthouse runs through `pnpm dlx` and is not installed.

## 4. Process

1. **(now)** Approval of this plan.
2. **Step 2: design.** Two or three visual directions as static HTML/CSS mockups. Each one covers mobile and desktop, light and dark, the player state and the "not found" state. You choose.
3. **Build:**
   - Set up the repo `fdlrules4ever/gebaren`.
   - Write the Worker and API with unit tests (fixtures), then the SPA.
   - Run the accessibility checks.
4. **Deploy:**
   - `*.workers.dev`, with Workers Builds connected to GitHub.
   - **You** need to connect the repo once in the Cloudflare dashboard.
   - PRs get preview URLs, and a smoke test runs against the preview.
5. **Report:** the PR description lists the axe, Lighthouse and manual test results.
6. **Switching over:** the domain moves to the new Worker. You check it on your phone. Only then will I propose deleting the old Worker and the R2 files.

## 5. Risks and shortcuts (named explicitly)

| Risk | Impact | Mitigation |
|---|---|---|
| Signbank changes or removes the bulk package or the media paths | The index can't be refreshed; videos fail once they drop out of the cache | The index is committed. The update script fails loudly; it never fails silently. The smoke test plays a few clips. |
| Edge cache is per data centre and can be evicted | Now and then a clip is fetched from Signbank again, which is slower for that one view | Acceptable: clips are 0.15–1.8 MB. Browsers also cache them (`Cache-Control: max-age`). |
| Free plan: 10 ms CPU per request | Slicing a 4K clip on a cache miss might come close | Measure on the preview. If it's too slow, stream the range instead of buffering it. |
| Release-2 clips are **4K, about 1.7 MB** | Mobile data use and decoding cost on cheap phones | Measure first. If needed, add Cloudflare Media Transformations (scale to 720p) later, as a separate step. |
| Release-1 clips are **656×370** | Soft at full-screen size on a desktop | The design caps the upscaling. We accept this, since it's a source limitation. |
| A word maps to signs with different meanings (`school` → LEREN) | Confusion | Exact gloss-name matches come first, and every video shows its Dutch meanings as text. |
| lerengebaren.nl migrates | The fallback stops working | Optional. It degrades to "not found", and fixture tests document the parser. |
| YouTube overrides | Third-party script, privacy, performance | `youtube-nocookie.com`, only for override words. |
| Rate Limiting binding is approximate and per location | Not a hard guarantee | Good enough for a small tool. R2 caching limits upstream traffic anyway. |
| Cloudflare policy on serving video | Low; video from R2 via Workers is allowed under the developer-platform terms | Keep an eye on bandwidth in the dashboard. |
| **Manual screen-reader tests** (NVDA, TalkBack, VoiceOver) | I can't run these myself | I write a short test script with steps. You (or a tester) run it, and the results go into the PR. |

## 6. Decisions for you (my default in bold)

1. **Serve Signbank videos through the Worker with the edge cache, using no R2 storage.** (Changed on 2026-11-14 after your question about the free plan.)
2. lerengebaren.nl fallback: **yes, as an optional fallback** / no, Signbank only.
3. `sticker` override: **drop the Facebook embed and use Signbank's STICKER** / keep it as a link.
4. Repository: `fdlrules4ever/gebaren` already exists (public, still empty).

**Shortcuts (deliberate, for a lightweight tool):**
- No monitoring or alerting beyond Workers Logs.
- No per-word server-side meta tags (so shared links show a generic preview).
- Index refresh is a manual script, not a cron job.
- No analytics. Recent searches and favourites stay on the device only.
