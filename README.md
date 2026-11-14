# Gebaren

**Type a Dutch word and immediately see the sign in Dutch Sign Language (NGT)**, large and on a loop. You can slow it down, mirror it, and keep a list of favourites.

This is v2 of [gebaren.franklippes.com](https://gebaren.franklippes.com). It is a small public tool for:
- hearing people learning NGT
- deaf and hard-of-hearing people
- parents, teachers and carers

Accessibility is the core of the product. The interface is in plain Dutch (B1).

- **Stack:**
  - Svelte 5 (runes) + Vite, as a single-page app (no SvelteKit)
  - served as static assets by a Cloudflare Worker
  - the API and the video proxy live in the same Worker, in plain TypeScript
- **Runtime dependencies:** none. Every dependency is a dev dependency (see [Dependencies](#dependencies)).

## Sources and licences

| Source | Used for | Licence | How |
|---|---|---|---|
| [NGT Signbank](https://signbank.cls.ru.nl/datasets/NGT/) (Radboud Universiteit and Universiteit van Amsterdam) | The main source: 6,671 signs with video, about 8,200 Dutch words | **CC BY 4.0** | We build a word index from Signbank's public package. Videos go through our Worker and the Cloudflare edge cache. Every video credits the source and links to the gloss page. |
| [LerenGebaren.nl](https://www.lerengebaren.nl/over-ons/) (old dictionary) | A fallback for words Signbank does not have | **CC BY-SA 4.0** | We parse the page with `HTMLRewriter`, cache the result for 7 days, and proxy the video as `video/mp4`. Switch it off with `LERENGEBAREN_FALLBACK`. |
| [Het gebaar van de dag](https://www.youtube.com/@hetgebaarvandedag9715) (YouTube) | Own overrides: `schep`, `rietje` | Standard YouTube licence | Embedded via `youtube-nocookie.com`. No download. |
| [Nederlands Gebarencentrum](https://ow.gebarencentrum.nl/) | Only a link on the "not found" screen | Paid, no open licence | Link only. |
| [Atkinson Hyperlegible Next](https://github.com/googlefonts/atkinson-hyperlegible-next) (font) | All text | SIL OFL 1.1 ([public/fonts/OFL.txt](public/fonts/OFL.txt)) | Self-hosted. |

The background research is in [docs/research-sources.md](docs/research-sources.md) and [docs/research-design.md](docs/research-design.md). The plan is in [docs/plan.md](docs/plan.md).

## How it works

```
Browser: Svelte app, service worker (app shell offline), /words.json for suggestions
   │  /, /huis, /dank%20je            → static assets; unknown paths get index.html (deep links)
   ▼
Worker "gebaren" (run_worker_first: /api/*, /video/*, /poster/*)
   ├─ GET /api/sign?q=…    validate → normalise → own overrides → Signbank index → lerengebaren fallback
   │                       → 404 with "did you mean" + compound parts (huisdier → huis + dier)
   │                       edge cache per word · rate limit 60/min per IP
   ├─ GET /video/sb/<id>.mp4, /poster/sb/<id>   Signbank media via the edge cache, with byte ranges
   ├─ GET /video/lg/<id>.mp4                    lerengebaren video (served as video/mp4)
   └─ GET /api/health
```

- **Why proxy the videos?** Signbank ignores `Range` requests, and iPhones refuse to play video without them.
  - The Worker fetches a clip once and keeps it in Cloudflare's **edge cache**. That needs no R2 or KV storage and uses no quota.
  - It then answers byte ranges itself.
  - Upstream URLs are always built from a fixed host plus a path from our own index (or a numeric id). They are never built from what the user typed.
- **Tolerant search:**
  - Case, accents, spaces and hyphens don't matter ("CAFE" finds "café", "dankje" finds "dank je").
  - An article in front is ignored ("het huis").
  - Small typos and other word forms become "Bedoel je …?".
  - Compound words are split into known parts.
- **Errors:**
  - invalid input → `400`
  - not found → `404` with suggestions
  - rate limited → `429`
  - a source down → `502`
  - a timeout → `504`

  The app shows each one with a clear message in plain words and a way forward.

### API

`GET /api/sign?q=<word>` returns:

```json
{
  "query": "Huis",
  "normalized": "huis",
  "results": [
    {
      "word": "huis", "videoUrl": "/video/sb/1954.mp4", "kind": "mp4",
      "sourceName": "NGT Signbank", "sourcePageUrl": "https://signbank.cls.ru.nl/dictionary/gloss/1954",
      "licence": "CC BY 4.0", "licenceUrl": "https://creativecommons.org/licenses/by/4.0/deed.nl",
      "senses": [["huis", "huisje", "hok", "schuur"]], "posterUrl": "/poster/sb/1954", "sourceId": "1954"
    }
  ],
  "suggestions": [],
  "parts": []
}
```

- `kind` is `"mp4"` or `"youtube"`.
- On a 404 the body also has `"error": "not_found"` and a `message`, and `suggestions` / `parts` are filled.

## Local development

You need Node 22+ and pnpm. Install without running any install scripts:

```bash
pnpm install --ignore-scripts
```

Run the app locally with the Worker (http://localhost:8787):

```bash
pnpm preview
```

For live reload, start the API in one terminal:

```bash
pnpm dev:api
```

Then start Vite in another terminal (http://localhost:5173; it proxies `/api` and `/video` to port 8787):

```bash
pnpm dev
```

There are no secrets. If you ever need local secrets, put them in `.dev.vars` (that file is in `.gitignore`) and use `wrangler secret put` in production.

`pnpm-workspace.yaml` sets `minimumReleaseAge: 4320`, so only package versions that are at least 3 days old get installed. It also sets `ignoreScripts: true`.

## Tests

| Command | What it does |
|---|---|
| `pnpm check` | `svelte-check` (no warnings allowed) plus strict TypeScript for the app, the Worker and Node |
| `pnpm test` | Unit tests (`node:test`): normalisation, typos, index builder, ZIP reader, lookup, compound words, byte ranges, overrides |
| `pnpm test:runtime` | Inside **workerd** (the real Workers runtime): the `HTMLRewriter` parser on saved pages (`tests/fixtures/`), the API and the media id checks. Run `pnpm build` first. |
| `pnpm test:e2e` | Playwright with your installed Chrome, on desktop and Pixel 7. Covers: **axe** on every screen in light and dark, plus "more contrast" and reduced motion; reflow at 320 px; text at 200 %; target sizes; keyboard-only use; the player; favourites; the back button. Run `pnpm build` first. |
| `pnpm smoke <url>` | Smoke test against a deployed URL: app shell, deep links, API, video byte ranges, headers |
| `pnpm verify` | All of the above except the smoke test, in order. Run this before you push to `main`. |

If the browser tests stop with "Timed out waiting … from config.webServer", a stuck `workerd.exe` from an earlier run is still holding port 8788. Close it (Task Manager, or `Get-NetTCPConnection -LocalPort 8788`), then run the tests again.

The screen-reader checks (NVDA, TalkBack, VoiceOver) are done by hand. See [docs/manual-a11y-tests.md](docs/manual-a11y-tests.md).

## Deployment

Keep it simple: **test locally, then push to `main`.** Cloudflare Workers Builds builds and deploys every push to `main`. There are no preview builds or preview URLs.

1. Run every check locally (type checks, unit tests, build, workerd tests, browser tests):

   ```bash
   pnpm verify
   ```

2. Look at the app yourself on http://localhost:8787:

   ```bash
   pnpm preview
   ```

3. Push to `main`. Workers Builds deploys it.
4. Smoke-test the live site:

   ```bash
   pnpm smoke https://gebaren.franklippes.com
   ```

**Workers Builds settings** (Workers & Pages → gebaren → Settings → Build):

| Setting | Value |
|---|---|
| Git repository | `fdlrules4ever/gebaren` |
| Production branch | `main` |
| Build command | `pnpm install --ignore-scripts --frozen-lockfile && pnpm build` |
| Deploy command | `npx wrangler deploy` |
| Builds for non-production branches | off |

To deploy by hand (if a build ever fails and you need a quick fix):

```bash
pnpm deploy
```

## Adding an override

Overrides come before Signbank. Add a word to [data/overrides.json](data/overrides.json):

```json
"woord": [{
  "kind": "youtube", "videoId": "XXXXXXXXXXX", "meaning": ["woord"],
  "sourceName": "Het gebaar van de dag (YouTube)", "sourcePageUrl": "https://www.youtube.com/watch?v=XXXXXXXXXXX",
  "licence": "Standaardlicentie YouTube", "licenceUrl": "https://www.youtube.com/t/terms"
}]
```

- For your own video, put the file in `public/media/` and use `"kind": "mp4", "url": "/media/woord.mp4"`.
- The file is checked strictly. A mistake stops the build with a clear message.

## Refreshing the Signbank index

```bash
pnpm update-index
```

- This downloads Signbank's public package and rewrites `data/signbank/index.json`.
- It refuses to write when the package looks broken (fewer than 1,000 signs, or 20% fewer than before).
- Commit the result. Builds never depend on Signbank being up.

## Dependencies

All of these are dev dependencies. Each one is listed with its reason.

| Package | Why |
|---|---|
| `svelte`, `vite`, `typescript`, `wrangler` | The agreed starting point |
| `@sveltejs/vite-plugin-svelte` | The official Svelte integration for Vite; required |
| `svelte-check` | Type-checks `.svelte` files under strict TypeScript |
| `@types/node` | Types for the Node scripts and tests |
| `@playwright/test`, `@axe-core/playwright` | Automated keyboard and axe tests in a real browser; there is no platform alternative |

## Accessibility results

Last run: 2026-11-14.
- `pnpm test:e2e`: **54/54 passed**, with **0 axe violations** on every screen and both themes.
- Manual results and Lighthouse scores go in the PR description.

## Deliberate shortcuts

- No monitoring or alerting beyond Workers Logs.
- No per-word server-side meta tags, so shared links show a generic preview.
- The index is refreshed by hand, not by a scheduled job.
- No analytics.
- Rate limiting is approximate (per Cloudflare location), by design of the binding.
- The edge cache is per data centre, so an evicted clip is fetched from Signbank again.
- Signbank's release-2 clips are 4K (about 1.7 MB). Shrinking them (for example with Cloudflare Media Transformations) is a possible later step.
- The YouTube embed shows YouTube's own title over the video. It is only used for the two override words.
