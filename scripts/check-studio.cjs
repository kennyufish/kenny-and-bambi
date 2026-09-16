const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildSync } = require('esbuild');
const THREE = require('three');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const compile = source => buildSync({ stdin: { contents: source, loader: 'ts', resolveDir: path.join(root, 'src') }, bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text;
const daylightModule = { exports: {} };
vm.runInNewContext(compile(read('src/daylight.ts')), { module: daylightModule });
const { daylightAt, clockLabel, pageThemeAt } = daylightModule.exports;
assert.equal(daylightAt(12).daylight, 1);
assert.equal(daylightAt(0).daylight, 0);
assert.equal(daylightAt(0).night, true);
assert.equal(daylightAt(6).warmth, 1);
assert.ok(daylightAt(18).warmth > .99);
assert.equal(daylightAt(Infinity).time, 12);
assert.equal(clockLabel(-1), '23:00');
assert.equal(clockLabel(24), '00:00');
assert.equal(pageThemeAt(12).paper, '#f4f4f0');
assert.notEqual(pageThemeAt(0).paper, pageThemeAt(12).paper);
assert.ok(parseInt(pageThemeAt(17).paper.slice(1, 3), 16) > 235, 'Late afternoon stays warm and light, not prematurely gray');
const luminance = hex => hex.match(/\w{2}/g).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
for (let hour = 0; hour < 24; hour += .05) {
  const theme = pageThemeAt(hour), a = luminance(theme.paper);
  for (const key of ['ink', 'graphite', 'signal-dark']) {
    const b = luminance(theme[key]);
    assert.ok((Math.max(a, b) + .05) / (Math.min(a, b) + .05) >= 4.5, `Readable ${key} contrast at ${hour}`);
  }
}

const source = read('src/scene.ts').replace("import * as THREE from 'three';", 'const THREE = testTHREE;').replace("import { OrbitControls } from 'three/addons/controls/OrbitControls.js';", 'const OrbitControls = TestControls;');
const sceneCode = compile(source);

async function checkScene(width, height, mobile, reducedMotion = false) {
  const callbacks = new Map(), timers = new Map(), observers = [], surfaces = [];
  let nextFrame = 0, renderer, controls, timeNotice, failed = false, now = 0, randomValue = .1;
  const randomMath = Object.create(Math); randomMath.random = () => randomValue;
  const target = () => ({ listeners: new Map(), addEventListener(name, fn, options) { this.listeners.set(name, { fn, options }); }, removeEventListener(name) { this.listeners.delete(name); } });
  function makeCanvas(w = 0, h = 0) {
    const context = new Proxy({ drawImage() {}, imageSmoothingEnabled: true, createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }, { get(object, key) { return key in object ? object[key] : () => {}; } });
    const canvas = { ...target(), width: w, height: h, clientWidth: w, clientHeight: h, style: {}, dataset: {}, context,
      closest: () => null, getContext: () => context, getBoundingClientRect: () => ({ left: 0, top: 0, width: w, height: h }),
      toBlob: callback => callback(new Blob(['png'], { type: 'image/png' })) };
    surfaces.push(canvas); return canvas;
  }
  const canvas = makeCanvas(width, height);
  const document = { ...target(), hidden: false, createElement: () => makeCanvas() };
  class Renderer {
    constructor(options) { renderer = this; this.options = options; this.shadowMap = {}; this.capabilities = { getMaxAnisotropy: () => 4 }; this.count = 0; }
    setPixelRatio(ratio) { this.ratio = ratio; }
    setSize(w, h) { canvas.width = Math.floor(w * this.ratio); canvas.height = Math.floor(h * this.ratio); }
    render(scene, camera) { this.scene = scene; this.camera = camera; scene.updateMatrixWorld(true); camera.updateMatrixWorld(true); this.count++; }
    dispose() { this.disposed = true; }
  }
  class Controls extends THREE.EventDispatcher {
    constructor(camera) { super(); controls = this; this.camera = camera; this.target = new THREE.Vector3(); this.mouseButtons = {}; this.touches = {}; this.last = ''; }
    update() {
      this.camera.lookAt(this.target);
      const key = this.camera.position.toArray().concat(this.target.toArray()).join(',');
      if (key !== this.last) { this.last = key; this.dispatchEvent({ type: 'change' }); }
    }
    dispose() { this.disposed = true; }
  }
  class Observer {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  const module = { exports: {} };
  vm.runInNewContext(sceneCode, { module, AbortController, testTHREE: { ...THREE, WebGLRenderer: Renderer }, TestControls: Controls,
    document, window: { devicePixelRatio: 3, setInterval: fn => { timers.set(1, fn); return 1; }, clearInterval: id => timers.delete(id) }, innerWidth: width,
    performance: { now: () => now }, Math: randomMath,
    matchMedia: query => ({ matches: query.includes('coarse') ? mobile : reducedMotion }),
    ResizeObserver: Observer, IntersectionObserver: Observer,
    requestAnimationFrame: fn => { callbacks.set(++nextFrame, fn); return nextFrame; }, cancelAnimationFrame: id => callbacks.delete(id) });
  const api = module.exports.createStudio(canvas, () => { failed = true; }, (hour, night) => { timeNotice = { hour, night }; });
  const step = time => { now = Math.max(now + (mobile ? 40 : 20), time); const [id, fn] = callbacks.entries().next().value; callbacks.delete(id); fn(now); };
  const clockStep = () => { now += 250; timers.forEach(fn => fn()); };
  clockStep(); assert.equal(timeNotice.hour > 10, !reducedMotion, 'Autoplay defaults on except for reduced motion');
  api.setCycling(false);
  assert.equal(canvas.dataset.ready, 'true');
  assert.equal(renderer.camera.aspect, width / height);
  assert.ok(renderer.camera.position.length() < renderer.camera.far);
  assert.equal(renderer.ratio, mobile ? 1.25 : 1.75);
  assert.equal(controls.enabled, false, 'The close-up composition is fixed until Rotate or Pan is explicitly selected');
  assert.equal(canvas.style.touchAction, 'pan-y pinch-zoom');
  const scene = renderer.scene;
  let triangles = 0, renderables = 0;
  const geometries = new Set();
  scene.traverse(object => {
    if (!object.geometry) return;
    renderables++; geometries.add(object.geometry);
    if (object.isMesh) triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3 * (object.isInstancedMesh ? object.count : 1);
  });
  console.log(`Geometry ${mobile ? 'mobile' : 'desktop'}: ${triangles} triangles, ${renderables} renderable objects, ${geometries.size} unique geometries`);
  assert.ok(triangles < (mobile ? 32000 : 66000), 'Keep curved geometry within the mobile/desktop budget');
  assert.ok(renderables < 300, 'Extra detail must not restore the old 405 draw-object workload');
  const seams = scene.getObjectByName('floor-seams').geometry.attributes.position;
  for (let i = 0; i < seams.count; i++) assert.ok(Math.abs(seams.getX(i)) <= 3.6, 'Floor strokes must stop at the model edge');
  for (const name of ['studio-base', 'desk-top', 'keyboard', 'coffee', 'kenny', 'bambi', 'bambi-tail', 'bambi-head']) assert.ok(scene.getObjectByName(name), name);
  for (const name of ['wall-clock', 'storage-cabinet', 'bambi-bed', 'bambi-toy', 'desk-notebook']) assert.ok(scene.getObjectByName(name), `Cozy room detail: ${name}`);
  const defaultDistance = renderer.camera.position.distanceTo(controls.target);
  if (width >= height && height >= 520) assert.ok(defaultDistance < 18, 'Desktop starts in the close-up reference composition with a vertical safety margin');
  const base = new THREE.Box3().setFromObject(scene.getObjectByName('studio-base'));
  for (const x of [base.min.x, base.max.x]) for (const z of [base.min.z, base.max.z]) {
    const corner = new THREE.Vector3(x, base.min.y, z).project(renderer.camera);
    assert.ok(Math.abs(corner.x) < 1 && corner.y > -.91, `Close-up base stays above controls at ${width}x${height}: ${corner.x.toFixed(3)}, ${corner.y.toFixed(3)}`);
  }
  assert.equal(scene.getObjectByName('keyboard-keys').count, 48);
  const hand = scene.getObjectByName('typing-hand-1');
  assert.equal(renderer.options.alpha, true, 'Page background must show through the canvas');
  assert.equal(renderer.options.antialias, true, 'Native mode keeps character edges smooth on low-DPR mobile displays');
  assert.equal(scene.background, null);
  assert.equal(scene.getObjectByName('moon-crescent').geometry.type, 'ExtrudeGeometry');
  assert.equal(scene.getObjectByName('sun-rays').count, 12);
  assert.ok(scene.getObjectByName('bambi-face').material.map, 'Tabby markings are painted on the surface');
  const faceMesh = scene.getObjectByName('bambi-face'), torso = scene.getObjectByName('bambi-coat');
  faceMesh.geometry.computeBoundingBox(); torso.geometry.computeBoundingBox();
  const faceSize = faceMesh.geometry.boundingBox.getSize(new THREE.Vector3());
  const torsoWidth = torso.geometry.boundingBox.getSize(new THREE.Vector3()).x * torso.scale.x;
  assert.ok(faceSize.x < torsoWidth && faceSize.x > torsoWidth * .85, 'Photo-guided head is narrower than the torso, not an oversized toy head');
  assert.ok(faceMesh.geometry.boundingBox.max.z > .33, 'Nose bridge and muzzle project from the continuous face geometry');
  const headVertices = faceMesh.geometry.attributes.position;
  let chinWidth = 0, cheekWidth = 0;
  for (let i = 0; i < headVertices.count; i++) {
    if (headVertices.getY(i) < -.17) chinWidth = Math.max(chinWidth, Math.abs(headVertices.getX(i)));
    if (Math.abs(headVertices.getY(i)) < .1) cheekWidth = Math.max(cheekWidth, Math.abs(headVertices.getX(i)));
  }
  assert.ok(chinWidth < cheekWidth * .8, 'Full cheeks taper to Bambi\'s chin');
  const foreleg = scene.getObjectByName('bambi-front-leg-1').children[0];
  assert.notEqual(foreleg.material.map, torso.material.map, 'Leg markings do not repeat the chest/bib texture');
  for (const side of [-1, 1]) {
    const earMesh = scene.getObjectByName(`bambi-ear-shell-${side}`), ear = earMesh.geometry;
    assert.ok(ear.index && ear.attributes.position.count < ear.index.count / 2, 'Ear bevel vertices must be welded for smooth normals');
    ear.computeBoundingBox();
    assert.ok(ear.boundingBox.max.z - ear.boundingBox.min.z < .085, 'Thin folded ears must not regress to thick toy triangles');
    const restAngle = earMesh.parent.rotation.z, materialSide = faceMesh.material.side;
    const faceCenter = faceMesh.getWorldPosition(new THREE.Vector3());
    faceMesh.material.side = THREE.DoubleSide;
    for (const angle of [-.12, 0, .12]) {
      earMesh.parent.rotation.z = angle; scene.updateMatrixWorld(true);
      for (let i = 0; i < ear.attributes.position.count; i++) {
        if (ear.attributes.position.getY(i) > -.035) continue;
        const rootPoint = earMesh.localToWorld(new THREE.Vector3().fromBufferAttribute(ear.attributes.position, i));
        const direction = rootPoint.clone().sub(faceCenter);
        const hit = new THREE.Raycaster(faceCenter, direction.clone().normalize()).intersectObject(faceMesh, false)[0];
        assert.ok(hit && direction.length() < hit.distance, 'Ear base stays buried in the head throughout its twitch');
      }
    }
    faceMesh.material.side = materialSide; earMesh.parent.rotation.z = restAngle; scene.updateMatrixWorld(true);
    const iris = scene.getObjectByName(`bambi-iris-${side * .123}`);
    iris.geometry.computeBoundingBox();
    assert.ok(iris.geometry.boundingBox.max.z > .02 && iris.material.roughness < .3, 'Eyes are curved glossy surfaces, not flat decals');
    assert.ok(iris.geometry.attributes.normal.getZ(0) > .9, 'Corneal dome faces outward');
    const irisSize = iris.geometry.boundingBox.getSize(new THREE.Vector3());
    assert.ok(irisSize.y / irisSize.x > .85, 'Eyes keep the requested soft round outline');
  }
  const hair = scene.getObjectByName('kenny-hair');
  assert.ok(hair.geometry.attributes.position.count > 600);
  for (const part of hair.parent.children.filter(object => object.name.startsWith('kenny-hair'))) {
    const positions = part.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
      assert.ok(Math.hypot(x / .32, y / .38, z / .29) >= 1.025, 'Hair must stay outside the head, including while nodding');
      assert.ok(y < .48, 'Short swept hair must not grow into an oversized crest');
      if (z < -.2 && Math.abs(x) < .2) assert.ok(y > .12, 'The fringe must leave the eyes and forehead clear');
    }
    if (part.name !== 'kenny-hair-lock') continue;
    const normals = part.geometry.attributes.normal;
    let facing = 0;
    for (let ring = 9; ring < positions.count - 9; ring += 9) {
      const center = new THREE.Vector3();
      for (let j = 0; j < 8; j++) center.add(new THREE.Vector3().fromBufferAttribute(positions, ring + j));
      center.multiplyScalar(1 / 8);
      for (let j = 0; j < 8; j++) {
        const offset = new THREE.Vector3().fromBufferAttribute(positions, ring + j).sub(center);
        facing += offset.dot(new THREE.Vector3().fromBufferAttribute(normals, ring + j));
      }
    }
    assert.ok(facing > 0, 'Swept locks must render their outer surface, not hollow inside-out tubes');
  }
  assert.equal(renderer.shadowMap.type, THREE.PCFShadowMap, 'Shadow radius must use a filter that supports it');
  assert.equal(scene.getObjectByName('monitor-rear-vents').count, 18, 'Fine repeated details stay instanced');
  const tableBounds = new THREE.Box3().setFromObject(scene.getObjectByName('desk-top'));
  for (const side of [-1, 1]) {
    const forearm = new THREE.Box3().setFromObject(scene.getObjectByName(`typing-forearm-${side}`), true);
    assert.ok(!forearm.intersectsBox(tableBounds), 'Both forearms must clear the tabletop');
  }
  const powerCable = scene.getObjectByName('monitor-power-cable');
  assert.ok(powerCable, 'Monitor power lead must be a continuous connected cable');
  const cablePath = powerCable.geometry.parameters.path;
  for (const [t, name] of [[0, 'monitor-power-plug'], [1, 'wall-power-plug']]) {
    const plug = scene.getObjectByName(name);
    assert.ok(plug, `Cable needs a physical endpoint: ${name}`);
    assert.ok(powerCable.localToWorld(cablePath.getPoint(t)).distanceTo(plug.getWorldPosition(new THREE.Vector3())) < .025, `${name} must meet its cable`);
  }
  for (let t = 0; t <= 1; t += .005) assert.ok(cablePath.getPoint(t).y >= .19, 'Cable must stay above the floor');
  const crossbar = new THREE.Box3().setFromObject(scene.getObjectByName('desk-crossbar'));
  for (const x of [-1.94, 1.94]) {
    const leg = new THREE.Box3().setFromObject(scene.getObjectByName(`desk-leg-${x}`));
    assert.ok(crossbar.intersectsBox(leg), 'Desk crossbar must meet both legs');
  }
  for (const name of ['desk-top', 'desk-leg-1.94', 'desk-leg--1.94', 'desk-foot-1.94', 'desk-foot--1.94', 'storage-cabinet', 'bambi-bed']) {
    const bounds = new THREE.Box3().setFromObject(scene.getObjectByName(name)).expandByScalar(.018);
    for (let t = 0; t <= 1; t += .001) assert.ok(!bounds.containsPoint(cablePath.getPoint(t)), `Power cable must not pass through ${name}`);
  }
  assert.equal(scene.getObjectByName('wall-power-plug').parent, scene.getObjectByName('window-low-wall').parent, 'The wall socket must not disappear with the cutaway upper wall');
  hand.traverse(object => { if (object.isMesh) assert.equal(object.material.transparent, false); });
  assert.ok(hand.getWorldPosition(new THREE.Vector3()).y > scene.getObjectByName('keyboard').getWorldPosition(new THREE.Vector3()).y);
  const wheel = canvas.listeners.get('wheel');
  assert.equal(wheel.options.capture, true); assert.equal(wheel.options.passive, true);
  let stopped = false, prevented = false;
  wheel.fn({ stopImmediatePropagation() { stopped = true; }, preventDefault() { prevented = true; } });
  assert.equal(stopped, true); assert.equal(prevented, false, 'Native page scroll must not be cancelled');
  api.setMode('pan'); assert.equal(controls.mouseButtons.LEFT, THREE.MOUSE.PAN);
  api.setMode('scroll'); assert.equal(controls.enabled, false);
  api.setMode('orbit'); assert.equal(controls.enabled, true);
  const before = renderer.camera.position.clone(); api.orbit(.2, .1); assert.ok(before.distanceTo(renderer.camera.position) > .1);
  const oldTarget = controls.target.clone(); api.pan(.2, .1); assert.ok(oldTarget.distanceTo(controls.target) > .1);
  api.zoom(.001); assert.ok(Math.abs(renderer.camera.position.distanceTo(controls.target) - controls.minDistance) < 1e-6);
  api.zoom(100); assert.ok(Math.abs(renderer.camera.position.distanceTo(controls.target) - controls.maxDistance) < 1e-6);
  api.resetView();
  assert.ok(Math.abs(renderer.camera.position.distanceTo(controls.target) - defaultDistance) < 1e-6, 'Reset restores the close-up default');
  const pupilApertures = [];
  scene.traverse(object => { if (object.name === 'bambi-pupil-aperture') pupilApertures.push(object); });
  assert.equal(pupilApertures.length, 2);
  api.setTime(0); assert.equal(timeNotice.night, true); assert.equal(scene.getObjectByName('moon').visible, true);
  pupilApertures.forEach(pupil => assert.ok(Math.abs(pupil.scale.x - pupil.scale.y) < .02, 'Night pupils dilate into near circles'));
  api.setTime(12); assert.equal(timeNotice.night, false); assert.equal(scene.getObjectByName('sun').visible, true);
  pupilApertures.forEach(pupil => assert.ok(pupil.scale.x === pupil.scale.y && pupil.scale.x >= .85, 'Daylight pupils stay large and round'));
  let lastPupilWidth = pupilApertures[0].scale.x;
  for (let hour = 12; hour <= 24; hour += .01) {
    api.setTime(hour);
    assert.ok(Math.abs(pupilApertures[0].scale.x - lastPupilWidth) < .004, 'Pupil dilation is continuous at sunrise and sunset');
    lastPupilWidth = pupilApertures[0].scale.x;
    for (let angle = 0; angle < Math.PI * 2; angle += .2) {
      const radius = pupilApertures[0].geometry.parameters.radius;
      const x = Math.abs(Math.cos(angle) * radius * pupilApertures[0].scale.x) + .017;
      const y = Math.abs(Math.sin(angle) * radius * pupilApertures[0].scale.y) + .009;
      assert.ok((x / .085) ** 2 + (y / .075) ** 2 < 1, 'Fully dilated tracking pupils stay within the iris envelope');
    }
  }
  api.setTime(12);
  assert.equal(scene.getObjectByName('moon').visible, false);
  const keyLight = scene.children.find(object => object.isDirectionalLight && object.castShadow);
  for (let hour = 0; hour < 24; hour += .25) {
    api.setTime(hour);
    const body = scene.getObjectByName(hour >= 6 && hour <= 18 ? 'sun' : 'moon');
    const visibleDirection = body.position.clone().sub(new THREE.Vector3(0, 1.35, 0)).normalize();
    const lightDirection = keyLight.position.clone().sub(keyLight.target.position).normalize();
    assert.ok(visibleDirection.dot(lightDirection) > .9999, `Visible celestial body and shadow source must align at ${hour}:00`);
    assert.ok(Math.abs(body.position.distanceTo(keyLight.target.position) - 4.8) < 1e-6, 'Celestial orbit keeps its radius in all three dimensions');
  }
  api.setTime(0); assert.ok(keyLight.intensity > .5, 'Moonlight casts a directional night shadow');
  assert.equal(scene.children.filter(object => object.isLight && object.castShadow).length, 1, 'Day and night reuse a single shadow map');
  api.setTime(21); const moonBefore = scene.getObjectByName('moon').position.clone();
  api.setTime(3); assert.ok(moonBefore.distanceTo(scene.getObjectByName('moon').position) > 5, 'Moon travels around the room, not in a fixed corner');
  for (const hour of [6, 18]) {
    api.setTime(hour - .001); const beforeHorizon = keyLight.intensity;
    api.setTime(hour + .001);
    assert.ok(beforeHorizon < .001 && keyLight.intensity < .001, 'Horizon handover fades rather than flipping a visible shadow');
  }
  api.setTime(12);
  api.setPixelated(true); assert.equal(renderer.ratio, .5); assert.equal(canvas.style.imageRendering, 'pixelated');
  assert.equal(canvas.width, Math.floor(width / 2));
  const blob = await api.capture(); assert.equal(blob.type, 'image/png');
  const screenshot = surfaces.at(-1); assert.equal(screenshot.width, width); assert.equal(screenshot.height, height); assert.equal(screenshot.context.imageSmoothingEnabled, false);
  api.setPixelated(false); assert.equal(renderer.ratio, mobile ? 1.25 : 1.75);
  const initialHand = hand.rotation.x;
  step(100); step(150);
  assert.equal(hand.rotation.x === initialHand, reducedMotion, 'Reduced-motion startup must not animate');
  const keyboardTop = new THREE.Box3().setFromObject(scene.getObjectByName('keyboard')).max.y;
  for (let t = 200; t <= 1400; t += 25) {
    step(t);
    for (const side of [-1, 1]) {
      const handBounds = new THREE.Box3().setFromObject(scene.getObjectByName(`typing-hand-${side}`), true);
      assert.ok(handBounds.min.y >= keyboardTop, 'A complete typing cycle must stay above the keyboard housing');
    }
  }
  const catHead = scene.getObjectByName('bambi-head');
  const pointerMove = canvas.listeners.get('pointermove').fn;
  pointerMove({ clientX: width, clientY: 0 });
  for (let i = 0; i < 45; i++) step(now + 40);
  if (reducedMotion) assert.equal(catHead.rotation.y, 0, 'Reduced motion also pauses pointer-following');
  else {
    assert.ok(catHead.rotation.y > .6 && catHead.rotation.x < -.25, 'Bambi visibly turns and looks up toward the pointer');
    pointerMove({ clientX: -width, clientY: height * 2 });
    for (let i = 0; i < 45; i++) step(now + 40);
    assert.ok(catHead.rotation.y < -.6 && catHead.rotation.y >= -.65, 'Opposite turn is stronger but remains anatomically bounded');
    assert.ok(catHead.rotation.x > .25 && catHead.rotation.x <= .28);
    scene.traverse(object => { if (object.name.startsWith('bambi-pupil-')) assert.ok(Math.abs(object.position.x) < .018 && Math.abs(object.position.y) < .01, 'Pupils remain inside the eyes'); });
    canvas.listeners.get('pointerleave').fn();
    for (let i = 0; i < 45; i++) step(now + 40);
    assert.ok(Math.abs(catHead.rotation.y) < .002 && Math.abs(catHead.rotation.x) < .002, 'Leaving the hero eases back to neutral');
  }
  api.setPaused(true); step(1450); const count = renderer.count; step(1500); step(1550);
  assert.equal(renderer.count, count, 'A paused unchanged scene must not redraw');
  api.setTime(18); step(1600); assert.ok(renderer.count > count, 'Paused scene still responds to time changes');
  api.setTime(0); assert.ok(pupilApertures.every(pupil => pupil.scale.x > .9), 'Manual time updates pupils even while motion is paused'); api.setTime(18);
  const cat = scene.getObjectByName('bambi'), catHome = cat.position.clone(), toy = scene.getObjectByName('bambi-toy');
  const restPose = [torso, catHead, foreleg.parent].map(object => ({ object, position: object.position.clone(), scale: object.scale.clone() }));
  const toyHome = toy.position.clone(), seen = new Set();
  assert.equal(api.playBambi('run'), true);
  for (let i = 0; i < 20; i++) step(now + 50);
  assert.ok(cat.position.equals(catHome), 'Pause freezes the entire Bambi routine');
  api.setPaused(false);
  for (const action of ['run', 'play', 'sleep']) {
    if (action !== 'run') assert.equal(api.playBambi(action), true, 'An action is available after returning to the desk');
    assert.equal(api.playBambi('play'), false, 'Repeated clicks cannot teleport an active cat');
    let frames = 0, ballMoved = false, pawContact = false;
    while (cat.userData.activity !== 'watch' && frames++ < 750) {
      step(now + 50); seen.add(cat.userData.activity);
      assert.ok(cat.position.distanceTo(catHome) < 4, 'Bambi remains inside the studio');
      for (const name of ['bambi-coat', 'bambi-face']) {
        const bounds = new THREE.Box3().setFromObject(scene.getObjectByName(name), true);
        assert.ok(bounds.min.y >= .15, `${action}/${cat.userData.activity}: ${name} must stay above the floor`);
        assert.ok(!bounds.intersectsBox(tableBounds), `${action}/${cat.userData.activity}: ${name} must clear the desk`);
        assert.ok(bounds.min.x > -3.6 && bounds.max.x < 3.6 && bounds.min.z > -2.8 && bounds.max.z < 2.86, `${action}/${cat.userData.activity}: body stays on the model base`);
      }
      if (cat.userData.activity === 'play' && toy.position.distanceTo(toyHome) > .1) ballMoved = true;
      for (const side of [-1, 1]) {
        const paw = scene.getObjectByName(`bambi-front-paw-${side}`);
        assert.ok(new THREE.Box3().setFromObject(paw, true).min.y >= .16, `${action}/${cat.userData.activity}: paws must not sink into the floor`);
        if (cat.userData.activity === 'play' && paw.getWorldPosition(new THREE.Vector3()).distanceTo(toy.position) < .19) pawContact = true;
      }
      if (cat.userData.activity === 'sleep') {
        assert.ok(cat.position.distanceTo(new THREE.Vector3(1.48, .295, 1.17)) < .01, 'Nap happens on the bed cushion');
        assert.ok(scene.getObjectByName('bambi-eye-0.123').scale.y < .05, 'Sleeping closes both the pupil and iris');
      }
    }
    assert.ok(frames < 750, `${action} finishes and returns to pointer watching`);
    assert.ok(cat.position.distanceTo(catHome) < .001);
    for (const pose of restPose) {
      assert.ok(pose.object.position.distanceTo(pose.position) < .001 && pose.object.scale.distanceTo(pose.scale) < .001, 'Each routine restores the refined idle proportions without a snap');
    }
    if (action === 'play') { assert.ok(ballMoved, 'A paw swipe actually rolls the ball'); assert.ok(pawContact, 'At least one paw physically reaches the rolling ball'); }
  }
  for (const stage of ['down', 'run', 'play', 'sleep', 'up']) assert.ok(seen.has(stage), `Bambi routine covers ${stage}`);
  assert.ok(toy.position.distanceTo(toyHome) < .001, 'Alternating paw taps finish with the ball at rest');
  const catPoint = catHead.getWorldPosition(new THREE.Vector3()).project(renderer.camera);
  const hit = { clientX: (catPoint.x + 1) * width / 2, clientY: (1 - catPoint.y) * height / 2 };
  const fire = (type, values = {}) => canvas.listeners.get(type).fn({ ...hit, pointerId: 1, isPrimary: true, button: 0, pointerType: mobile ? 'touch' : 'mouse', target: canvas, ...values });
  const stillWatching = message => assert.equal(cat.userData.activity, 'watch', message);
  api.setPaused(true); fire('pointerdown'); fire('pointerup'); stillWatching('Tapping respects pause / reduced-motion state'); api.setPaused(false);
  fire('pointerdown', { clientX: 0, clientY: 0 }); fire('pointerup', { clientX: 0, clientY: 0 }); stillWatching('The empty background is not a cat button');
  fire('pointerdown', { button: 2 }); fire('pointerup', { button: 2 }); stillWatching('Right-click does not start a routine');
  fire('pointerdown'); fire('pointermove', { clientX: hit.clientX + 25 }); fire('pointermove'); fire('pointerup'); stillWatching('Dragging away and back is not a tap');
  fire('pointerdown'); fire('pointercancel'); fire('pointerup'); stillWatching('A browser-cancelled page scroll does not trigger Bambi');
  fire('pointerdown'); fire('pointerdown', { pointerId: 2, isPrimary: false }); fire('pointerup'); stillWatching('Pinch zoom does not trigger Bambi');
  fire('pointerdown'); fire('pointerleave'); fire('pointerup'); stillWatching('Leaving the canvas cancels a press');
  const blocker = scene.getObjectByName('monitor-power-plug'), blockerPosition = blocker.position.clone(), blockerScale = blocker.scale.clone();
  blocker.position.copy(blocker.parent.worldToLocal(catHead.getWorldPosition(new THREE.Vector3()).lerp(renderer.camera.position, .15))); blocker.scale.setScalar(20);
  fire('pointerdown'); fire('pointerup'); stillWatching('A foreground object occludes the cat hit target');
  blocker.position.copy(blockerPosition); blocker.scale.copy(blockerScale);
  for (const [random, expected] of [[.1, 'run'], [.5, 'play'], [.9, 'sleep']]) {
    randomValue = random;
    if (expected === 'sleep') canvas.listeners.get('keydown').fn({ key: 'Enter', preventDefault() {} });
    else { fire('pointerdown'); fire('pointerup'); }
    assert.equal(cat.userData.activity, 'prepare', 'Click / touch / keyboard starts the existing routine');
    let frames = 0, performed = false;
    while (cat.userData.activity !== 'watch' && frames++ < 750) {
      step(now + 50); performed ||= cat.userData.activity === expected;
    }
    assert.ok(performed && frames < 750, `Random selection ${random} completes ${expected} and returns home`);
  }
  for (let i = 0; i < 361; i++) step(now + 50);
  assert.notEqual(cat.userData.activity, 'watch', 'Autoplay still starts after an idle break');
  api.setCycling(true); api.setPaused(false); step(1650);
  const frameSun = scene.getObjectByName('sun').position.clone(); step(1700);
  assert.ok(frameSun.distanceTo(scene.getObjectByName('sun').position) > .001, 'Celestial motion advances between render frames, without waiting for the 250 ms UI timer');
  for (let t = 1700; t <= 2250; t += 50) step(t);
  clockStep();
  assert.ok(timeNotice.hour > 18, 'Day-cycle playback advances the clock');
  document.hidden = true; document.listeners.get('visibilitychange').fn(); assert.equal(callbacks.size, 0);
  const hiddenHour = timeNotice.hour; clockStep(); assert.equal(timeNotice.hour, hiddenHour);
  document.hidden = false; document.listeners.get('visibilitychange').fn(); assert.equal(callbacks.size, 1);
  observers[1].callback([{ isIntersecting: false }]); assert.equal(callbacks.size, 0);
  const offscreenRenders = renderer.count, offscreenHour = timeNotice.hour;
  clockStep(); assert.ok(timeNotice.hour > offscreenHour, 'Whole-page theme keeps cycling below the hero');
  assert.equal(renderer.count, offscreenRenders, 'Offscreen theme playback does not draw the GPU scene');
  observers[1].callback([{ isIntersecting: true }]); assert.equal(callbacks.size, 1);
  canvas.listeners.get('webglcontextlost').fn({ preventDefault() {} }); assert.equal(failed, true); assert.equal(callbacks.size, 0);
  api.dispose(); assert.equal(renderer.disposed, true); assert.equal(controls.disposed, true);
  assert.equal(timers.size, 0, 'Dispose clears the page clock');
  assert.ok(observers.every(observer => observer.disconnected)); assert.equal(canvas.listeners.size, 0); assert.equal(document.listeners.size, 0);
  console.log(`PASS scene ${width}x${height}${reducedMotion ? ' reduced-motion' : ''}`);
}

(async () => {
  await checkScene(1440, 900, false);
  await checkScene(1199, 1000, false);
  await checkScene(390, 844, true);
  await checkScene(844, 390, true);
  await checkScene(320, 568, true, true);
  for (const page of ['index.html', 'bambi.html', 'studio.html']) {
    const html = read(page);
    for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (/^(?:https?:|mailto:|#|data:)/.test(url)) continue;
      assert.ok(fs.existsSync(path.join(root, url.split(/[?#]/)[0])), `${page}: missing ${url}`);
    }
    assert.equal(read(`dist/${page}`), html, `Production ${page} must be current`);
  }
  const index = read('index.html');
  assert.ok(index.includes('id="scene-root"'));
  assert.ok(/<template id="original-hero-art">[\s\S]*cat-reference[\s\S]*<\/template>/.test(index), 'Keep the hand-edited art in source');
  assert.ok(!/<a[^>]+href="studio.html"/.test(index), 'No separate Studio entrance');
  for (const id of ['work', 'about', 'resume', 'contact']) assert.ok(index.includes(`id="${id}"`));
  assert.equal(read('dist/assets/home.bundle.js'), read('assets/home.bundle.js'));
  new vm.Script(read('assets/home.bundle.js'));
  console.log('PASS daylight, home integration, static assets, production output and bundle syntax');
  console.log('GPU rendering, browser gestures/download/fullscreen and visual acceptance are not covered by this Node smoke check.');
})().catch(error => { console.error(error); process.exitCode = 1; });
