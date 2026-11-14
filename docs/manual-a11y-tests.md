# Manual accessibility tests

Automated tests (axe, keyboard, reflow, target sizes) run with `pnpm test:e2e`. The checks below need a person with a real screen reader or phone.

Run them on the live site (https://gebaren.franklippes.workers.dev, later https://gebaren.franklippes.com). For desktop tests you can also use the local app (`pnpm preview`, http://localhost:8787). Then fill in the results table at the bottom.

Each test takes about 5 minutes.

## 1. Keyboard only (desktop, any browser)

Put the mouse away.

1. Press Tab once. **Naar de inhoud** appears. Press Enter: focus jumps to the content.
2. Tab to the search field. Type `hu`.
   - A list with words appears.
   - The text below the field says how many words there are.
3. Press Down twice, then Enter.
   - The word's page opens.
   - Focus is on the big word (heading).
4. Press Space: the video pauses, and the button changes to **Afspelen**. Press Space again: it plays.
5. Press `2`: the speed changes to Langzaam (and that button shows a check mark). Then press `S`: mirror turns on.
6. Tab through every control.
   - The focus ring is always clearly visible.
   - The order is logical: search, then Gebaar 1/2, Bewaar, Pauze, Opnieuw, the speed buttons, Spiegel, Volledig scherm, the lists, the shortcuts.
7. On a word with several signs, Tab to **Gebaar 1** and use the left and right arrows: the video changes.
8. Turn **Sneltoetsen aan** off. Space, R and S now do nothing outside buttons.
9. Press `/`: focus goes to the search field.

## 2. NVDA + Firefox or Chrome (Windows)

1. Open the start page. Press H to move through the headings. Press D (landmarks): you should hear banner, search, main, contentinfo.
2. In the search field you should hear "Zoek een woord, combobox, collapsed".
3. Type `kof`. After a moment NVDA reads "… woorden. Kies met de pijltjes en Enter."
4. Press Down: NVDA reads the selected word (for example "koffie, 1 of …").
5. Press Enter. You should hear "Gevonden: 6 gebaren voor koffie."
6. Press Tab to a tab. You should hear "Gebaar 1 van 6, tab, selected, 1 of 6".
7. On **Spiegel** you should hear "toggle button, not pressed". Press Space: "Spiegel staat aan."
8. Search for `kinderopvangje`. You should hear "Geen gebaar gevonden voor kinderopvangje." The suggestions are links.

## 3. VoiceOver on an iPhone (Safari)

1. Open the live site. The video plays in the page, not full screen, and loops.
2. Swipe through the page. Every button has a word (not only an icon).
3. Double-tap **Volledig scherm**: the iPhone's own full-screen player opens. Close it.
4. Search for `dank je` with the on-screen keyboard. The suggestions can be reached and chosen.
5. Settings → Accessibility → Motion → Reduce Motion: on. Reload: the video waits, and the button says **Afspelen**.
6. Share → Add to Home Screen. Open it from the home screen: the app opens without the Safari address bar.

## 4. TalkBack on Android (Chrome)

Repeat steps 1, 2 and 4 of the VoiceOver test with TalkBack. Also check that **Bewaar** reads "toggle button" and changes state.

## 5. 400 % zoom (desktop)

1. In Chrome on a 1280 px wide window, press Ctrl and + until the zoom is 400%.
2. Nothing scrolls sideways. All controls are still there and usable; they may stack.
3. Also set the browser's font size to *Very large* (Settings → Appearance). The text grows and nothing overlaps.

## Results

| Test | Device / browser | Result | Notes |
|---|---|---|---|
| Keyboard only | | | |
| NVDA | | | |
| VoiceOver iPhone | | | |
| TalkBack | | | |
| 400 % zoom | | | |
