# Kenny & Bambi Portfolio

An existing paper / ink / red portfolio with a full-screen, code-generated miniature workspace on **index.html**. Three.js, React and strict TypeScript power only the interactive hero; the original semantic portfolio content and Bambi photo page remain intact. There is no separate Studio navigation entry. Old `studio.html` links redirect home.

## Open or build

Open `index.html` directly in a modern WebGL 2 browser. The included `assets/home.bundle.js` contains React, Three.js and OrbitControls: no CDN, model download or runtime server is needed. Keep the HTML, CSS, `script.js` and `assets/` together. Google Fonts are optional, with local fallbacks.

For a local HTTP preview:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173/index.html`. After editing source:

```powershell
npm ci
npm run typecheck
npm run build
npm run test:studio
npm run test:work
```

The build regenerates `assets/home.bundle.js` and the complete static site in `dist/`. It replaces only the generated `dist/` directory. No deployment or GitHub push is performed by these commands.

## Controls

- Mouse wheel always scrolls the **webpage**, not the miniature. Desktop and phone both start in **Browse** mode with a fixed close-up composition. Open Scene controls and choose Rotate / Pan to explore; zoom with the + / − buttons, keyboard, or touch gestures in scene mode.
- Near-square desktop windows show the scene about 22% larger, matching the supplied reference. Reset and reload return to this view. Wider windows also enforce a vertical safety margin; portrait phones use a smaller enlargement, and short landscape screens retain room for the copy and controls.
- Bambi tracks the pointer across the hero, including over text and buttons. Head turns reach ±0.65 radians, with bounded upward / downward motion and a slight tilt; pupils stay within the eyes. Leaving the hero eases back to neutral. Pause and reduced-motion settings also pause tracking.
- After an 18-second desk break, Bambi alternates between a short run, batting the ball with both paws, and curling up in the cat bed. Each routine includes a table-edge-clearing jump and returns to the original pointer-watching pose. **Scene controls → Bambi** can start any routine early; buttons wait until the current routine finishes. Pause freezes the complete routine, and reduced motion keeps autoplay off. Routes are authored for the fixed furniture layout; no physics engine or extra animation package is used.
- Click / tap **Bambi himself** to randomly run, play ball or nap; the existing buttons and automatic routines remain available. Dragging, page scrolling, multi-touch, right-click and occluded parts of the cat do not trigger actions. An active routine finishes before another can start. Pause and reduced motion apply to direct interaction too.
- Focus the canvas: Enter / Space plays a random Bambi action; arrows rotate, Shift + arrows pan, + / − zoom, R resets. Escape closes the control panel and restores focus.
- The day cycle plays automatically (unless reduced motion is requested), synchronizing scene lighting, the sun / crescent moon, page backgrounds, navigation, text and section colors. Manual time selection pauses the cycle; the play control resumes it. This is an artistic 24-hour loop of roughly 133 seconds, not location-based solar data.
- Native / **2px pixel** affects only the 3D canvas. The latter draws one backing pixel per two CSS pixels; text and interface icons stay sharp.
- Screenshot downloads a PNG of the scene, without the page UI. Fullscreen expands the hero, with an informative fallback where the browser does not support the Fullscreen API.
- 中文 / EN switches homepage copy and scene controls and remembers the preference locally. Project names, technology names and external documents are unchanged; the separate Bambi photo page is not translated by this homepage control.

## Implementation phases

1. Home integration: retain the original content, colors, typography, links and lower-page sections. The hand-edited original illustration, including `.cat-reference`, is preserved in the inert `#original-hero-art` template.
2. Interaction: procedural engineer, Bambi, desk, coffee, room, animated typing / ears / tail, OrbitControls, day-night lighting, time control, pixel mode, screenshot, fullscreen and bilingual UI.
3. Performance and validation: responsive portrait / landscape framing, capped rendering resolution and frame rate, instanced keyboard keys, lower-resolution mobile shadows, reduced-motion support, offscreen / hidden-tab suspension, cleanup, strict type checking and production build.

Mobile uses a 1.25 DPR cap, 512px shadows and a 30fps rendering cap; desktop caps are 1.75 DPR, 1024px shadows and 60fps. These are budgets, not measured device performance guarantees. Lighting follows the render clock; the single shadow map refreshes at approximately 30Hz instead of the previous 5Hz, using radius-filtered PCF shadows. A paused, unchanged scene does not redraw. When the hero scrolls offscreen, GPU rendering stops but the page clock continues at four updates per second. Hidden tabs suspend both. Reduced-motion preferences pause animations and autoplay on startup. There are no imported 3D models or photographic scene textures.

The Node smoke check uses actual Three.js geometry and camera math with a stubbed WebGL renderer. It exercises controls, wheel routing, responsive framing, day/night, pixel resolution, screenshot sizing, pause and lifecycle cleanup. It does **not** prove visual quality, real-GPU performance, browser downloads, fullscreen permissions or real touch behavior. Those require browser / device acceptance.

### Model polish

