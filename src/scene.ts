import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { daylightAt, pageThemeAt } from './daylight';
import { createBambiMotion, type BambiState } from './bambi-motion';

export type ViewMode = 'scroll' | 'orbit' | 'pan';
type Vec3 = [number, number, number];
export function createStudio(canvas: HTMLCanvasElement, onError: () => void, onTime: (hour: number, night: boolean) => void = () => {}, onBambiState: (state: BambiState) => void = () => {}) {

  const ink = 0x292b29;
  const paper = 0xf4f4f0;
  const cream = 0xe9e5da;
  const orange = 0xdba66e;
  const stripe = 0xb57947;
  const red = 0xe7432f;
  const scene = new THREE.Scene();
  const mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 768;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.75));
  renderer.shadowMap.enabled = true;
  // PCF supports radius; PCFSoft ignores it and left the silhouettes razor sharp.
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 80);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = .08;
  controls.enablePan = true;
  controls.minDistance = 7;
  controls.maxDistance = 23;
  controls.minPolarAngle = .3;
  controls.maxPolarAngle = Math.PI / 2 - .04;
  controls.rotateSpeed = .7;
  controls.zoomSpeed = .8;

  const ambient = new THREE.HemisphereLight(0xfff9ec, 0xbbbcb6, 2.4);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xfff5dc, 4);
  const orbitCenter = new THREE.Vector3(0, 1.35, 0);
  sun.target.position.copy(orbitCenter);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 512 : 1024, mobile ? 512 : 1024);
  Object.assign(sun.shadow.camera, { left: -5.8, right: 5.8, top: 5.8, bottom: -5.8, near: .5, far: 32 });
  sun.shadow.normalBias = .022;
  sun.shadow.bias = -.0001;
  sun.shadow.radius = mobile ? 2.5 : 4;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xffffff, .65);
  fill.position.set(4, 5, 7);
  scene.add(fill);

  const room = new THREE.Group();
  scene.add(room);
  const roundSegments = mobile ? 16 : 24;
  const sphere = new THREE.SphereGeometry(1, roundSegments, mobile ? 10 : 16);
  const materialCache = new Map<THREE.ColorRepresentation, THREE.MeshStandardMaterial>();
  const outlineMaterial = new THREE.LineBasicMaterial({ color: ink, transparent: true, opacity: .72 });
  function material(color: THREE.ColorRepresentation) {
    if (!materialCache.has(color)) materialCache.set(color, new THREE.MeshStandardMaterial({ color, roughness: .86 }));
    return materialCache.get(color)!;
  }
  function mesh(geometry: THREE.BufferGeometry, color: THREE.ColorRepresentation, position: Vec3, parent: THREE.Object3D = room, outline = true) {
    const object = new THREE.Mesh(geometry, material(color));
    object.position.set(...position);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    if (outline) object.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 35), outlineMaterial));
    return object;
  }
  function box(size: Vec3, color: THREE.ColorRepresentation, position: Vec3, parent: THREE.Object3D = room) {
    return mesh(new THREE.BoxGeometry(...size), color, position, parent);
  }
  function ellipsoid(size: Vec3, color: THREE.ColorRepresentation, position: Vec3, parent: THREE.Object3D = room) {
    const object = mesh(sphere, color, position, parent, false);
    object.scale.set(...size);
    return object;
  }
  function cylinder(radius: number, height: number, color: THREE.ColorRepresentation, position: Vec3, parent: THREE.Object3D = room, segments = roundSegments) {
    return mesh(new THREE.CylinderGeometry(radius, radius, height, segments), color, position, parent, false);
  }
  function rod(start: Vec3, end: Vec3, radius: number, color: THREE.ColorRepresentation, parent: THREE.Object3D = room) {
    const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
    const object = cylinder(radius, a.distanceTo(b), color, a.clone().add(b).multiplyScalar(.5).toArray(), parent, radius > .055 ? roundSegments : 8);
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
    return object;
  }
  function line(points: Vec3[], color = ink, parent: THREE.Object3D = room) {
    const object = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p))), new THREE.LineBasicMaterial({ color }));
    parent.add(object);
    return object;
  }
  function tube(points: Vec3[], radius: number, color: THREE.ColorRepresentation, parent: THREE.Object3D = room) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    return mesh(new THREE.TubeGeometry(curve, mobile ? 32 : 48, radius, 8, false), color, [0, 0, 0], parent, false);
  }
  function texture(width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void) {
    const surface = document.createElement('canvas');
    surface.width = width; surface.height = height;
    const context = surface.getContext('2d');
    if (!context) throw new Error('Canvas 2D is unavailable');
    paint(context);
    const map = new THREE.CanvasTexture(surface);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
    return map;
  }
  function print(width: number, height: number, map: THREE.Texture, position: Vec3, parent: THREE.Object3D = room) {
    const object = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map, transparent: true, side: THREE.DoubleSide, toneMapped: false }));
    object.position.set(...position);
    parent.add(object);
    return object;
  }

  // The room is an open miniature: opaque furniture, real depth, no image layers.
  const floor = box([7.5, .22, 5.7], 0xe5e0d5, [0, .02, 0]);
  floor.name = 'studio-base';
  box([7.25, .035, 5.45], 0xf3f0e7, [0, .15, 0]);
  // One draw for the floor seams, instead of one draw per short pencil stroke.
  const floorSeams: THREE.Vector3[] = [];
  for (let x = -3.25; x < 3.5; x += .48) {
    floorSeams.push(new THREE.Vector3(x, .174, -2.6), new THREE.Vector3(x + .025, .174, 2.6));
    for (let z = -2.1; z < 2.5; z += 1.5) {
      const seamX = x + .025 * (z + 2.6) / 5.2;
      floorSeams.push(new THREE.Vector3(seamX, .174, z), new THREE.Vector3(Math.min(3.55, seamX + .48), .174, z));
    }
  }
  const floorInk = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(floorSeams), new THREE.LineBasicMaterial({ color: 0xcfcabd }));
  floorInk.name = 'floor-seams'; room.add(floorInk);
  const backWall = new THREE.Group(); room.add(backWall);
  box([7.45, 3.65, .12], 0xecebe3, [0, 2, -2.77], backWall);
  box([7.35, .15, .06], cream, [0, .32, -2.68], backWall);
  const leftWall = new THREE.Group(); room.add(leftWall);
  // A real opening around the window lets the light reach the workbench.
  box([.12, 2.75, .95], cream, [-3.67, 2.445, -2.26], leftWall);
  box([.12, 2.75, 1.18], cream, [-3.67, 2.445, 1.91], leftWall);
  // Keep the low wall and socket when the upper wall cuts away during orbit.
  box([.12, .9, 5.24], cream, [-3.67, .62, -.12]).name = 'window-low-wall';
  box([.12, .42, 3.05], cream, [-3.67, 3.62, -.1], leftWall);
  for (const z of [-1.7, 1.43]) box([.2, 2.6, .12], 0xfaf8ef, [-3.62, 2.2, z], leftWall);
  for (const y of [.95, 2.2, 3.43]) box([.2, .09, 3.2], 0xfaf8ef, [-3.62, y, -.13], leftWall);
  box([.17, 2.5, .06], 0xfaf8ef, [-3.62, 2.2, -.13], leftWall);
  box([.45, .09, 3.45], 0xfaf8ef, [-3.49, .93, -.13], leftWall);
  // A pair of folded linen panels: real shallow pleats, not extra texture layers.
  const curtainGeometry = new THREE.PlaneGeometry(.42, 2.32, 12, 2);
  const curtainVertices = curtainGeometry.attributes.position;
  for (let i = 0; i < curtainVertices.count; i++) {
    curtainVertices.setZ(i, Math.cos(curtainVertices.getX(i) / .42 * Math.PI * 6) * .035);
  }
  curtainGeometry.computeVertexNormals();
  const linen = new THREE.MeshStandardMaterial({ color: 0xe5dcc9, side: THREE.DoubleSide, roughness: 1 });
  for (const z of [-1.47, 1.2]) {
    const curtain = mesh(curtainGeometry, cream, [-3.40, 2.21, z], leftWall, false);
    curtain.name = `linen-curtain-${z}`; curtain.rotation.y = Math.PI / 2; curtain.material = linen;
  }
  rod([-3.4, 3.41, -1.79], [-3.4, 3.41, 1.52], .02, ink, leftWall);

  // A pinboard, a shelf, and a quiet row of books make this a lived-in workspace.
  box([1.45, 1.18, .07], 0xd6c4ad, [-2.5, 2.75, -2.66], backWall);
  const noteMap = texture(512, 400, ctx => {
    ctx.fillStyle = '#f9f7ee'; ctx.fillRect(0, 0, 512, 400);
    ctx.fillStyle = '#292b29'; ctx.font = 'bold 43px monospace'; ctx.fillText('MAKE SMALL', 40, 90); ctx.fillText('THINGS', 40, 147); ctx.fillText('WITH CARE.', 40, 204);
    ctx.strokeStyle = '#e7432f'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(40, 225); ctx.quadraticCurveTo(200, 241, 365, 225); ctx.stroke();
    ctx.font = '25px monospace'; ctx.fillText('coffee → code → cat', 40, 315);
  });
  const note = print(1.15, .9, noteMap, [-2.5, 2.75, -2.615], backWall); note.rotation.z = -.06;
  ellipsoid([.035, .035, .025], red, [-2.5, 3.17, -2.57], backWall);
  box([2.65, .1, .53], cream, [1.03, 2.88, -2.46], backWall);
  for (let i = 0; i < 7; i++) {
    const book = box([.16, .38 + (i % 3) * .06, .3], [0x858e82, cream, 0xa69b8a, red, paper, 0x7d8178, cream][i], [.13 + i * .18, 3.16, -2.45], backWall);
    if (i === 6) book.rotation.z = -.16;
    line([[-.04, -.11, .151], [.04, -.11, .151]], ink, book);
  }
  const wallClock = new THREE.Group(); wallClock.name = 'wall-clock'; wallClock.position.set(2.98, 3.14, -2.63); backWall.add(wallClock);
  const clockCase = cylinder(.32, .075, 0xd6c4ad, [0, 0, 0], wallClock); clockCase.rotation.x = Math.PI / 2;
  const clockMap = texture(256, 256, ctx => {
    ctx.fillStyle = '#f4f4f0'; ctx.beginPath(); ctx.arc(128, 128, 123, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#52584e'; ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6, inner = i % 3 ? 106 : 98;
      ctx.beginPath(); ctx.moveTo(128 + Math.sin(a) * inner, 128 + Math.cos(a) * inner);
      ctx.lineTo(128 + Math.sin(a) * 114, 128 + Math.cos(a) * 114); ctx.stroke();
    }
  });
  print(.61, .61, clockMap, [0, 0, .039], wallClock);
  const clockHands = [.13, .21].map((length, i) => {
    const pivot = new THREE.Group(); pivot.position.z = .052 + i * .008; wallClock.add(pivot);
    mesh(new THREE.BoxGeometry(.014, length, .008), i ? red : ink, [0, length * .4, 0], pivot, false);
    return pivot;
  });
  mesh(new THREE.CircleGeometry(.023, 12), ink, [0, 0, .07], wallClock, false);
  const cabinet = new THREE.Group(); cabinet.name = 'storage-cabinet'; cabinet.position.set(-2.9, .18, -.2); cabinet.scale.set(1, .75, 1); room.add(cabinet);
  mesh(new RoundedBoxGeometry(1.06, 1.08, .82, 1, .035), 0xd6c4ad, [0, .54, 0], cabinet, false);
  for (const y of [.28, .79]) {
    mesh(new THREE.BoxGeometry(.96, .46, .03), cream, [0, y, .427], cabinet, false);
    rod([-.11, y + .08, .45], [.11, y + .08, .45], .018, ink, cabinet);
  }
  mesh(new THREE.BoxGeometry(.68, .085, .48), 0x858e82, [.06, 1.123, -.015], cabinet, false);
  mesh(new THREE.BoxGeometry(.57, .075, .43), paper, [.01, 1.203, -.035], cabinet, false).rotation.y = -.12;

  // Curved, creased leaves replace sphere clusters: a clearer silhouette at fewer triangles.
  const leafGeometry = new THREE.PlaneGeometry(.23, .49, 4, 8);
  const leafVertices = leafGeometry.attributes.position;
  for (let i = 0; i < leafVertices.count; i++) {
    const y = leafVertices.getY(i), t = (y + .245) / .49, x = leafVertices.getX(i);
    leafVertices.setXYZ(i, x * (.025 + .975 * Math.sin(Math.PI * t)), y,
      .10 * Math.sin(Math.PI * t) - .055 * Math.abs(x / .115) * Math.sin(Math.PI * t));
  }
  leafGeometry.computeVertexNormals();
  function plant(position: Vec3, scale: number, parent: THREE.Object3D = room) {
    const group = new THREE.Group(); group.position.set(...position); group.scale.setScalar(scale); parent.add(group);
    const potProfile = [[0, 0], [.155, 0], [.18, .035], [.235, .37], [.24, .41], [.218, .425], [.20, .40], [.18, .09], [0, .09]].map(([x, y]) => new THREE.Vector2(x, y));
    mesh(new THREE.LatheGeometry(potProfile, roundSegments), cream, [0, 0, 0], group, false);
    cylinder(.2, .02, 0x756757, [0, .4, 0], group);
    for (let i = 0; i < 6; i++) {
      const angle = i * 2.4;
      const end: Vec3 = [Math.cos(angle) * .26, .73 + (i % 3) * .16, Math.sin(angle) * .26];
      rod([0, .4, 0], end, .012, 0x737e67, group);
      const leaf = mesh(leafGeometry, i % 2 ? 0x89967b : 0x707e64, end, group, false);
      leaf.material.side = THREE.DoubleSide; leaf.material.roughness = .62;
      leaf.rotation.set(.5 * Math.sin(angle), angle, -.45 * Math.cos(angle));
    }
    return group;
  }
  plant([1.98, 2.93, -2.44], .68, backWall);
  plant([2.82, .18, -1.72], 1.6);
  const rug = cylinder(1.6, .025, 0xdcd9cd, [-.55, .195, 1.05], room, 48); rug.scale.z = .82;
  for (let i = 0; i < 3; i++) {
    const ring = mesh(new THREE.TorusGeometry(1.3 + i * .11, .006, 3, 48), 0xaaa99a, [-.55, .216, 1.05], room, false);
    ring.rotation.x = Math.PI / 2; ring.scale.y = .82;
  }
  const bed = new THREE.Group(); bed.name = 'bambi-bed'; bed.position.set(1.48, .20, 1.17); room.add(bed);
  const bedRim = mesh(new THREE.TorusGeometry(.47, .10, 8, 32), 0xd6c4ad, [0, .10, 0], bed, false);
  bedRim.rotation.x = Math.PI / 2; bedRim.scale.y = .80;
  const cushion = cylinder(.445, .07, 0x858e82, [0, .06, 0], bed, 32); cushion.scale.z = .8;
  const toy = mesh(new THREE.SphereGeometry(.105, 12, 8), red, [2.23, .279, 1.38], room, false); toy.name = 'bambi-toy';
  const toySeam = mesh(new THREE.TorusGeometry(.104, .005, 3, 20), cream, [0, 0, 0], toy, false); toySeam.rotation.x = .65;

  const desk = new THREE.Group(); desk.name = 'desk'; room.add(desk);
  mesh(new RoundedBoxGeometry(4.5, .16, 1.7, 2, .035), 0xf8f5ec, [0, 1.88, -.35], desk, false).name = 'desk-top';
  for (const x of [-1.94, 1.94]) {
    box([.15, 1.58, .16], cream, [x, 1.02, -.48], desk).name = `desk-leg-${x}`;
    box([.52, .1, 1.38], cream, [x, .22, -.38], desk).name = `desk-foot-${x}`;
  }
  box([3.88, .12, .09], 0xb7b9af, [0, 1.32, -.48], desk).name = 'desk-crossbar';
  for (let i = 0; i < 7; i++) line([[1.2 + i * .08, 1.966, -.96], [1.05 + i * .08, 1.966, -.83]], 0xb9b5a8, desk);
  // The keyboard, wrists, monitor and cat all share the tabletop's coordinates.
  const monitor = new THREE.Group(); monitor.position.set(-.28, 0, -.72); desk.add(monitor);
  material(0xbfc0b6).roughness = .4; material(0xbfc0b6).metalness = .35;
  mesh(new RoundedBoxGeometry(.74, .06, .4, 2, .025), 0xbfc0b6, [0, 1.99, 0], monitor, false);
  box([.1, .42, .11], 0xbfc0b6, [0, 2.23, -.05], monitor);
  mesh(new RoundedBoxGeometry(1.92, 1.2, .13, 2, .025), ink, [0, 2.96, -.04], monitor, false);
  const monitorHinge = cylinder(.075, .27, 0xbfc0b6, [0, 2.43, -.09], monitor); monitorHinge.rotation.z = Math.PI / 2;
  const vents = new THREE.InstancedMesh(new THREE.BoxGeometry(.018, .14, .008), material(0x666b64), 18);
  vents.name = 'monitor-rear-vents'; monitor.add(vents);
  for (let i = 0; i < 18; i++) vents.setMatrixAt(i, new THREE.Matrix4().makeTranslation(-.51 + i * .06, 3.38, -.108));
  box([1.84, 1.1, .016], paper, [0, 2.985, .034], monitor);
  const codeMap = texture(1024, 600, ctx => {
    ctx.fillStyle = '#f4f4eb'; ctx.fillRect(0, 0, 1024, 600);
    ctx.fillStyle = '#e5e4da'; ctx.fillRect(0, 0, 1024, 58);
    ctx.fillStyle = '#52584e'; ctx.font = '21px monospace'; ctx.fillText('BambiService.java', 40, 38);
    const code = ['@Service', 'public class BambiService {', '', '  private final TreatQueue treats;', '  private final PointerTracker pointer;', '', '  BambiMood follow(Cursor cursor) {', '    pointer.watch(cursor);', '    return treats.isEmpty()', '      ? CURIOUS : VERY_HAPPY;', '  }', '}'];
    ctx.font = '26px monospace';
    code.forEach((row, i) => {
      ctx.fillStyle = '#929487'; ctx.fillText(String(i + 1).padStart(2, '0'), 30, 104 + i * 39);
      ctx.fillStyle = i === 0 || i === 9 ? '#bd3d2c' : '#303b32'; ctx.fillText(row, 93, 104 + i * 39);
    });
  });
  print(1.77, 1.025, codeMap, [0, 2.985, .046], monitor);
  const codeCursor = box([.008, .04, .004], red, [-.73, 2.55, .053], monitor);
  ellipsoid([.018, .012, .008], 0x89967b, [.83, 2.403, .04], monitor);
  const monitorPlug = box([.1, .085, .09], red, [.66, 2.57, -.126], monitor);
  monitorPlug.name = 'monitor-power-plug';
  box([.055, .32, .25], paper, [-3.58, .59, 1.85]);
  const wallPlug = box([.14, .105, .12], red, [-3.5, .59, 1.85]);
  wallPlug.name = 'wall-power-plug';
  room.updateMatrixWorld(true);
  const cableStart = monitorPlug.getWorldPosition(new THREE.Vector3());
  const cableEnd = wallPlug.getWorldPosition(new THREE.Vector3());
  const cablePath = new THREE.CurvePath<THREE.Vector3>();
  const cableBends: [Vec3, Vec3, Vec3][] = [
    [[.38, 2.57, -1.4], [.55, 2.15, -1.4], [.55, 1.65, -1.4]],
    [[.55, 1.1, -1.4], [1.45, .2, -1.4], [2.4, .2, -1.3]],
    [[2.95, .2, -.4], [2.85, .2, 1.5], [2.38, .2, 1.92]],
    [[1.5, .2, 2.65], [.4, .2, 2.3], [-.9, .2, 2.4]],
    [[-1.8, .2, 2.6], [-2.45, .2, 2.25], [-2.98, .2, 2.12]],
    [[-3.45, .2, 2], [-3.15, .59, 1.85], cableEnd.toArray()]
  ];
  let cablePoint = cableStart;
  for (const [controlA, controlB, end] of cableBends) {
    const next = new THREE.Vector3(...end);
    cablePath.add(new THREE.CubicBezierCurve3(cablePoint, new THREE.Vector3(...controlA), new THREE.Vector3(...controlB), next));
    cablePoint = next;
  }
  mesh(new THREE.TubeGeometry(cablePath, mobile ? 96 : 144, .018, 8, false), red, [0, 0, 0], room, false).name = 'monitor-power-cable';
  mesh(new RoundedBoxGeometry(1.22, .055, .42, 1, .018), 0xd4d3c9, [-.25, 1.995, .08], desk, false).name = 'keyboard';
  // Mobile keycaps keep clipped corners without spending thousands of triangles on tiny bevels.
  const keyShape = new THREE.Shape();
  [[-.032, -.0345], [.032, -.0345], [.0375, -.029], [.0375, .029], [.032, .0345], [-.032, .0345], [-.0375, .029], [-.0375, -.029]].forEach(([x, y], i) => i ? keyShape.lineTo(x, y) : keyShape.moveTo(x, y));
  keyShape.closePath();
  const keyGeometry = mobile ? new THREE.ExtrudeGeometry(keyShape, { depth: .014, bevelEnabled: false, steps: 1 }).rotateX(-Math.PI / 2).translate(0, -.007, 0)
    : new RoundedBoxGeometry(.075, .014, .069, 1, .004);
  const keys = new THREE.InstancedMesh(keyGeometry, material(paper), 48);
  keys.name = 'keyboard-keys'; desk.add(keys);
  for (let row = 0; row < 4; row++) for (let key = 0; key < 12; key++) {
    const index = row * 12 + key;
    keys.setMatrixAt(index, new THREE.Matrix4().makeTranslation(-.78 + key * .094, 2.029, -.068 + row * .091));
    keys.setColorAt(index, new THREE.Color(index === 0 ? red : paper));
  }
  const mouse = ellipsoid([.11, .045, .17], paper, [.64, 2.01, .18], desk);
  line([-.7, -.35, 0].map(z => [0, 1.02 * Math.sqrt(1 - z * z), z] as Vec3), ink, mouse);
  const notebook = new THREE.Group(); notebook.name = 'desk-notebook'; notebook.position.set(-1.25, 1.969, -.32); notebook.rotation.y = -.12; desk.add(notebook);
  mesh(new THREE.BoxGeometry(.49, .018, .6), 0x858e82, [0, 0, 0], notebook, false);
  mesh(new THREE.BoxGeometry(.46, .02, .565), paper, [0, .018, 0], notebook, false);
  const notebookMap = texture(256, 320, ctx => {
    ctx.strokeStyle = '#c9ccc5'; ctx.lineWidth = 2;
    for (let y = 60; y < 280; y += 25) { ctx.beginPath(); ctx.moveTo(32, y); ctx.lineTo(221, y); ctx.stroke(); }
    ctx.fillStyle = '#52584e'; ctx.font = '20px monospace'; ctx.fillText('small ideas', 30, 36);
  });
  const notebookPage = print(.45, .55, notebookMap, [0, .029, 0], notebook); notebookPage.rotation.x = -Math.PI / 2;
  rod([.10, .041, -.21], [.17, .041, .21], .012, red, notebook);

  // Ceramic mug: open rim, coffee surface and an actual handle.
  const mug = new THREE.Group(); mug.name = 'coffee'; mug.position.set(-1.65, 1.97, .3); desk.add(mug);
  const cupProfile = [[0, 0], [.125, 0], [.15, .025], [.16, .28], [.151, .31], [.13, .29], [.125, .055], [0, .055]].map(([x, y]) => new THREE.Vector2(x, y));
  const ceramic = new THREE.MeshStandardMaterial({ color: paper, roughness: .28 });
  mesh(new THREE.LatheGeometry(cupProfile, roundSegments), paper, [0, 0, 0], mug, false).material = ceramic;
  material(0x695043).roughness = .18;
  cylinder(.129, .014, 0x695043, [0, .281, 0], mug, roundSegments);
  const rim = mesh(new THREE.TorusGeometry(.151, .012, 8, roundSegments), paper, [0, .305, 0], mug, false); rim.rotation.x = Math.PI / 2;
  const handle = mesh(new THREE.TorusGeometry(.105, .03, 8, roundSegments), paper, [-.17, .16, 0], mug, false);
  rim.material = ceramic; handle.material = ceramic;
  const saucerProfile = [[0, -.004], [.13, -.004], [.24, .006], [.25, .025], [.23, .038], [.16, .017], [0, .013]].map(([x, y]) => new THREE.Vector2(x, y));
  mesh(new THREE.LatheGeometry(saucerProfile, roundSegments), paper, [0, -.004, 0], mug, false).material = ceramic;
  const steam = new THREE.Group(); mug.add(steam);
  for (let i = 0; i < 3; i++) {
    const wisp = line([[i * .065 - .065, .36, 0], [i * .065 - .09, .45, .018], [i * .065 - .04, .55, 0], [i * .065 - .065, .65, -.012]], 0xc2beb1, steam);
    wisp.material.transparent = true; wisp.material.opacity = .5;
  }

  // A small articulated Kenny, facing -Z toward the screen.
  const kenny = new THREE.Group(); kenny.name = 'kenny'; kenny.position.set(-.45, 0, 1); room.add(kenny);
  cylinder(.08, .66, ink, [0, .62, .3], kenny);
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    const end: Vec3 = [Math.cos(a) * .5, .31, .3 + Math.sin(a) * .5];
    rod([0, .32, .3], end, .037, ink, kenny);
    const wheel = cylinder(.08, .07, ink, [end[0], .26, end[2]], kenny); wheel.rotation.z = Math.PI / 2;
  }
  mesh(new RoundedBoxGeometry(.94, .16, .87, 2, .07), 0x626762, [0, 1.03, .22], kenny, false);
  rod([0, .99, .53], [0, 1.87, .69], .055, ink, kenny);
  const chairBack = mesh(new RoundedBoxGeometry(.91, .86, .13, 2, .06), cream, [0, 1.61, .71], kenny, false); chairBack.rotation.x = -.1;
  for (let i = 0; i < 5; i++) line([[-.36, -.32 + i * .14, .066], [.36, -.25 + i * .14, .066]], 0xa4a59b, chairBack);
  for (const x of [-.5, .5]) {
    rod([x, 1.03, .27], [x, 1.48, .12], .035, ink, kenny);
    mesh(new RoundedBoxGeometry(.11, .07, .49, 2, .03), cream, [x, 1.48, .05], kenny, false);
  }
  for (const x of [-.21, .21]) {
    rod([x, 1.16, .16], [x, 1.03, -.39], .15, 0x585d57, kenny);
    rod([x, 1.03, -.39], [x, .4, -.48], .12, 0x585d57, kenny);
    ellipsoid([.145, .145, .145], 0x585d57, [x, 1.03, -.39], kenny);
    ellipsoid([.16, .12, .3], paper, [x, .31, -.61], kenny);
  }
  const shirtProfile = [[0, -.48], [.31, -.48], [.355, -.45], [.372, -.37], [.38, -.2], [.355, .18], [.325, .32], [.28, .41], [.16, .46], [0, .46]].map(([x, y]) => new THREE.Vector2(x, y));
  const torso = mesh(new THREE.LatheGeometry(shirtProfile, roundSegments), cream, [0, 1.78, .03], kenny, false);
  torso.rotation.x = -.12;
  cylinder(.33, .14, 0x585d57, [0, 1.28, .10], kenny);
  rod([0, 2.17, -.015], [0, 2.40, -.04], .14, 0xe6b899, kenny);
  const head = new THREE.Group(); head.position.set(0, 2.64, -.075); head.rotation.x = -.08; kenny.add(head);
  ellipsoid([.32, .38, .29], 0xe6b899, [0, 0, 0], head);
  for (const x of [-.31, .31]) ellipsoid([.065, .11, .075], 0xe6b899, [x, -.015, 0], head);
  ellipsoid([.055, .07, .08], 0xe6b899, [0, -.025, -.29], head);
  for (const x of [-.11, .11]) ellipsoid([.022, .028, .012], ink, [x, .035, -.269], head);
  line([[-.06, -.145, -.255], [0, -.16, -.278], [.065, -.145, -.255]], ink, head);
  // Tapered short sides, an ear cutout and a broken nape; no bowl-shaped hem.
  const hairGeometry = new THREE.SphereGeometry(1, mobile ? 32 : 48, 20, 0, Math.PI * 2, 0, Math.PI / 2);
  const hairVertices = hairGeometry.attributes.position, hairUV = hairGeometry.attributes.uv;
  function hairPoint(u: number, v: number) {
    const phi = u * Math.PI * 2;
    const front = Math.max(0, -Math.sin(phi)), back = Math.max(0, Math.sin(phi));
    const ear = Math.abs(Math.cos(phi)) ** 12;
    const edge = .51 + back * .14 - front * .18 - ear * .095 + .013 * Math.sin(phi * 13);
    const theta = (1 - v) * Math.PI * edge;
    const top = Math.max(0, Math.cos(theta));
    const lift = .012 + .035 * top ** 2;
    return new THREE.Vector3(-(.32 + lift) * Math.cos(phi) * Math.sin(theta),
      (.38 + lift) * Math.cos(theta), (.29 + lift) * Math.sin(phi) * Math.sin(theta));
  }
  for (let i = 0; i < hairVertices.count; i++) {
    const p = hairPoint(hairUV.getX(i), hairUV.getY(i)); hairVertices.setXYZ(i, p.x, p.y, p.z);
  }
  hairGeometry.computeVertexNormals();
  mesh(hairGeometry, 0x292723, [0, 0, 0], head, false).name = 'kenny-hair';
  // Broad, flattened locks sweep across the crown, with fine tapered ends.
  // The underside stays outside the skin ellipsoid, even during the head nod.
  function hairLock(points: Vec3[], width: number, depth: number, color: number) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const positions: number[] = [], indices: number[] = [], segments = mobile ? 12 : 18, sides = 8;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments, center = curve.getPoint(t), tangent = curve.getTangent(t);
      const loft = 1.06 + .065 * Math.sin(Math.PI * t) + .025 * Math.max(0, -center.z / .3);
      center.multiplyScalar(loft / Math.hypot(center.x / .32, center.y / .38, center.z / .29));
      const outward = center.clone().normalize();
      const across = new THREE.Vector3().crossVectors(tangent, outward).normalize();
      outward.crossVectors(across, tangent).normalize();
      const taper = .025 + .975 * Math.sin(Math.PI * t) ** .65;
      for (let j = 0; j <= sides; j++) {
        const a = j / sides * Math.PI * 2;
        const p = center.clone().addScaledVector(across, Math.cos(a) * width * taper)
          .addScaledVector(outward, Math.sin(a) * depth * taper * .5);
        const skinRadius = Math.hypot(p.x / .32, p.y / .38, p.z / .29);
        if (skinRadius < 1.035) p.multiplyScalar(1.035 / skinRadius);
        positions.push(p.x, p.y, p.z);
        if (i < segments && j < sides) {
          const n = i * (sides + 1) + j;
          indices.push(n, n + sides + 1, n + 1, n + 1, n + sides + 1, n + sides + 2);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    mesh(geometry, color, [0, 0, 0], head, false).name = 'kenny-hair-lock';
  }
  hairLock([[.18, .25, .18], [.17, .40, .07], [.08, .47, -.08], [-.12, .38, -.26], [-.23, .18, -.25]], .085, .035, 0x302c27);
  hairLock([[.08, .27, .23], [.06, .41, .13], [-.07, .47, -.02], [-.25, .34, -.16], [-.30, .12, -.18]], .09, .032, 0x34302a);
  hairLock([[-.03, .22, .26], [-.07, .37, .19], [-.20, .40, .05], [-.32, .24, -.06], [-.32, .09, -.10]], .078, .028, 0x2c2925);
  hairLock([[-.12, .15, .27], [-.18, .29, .23], [-.30, .31, .11], [-.345, .15, .01]], .065, .022, 0x302c27);
  hairLock([[.15, .26, .18], [.27, .31, .06], [.32, .22, -.07], [.29, .10, -.15]], .065, .025, 0x302c27);
  hairLock([[.11, .19, .27], [.25, .24, .20], [.33, .15, .11], [.33, .07, .04]], .06, .018, 0x2c2925);
  const hands: THREE.Group[] = [], wristHeight = 2.091;
  for (const side of [-1, 1]) {
    const shoulder: Vec3 = [side * .29, 2.23, -.025];
    const elbow: Vec3 = [side * .43, 2.10, -.34];
    const wrist: Vec3 = [side * .25 + .12, wristHeight, -.8];
    rod(shoulder, elbow, .125, cream, kenny);
    rod(elbow, wrist, .095, cream, kenny).name = `typing-forearm-${side}`;
    ellipsoid([.133, .133, .133], cream, elbow, kenny);
    ellipsoid([.132, .132, .132], cream, shoulder, kenny);
    const hand = new THREE.Group(); hand.name = `typing-hand-${side}`; hand.position.set(...wrist); kenny.add(hand); hands.push(hand);
    ellipsoid([.103, .055, .13], 0xe6b899, [0, 0, -.065], hand);
    for (let i = 0; i < 4; i++) rod([-.065 + i * .039, -.008, -.1], [-.065 + i * .039, -.04, -.18], .017, 0xe6b899, hand);
    line([[side * .2, 1.37, -.31], [side * .15, 1.57, -.335], [side * .2, 1.69, -.32]], 0x96968c, kenny);
  }

  // Photo-guided Bambi: continuous face volume and region-specific painted fur.
  // Fine strokes are baked once; no individual fur meshes or per-frame textures.
  function furStrokes(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.lineWidth = .65;
    for (let i = 0; i < 4200; i++) {
      const x = (i * 137.508) % width, y = (i * 71.731) % height;
      ctx.strokeStyle = i % 3 ? '#fff3df30' : '#78543b19';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(x * .03) * 2, y + 2 + i % 4); ctx.stroke();
    }
  }
  const bodyCoat = texture(512, 512, ctx => {
    const coat = ctx.createLinearGradient(0, 0, 0, 512);
    coat.addColorStop(0, '#c59a6f'); coat.addColorStop(.45, '#d6ad80'); coat.addColorStop(1, '#e6c9a7');
    ctx.fillStyle = coat; ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#a5784c9a';
    for (let y = 75; y < 480; y += 53) {
      for (const x of [0, 256, 512]) {
        const bend = Math.sin(y * .07 + x) * 18;
        ctx.beginPath(); ctx.moveTo(x - 103, y - 17);
        ctx.bezierCurveTo(x - 35, y + bend, x + 24, y + 24, x + 97, y - 9);
        ctx.bezierCurveTo(x + 30, y + 8, x - 32, y + bend - 14, x - 103, y - 17); ctx.fill();
      }
    }
    const bib = ctx.createRadialGradient(128, 215, 10, 128, 215, 105);
    bib.addColorStop(0, '#f1e3cf'); bib.addColorStop(.5, '#e8d3b7dd'); bib.addColorStop(1, '#e8d3b700');
    ctx.save(); ctx.scale(1, 1.45); ctx.fillStyle = bib; ctx.fillRect(0, 0, 512, 512); ctx.restore();
    furStrokes(ctx, 512, 512);
  });
  const legCoat = texture(256, 256, ctx => {
    const coat = ctx.createLinearGradient(0, 0, 0, 256);
    coat.addColorStop(0, '#cba176'); coat.addColorStop(.7, '#e0c19c'); coat.addColorStop(1, '#ecdbc2');
    ctx.fillStyle = coat; ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#a8754866'; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      ctx.lineWidth = 7 - i; const y = 40 + i * 41;
      ctx.beginPath(); ctx.moveTo(-10, y); ctx.bezierCurveTo(60, y + 17, 148, y - 11, 270, y + 6); ctx.stroke();
    }
    furStrokes(ctx, 256, 256);
  });
  const faceCoat = texture(1024, 512, ctx => {
    ctx.fillStyle = '#cea376'; ctx.fillRect(0, 0, 1024, 512);
    const chin = ctx.createRadialGradient(256, 350, 28, 256, 350, 112);
    chin.addColorStop(0, '#f4e8d8'); chin.addColorStop(.6, '#eee0cc'); chin.addColorStop(1, '#cea37600');
    ctx.fillStyle = chin; ctx.fillRect(110, 240, 292, 250);
    ctx.strokeStyle = '#986b4459'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    // Short soft forehead marks leave the eyes open; no angular brow-shaped M.
    for (const x of [215, 241, 272, 298]) {
      ctx.beginPath(); ctx.moveTo(x, 133); ctx.quadraticCurveTo(x + (256 - x) * .16, 161, x + (256 - x) * .25, 182 + Math.abs(256 - x) * .25); ctx.stroke();
    }
    for (const side of [-1, 1]) for (let i = 0; i < 2; i++) {
      ctx.lineWidth = 5 - i;
      ctx.beginPath(); ctx.moveTo(256 + side * (73 + i * 8), 265 + i * 24);
      ctx.quadraticCurveTo(256 + side * 117, 281 + i * 24, 256 + side * (157 + i * 9), 246 + i * 28); ctx.stroke();
    }
    ctx.lineWidth = 3; ctx.strokeStyle = '#986b4433';
    for (let x = 43; x < 1024; x += 57) {
      ctx.beginPath(); ctx.moveTo(x, 65); ctx.quadraticCurveTo(x - 9, 112, x + Math.sin(x) * 9, 151); ctx.stroke();
    }
    furStrokes(ctx, 1024, 512);
  });
  const fur = new THREE.MeshStandardMaterial({ map: bodyCoat, roughness: .92 });
  const legFur = new THREE.MeshStandardMaterial({ map: legCoat, roughness: .94 });
  const neckCoat = texture(256, 256, ctx => {
    ctx.fillStyle = '#d6ad80'; ctx.fillRect(0, 0, 256, 256);
    const bib = ctx.createRadialGradient(64, 130, 12, 64, 130, 73);
    bib.addColorStop(0, '#f1e3cf'); bib.addColorStop(.55, '#ead7bc'); bib.addColorStop(1, '#d6ad8000');
    ctx.fillStyle = bib; ctx.fillRect(0, 0, 256, 256); furStrokes(ctx, 256, 256);
  });
  const cat = new THREE.Group(); cat.name = 'bambi'; cat.position.set(1.34, 1.97, -.1); cat.rotation.y = .18; room.add(cat);
  const body = ellipsoid([.285, .47, .24], orange, [0, .47, -.035], cat); body.material = fur; body.name = 'bambi-coat';
  body.geometry = new THREE.SphereGeometry(1, mobile ? 24 : 32, mobile ? 14 : 20);
  const torsoVertices = body.geometry.attributes.position;
  for (let i = 0; i < torsoVertices.count; i++) {
    const y = torsoVertices.getY(i), taper = 1 - .13 * Math.max(0, y) + .045 * Math.exp(-(((y + .4) / .4) ** 2));
    torsoVertices.setXYZ(i, torsoVertices.getX(i) * taper, y, torsoVertices.getZ(i) * taper);
  }
  body.geometry.computeVertexNormals();
  const hindLegs: THREE.Group[] = [], frontLegs: THREE.Group[] = [];
  for (const x of [-.205, .205]) {
    const leg = new THREE.Group(); leg.name = `bambi-hind-leg-${Math.sign(x)}`; leg.position.set(x, .255, -.065); cat.add(leg); hindLegs.push(leg);
    ellipsoid([.14, .245, .195], orange, [0, 0, 0], leg).material = fur;
    const shin = ellipsoid([.073, .19, .078], orange, [0, -.29, 0], leg); shin.material = legFur; shin.visible = false;
    const paw = ellipsoid([.081, .055, .117], 0xe5ceb0, [0, -.46, .03], leg); paw.visible = false; paw.name = `bambi-hind-paw-${Math.sign(x)}`;
  }
  const forelegGeometry = new THREE.SphereGeometry(1, mobile ? 20 : 28, mobile ? 12 : 18);
  const legVertices = forelegGeometry.attributes.position;
  for (let i = 0; i < legVertices.count; i++) {
    const y = legVertices.getY(i), radius = Math.sqrt(Math.max(0, 1 - y * y));
    const taper = (.85 + y * .25) / Math.max(.001, radius ** .3);
    legVertices.setX(i, legVertices.getX(i) * taper);
    legVertices.setZ(i, legVertices.getZ(i) * taper - .09 * (1 - y * y));
  }
  forelegGeometry.computeVertexNormals();
  for (const x of [-.108, .108]) {
    const limb = new THREE.Group(); limb.name = `bambi-front-leg-${Math.sign(x)}`; limb.position.set(x, .54, .158); cat.add(limb); frontLegs.push(limb);
    const leg = ellipsoid([.082, .28, .087], orange, [0, -.205, 0], limb); leg.geometry = forelegGeometry; leg.rotation.x = -.07; leg.material = legFur;
    ellipsoid([.082, .052, .113], 0xe5ceb0, [0, -.482, .049], limb).name = `bambi-front-paw-${Math.sign(x)}`;
    for (const offset of [-.024, .024]) line([[offset, -.465, .151], [offset, -.489, .16]], 0xba9470, limb);
  }
  const neck = ellipsoid([.202, .245, .184], orange, [0, .78, -.018], cat);
  neck.material = new THREE.MeshStandardMaterial({ map: neckCoat, roughness: .94 });
  const catHead = new THREE.Group(); catHead.name = 'bambi-head'; catHead.position.set(0, .98, .025); cat.add(catHead);
  const faceGeometry = new THREE.SphereGeometry(1, mobile ? 32 : 40, mobile ? 20 : 28);
  const faceVertices = faceGeometry.attributes.position;
  const bulge = (x: number, y: number) => .052 * Math.exp(-((x / .068) ** 2 + ((y + .005) / .13) ** 2))
    + .083 * Math.exp(-((x / .115) ** 2 + ((y + .08) / .074) ** 2));
  for (let i = 0; i < faceVertices.count; i++) {
    const y = faceVertices.getY(i), z = faceVertices.getZ(i);
    const cheek = 1 + .055 * Math.exp(-(((y + .15) / .35) ** 2)) - .22 * Math.max(0, -y - .25);
    const x = faceVertices.getX(i) * .265 * cheek, height = y * (y > 0 ? .225 : .265);
    faceVertices.setXYZ(i, x, height, z * .235 + bulge(x, height) * THREE.MathUtils.smoothstep(z, 0, .55));
  }
  faceGeometry.computeVertexNormals();
  const face = mesh(faceGeometry, orange, [0, 0, 0], catHead, false);
  face.name = 'bambi-face'; face.material = new THREE.MeshStandardMaterial({ map: faceCoat, roughness: .94 });
  const earLining = texture(256, 256, ctx => {
    ctx.fillStyle = '#dfc5a6'; ctx.fillRect(0, 0, 256, 256);
    const pink = ctx.createRadialGradient(128, 142, 22, 128, 142, 126);
    pink.addColorStop(0, '#c99590'); pink.addColorStop(.65, '#d7ada0'); pink.addColorStop(1, '#dfc5a600');
    ctx.fillStyle = pink; ctx.fillRect(0, 0, 256, 256); furStrokes(ctx, 256, 256);
    ctx.strokeStyle = '#f5e4d07a';
    for (let i = 0; i < 70; i++) {
      const y = 32 + i * 2.6, x = (i % 2 ? 1 : -1) * (105 - y * .25);
      ctx.beginPath(); ctx.moveTo(128 + x, y); ctx.lineTo(128 + x * .73, y + 11); ctx.stroke();
    }
  });
  const earMaterial = new THREE.MeshStandardMaterial({ map: earLining, roughness: 1 });
  const ears: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const ear = new THREE.Group(); ear.name = `bambi-ear-${side}`; ear.position.set(side * .135, .105, -.02); ear.scale.set(.9, .94, 1); ear.rotation.y = side * .18; catHead.add(ear); ears.push(ear);
    const shape = new THREE.Shape(); shape.moveTo(-.108, -.035);
    shape.quadraticCurveTo(-.11, .085, side * .047 - .016, .233);
    shape.quadraticCurveTo(side * .047, .257, side * .047 + .017, .232);
    shape.quadraticCurveTo(.107, .08, .11, -.035); shape.closePath();
    const earGeometry = new THREE.ExtrudeGeometry(shape, { depth: .023, bevelEnabled: true, bevelSize: .009, bevelThickness: .007, bevelSegments: 3, steps: 1, curveSegments: mobile ? 6 : 10 });
    const inside = new THREE.Shape(); inside.moveTo(-.077, -.001); inside.quadraticCurveTo(-.075, .065, side * .044, .214);
    inside.quadraticCurveTo(.075, .068, .078, -.001); inside.closePath();
    const innerGeometry = new THREE.ShapeGeometry(inside, 12);
    const innerUV = innerGeometry.attributes.uv, innerVertices = innerGeometry.attributes.position;
    for (let i = 0; i < innerUV.count; i++) innerUV.setXY(i, (innerVertices.getX(i) + .08) / .16, (innerVertices.getY(i) + .01) / .23);
    for (const geometry of [earGeometry, innerGeometry]) {
      const vertices = geometry.attributes.position;
      for (let i = 0; i < vertices.count; i++) vertices.setZ(i, vertices.getZ(i) - .042 * (Math.max(0, vertices.getY(i)) / .25) ** 2);
      geometry.computeVertexNormals();
    }
    // Extrusion duplicates vertices at each face: weld before smoothing the rounded ear shell.
    earGeometry.deleteAttribute('normal'); earGeometry.deleteAttribute('uv');
    const smoothEar = mergeVertices(earGeometry); smoothEar.computeVertexNormals(); earGeometry.dispose();
    mesh(smoothEar, 0xcfab82, [0, 0, -.008], ear, false).name = `bambi-ear-shell-${side}`;
    mesh(innerGeometry, 0xffffff, [0, 0, .023], ear, false).material = earMaterial;
  }
  const pupils: THREE.Group[] = [], eyes: THREE.Group[] = [];
  const eyeShape = new THREE.Shape(); eyeShape.absellipse(0, 0, 1, .98, 0, Math.PI * 2, true);
  const eyeGeometry = new THREE.ShapeGeometry(eyeShape, 16);
  const irisMap = texture(128, 128, ctx => {
    const color = ctx.createRadialGradient(64, 64, 18, 64, 64, 64);
    color.addColorStop(0, '#c8b775'); color.addColorStop(.55, '#a4ad73'); color.addColorStop(.84, '#869462'); color.addColorStop(1, '#586447');
    ctx.fillStyle = color; ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#e4d59866'; ctx.lineWidth = 1;
    for (let i = 0; i < 64; i++) {
      const a = i * Math.PI / 32, r = 26 + Math.sin(i * 13) * 5;
      ctx.beginPath(); ctx.moveTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r);
      ctx.lineTo(64 + Math.cos(a + .02) * 57, 64 + Math.sin(a + .02) * 57); ctx.stroke();
    }
  });
  // Soft, nearly round eyes; the existing corneal dome keeps genuine depth.
  const irisGeometry = new THREE.BufferGeometry(), irisRim = eyeShape.getSpacedPoints(32).slice(0, -1);
  const irisPositions = [0, 0, .023], irisUV = [.5, .5], irisIndices: number[] = [];
  for (let ring = 1; ring <= 3; ring++) for (let i = 0; i < 32; i++) {
    const r = ring / 3, x = irisRim[i].x * r, y = irisRim[i].y * r, v = 1 + (ring - 1) * 32 + i, next = 1 + (ring - 1) * 32 + (i + 1) % 32;
    irisPositions.push(x * .086, y * .078, .023 * (1 - r * r)); irisUV.push((x + 1) / 2, (y + 1) / 2);
    if (ring === 1) irisIndices.push(0, next, v);
    else irisIndices.push(v - 32, next, v, v - 32, next - 32, next);
  }
  irisGeometry.setAttribute('position', new THREE.Float32BufferAttribute(irisPositions, 3));
  irisGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(irisUV, 2)); irisGeometry.setIndex(irisIndices); irisGeometry.computeVertexNormals();
  const irisMaterial = new THREE.MeshStandardMaterial({ map: irisMap, roughness: .25 });
  for (const x of [-.123, .123]) {
    const eye = new THREE.Group(); eye.position.set(x * .97, .044, .22); eye.rotation.y = Math.sign(x) * .38; catHead.add(eye);
    eye.name = `bambi-eye-${x}`; eyes.push(eye);
    mesh(eyeGeometry, 0x786451, [0, 0, 0], eye, false).scale.set(.09, .082, 1);
    const iris = mesh(irisGeometry, 0xffffff, [0, 0, .002], eye, false); iris.material = irisMaterial; iris.name = `bambi-iris-${x}`;
    const pupil = new THREE.Group(); pupil.name = `bambi-pupil-${x}`; pupil.position.z = .027; eye.add(pupil); pupils.push(pupil);
    mesh(new THREE.CircleGeometry(.049, mobile ? 24 : 32), 0x20271e, [0, 0, 0], pupil, false).name = 'bambi-pupil-aperture';
    mesh(new THREE.CircleGeometry(.012, mobile ? 12 : 20), 0xfff9eb, [-.012, .019, .002], pupil, false);
  }
  const noseShape = new THREE.Shape(); noseShape.moveTo(-.034, .012); noseShape.quadraticCurveTo(0, .025, .034, .012);
  noseShape.quadraticCurveTo(.02, -.012, 0, -.024); noseShape.quadraticCurveTo(-.02, -.012, -.034, .012);
  mesh(new THREE.ExtrudeGeometry(noseShape, { depth: .013, bevelEnabled: true, bevelThickness: .005, bevelSize: .004, bevelSegments: 2, curveSegments: 8 }), 0xc58d83, [0, -.052, .345], catHead, false).name = 'bambi-nose';
  line([[0, -.074, .354], [0, -.11, .327], [-.033, -.13, .294]], 0x98755d, catHead);
  line([[0, -.11, .327], [.033, -.13, .294]], 0x98755d, catHead);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(side * .062, -.093 - i * .009, .3 - i * .008), new THREE.Vector3(side * .25, -.075 - i * .032, .32), new THREE.Vector3(side * .4, -.04 - i * .067, .26));
      line(curve.getPoints(12).map(p => p.toArray()), 0xc1b5a0, catHead);
    }
  }
  const tail = new THREE.Group(); tail.name = 'bambi-tail'; tail.position.set(.19, .19, -.19); cat.add(tail);
  const tailPoints: Vec3[] = [[0, 0, 0], [.28, -.045, -.05], [.56, -.07, .03], [.74, .04, .18], [.81, .25, .25]];
  const tailMesh = tube(tailPoints, .06, orange, tail);
  const tailUV = tailMesh.geometry.getAttribute('uv');
  const tailVertices = tailMesh.geometry.attributes.position, tailPath = (tailMesh.geometry as THREE.TubeGeometry).parameters.path;
  const tailColors = new Float32Array(tailUV.count * 3);
  const tailBase = new THREE.Color(0xd6b28a), tailStripe = new THREE.Color(0xa77b53);
  for (let i = 0; i < tailUV.count; i++) {
    const u = tailUV.getX(i), band = Math.sin(u * 38 + Math.sin(u * 19) * .65);
    tailBase.clone().lerp(tailStripe, THREE.MathUtils.smoothstep(band, .15, .8) * .7).toArray(tailColors, i * 3);
    const center = tailPath.getPointAt(u), taper = 1 - .55 * u ** 4;
    tailVertices.setXYZ(i, center.x + (tailVertices.getX(i) - center.x) * taper, center.y + (tailVertices.getY(i) - center.y) * taper, center.z + (tailVertices.getZ(i) - center.z) * taper);
  }
  tailMesh.geometry.computeVertexNormals();
  tailMesh.geometry.setAttribute('color', new THREE.BufferAttribute(tailColors, 3));
  tailMesh.material = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: .86 });
  ellipsoid([.027, .027, .027], 0xc6a077, tailPoints[tailPoints.length - 1], tail);
  const bambiMotion = createBambiMotion({ cat, body, neck, head: catHead, frontLegs, hindLegs, tail, toy }, onBambiState);
  const plaqueMap = texture(768, 120, ctx => {
    ctx.fillStyle = '#555b52'; ctx.font = '32px monospace'; ctx.fillText('KENNY & BAMBI  /  THE LITTLE STUDIO', 16, 75);
  });
  print(3.55, .55, plaqueMap, [0, .015, 2.862]);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: .13 }));
  ground.position.y = -.12; ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  // Illustrated celestial silhouettes stay readable from every orbit angle.
  const sunDisc = new THREE.Group(); sunDisc.name = 'sun';
  const moon = new THREE.Group(); moon.name = 'moon';
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffc16c, toneMapped: false, transparent: true });
  sunDisc.add(new THREE.Mesh(new THREE.CircleGeometry(.32, 48), sunMaterial));
  const rays = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.012, .085, 3, 6), sunMaterial, 12);
  rays.name = 'sun-rays'; sunDisc.add(rays);
  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI / 6;
    rays.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(Math.sin(angle) * .47, Math.cos(angle) * .47, 0), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -angle), new THREE.Vector3(1, i % 2 ? .72 : 1, 1)));
  }
  const crescent = new THREE.Shape(); crescent.moveTo(.17, .35);
  crescent.bezierCurveTo(-.37, .48, -.53, -.23, -.07, -.36);
  crescent.quadraticCurveTo(.06, -.40, .21, -.28);
  crescent.bezierCurveTo(-.16, -.30, -.25, .17, .17, .35);
  const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xe1e8ed, toneMapped: false, transparent: true });
  const craterMaterial = new THREE.MeshBasicMaterial({ color: 0x8d9cae, transparent: true, opacity: .45, toneMapped: false });
  const moonShape = new THREE.Mesh(new THREE.ExtrudeGeometry(crescent, { depth: .045, bevelEnabled: true, bevelSize: .012, bevelThickness: .01, bevelSegments: 3, curveSegments: 32 }), moonMaterial);
  moonShape.name = 'moon-crescent'; moon.add(moonShape);
  for (const [x, y, r] of [[-.28, .06, .043], [-.20, -.20, .027], [-.15, .23, .021]]) {
    const crater = new THREE.Mesh(new THREE.RingGeometry(r * .7, r, 20), craterMaterial);
    crater.position.set(x, y, .06); moon.add(crater);
  }
  const haloMap = texture(128, 128, ctx => {
    for (let radius = 62; radius > 4; radius -= 2) {
      ctx.fillStyle = 'rgba(255,255,255,.012)'; ctx.beginPath(); ctx.arc(64, 64, radius, 0, Math.PI * 2); ctx.fill();
    }
  });
  const halos: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  for (const [body, color] of [[sunDisc, 0xffbe76], [moon, 0xaac7ef]] as const) {
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: haloMap, color, transparent: true, depthWrite: false, toneMapped: false, opacity: .45 }));
    halo.position.z = -.035; body.add(halo); halos.push(halo);
  }
  scene.add(sunDisc, moon);
  const lamp = new THREE.PointLight(0xffc17d, 0, 5, 2); lamp.position.set(-1.64, 2.73, -.73); scene.add(lamp);
  cylinder(.16, .04, ink, [-1.93, 1.99, -.8]);
  rod([-1.93, 2.02, -.8], [-1.93, 2.6, -.8], .024, ink);
  rod([-1.93, 2.6, -.8], [-1.65, 2.88, -.73], .024, ink);
  const shade = mesh(new THREE.ConeGeometry(.2, .22, roundSegments, 1, true), cream, [-1.64, 2.82, -.73], room, false);
  shade.material = new THREE.MeshStandardMaterial({ color: cream, side: THREE.DoubleSide, roughness: .48 });
  const bulb = ellipsoid([.045, .045, .045], paper, [-1.64, 2.75, -.73]);
  bulb.material = new THREE.MeshStandardMaterial({ color: paper, emissive: 0xffbf75 }); bulb.castShadow = false;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let hour = 10, cycling = !reducedMotion.matches, pixelated = false, dirty = true;
  let lastShadowUpdate = -1;
  const daylightColor = new THREE.Color(0xfff5dc), sunsetColor = new THREE.Color(0xffaf79), moonlightColor = new THREE.Color(0xb7cef4);
  const ambientDay = new THREE.Color(0xfff9ec), ambientNight = new THREE.Color(0xabbfe1);
  const orbitDirection = new THREE.Vector3();
  function updateLighting() {
    const sky = daylightAt(hour);
    clockHands[0].rotation.z = -hour / 12 * Math.PI * 2;
    clockHands[1].rotation.z = -(hour % 1) * Math.PI * 2;
    const daylight = THREE.MathUtils.smoothstep(sky.elevation, -.14, .56);
    // Continuous dilation follows the same light as the room, including manual time while paused.
    pupils.forEach(pupil => { const size = .86 + (1 - daylight) * .12; pupil.children[0].scale.set(size, size, 1); });
    const strength = THREE.MathUtils.smoothstep(Math.abs(sky.elevation), .015, .3);
    const isSun = sky.elevation >= 0;
    floorInk.material.color.set(0xcfcabd).multiplyScalar(.18 + sky.daylight * .82);
    // One inclined world-space circle, with the moon half a revolution behind.
    // Visible body and shadow light share this direction, including at night.
    orbitDirection.set(-Math.cos(sky.angle), sky.elevation * .8, -sky.elevation * .6);
    sunDisc.position.copy(orbitCenter).addScaledVector(orbitDirection, 4.8);
    moon.position.copy(orbitCenter).addScaledVector(orbitDirection, -4.8);
    const sunFade = THREE.MathUtils.smoothstep(sky.elevation, -.07, .07), moonFade = 1 - sunFade;
    sunDisc.visible = sunFade > 0; moon.visible = moonFade > 0;
    sunMaterial.opacity = sunFade; moonMaterial.opacity = moonFade; craterMaterial.opacity = .45 * moonFade;
    halos[0].material.opacity = .45 * sunFade; halos[1].material.opacity = .45 * moonFade;
    sun.position.copy(orbitCenter).addScaledVector(orbitDirection, isSun ? 14 : -14);
    sun.intensity = strength * (isSun ? 3 : .65);
    sun.color.copy(isSun ? daylightColor : moonlightColor);
    if (isSun) sun.color.lerp(sunsetColor, sky.warmth);
    // Fade both sources to zero at the horizon before handing over the one map.
    sun.shadow.intensity = strength * (isSun ? .72 : .45);
    ambient.intensity = .72 + daylight * .9;
    ambient.color.copy(ambientNight).lerp(ambientDay, daylight);
    fill.intensity = .24 + daylight * .35;
    lamp.intensity = (1 - daylight) * 1.5;
    bulb.material.emissiveIntensity = (1 - daylight) * 1.8;
  }


  let paused = reducedMotion.matches, visible = true, disposed = false;
  let elapsed = 0, previousTime = 0, frame = 0, lastRendered = 0;
  let clockTime = performance.now();
  function advanceClock(now: number) {
    const delta = THREE.MathUtils.clamp((now - clockTime) / 1000, 0, 1); clockTime = now;
    if (cycling && !paused && !document.hidden && !disposed) hour = (hour + delta * .18) % 24;
  }
  function setTime(value: number) {
    hour = daylightAt(value).time; clockTime = performance.now();
    updateLighting(); renderer.shadowMap.needsUpdate = true; dirty = true;
    onTime(hour, daylightAt(hour).night);
  }
  // The page clock keeps running offscreen, without rendering an invisible canvas.
  const clockTimer = window.setInterval(() => {
    advanceClock(performance.now());
    if (cycling && !paused && !document.hidden && !disposed) onTime(hour, daylightAt(hour).night);
  }, 250);
  const pointer = new THREE.Vector2(), look = new THREE.Vector2(), catOnScreen = new THREE.Vector3();
  let pointerActive = false;
  function resetView() {
    controls.enableDamping = false; controls.update(); controls.enableDamping = true;
    const portrait = canvas.clientHeight > canvas.clientWidth;
    controls.target.set(portrait ? 0 : -.5, 1.4, 0);
    camera.position.set(9.2, 7.7, 11.4);
    const offset = camera.position.clone().sub(controls.target);
    const fitWidth = (portrait ? 11.4 : 15.4) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    // The reference is nearly square; wide screens also need a vertical floor/controls margin.
    const distance = portrait ? Math.max(14.5, fitWidth) * .94 : canvas.clientHeight < 520 ? Math.max(14.5, fitWidth) * 1.16 : Math.max(17.2, fitWidth * .82);
    controls.maxDistance = Math.max(23, distance * 1.65);
    camera.position.copy(controls.target).add(offset.setLength(distance));
    controls.update();
  }
  function resize() {
    const width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(pixelated ? .5 : Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.75));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const portrait = height > width;
    camera.setViewOffset(width, height, portrait ? 0 : -width * (height < 520 ? .13 : .045), height * (portrait ? -.17 : height < 520 ? .005 : -.045), width, height);
    camera.updateProjectionMatrix(); resetView();
    dirty = true;
  }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(canvas);
  resize();
  function orbit(theta: number, phi = 0) {
    const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    spherical.theta += theta;
    spherical.phi = THREE.MathUtils.clamp(spherical.phi + phi, controls.minPolarAngle, controls.maxPolarAngle);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical)); controls.update();
  }
  function zoom(factor: number) {
    const offset = camera.position.clone().sub(controls.target);
    camera.position.copy(controls.target).add(offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance)));
    controls.update();
  }
  function pan(x: number, y: number) {
    const offset = new THREE.Vector3(x, y, 0).applyQuaternion(camera.quaternion);
    controls.target.add(offset); camera.position.add(offset); controls.update();
  }
  function setMode(mode: ViewMode) {
    controls.enabled = mode !== 'scroll';
    controls.mouseButtons.LEFT = mode === 'pan' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE;
    controls.touches.ONE = mode === 'pan' ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE;
    canvas.style.touchAction = mode === 'scroll' ? 'pan-y pinch-zoom' : 'none';
  }
  const raycaster = new THREE.Raycaster(), hitPointer = new THREE.Vector2(), pickable: THREE.Mesh[] = [];
  room.traverse(object => { if (object instanceof THREE.Mesh) pickable.push(object); });
  const isVisible = (object: THREE.Object3D): boolean => object.visible && (!object.parent || isVisible(object.parent));
  function hitsBambi(event: PointerEvent) {
    if (paused || disposed || !bambiMotion.watching) return false;
    const rect = canvas.getBoundingClientRect();
    hitPointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(); raycaster.setFromCamera(hitPointer, camera);
    if (!raycaster.intersectObject(cat, true).some(hit => hit.object instanceof THREE.Mesh && isVisible(hit.object))) return false;
    // The nearest visible surface wins: no clicking through the monitor or walls.
    let object: THREE.Object3D | null = raycaster.intersectObjects(pickable, false).find(hit => isVisible(hit.object))?.object ?? null;
    while (object) { if (object === cat) return true; object = object.parent; }
    return false;
  }
  function randomBambi() {
    if (!paused && !disposed) bambiMotion.start((['run', 'play', 'sleep'] as const)[Math.floor(Math.random() * 3)]);
    canvas.style.cursor = '';
  }
  let tap: { id: number; x: number; y: number } | null = null, lastHover = 0;
  const cancelTap = () => { tap = null; canvas.style.cursor = ''; };
  const tapStart = (event: PointerEvent) => {
    if (tap || !event.isPrimary || event.button !== 0) { cancelTap(); return; }
    if (hitsBambi(event)) tap = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };
  const tapEnd = (event: PointerEvent) => {
    const start = tap; cancelTap();
    if (start && event.isPrimary && event.button === 0 && event.pointerId === start.id && Math.hypot(event.clientX - start.x, event.clientY - start.y) <= 6 && hitsBambi(event)) randomBambi();
  };
  canvas.addEventListener('pointerdown', tapStart, { passive: true });
  canvas.addEventListener('pointerup', tapEnd, { passive: true });
  canvas.addEventListener('pointercancel', cancelTap);
  canvas.addEventListener('pointerleave', cancelTap);
  // Suppress only OrbitControls' wheel listener, never the browser's page scroll.
  const pageWheel = (event: WheelEvent) => event.stopImmediatePropagation();
  canvas.addEventListener('wheel', pageWheel, { capture: true, passive: true });
  const keyboard = (event: KeyboardEvent) => {
    const actions: Record<string, () => void> = {
      ArrowLeft: () => event.shiftKey ? pan(-.2, 0) : orbit(-.12),
      ArrowRight: () => event.shiftKey ? pan(.2, 0) : orbit(.12),
      ArrowUp: () => event.shiftKey ? pan(0, .2) : orbit(0, -.1),
      ArrowDown: () => event.shiftKey ? pan(0, -.2) : orbit(0, .1),
      '+': () => zoom(.9), '=': () => zoom(.9), '-': () => zoom(1.1), r: resetView, R: resetView,
      Enter: () => { if (!event.repeat) randomBambi(); }, ' ': () => { if (!event.repeat) randomBambi(); }
    };
    if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
  };
  const followPointer = (event: PointerEvent) => {
    if (tap && (event.pointerId !== tap.id || Math.hypot(event.clientX - tap.x, event.clientY - tap.y) > 6)) cancelTap();
    const now = performance.now();
    if (event.target === canvas && event.pointerType !== 'touch' && now - lastHover > 60) {
      canvas.style.cursor = hitsBambi(event) ? 'pointer' : ''; lastHover = now;
    }
    const rect = canvas.getBoundingClientRect();
    pointer.set(THREE.MathUtils.clamp((event.clientX - rect.left) / Math.max(1, rect.width) * 2 - 1, -1, 1), THREE.MathUtils.clamp(-((event.clientY - rect.top) / Math.max(1, rect.height) * 2 - 1), -1, 1));
    pointerActive = true;
  };
  const leavePointer = () => { pointerActive = false; cancelTap(); };
  const pointerSurface = canvas.closest<HTMLElement>('#top') ?? canvas;
  canvas.addEventListener('keydown', keyboard);
  pointerSurface.addEventListener('pointermove', followPointer, { passive: true });
  pointerSurface.addEventListener('pointerleave', leavePointer);
  function draw(time: number) {
    const delta = previousTime ? Math.min((time - previousTime) / 1000, .08) : 0;
    previousTime = time;
    advanceClock(performance.now());
    if (cycling && !paused) updateLighting();
    if (!paused && time - lastShadowUpdate >= 1000 / 30 - .5) { renderer.shadowMap.needsUpdate = true; lastShadowUpdate = time; }
    if (!paused) {
      elapsed += delta;
      hands.forEach((hand, i) => {
        const stroke = Math.sin(elapsed * 12 + i * Math.PI);
        hand.rotation.x = -stroke * .04; hand.position.y = wristHeight + stroke * .006;
      });
      head.rotation.x = -.08 + Math.sin(elapsed * 1.8) * .025;
      bambiMotion.update(delta, elapsed);
      if (!bambiMotion.watching) canvas.style.cursor = '';
      ears.forEach((ear, i) => { ear.rotation.z = Math.sin(elapsed * 11 + i) * Math.pow(Math.max(0, Math.sin(elapsed * .7 + i)), 14) * .12 * (1 - bambiMotion.sleeping); });
      if (bambiMotion.watching) {
        tail.rotation.y = Math.sin(elapsed * 1.9) * .28;
        tail.rotation.x = Math.sin(elapsed * 1.6) * .08;
        if (pointerActive) {
          catHead.getWorldPosition(catOnScreen).project(camera);
          const x = THREE.MathUtils.clamp(catOnScreen.x, -.8, .8), y = THREE.MathUtils.clamp(catOnScreen.y, -.8, .8);
          look.set(THREE.MathUtils.clamp((pointer.x - x) / (pointer.x > x ? 1 - x : 1 + x) * 1.2, -1, 1),
            THREE.MathUtils.clamp((pointer.y - y) / (pointer.y > y ? 1 - y : 1 + y) * 1.2, -1, 1));
        } else look.set(0, 0);
        catHead.rotation.y = THREE.MathUtils.damp(catHead.rotation.y, look.x * .65, 6, delta);
        catHead.rotation.x = THREE.MathUtils.damp(catHead.rotation.x, -look.y * .28, 6, delta);
        catHead.rotation.z = THREE.MathUtils.damp(catHead.rotation.z, -look.x * .045, 5, delta);
      } else look.set(0, 0);
      pupils.forEach(pupil => {
        pupil.position.x = THREE.MathUtils.damp(pupil.position.x, look.x * .017, 10, delta);
        pupil.position.y = THREE.MathUtils.damp(pupil.position.y, look.y * .009, 10, delta);
      });
      const blink = Math.pow(Math.max(0, Math.sin(elapsed * .64)), 90);
      eyes.forEach(eye => { eye.scale.y = 1 - Math.max(blink, bambiMotion.sleeping) * .96; });
      steam.position.y = Math.sin(elapsed * 1.1) * .035;
      steam.rotation.y = Math.sin(elapsed * .6) * .3;
      codeCursor.visible = Math.sin(elapsed * 5) > 0;
    }
    const showBack = camera.position.z > -2.3, showLeft = camera.position.x > -3.2;
    if (backWall.visible !== showBack || leftWall.visible !== showLeft) renderer.shadowMap.needsUpdate = true;
    backWall.visible = showBack; leftWall.visible = showLeft;
    sunDisc.quaternion.copy(camera.quaternion); moon.quaternion.copy(camera.quaternion);
    rays.rotation.z = elapsed * .045;
    renderer.render(scene, camera);
  }
  function tick(time: number) {
    if (disposed || !visible || document.hidden) return;
    frame = requestAnimationFrame(tick);
    if (time - lastRendered < 1000 / (mobile ? 30 : 60)) return;
    controls.update();
    if (paused && !dirty) return;
    lastRendered = time; draw(time); dirty = false;
  }
  function syncVisibility() {
    cancelTap();
    cancelAnimationFrame(frame); previousTime = 0; lastRendered = 0; clockTime = performance.now();
    if (visible && !document.hidden && !disposed) frame = requestAnimationFrame(tick);
  }
  const intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncVisibility(); });
  intersectionObserver.observe(canvas);
  document.addEventListener('visibilitychange', syncVisibility);
  const contextLost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(frame); window.clearInterval(clockTimer); disposed = true; onError(); };
  canvas.addEventListener('webglcontextlost', contextLost);
  const viewChanged = () => { dirty = true; };
  controls.addEventListener('change', viewChanged);
  setMode('scroll'); setTime(hour); draw(0); syncVisibility();
  canvas.dataset.ready = 'true';
  return {
    resetView, orbit, pan, zoom, setMode,
    playBambi: bambiMotion.start,
    setPaused(value: boolean) { paused = value; cancelTap(); previousTime = 0; clockTime = performance.now(); dirty = true; },
    setTime,
    setCycling(value: boolean) { cycling = value; clockTime = performance.now(); },
    setPixelated(value: boolean) {
      pixelated = value; canvas.style.imageRendering = value ? 'pixelated' : 'auto';
      renderer.setPixelRatio(value ? .5 : Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.75));
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      dirty = true;
    },
    capture(): Promise<Blob> {
      renderer.render(scene, camera);
      const snapshot = document.createElement('canvas');
      snapshot.width = Math.round(canvas.clientWidth); snapshot.height = Math.round(canvas.clientHeight);
      const context = snapshot.getContext('2d');
      if (!context) return Promise.reject(new Error('Screenshot canvas unavailable'));
      context.imageSmoothingEnabled = !pixelated;
      context.fillStyle = pageThemeAt(hour).paper; context.fillRect(0, 0, snapshot.width, snapshot.height);
      context.drawImage(canvas, 0, 0, snapshot.width, snapshot.height);
      return new Promise((resolve, reject) => snapshot.toBlob(blob => blob ? resolve(blob) : reject(new Error('Screenshot failed')), 'image/png'));
    },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); window.clearInterval(clockTimer);
      resizeObserver.disconnect(); intersectionObserver.disconnect(); controls.removeEventListener('change', viewChanged); controls.dispose();
      document.removeEventListener('visibilitychange', syncVisibility);
      canvas.removeEventListener('wheel', pageWheel, true);
      canvas.removeEventListener('pointerdown', tapStart); canvas.removeEventListener('pointerup', tapEnd);
      canvas.removeEventListener('pointercancel', cancelTap); canvas.removeEventListener('pointerleave', cancelTap);
      canvas.removeEventListener('keydown', keyboard); pointerSurface.removeEventListener('pointermove', followPointer);
      pointerSurface.removeEventListener('pointerleave', leavePointer); canvas.removeEventListener('webglcontextlost', contextLost);
      scene.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          for (const item of (Array.isArray(object.material) ? object.material : [object.material])) {
            if ('map' in item && item.map instanceof THREE.Texture) item.map.dispose();
            item.dispose();
          }
        }
      });
      sun.shadow.map?.dispose();
      renderer.dispose();
    }
  };
}
export type StudioController = ReturnType<typeof createStudio>;
