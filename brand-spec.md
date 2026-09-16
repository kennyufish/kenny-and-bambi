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
- Brand fidelity: 10. The hero scene follows the approved composition, ink treatment, red cursor line, and rear-facing orange cat.

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

The hero is a single hand-inked scene: Kenny types while Bambi looks around and follows the visitor's pointer. No other section competes with that motion.

## Source assets

- Approved reference: `concepts/2026-08-23/C-ink-and-cursor.png`
- Hero coder: `assets/hero-coder-v2.png`, generated from the approved reference and isolated at render time
- Rear-facing hero cat: `assets/hero-cat-back-v1.png`, generated from the approved reference and isolated at render time
- Foldergram banner: public repository asset from `kennyufish/foldergram-folder-edition-public`
- Bambi walking loop: public repository asset from `kennyufish/bambi-2d-desktop-pet`
- Resume: local copy of the verified neutral master; review it again before publishing the site

## Content guardrails

### Bambi likeness — approved September 2026

Redesign-preserve, scoped only to the procedural 3D cat. Reference the supplied `image.jpg` for face and natural-light coloring, `12.jpg` for seated proportions, and `15.jpg` for side markings. Aim for recognizable proportions in the existing soft miniature aesthetic, not photographic fur. Retain camera composition, room, interface, Work, photo page and original hand-edited illustration. Dials remain variance 7, motion 6, density 3, asset dependence 8, fidelity 10: photos guide anatomy but are not imported as scene textures. Shape cheeks, chin and projecting muzzle as one continuous surface; use thin pink-lined ears, olive/yellow-green eyes, warm pale-orange coat and region-specific irregular tabby markings. Latest user feedback prioritizes a cuter expression: shorter rounded-tip ears with buried roots, rounder eyes and larger round pupils even in daylight, subtle night dilation, and softer face markings. This supersedes the earlier slit-pupil direction. Preserve pointer tracking, click actions, automatic routines and reduced motion. Keep existing geometry/draw-object budgets; check front, side, room-scale views and complete action cycles. No imported model, fur-mesh system, new dependency or added render pass.

### Work redesign — approved September 2026

Redesign-preserve: keep the paper / ink / red tokens, display/body/mono families, three verified projects and their caveats. The current 3D hero, day/night theme, Bambi photo route and protected original artwork are out of scope. Work becomes a kinetic editorial gallery for recruiters and collaborators, with three indexed sheets and optional project-note dialogs. Dials: variance 7, motion 7, density 4, assets 8, fidelity 9. Richer motion is explicitly requested: layered native scroll, sequenced titles and visual feedback; stable copy remains readable. Reuse true benchmark values and repository images, never fabricated screenshots. Highest risk is sticky content becoming inaccessible on short or zoomed viewports; enable stacking only when all cards fit, otherwise retain document flow. Mobile and reduced motion also use document flow. Theme colors continue to follow the existing day cycle.

- Benchmark values are labeled as local and synthetic.
- Bambi remains labeled as Beta with outstanding hands-on testing.
- Foldergram is identified as an independent, unofficial variant.
- Public contact routes are GitHub and LinkedIn.
- Do not add unsupported technologies, production-scale claims, testimonials, or client logos.
