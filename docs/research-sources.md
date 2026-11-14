# Research: NGT video sources

Checked on 2026-11-14. Every number below was measured or read on that date. Nothing was assumed.

## Summary

| Source | Signs with video | Word list / index | URL stability | Licence | Verdict |
|---|---|---|---|---|---|
| **NGT Signbank** (Radboud Universiteit + Universiteit van Amsterdam) | **6,708** (6,862 public glosses), about **8,400 Dutch words** | Yes: a public bulk package (JSON) plus a JSON search API | Good: numeric gloss IDs, versioned releases | **CC BY 4.0** for all public lexical items | **Primary source** |
| **lerengebaren.nl**, old dictionary | about 2,300 clips | Only via the sitemap (no API) | **At risk**: the site says it is moving to a new website soon | **CC BY-SA 4.0** (stated on /over-ons) | Optional fallback for words Signbank lacks |
| **lerengebaren.nl**, new app (`/app/`) | 1,401 words / 2,839 clips (SignLab Amsterdam recordings) | A private JSON API with **signed, expiring video URLs** | Private; tokens expire | The videos are UvA open data (see below), but the API is not offered for reuse | **Do not use the API.** Use the open UvA/Signbank data instead |
| **Nederlands Gebarencentrum** (ow.gebarencentrum.nl) | about 16,000 (paid subscription); about 900 free | No public index or API | n/a | No open licence found; paid product | **Link only** ("Zoek ook bij het Gebarencentrum") |
| **Het gebaar van de dag** (YouTube) | About 1 clip a day from 2014 to 2025-11; last upload 2025-11-04 | RSS feed only (most recent 15) | YouTube video IDs are stable | Standard YouTube licence: **embedding through the YouTube player is allowed**; downloading is not | **Overrides only** (`schep`, `rietje`) |
| UvA open datasets (figshare) | NGT-LEX-UvA-2025 (CC BY 4.0), SignBeach 1,400 signs (**CC BY-NC 4.0**), ZIN-IN-NGT 4,083 sentences (CC BY 4.0) | Codebooks; large multi-camera zips | DOIs, very stable | As stated | Not needed: the lexical videos are already in Signbank (release 2) |

## NGT Signbank: details

- **Dataset page:** https://signbank.cls.ru.nl/datasets/NGT/ shows 6,862 public glosses (7,469 in total). Releases: 2020 (Radboud, for the Corpus NGT) and 2025 (UvA).
- **Licence (quoted from the dataset page):** "A Creative Commons BY 4.0 International license applies to all accessible lexical items."
  - The Corpus NGT example *sentences* are stricter (CC BY-NC-SA 4.0). We don't use them.
  - The site's Conditions of Use say: don't copy or spread data "unless given permission or if the license allows it". CC BY 4.0 allows it, so **embedding, linking and caching or rehosting are allowed, with attribution**.
- **Bulk package:** `GET /dictionary/package/?dataset_name=NGT` returns a zip of about 6 MB, dated 2026-10-01:
  - `glosses.json`: for each gloss, the Dutch and English gloss name, `Senses: Dutch` (for example HUIS-A → "huis, huisje, hok, schuur"), handedness, location, semantic field, `Link` and `Video`.
  - `video_urls.json` and `image_urls.json`.
- **Search API:** `GET /dictionary/gloss/api/?search=<prefix>&dataset=5&results=<n>` returns `[{id, sign_name, video_url, image_url}]`. It needs no login and answered in about 0.1–0.3 s.
- **Per-gloss JSON:** `GET /dictionary/get_gloss_data/5/<id>/`.
- **Coverage test** (Dutch senses, after normalisation):
  - `huis` → HUIS-A, HUIS-B
  - `café` → CAFE-A/B/C/D
  - `dank je` → BEDANKEN-A/B/C
  - `rietje` → RIETJE
  - `sticker` → STICKER
  - `school` → SCHOOL-A…G (plus LEREN-A)
  - Of the 8,414 Dutch keys, **3,293 have more than one sign** (variants), and 2,007 are multi-word.
- **Video files:**
  - Release 1 (about 3,700 glosses): 656×370 H.264, about 150 KB, about 3.5 s, moov atom at the front (fast start).
  - Release 2 (about 3,000 glosses): **3840×2160** H.264, about 1.5–1.8 MB, about 4 s, moov atom **at the end**.
  - About 2,900 glosses also have "perspective" (side-view) videos.
- **⚠️ No byte-range support:** a `Range: bytes=0-1023` request gets `200` with the full body. iOS Safari needs `206` range responses to play MP4, so **hotlinking would break on iPhones**. The fix is to serve the videos through our own Worker, from R2 (see the plan).
- Response headers: `Access-Control-Allow-Origin: *`, `X-Frame-Options: DENY` (so no iframing of their pages), no Cache-Control.

## lerengebaren.nl: details

- **Old dictionary:** `https://www.lerengebaren.nl/gebarenwoordenboek/<word>`
  - It renders `<h2><div id="woord_header">Huis</div></h2>` and `<video id="myvideo"><source src="https://www.lerengebaren.nl/gebaren/1084.m4v" type='video/mp4'/></video>`.
  - The .m4v files **do** support range requests (206).
  - The sitemap lists 2,306 `/gebaarfilm/…` entries.
- **Licence:** /over-ons links to CC BY-SA 4.0 ("vrij te gebruiken … wel moet er bronvermelding toegevoegd worden").
  - The site also says the signs are recorded by **non-native signers**, and that the Nederlands Gebarencentrum distances itself from them.
- **Migration:** a banner on every page (since 2026-10) says "LerenGebaren krijgt een nieuwe website. Binnenkort verhuizen we." The old URLs (which v1 depends on) may disappear.
- **The new app's** `/gs_api/videos.php` returns signed URLs (`?st=…&e=…`). This is a deliberate access control, so we stay away from it.

## Nederlands Gebarencentrum

- `ow.gebarencentrum.nl` is a JavaScript app with no public API.
- The homepage says: "Neem een abonnement op het online woordenboek met ruim 16.000 gebaren … gratis deel … ruim 900 gebaren."
- Its "Gebaar van de week" videos are on Vimeo.
- No open licence was found, so we use **link-out only**.

## Het gebaar van de dag (YouTube)

- Channel `UCka3vwMWT5corqam_M0sXDQ` (@hetgebaarvandedag9715).
- oEmbed confirms that both overrides still exist and can be embedded:
  - `-mZJCBQkhiY` ("Schep")
  - `NWwxULW91II` ("rietje")
- The `sticker` override points to a **Facebook** video embed. That doesn't fit the API's `kind: "mp4" | "youtube"`, it loads Facebook tracking, and our controls can't operate it. Signbank now has `STICKER` itself (see the plan for a proposal).
