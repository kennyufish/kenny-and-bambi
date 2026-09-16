import * as THREE from 'three';

export type BambiAction = 'run' | 'play' | 'sleep';
export type BambiState = 'watch' | 'jump' | BambiAction;
type Rig = {
  cat: THREE.Group; body: THREE.Mesh; neck: THREE.Mesh; head: THREE.Group;
  frontLegs: THREE.Group[]; hindLegs: THREE.Group[]; tail: THREE.Group; toy: THREE.Mesh;
};

// ponytail: Authored routes fit this fixed room; add navigation only if furniture becomes movable.
export function createBambiMotion(rig: Rig, onState: (state: BambiState) => void) {
  const { cat, body, neck, head, frontLegs, hindLegs, tail, toy } = rig;
  const home = cat.position.clone(), landing = new THREE.Vector3(2.72, .18, 1.35);
  const bed = new THREE.Vector3(1.48, .295, 1.17), ballHome = toy.position.clone();
  const playSpot = new THREE.Vector3(2.38, .18, .87);
  const runPath = new THREE.CatmullRomCurve3([
    landing, new THREE.Vector3(2.72, .18, 1.62), new THREE.Vector3(2.1, .18, 2.03),
    new THREE.Vector3(.75, .18, 2.02), new THREE.Vector3(.62, .18, 1.92),
    new THREE.Vector3(1.25, .18, 1.90), new THREE.Vector3(2.1, .18, 2.03),
    new THREE.Vector3(2.72, .18, 1.62), landing
  ]);
  const travel = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3());
  const point = new THREE.Vector3(), tangent = new THREE.Vector3();
  const durations = { watch: 18, prepare: .7, down: 1.25, run: 6, approach: 2.5, play: 7.2, curl: 1.3, sleep: 12, wake: 1.3, return: 2.5, up: 1.25, settle: .7 };
  type Stage = keyof typeof durations;
  let stage: Stage = 'watch', time = 0, action: BambiAction = 'run', next = 0, sleeping = 0;
  let yaw = .18, startYaw = yaw;
  const headStart = new THREE.Euler();
  const ease = (t: number) => t * t * (3 - 2 * t);
  const mix = THREE.MathUtils.lerp;
  function enter(value: Stage) {
    stage = value; time = 0; startYaw = yaw;
    if (value === 'prepare') headStart.copy(head.rotation);
    const state: BambiState = value === 'watch' ? 'watch' : ['prepare', 'down', 'up', 'settle'].includes(value) ? 'jump' : action;
    cat.userData.activity = value; onState(state);
    if (value === 'watch') {
      sleeping = 0; yaw = .18; cat.position.copy(home); cat.rotation.y = yaw; pose(0, 0, 0, 0);
    }
    if (value === 'return' && action === 'play') toy.position.copy(ballHome);
    if (value === 'approach' || value === 'return') {
      travel.v0.copy(cat.position);
      travel.v2.copy(value === 'return' ? landing : action === 'sleep' ? bed : playSpot);
      travel.v1.copy(value === 'return' && action !== 'sleep' ? landing : new THREE.Vector3(2.55, .24, 1.90));
      if (action === 'play') travel.v1.copy(travel.v0).lerp(travel.v2, .5);
    }
  }
  function start(value: BambiAction) {
    if (stage !== 'watch') return false;
    action = value; enter('prepare'); return true;
  }
  function face(direction: THREE.Vector3, delta: number) {
    const target = Math.atan2(direction.x, direction.z);
    yaw += Math.atan2(Math.sin(target - yaw), Math.cos(target - yaw)) * (1 - Math.exp(-delta * 12));
  }
  function pose(stand: number, curl: number, stride: number, seconds: number, swipe = 0) {
    const breath = Math.sin(seconds * 2) * .006 * curl;
    body.position.set(0, mix(mix(.47, .48, stand), .245 + breath, curl), mix(-.035, 0, curl));
    body.rotation.set(stand * Math.PI / 2, 0, -.16 * curl);
    body.scale.set(mix(.285, .30, curl), mix(.47, .34, curl), mix(.24, .245, curl));
    neck.position.set(.08 * curl, mix(mix(.78, .57, stand), .29, curl), mix(mix(-.018, .33, stand), .16, curl));
    neck.scale.set(mix(.202, .15, curl), mix(.245, .16, curl), mix(.184, .15, curl));
    head.position.set(.13 * curl, mix(mix(.98, .67, stand), .29 + breath, curl), mix(mix(.025, .49, stand), .19, curl));
    head.rotation.set(.18 * curl, -.35 * curl, -.42 * curl);
    frontLegs.forEach((leg, i) => {
      const side = i ? 1 : -1;
      leg.position.set(side * mix(mix(.108, .18, stand), .10, curl), mix(mix(.54, .46, stand), .15, curl), mix(mix(.158, .32, stand), .18, curl));
      leg.scale.set(1, mix(mix(1, .85, stand), .46, curl), 1);
      leg.rotation.set(stride * side + curl * 1.4 - Math.max(0, swipe * side) * .7, 0, Math.max(0, swipe * side) * side * .3);
    });
    hindLegs.forEach((leg, i) => {
      const side = i ? 1 : -1;
      leg.position.set(side * mix(.205, .17, curl), mix(mix(.255, .40, stand), .19, curl), mix(mix(-.065, -.37, stand), -.13, curl));
      leg.scale.set(mix(1, .8, stand), mix(mix(1, .72, stand), .5, curl), mix(1, .8, stand));
      leg.rotation.x = -stride * side;
      leg.children.forEach((child, index) => { if (index > 0) child.visible = stand > .1 && curl < .8; });
    });
    tail.position.set(mix(.19, 0, stand) - .12 * curl, mix(mix(.19, .4, stand), .16, curl), mix(mix(-.19, -.42, stand), -.18, curl));
    tail.scale.setScalar(mix(mix(1, .65, stand), .48, curl));
    tail.rotation.set(Math.sin(seconds * 1.6) * .05 * (1 - curl), mix(stand * 1.6 + Math.sin(seconds * 2.4) * .16, -.5, curl), 0);
  }
  function update(delta: number, seconds: number) {
    time += delta;
    if (time >= durations[stage]) {
      switch (stage) {
        case 'watch': start((['run', 'play', 'sleep'] as const)[next++ % 3]); break;
        case 'prepare': enter('down'); break;
        case 'down': enter(action === 'run' ? 'run' : 'approach'); break;
        case 'run': enter('up'); break;
        case 'approach': enter(action === 'sleep' ? 'curl' : 'play'); break;
        case 'play': enter('return'); break;
        case 'curl': enter('sleep'); break;
        case 'sleep': enter('wake'); break;
        case 'wake': enter('return'); break;
        case 'return': enter('up'); break;
        case 'up': enter('settle'); break;
        case 'settle': enter('watch'); break;
      }
    }
    if (stage === 'watch') return;
    const t = Math.min(1, time / durations[stage]), s = ease(t);
    let stand = 1, curl = 0, stride = 0, swipe = 0;
    if (stage === 'prepare' || stage === 'settle') {
      stand = stage === 'prepare' ? s : 1 - s;
      cat.position.copy(home);
      const target = stage === 'prepare' ? .95 : .18;
      yaw = startYaw + Math.atan2(Math.sin(target - startYaw), Math.cos(target - startYaw)) * s;
    } else if (stage === 'down' || stage === 'up') {
      const jump = stage === 'down' ? t : 1 - t;
      cat.position.copy(home).lerp(landing, 1 - (1 - jump) ** 2);
      cat.position.y = mix(home.y, landing.y, jump);
      // A forward launch keeps the paws above the table edge until they clear it.
      cat.position.y += Math.sin(Math.PI * jump) * .80;
      tangent.copy(stage === 'down' ? landing : home).sub(stage === 'down' ? home : landing); face(tangent, delta);
      stride = Math.sin(Math.PI * t) * .35;
    } else if (stage === 'run') {
      runPath.getPointAt(s, point); runPath.getTangentAt(s, tangent); cat.position.copy(point); face(tangent, delta);
      stride = Math.sin(seconds * 15) * .60 * Math.sin(Math.PI * t);
      cat.position.y += Math.abs(stride) * .025;
    } else if (stage === 'approach' || stage === 'return') {
      travel.getPoint(s, point); travel.getTangent(s, tangent); cat.position.copy(point); face(tangent, delta);
      stride = Math.sin(seconds * 10) * .32 * Math.sin(Math.PI * t);
      // Step over the soft bed rim, rather than moving through it.
      if (action === 'sleep') cat.position.y += Math.sin(Math.PI * t) * .17;
    } else if (stage === 'play') {
      cat.position.copy(playSpot); yaw = mix(startYaw, 0, Math.min(1, time * 2));
      const beat = t * Math.PI * 6, roll = (1 - Math.cos(beat)) * .5;
      toy.position.set(ballHome.x + roll * .3, ballHome.y + Math.abs(Math.sin(beat)) * .025, ballHome.z);
      toy.rotation.z = -roll * .3 / .105;
      swipe = Math.sin(beat); head.rotation.y = (roll - .5) * .35;
    } else {
      cat.position.copy(bed);
      yaw = startYaw + Math.atan2(Math.sin(.65 - startYaw), Math.cos(.65 - startYaw)) * (stage === 'curl' ? s : 1);
      curl = stage === 'curl' ? s : stage === 'wake' ? 1 - s : 1;
    }
    sleeping = curl; pose(stand, curl, stride, seconds, swipe); cat.rotation.y = yaw;
    if (stage === 'prepare') head.rotation.set(headStart.x * (1 - s), headStart.y * (1 - s), headStart.z * (1 - s));
    if (stage === 'play') head.rotation.y = (toy.position.x - playSpot.x) * .8;
  }
  cat.userData.activity = 'watch';
  return { start, update, get watching() { return stage === 'watch'; }, get sleeping() { return sleeping; } };
}
