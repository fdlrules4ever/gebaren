# Research: design for deaf and hard-of-hearing users and sign dictionaries

Checked on 2026-11-14. Sites that only render with JavaScript were read in a real browser, and video attributes and colours were measured on the live page. Anything marked *(unverified)* could not be checked.

## Sites

| Site | Video | Hierarchy, type and colour | Navigation and language | Works well | Doesn't work |
|---|---|---|---|---|---|
| **Gebarencentrum** online dictionary | Top-left, about half the width on desktop, full width on mobile. Autoplays muted on a loop (2.9 s). Speed 0.25–1× hidden behind a gear icon. Fullscreen, no mirror. Plain blue backdrop, signer in dark clothes. | Blue #00549A, orange accent #F6A43E, Neo Sans 14px. Cards with handshape photos and a location pictogram. | Search by word, by sign feature, or on a map. "huis" gives 32 results instead of the exact match. Player labels in English, `lang="en"`. | Short loop, pictograms for handshape and location, example-sentence video, related signs | White-on-orange main button about 2.1:1. Gear button has no accessible name. Headings cut off in cards. |
| **NGT Signbank** | About 459px, plays once, no loop, icon-only controls, no speed | Red header, Helvetica 14px, data tables | English with linguistic jargon ("Annotation ID Gloss"). Variants only shown as -A/-B. | Rich, open data | Says itself it "does not presently serve as a dictionary" |
| **lerengebaren.nl** (old) | `width="50%" autoplay` *without* `muted`, so Chrome blocks it and the page opens on a paused clip. No loop, no speed. Bright green backdrop, patterned T-shirt. | Video sits under three headings | Search field has no label (the pre-filled text "Typ een zoekwoord!" stands in for one). Suggestions only after 3 letters. | One sign per page, the word in the URL | App pop-up and a fixed banner cover the page on arrival; Mailchimp pop-up |
| **Dovenschap** | No NGT video on the homepage | Small grey centred text on a photo | No `lang` attribute, icon-only social links | n/a | No public guidance on digital accessibility found |
| **Spreadthesign** | 320×240, autoplays muted on a loop, no controls. Speed 25–100% as turtle and hare icons, with a tooltip only. | Picture of the word next to the video | Flags for languages, a two-language side-by-side option | Picture plus video, speed control | Small video, icon-only controls, cookie banner. NGT not available for "house". |
| **SignBSL** | Up to 9 cards per word, **grouped by meaning** with a definition, click to play. Text buttons "Slow" and "Normal". | Credits the source of each video | Meaning groups ("house: home" vs "house: theatre") | Grouping by meaning, visible speed buttons, credit line | Adverts. Toggle state not exposed (no `aria-pressed`). |
| **Handspeak** | Autoplays muted, default controls, no loop. **Variants as tabs** with thumbnails. "Overlay" mode puts your webcam image over the model. | Busy, many side panels | Jargon ("open-8 hands"), emoji in labels | Variant tabs, practice overlay with a screen-reader status message | Adverts, jargon, clutter |
| **Gallaudet** | Full-screen background video, autoplay and loop. No pause button found. | 18px body text | n/a | Reduced-motion CSS present *(effect unverified)* | No pause control for the video (WCAG 2.2.2) |

## Guidelines and evidence

