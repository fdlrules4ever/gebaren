# Design mockups (step 2)

There are three working, responsive HTML/CSS mockups for Gebaren v2:

| File | Direction | In short |
|---|---|---|
| `a-stilte.html` | **A, Stilte** | One calm centred column, Atkinson Hyperlegible Next, deep blue |
| `b-signaal.html` | **B, Signaal** | Bold signage: yellow search band, word on the left, video on the right, Lexend |
| `c-zakboek.html` | **C, Zakboek** | Pocket app: round buttons, tab bar on the phone, side rail on a laptop, "Inzoomen", Andika |

`index.html` is the comparison board, with screenshots of each direction:
- at laptop size (1280×860) and phone size (390×844)
- in light and dark
- in the player, "not found" and start (typing) states

## Viewing them

```bash
node design/serve.mjs
```

Then open http://localhost:4173/.

This is a small static server with no dependencies. It supports byte ranges, so the videos also play in Safari.

Each mockup reads its screen and theme from the address:
- `#gebaar`, `#niet-gevonden` or `#start`
- optionally followed by `-licht` or `-donker`, for example `c-zakboek.html#niet-gevonden-donker`

The dashed **Mockup** button switches between screens and themes. It is not part of the design.

## Shared parts

- `shared/base.css`: reset, focus ring, the check marks for on/off states, and full-screen behaviour
- `shared/mock.js`: icons, screen switching, the player (play/pause, replay, speed, mirror, zoom, full screen, variants as tabs), the search combobox, and keyboard shortcuts that can be switched off

## Media

`media/huis-a.*` and `media/huis-b.*` are the HUIS-A and HUIS-B signs from NGT Signbank (Radboud Universiteit and Universiteit van Amsterdam), licensed **CC BY 4.0**.

## Regenerating the screenshots

`shots/` was made with headless Chrome. Add `-foto` to a mockup's address: it hides the Mockup button and freezes the clip mid-sign.
