# Kenny & Bambi Portfolio

A one-page paper / ink / red portfolio for Kenny Yu, backend software engineer, and Bambi, his orange tabby. The hero is the approved hand-inked "ink and cursor" scene set as a **two-ink poster**: the line art is printed once in black and once in signal red, a hair out of register, under a full-width `KENNY & BAMBI` title. Bambi's pupils follow the pointer, Kenny types, and the red cursor line draws in on load.

There is no framework and no WebGL. The site is static HTML and CSS, one small vanilla script (`script.js`) and one small bundle (`assets/portfolio.bundle.js`) for the Work section and the language switch. The earlier Three.js / React miniature room was retired in November 2026; `studio.html` still redirects home.

## Open or build

Open `index.html` directly in any modern browser. Google Fonts are optional, with local fallbacks. Keep the HTML, CSS, `script.js` and `assets/` together.

For a local HTTP preview:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173/index.html`. After editing anything under `src/`:

```powershell
npm ci
npm run typecheck
npm run build
npm run test:work
```

The build regenerates `assets/portfolio.bundle.js` and the complete static site in `dist/`. It replaces only the generated `dist/` directory. No deployment or GitHub push is performed by these commands.

## What moves, and where it stops

- **Hero.** `script.js` turns Bambi's pupils toward the pointer anywhere on the page and lets him look around when the pointer rests. CSS loops the typing hands, caret, tail sway and ear twitches; the red signal line draws in once after load. Everything pauses offscreen and in hidden tabs, and `prefers-reduced-motion` renders a static scene.
- **中文 / EN.** One button in the header switches the homepage copy, the Work sheets and the project notes, and remembers the choice in `localStorage`. Project names, technology names and external documents are unchanged. The Bambi photo page stays English.
- **Work.** On sufficiently tall desktop screens the four sheets stack with native `position: sticky`, scroll-linked recession and one-time title / benchmark reveals. Short screens, tablets, phones and reduced motion keep ordinary document flow. **Explore project** opens a native dialog with the project title, its notes and a GitHub link; the summary and visual stay on the sheet instead of being repeated. Escape, Close or a backdrop click dismisses it and returns focus.
- **Bambi page.** The walking loop is the same small H.264 preview and poster the Work section uses. It plays while visible, pauses in background tabs and never autoplays under reduced motion.

## Design rules worth keeping

- Tokens, type and spacing are defined in `brand-spec.md`. Paper `#F4F4F0`, ink `#171918`, signal red `#E7432F`; Barlow Condensed for display, DM Sans for body, IBM Plex Mono for utility text.
- Small type never goes below `0.75rem`, including captions, evidence notes and the footer.
- `↗` marks an external link and nothing else. In-page links and dialog triggers carry no arrow.
- The kicker is a sentence, not a tracked-out label: "Kenny Yu, backend software engineer".

## Assets

- `assets/hero-studio-v3.webp` and `assets/hero-cat-front-v2.webp` are the delivery copies of the hand-edited PNG sources, which stay in `assets/` as the editable originals.
- `assets/hero-studio-ink-red.webp` is the second ink plate: the same drawing with line darkness mapped to alpha, white fills dropped and the result filled with signal red. Regenerate it from the PNG source with Pillow:

  ```python
  from PIL import Image
  src = Image.open('assets/hero-studio-v3.png').convert('RGBA')
  r, g, b, a = src.split()
  ink = Image.merge('RGB', (r, g, b)).convert('L').point(lambda v: 255 - v)
  plate = Image.new('RGBA', src.size, (231, 67, 47, 255))
  plate.putalpha(Image.composite(ink, Image.new('L', src.size, 0), a))
  plate.save('assets/hero-studio-ink-red.webp', 'WEBP', quality=80, method=6)
  ```

- `assets/eat-meowever-look.jpg` and `assets/eat-meowever-filters.jpg` are English screenshots from the EatMeowever | 吃什喵 demo's about page, used on the featured Work sheet.
- `assets/bambi-walking.mp4` and `assets/bambi-walking-poster.png` serve both the Work sheet and the Bambi page. The old GIF is gone.
- `concepts/2026-08-23/` holds the original four hero concepts (C was approved). `concepts/2026-11-05/` holds the three alternatives drawn up when the 3D room was retired; M3, the two-ink poster, is the one in production.

## Files

- `index.html`, `styles.css`, `script.js`: portfolio structure, the two-ink hero, progressive reveals and pointer tracking
- `work.css`, `src/work.ts`: scoped project gallery, scroll motion, preview playback and the native detail dialog
- `src/i18n.ts`: homepage language strings and the header switch
- `src/main.ts`: bundle entry
- `bambi.html`: Life with Bambi photo page
- `studio.html`: compatibility redirect only
- `scripts/build.mjs`, `scripts/check-work.cjs`: build and deterministic smoke check
- `assets/portfolio.bundle.js`: generated browser bundle

`test:work` checks the stacking math, desktop / mobile / reduced-motion branches, video visibility and pause behaviour, frame coalescing, keyboard layer release, detail routes, protected hero markup and production assets. Browser checks are still required for actual layout, native focus behaviour and playback. Review the bundled resume and public links before any deployment.