- **WCAG 2.2.2 Pause, Stop, Hide:** a looping video that starts automatically needs a pause control. [w3.org](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- **WCAG 2.5.8 / 2.5.5 target size:** at least 24 px for AA and 44 px at AAA. We use 44 px throughout. [w3.org](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- **WCAG 1.2.6 sign language (AAA):** for signers, captions are often a second language. [w3.org](https://www.w3.org/WAI/WCAG22/Understanding/sign-language-prerecorded.html)
- **W3C WAI, auditory disabilities:** sign language is some people's first language. Use simpler text supported by images, and high-quality video. [w3.org](https://www.w3.org/WAI/people-use-web/abilities-barriers/auditory/)
- **DeafSpace (Gallaudet):** glare, shadows and backlighting tire the eyes. Use a colour that contrasts with skin tone so that signing stands out. [gallaudet.edu](https://gallaudet.edu/campus-design-facilities/campus-design-and-planning/deafspace/)
- **Hassan et al., CHI 2022** (sign-dictionary learners):
  - 17 of 32 learners want results to autoplay and loop.
  - 7 found autoplay "a little overwhelming".
  - The authors recommend loop by default, with an option to switch it off, and a picture plus a name for handshapes. [PDF](https://par.nsf.gov/servlets/purl/10335691)
- **Shield & Meier 2018:** right-handed beginners made left-right errors on 20.6% of items with a model that looked right-handed, and on 0.9% with a mirrored one. Mirror view helps learners. [frontiersin.org](https://www.frontiersin.org/articles/10.3389/fpsyg.2018.00811)
- **Wauters et al. 2001:** reading problems are unusually large among deaf readers, and recognising written words is slow and tiring. Linking written Dutch words to NGT signs improved word recognition. [PDF](https://pedagogischestudien.nl/article/download/14785/16251/31918)
- **Tetralogical 2026:** use icons together with text labels, and offer spelling correction in search. [tetralogical.com](https://tetralogical.com/blog/2026/06/17/designing-for-deaf-people/)
- **UK Home Office poster:** plain language, a linear layout, no long text blocks, no complex menus. [ukhomeoffice.github.io](https://ukhomeoffice.github.io/accessibility-posters/deaf)
- **B1 writing (IPLO):** sentences of about 15–20 words, active voice, address the reader directly, simple words, clear subheadings. [iplo.nl](https://iplo.nl/digitaal-stelsel/toepasbare-regels/maken-testen/schrijfwijzer/schrijftips-taalniveau-b1/)
- **NGT is legally recognised** (since 1 July 2021), and the government consults target groups. [rijksoverheid.nl](https://www.rijksoverheid.nl/onderwerpen/erkende-talen/de-nederlandse-gebarentaal-ngt)
- **Gaps:**
  - digitoegankelijk.nl has no guidance specific to deaf users.
  - No Dovenschap guidance was found.
  - No study was found that tests slow motion on its own.

## Design principles for Gebaren

1. **The video comes first and is large.** It is full width on mobile and above the fold, with the word as a large heading right next to it. *Because:* the sizes found were 50% at lerengebaren and 320px at Spreadthesign, and WAI asks for high-quality video.
2. **Autoplay, muted and looping, with a large "Pauze" button that is always visible** (44 px or more, icon plus text). *Because:* Hassan (17 of 32 learners want it), WCAG 2.2.2, and lerengebaren's autoplay being blocked because it isn't muted.
3. **Reduced motion means a calm start.** The video stays paused, with a large "Afspelen" button. *Because:* 7 of 32 learners found autoplay overwhelming, and the user setting should win.
4. **Speed is a set of visible text buttons** (1×, 0.75×, 0.5×), never a gear menu. Each button exposes its state with `aria-pressed`. *Because:* Gebarencentrum hides speed, SignBSL's labelled buttons work, and SignBSL is missing `aria-pressed`.
5. **"Spiegel" (mirror) is a switch, off by default, with one line of explanation** ("Handig als je het gebaar wilt nadoen"). *Because:* Shield & Meier (20.6% vs 0.9% errors), and no reviewed site offers it.
6. **One card per sign, with its Dutch meanings as text**, and variants as clearly labelled choices ("Gebaar 1 van 3"). Gloss codes like HUIS-B are never shown as the main label. *Because:* SignBSL's meaning groups and Handspeak's tabs work, while Signbank's -A/-B codes mean nothing to most users.
7. **Forgiving search.** Suggestions start from the first letter, the exact match comes first, "Bedoel je …?" handles typos, and a result is never just a blank page. *Because:* Gebarencentrum gives 32 results for "huis", lerengebaren needs 3 letters, and Tetralogical recommends spelling correction.
8. **B1 Dutch, and every icon has a text label.** Player labels are in Dutch and the page uses `lang="nl"`. *Because:* Gebarencentrum's English labels, Spreadthesign's icon-only buttons and the IPLO B1 rules.
9. **A calm page.** No adverts, pop-ups, carousels or cookie walls (we set no cookies), body text at 7:1 contrast, and nothing moving except the sign itself. *Because:* lerengebaren's pop-ups, the adverts on SignBSL and Handspeak, Gebarencentrum's 2.1:1 button, and DeafSpace on eye fatigue.
10. **The video stage is calm too.** Neutral, low-glare surroundings in both themes, and no text or controls over the signer's body. Controls sit beside or below the video. *Because:* DeafSpace on glare and contrast, and Gebarencentrum's label placed over the video.
11. **Sources stay visible but quiet.** Each video carries a short credit line with a link (as SignBSL does). This also meets the CC BY attribution requirement.
12. **Test with real users.** Ask a few deaf NGT users, and if possible Dovenschap or the Gebarencentrum, for feedback before switching the domain over. *Because:* the government consults target groups, and Tetralogical recommends the same.

**Not in scope for v2** (named explicitly): handshape and location pictograms, and pictures of the word. Hassan, Wauters and Spreadthesign show they help. But we have no licensed artwork for them, and Signbank's handshape data is linguistic notation ("B", "Money"). They are a good candidate for later.