The scene uses smooth normals and a photo-guided, stylized Bambi. His head is narrower than his torso, with full cheeks tapering to the chin, a nose bridge and muzzle shaped into one continuous surface rather than separate balls, and shorter pink-lined ears with rounded tips and roots embedded in the head. The yellow-green eyes and larger tracking pupils stay round in daylight, with subtle dilation at night; softened forehead and cheek markings keep the expression open. Manual time changes also work while motion is paused. Kenny has tapered short hair with exposed ears, a broken nape and six shallow side-swept locks instead of a round striped cap. The fitted hair stays outside the head throughout the nodding animation. His raised seated posture keeps forearms clear of the desk, with opaque fingers above the keyboard. The desktop and chair have gently rounded edges. The hollow cup, animated striped tail, connected red power lead and hand-drawn floor seams remain. The original paper / ink / red design and portfolio content are retained, with a coordinated night palette.

The monitor has a rounded bezel, hinge and instanced rear vents; the keyboard has rounded keycaps, and the cup has a glazed finish and a shaped saucer. Curved, creased leaf surfaces replace dense sphere clusters. Linen curtains, a clock synchronized to the day cycle, a storage cabinet, a notebook and pencil, a cat bed and a toy ball make the room lived-in without adding another visual style. Bambi's ear shells have welded, smoothly shaded bevels; curved glossy irises have procedural radial detail. Fuller shoulders, tapered forelegs and flatter paws refine the seated silhouette. Face, torso, neck and legs use distinct warm-orange/cream coat maps with irregular tabby bands and fine baked strokes; the tail tapers to a softer tip. These details are generated once, without individual fur meshes. The complete scene has 54,984 triangles on desktop and 31,408 on mobile, with 285 renderable objects (down from 56,670 / 31,982 / 287 before the likeness revision). This remains within the existing 66k / 32k triangle and 300-object budgets, without additional dependencies or post-processing passes.

Sun and moon share a tilted circular world-space orbit centered on the miniature, half a revolution apart. The active directional light uses the same direction as its visible celestial body. Near the horizon, light and shadow intensity fade out before the one shadow map changes source; the celestial silhouettes and ambient color also blend continuously. The desk lamp's light now sits inside its physical shade. This is an artistic day cycle, not a location-based astronomy simulation.

The smoke check enforces geometry budgets, forearm clearance, cable connections, celestial/light alignment throughout 24 hours, constant orbital radius, horizon handover, frame-by-frame clock movement, offscreen suspension, reduced motion, and page-text contrast. It also checks Bambi's head/body ratio, continuous projecting muzzle, tapered chin, thin ears with embedded roots throughout their twitch, distinct leg coat, round eyes, smooth day/night pupil dilation and pupil containment. Real geometry raycasts verify pointer / keyboard actions, drag and pinch cancellation, pause, occlusion, all random choices, autoplay, complete action returns with the refined proportions and listener cleanup. These structural checks are not a real-phone performance or visual-likeness guarantee.

## Files

### Selected work

The three projects use native sticky sheets on sufficiently tall desktop screens, with scroll-linked recession and one-time title / benchmark reveals. Short screens, tablets, phones and reduced-motion mode keep ordinary document flow. There is no scroll hijacking, snap or additional animation dependency. Visuals use the existing benchmark evidence, Foldergram screenshot and Bambi walking asset; the latter is also encoded as a small H.264 preview with a still poster, a pause button, and offscreen / hidden-tab suspension.

Each Explore project button opens a native dialog with project notes and a separate GitHub link. Escape, Close, or a desktop backdrop click dismisses it and returns focus without changing the page's scroll position. The existing homepage language switch covers Work and its notes. The Work script coalesces scroll events into at most one pending frame and does not run an idle animation loop. `test:work` checks scroll math, desktop/mobile/reduced-motion branches, video visibility and pause behavior, frame coalescing, keyboard layer release, detail bindings, protected content and production assets. Browser checks are still required for actual layout, native focus behavior and playback.

- `work.css`, `src/work.ts`: scoped project gallery, scroll motion, preview playback and native detail dialog

- `index.html`, `styles.css`, `script.js`: original portfolio structure and progressive reveals
- `home-3d.css`: scoped full-screen hero and lightweight controls
- `src/main.tsx`: React scene UI and native browser actions
- `src/scene.ts`: procedural geometry, lights, OrbitControls and animation lifecycle
- `src/bambi-motion.ts`: lightweight Bambi poses, room routes and action sequence
- `src/daylight.ts`, `src/i18n.ts`: time mapping and homepage language strings
- `bambi.html`: existing Life with Bambi photo page
- `studio.html`: compatibility redirect only
- `scripts/build.mjs`, `scripts/check-studio.cjs`: build and deterministic smoke check
- `assets/home.bundle.js`: generated browser bundle

Three.js is pinned to r180. Its MIT license is included in `assets/three-LICENSE.txt`. See the [OrbitControls documentation](https://threejs.org/docs/pages/OrbitControls.html). Review the bundled resume and public links before any deployment.
