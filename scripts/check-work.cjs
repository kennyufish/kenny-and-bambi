const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { buildSync } = require('esbuild');
const { resolve } = require('node:path');
process.chdir(resolve(__dirname, '..'));
const output = buildSync({ entryPoints: ['src/work.ts'], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text;
const moduleScope = { exports: {} };
vm.runInNewContext(output, { module: moduleScope });
const { stackProgress } = moduleScope.exports;
assert.equal(stackProgress(700, 100, 600), 0, 'No shrinking before the next sheet arrives');
assert.equal(stackProgress(400, 100, 600), .5);
assert.equal(stackProgress(100, 100, 600), 1);
assert.equal(stackProgress(-500, 100, 600), 1);
assert.equal(stackProgress(2000, 100, 600), 0);
assert.ok(Number.isFinite(stackProgress(100, 100, 0)));
// Exercise the actual initialization and preference / visibility branches.
// Native dialog focus and geometry are checked in the browser, not faked here.
for (const [mobile, reducedMotion] of [[false, false], [true, false], [false, true]]) {
  const makeNode = () => {
    const classes = new Set(), values = {}, listeners = {};
    return { classes, values, listeners, hidden: false, offsetHeight: 500,
      style: { setProperty: (k, v) => { values[k] = v; }, removeProperty: k => { delete values[k]; } },
      classList: { add: k => classes.add(k), remove: k => classes.delete(k), contains: k => classes.has(k), toggle: (k, on) => on ? classes.add(k) : classes.delete(k) },
      setAttribute: (k, v) => { values[k] = v; },
      addEventListener: (k, fn) => { listeners[k] = fn; }, getBoundingClientRect: () => ({ top: 100, height: 500 }),
      querySelector: () => null, querySelectorAll: () => [] };
  };
  const video = { ...makeNode(), paused: true, play() { this.paused = false; return Promise.resolve(); }, pause() { this.paused = true; } };
  const toggle = makeNode(), summary = makeNode(), close = makeNode();
  const cards = [makeNode(), makeNode(), makeNode()];
  cards.forEach(card => { const visual = makeNode(); card.querySelector = () => visual; });
  const work = makeNode(), dialog = { ...makeNode(), open: false, showModal() {} };
  work.querySelectorAll = selector => selector === '.work-card' ? cards : [];
  work.querySelector = selector => selector === 'video' ? video : toggle;
  dialog.querySelector = selector => selector === '.work-detail-summary' ? summary : close;
  const reduced = { ...makeNode(), matches: reducedMotion };
  const desktop = { ...makeNode(), matches: !mobile };
  const document = { ...makeNode(), hidden: false, fonts: { ready: { then() {} } }, querySelector: selector => selector === '#work' ? work : dialog };
  const observers = [], windowListeners = {};
  let scheduled = 0;
  const scope = { module: { exports: {} }, document, innerHeight: 900,
    window: { IntersectionObserver: true },
    matchMedia: query => query.includes('reduced-motion') ? reduced : desktop,
    IntersectionObserver: class { constructor(callback) { this.callback = callback; } observe(target) { observers.push({ target, callback: this.callback }); } unobserve() {} },
    ResizeObserver: class { observe() {} },
    addEventListener: (key, fn) => { windowListeners[key] = fn; },
    requestAnimationFrame: () => ++scheduled };
  vm.runInNewContext(output, scope);
  scope.module.exports.setupWork();
  assert.equal(work.classes.has('work-stacked'), !mobile && !reducedMotion);
  const show = target => observers.find(item => item.target === target).callback([{ target, isIntersecting: true }]);
  show(work); show(video);
  assert.equal(video.paused, reducedMotion, 'Reduced motion prevents preview autoplay');
  const beforeScroll = scheduled;
  windowListeners.scroll(); windowListeners.scroll();
  assert.equal(scheduled, beforeScroll, 'Scroll is coalesced; no idle or duplicate frame loop');
  if (!reducedMotion) {
    toggle.listeners.click(); assert.equal(video.paused, true);
    toggle.listeners.click(); assert.equal(video.paused, false);
  }
  document.hidden = true; document.listeners.visibilitychange();
  assert.equal(video.paused, true, 'Background tabs pause decoding');
  document.hidden = false; dialog.open = true; document.listeners.visibilitychange();
  assert.equal(video.paused, true, 'Opening details pauses the card preview');
  dialog.open = false; reduced.matches = true; reduced.listeners.change();
  assert.equal(video.paused, true); assert.equal(work.classes.has('work-stacked'), false);
  windowListeners.keydown({ key: 'Tab' }); assert.equal(work.classes.has('work-keyboard'), true);
  windowListeners.wheel(); assert.equal(work.classes.has('work-keyboard'), false, 'Mouse scrolling releases a focused sheet');
}
const html = fs.readFileSync('index.html', 'utf8');
for (const project of ['eatmeowever', 'java', 'foldergram', 'bambi']) {
  assert.equal((html.match(new RegExp(`data-project="${project}"`, 'g')) || []).length, 1);
  assert.equal((html.match(new RegExp(`data-detail="${project}"`, 'g')) || []).length, 1);
}
assert.match(html, /<dialog[^>]+id="work-dialog"[^>]+aria-labelledby="work-detail-title"/);
assert.match(html, /id="studio-scene"/);
assert.match(html, /class="cat-reference"/);
assert.match(html, /class="studio-ghost"[^>]+hero-studio-ink-red\.webp/, 'Two-ink hero keeps its red plate');
assert.ok(!html.includes('home.bundle.js') && !html.includes('home-3d.css'), 'The retired 3D scene is not loaded');
for (const value of ['34', '6', '53.489', '0.040']) assert.ok(html.includes(`>${value}</span>`));
assert.ok(!/<video[^>]+autoplay/.test(html), 'Playback follows visibility and motion preferences, not a static autoplay attribute');
for (const file of ['styles.css', 'work.css', 'assets/portfolio.bundle.js', 'assets/hero-studio-ink-red.webp', 'assets/bambi-walking.mp4', 'assets/bambi-walking-poster.png', 'assets/eat-meowever-look.jpg', 'assets/eat-meowever-filters.jpg']) {
  assert.ok(fs.statSync(file).size > 0);
  assert.ok(fs.readFileSync(file).equals(fs.readFileSync(`dist/${file}`)), `Production asset is current: ${file}`);
}
console.log('Work checks passed: stack math, desktop/mobile/reduced motion, playback/visibility, frame coalescing, keyboard release, detail routes, protected content and production assets.');
