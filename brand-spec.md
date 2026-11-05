# Kenny Yu Portfolio - Visual System

## Design read

- Artifact: one-page personal portfolio
- Audience: engineering managers, recruiters, and collaborators
- Visual language: hand-inked developer notebook with restrained editorial structure
- Mode: redesign-preserve, matching the approved C concept while retaining page contracts
- Visual variance: 7. The hero is asymmetric and illustration-led; later sections use quieter, varied layouts.
- Motion intensity: 6. Motion is concentrated in the hero scene and short content reveals.
- Information density: 3. Each viewport carries one dominant idea.
- Asset dependence: 8. The hero relies on reference-matched character and cat artwork; project sections use verified repository assets and data.
- Brand fidelity: 10. The hero scene follows the approved composition, ink treatment, red cursor line, and front-facing orange cat, printed as a two-ink poster.

## Design decisions

- Anchor: custom ink-and-cursor direction
- Paper: `#F4F4F0`
- Ink: `#171918`
- Graphite: `#666A66`
- Hairline: `#C9CCC5`
- Signal red: `#E7432F`
- Cat orange: `#E88949`, reserved for the literal cat illustration
- Display type: Barlow Condensed, with narrow local fallbacks
- Body type: DM Sans, with neutral local fallbacks
- Utility type: IBM Plex Mono, with monospace fallbacks
- Spacing: 8 px base with 16, 24, 40, 64, 96, and 144 px steps
- Radius: sharp throughout
- Shadows: none; hierarchy comes from scale, lines, color, and whitespace
- Theme: light only because the approved direction intentionally emulates a cold-white sketchbook page
- Motion: transform and opacity only, using a restrained ease-out curve; reduced-motion users receive a static scene

## Signature

The hero is a single hand-inked scene set as a two-ink poster: a full-width `KENNY & BAMBI` title, then the drawing printed in black with the same line art printed in signal red a hair out of register. Kenny types while Bambi looks around and follows the visitor's pointer. No other section competes with that motion.

## Source assets

- Approved reference: `concepts/2026-08-23/C-ink-and-cursor.png`
- Chosen hero concept: `concepts/2026-11-05/M3-two-ink-poster.png`; the rejected alternatives M1 and M2 sit beside it
- Hero scene: `assets/hero-studio-v3.png` (source) served as `assets/hero-studio-v3.webp`
- Second ink plate: `assets/hero-studio-ink-red.webp`, generated from the scene source (line darkness to alpha, filled with signal red); the recipe is in README
- Hero cat: `assets/hero-cat-front-v2.png` (source) served as `assets/hero-cat-front-v2.webp`
- Earlier isolated layers `assets/hero-coder-v2.png` and `assets/hero-cat-back-v1.png` remain as references only
- Foldergram banner: public repository asset from `kennyufish/foldergram-folder-edition-public`
- Bambi walking loop: public repository asset from `kennyufish/bambi-2d-desktop-pet`
- Resume: local copy of the verified neutral master; review it again before publishing the site

## Content guardrails

### Hero — two-ink poster, approved November 2026

The procedural 3D room (Three.js, React, day/night cycle, scene controls) was retired. The hero returns to the approved hand-inked scene and sets it as a poster: title first, one line, `&` in signal red; the drawing right-aligned below it; the copy block bottom-left; the pointer note bottom-right. The red plate sits 2.5px up and right of the black plate at 80% opacity and is never animated on its own. Keep pointer tracking, the typing / tail / ear loops, the red line draw-in and the reduced-motion static fallback. The kicker reads "Kenny Yu, backend software engineer" in sentence case. `↗` is reserved for external links. No text below 0.75rem. Bambi likeness guidance now applies only to the illustration and the photo page: an orange tabby with yellow-green eyes, never a different cat.

### Work redesign — approved September 2026

Redesign-preserve: keep the paper / ink / red tokens, display/body/mono families, three verified projects and their caveats. The hero, Bambi photo route and protected original artwork are out of scope. Work becomes a kinetic editorial gallery for recruiters and collaborators, with three indexed sheets and optional project-note dialogs. Dials: variance 7, motion 7, density 4, assets 8, fidelity 9. Richer motion is explicitly requested: layered native scroll, sequenced titles and visual feedback; stable copy remains readable. Reuse true benchmark values and repository images, never fabricated screenshots. Highest risk is sticky content becoming inaccessible on short or zoomed viewports; enable stacking only when all cards fit, otherwise retain document flow. Mobile and reduced motion also use document flow. The Explore dialog shows the title, notes and repository link only; the sheet already carries the summary and visual.

- Benchmark values are labeled as local and synthetic.
- Bambi remains labeled as Beta with outstanding hands-on testing.
- Foldergram is identified as an independent, unofficial variant.
- Public contact routes are GitHub and LinkedIn.
- Do not add unsupported technologies, production-scale claims, testimonials, or client logos.
