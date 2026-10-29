import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

history.scrollRestoration = 'manual';
scrollTo(0, 0);
const P = await (await fetch('data.json')).json();
await document.fonts.ready;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const { clamp, damp, lerp } = THREE.MathUtils;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 900px), (pointer: coarse)').matches;
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clip = (s, n) => (s.length > n ? s.slice(0, s.lastIndexOf(' ', n)) + '…' : s);
const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const manager = new THREE.LoadingManager();
const loader = new THREE.TextureLoader(manager);

// ---------------------------------------------------------------- headings split into rising lines
$$('.split').forEach((el) => { el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map((h) => `<span class="ln"><span>${h}</span></span>`).join(''); });
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in');
  $$('[data-count]', e.target).forEach(countUp);
  io.unobserve(e.target);
}), { threshold: .3 });
function countUp(el) {
  const to = +el.dataset.count, t0 = performance.now();
  const step = (t) => { const k = Math.min((t - t0) / 1500, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

// ================================================================ THE MODEL (a physical architect's model)
const canvas = $('#model');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.6 : 2));
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = mobile ? THREE.PCFSoftShadowMap : THREE.VSMShadowMap;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
scene.environmentIntensity = .55;
const camera = new THREE.PerspectiveCamera(26, innerWidth / innerHeight, .1, 300);

const key = new THREE.DirectionalLight(0xfff2e2, 2.4);
key.position.set(-9, 15, 9);
key.castShadow = true;
key.shadow.mapSize.setScalar(mobile ? 1024 : 2048);
Object.assign(key.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 50 });
key.shadow.bias = -.0005;
key.shadow.radius = 9; key.shadow.blurSamples = 20;
scene.add(key, new THREE.HemisphereLight(0xffffff, 0xd8ccb6, .7));
const catcher = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.ShadowMaterial({ opacity: .16 }));
catcher.rotation.x = -Math.PI / 2; catcher.position.y = -.8; catcher.receiveShadow = true;
scene.add(catcher);

const card = new THREE.MeshStandardMaterial({ color: 0xf7f4ee, roughness: .9 });
const card2 = new THREE.MeshStandardMaterial({ color: 0xebe6dc, roughness: .9 });
const wood = new THREE.MeshStandardMaterial({ color: 0xdcc39c, roughness: .65 });
loader.load(`assets/tex/oak${mobile ? '-lo' : ''}.jpg`, (t) => {   // basswood base: the oak texture, lightened
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.5, 2.5);
  wood.map = t; wood.color.setRGB(1.22, 1.24, 1.3); wood.needsUpdate = true;
});
const acrylic = new THREE.MeshPhysicalMaterial({ color: 0xd4e2e6, roughness: .04, transparent: true, opacity: .3, clearcoat: 1, clearcoatRoughness: .05, depthWrite: false });
const felt = new THREE.MeshStandardMaterial({ color: 0xa3ab8e, roughness: 1 });
const ink = new THREE.LineBasicMaterial({ color: 0x262c24, transparent: true, opacity: 0, depthWrite: false });
const xrayMats = [card, card2, wood, felt];
xrayMats.forEach((m) => { m.transparent = true; });

const model = new THREE.Group();
scene.add(model);
const mk = (geo, mat, x, y, z, parent = model) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
const boxM = (w, h, d, mat, x, y, z, parent) => mk(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);

boxM(16, .8, 11, wood, 0, -.4, 0);                      // basswood plinth
boxM(15.2, .06, 10.2, card2, 0, .03, 0);                // site plate
boxM(15.2, .02, 1.1, card, 0, .07, 4.2);                // promenade
const pool = boxM(5.5, .03, 1.6, acrylic, -3.2, .08, 2.6); pool.castShadow = false;

// terraced floors: each floor steps back to leave a planted terrace at the front
const FLOORS = 5, FH = 1;
const layers = [];
for (let i = 0; i <= FLOORS; i++) {
  const g = new THREE.Group(); model.add(g); layers.push(g);
  const w = 10.4 - i * .9, d = 5.4 - i * .45, z = -1.2 - i * .42, y = .06 + i * FH;
  boxM(w, .12, d, i === FLOORS ? card2 : card, 0, y + .06, z, g);      // slab
  if (i === FLOORS) continue;
  const glass = boxM(w - .5, FH - .12, d - .5, acrylic, 0, y + .12 + (FH - .12) / 2, z, g); glass.castShadow = false;
  const cg = new THREE.CylinderGeometry(.035, .035, FH - .12, 8);
  for (let x = -w / 2 + .3; x <= w / 2 - .29; x += .8) mk(cg, card, x, y + .12 + (FH - .12) / 2, z + d / 2 - .18, g);   // colonnade
  boxM(w - .5, FH - .5, .06, card2, 0, y + .62, z - d / 2 + .3, g);    // solid rear wall
  if (i > 0) for (let x = -w / 2 + .5; x < w / 2 - .4; x += 1.1) {       // planters on the terrace in front of this floor
    mk(new THREE.SphereGeometry(.16, 16, 12), felt, x, y + .26, z + d / 2 + .22, g);
  }
}
// service core and entrance canopy
const core = new THREE.Group(); model.add(core);
boxM(1.5, FLOORS + 1.6, 1.6, card, 4.3, (FLOORS + 1.6) / 2 + .06, -2.6, core);
for (let k = -2; k <= 2; k++) boxM(.05, FLOORS + 1.5, .12, card2, 4.3 + k * .3, (FLOORS + 1.5) / 2 + .06, -1.74, core);
const canopy = new THREE.Group(); model.add(canopy);
boxM(3.4, .08, 2, card, -3.6, 1.05, 2.1, canopy);
mk(new THREE.CylinderGeometry(.04, .04, 1, 8), card, -5, .56, 2.9, canopy);
mk(new THREE.CylinderGeometry(.04, .04, 1, 8), card, -2.2, .56, 2.9, canopy);
// trees: felt and white card, scattered on the site
{
  const r = mulberry(5);
  const spots = [];
  for (let k = 0; k < 80 && spots.length < 26; k++) {
    const x = (r() - .5) * 14.4, z = (r() - .5) * 9.4;
    const inBuilding = Math.abs(x) < 5.6 && z > -4.4 && z < 1.7, inPool = x > -6.2 && x < -.2 && z > 1.6 && z < 3.6, onPath = z > 3.6 && z < 4.8;
    if (inBuilding || inPool || onPath || (x > 3.2 && z < -1.6)) continue;
    spots.push([x, z]);
  }
  const trunk = new THREE.CylinderGeometry(.025, .03, .5, 6);
  spots.forEach(([x, z], k) => {
    const s = .32 + r() * .26;
    mk(trunk, card, x, .3, z);
    mk(new THREE.SphereGeometry(s, 20, 14), k % 3 ? felt : card, x, .55 + s * .8, z);
  });
}
// MEP services (only visible in the x-ray coordination view) and a flagged clash
const mepMat = new THREE.MeshStandardMaterial({ color: 0xb98a4e, roughness: .5, transparent: true, opacity: 0 });
const duct = mk(new THREE.BoxGeometry(8.4, .18, .22), mepMat, 0, 2.86, -1.6); duct.castShadow = false;
const pipe = mk(new THREE.CylinderGeometry(.05, .05, 4.4, 10), mepMat, 2.2, 2.9, -1.4); pipe.rotation.x = Math.PI / 2; pipe.castShadow = false;
const clash = mk(new THREE.SphereGeometry(.42, 24, 16), new THREE.MeshBasicMaterial({ color: 0xc2452d, transparent: true, opacity: 0, depthTest: false }), 2.2, 2.88, -1.6);
clash.castShadow = false; clash.renderOrder = 10;
// ink edges for the drawing view (round trees and columns are skipped: they only add noise)
model.traverse((o) => {
  if (!o.isMesh || o.geometry.type === 'SphereGeometry' || o.geometry.type === 'CylinderGeometry' || o === clash) return;
  o.add(new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 25), ink));
});
model.position.y = -.4;

// ---------------------------------------------------------------- scroll-driven model states
const STATES = {
  hero: { rot: -.55, elev: .42, dist: 38, explode: 0, xray: 0, sx: .2, ty: 1.8 },
  explode: { rot: .35, elev: .34, dist: 44, explode: 1, xray: 0, sx: .22, ty: 3.6 },
  xray: { rot: 1.05, elev: .78, dist: 40, explode: .25, xray: 1, sx: .22, ty: 2.2 },
};
const KEYS = Object.keys(STATES.hero);
let scenes = [];
function layout() {
  scenes = $$('[data-scene]').map((el) => {
    const r = el.getBoundingClientRect();
    return { st: STATES[el.dataset.scene], y: r.top + scrollY + r.height / 2 - innerHeight / 2 };
  });
  scenes[0].y = 0;
}
const cur = { ...STATES.hero };
function target(y) {
  let i = 0;
  while (i < scenes.length - 2 && y > scenes[i + 1].y) i++;
  const a = scenes[i], b = scenes[i + 1];
  let t = clamp((y - a.y) / (b.y - a.y), 0, 1);
  t = t * t * (3 - 2 * t);
  const o = {};
  for (const k of KEYS) o[k] = lerp(a.st[k], b.st[k], t);
  return o;
}

// ---------------------------------------------------------------- drag to rotate, explore mode, pins
let userYaw = 0, yawVel = 0, drag = null, exploring = false;
canvas.addEventListener('pointerdown', (e) => { if (!exploring) drag = { x: e.clientX }; });
addEventListener('pointermove', (e) => { if (drag) { yawVel = (e.clientX - drag.x) * .006; userYaw += yawVel; drag.x = e.clientX; } });
addEventListener('pointerup', () => { drag = null; });
const controls = new OrbitControls(camera, canvas);
Object.assign(controls, { enabled: false, enableDamping: true, minDistance: 16, maxDistance: 60, maxPolarAngle: 1.45, enablePan: false });
const exitBtn = document.createElement('button');
exitBtn.id = 'explore-exit'; exitBtn.className = 'btn dark'; exitBtn.type = 'button'; exitBtn.textContent = 'Close the model ✕';
document.body.append(exitBtn);
const lookAt = V(), desired = V(), tmp = V();
function setExplore(on) {
  exploring = on;
  document.body.classList.toggle('exploring', on);
  controls.enabled = on;
  if (on) { scrollTo({ top: 0 }); controls.target.copy(lookAt); controls.update(); }
}
$('#explore-btn').addEventListener('click', () => setExplore(true));
exitBtn.addEventListener('click', () => setExplore(false));
addEventListener('keydown', (e) => { if (e.key === 'Escape' && exploring) setExplore(false); });
const PINS = [
  ['01', 'Profile', '#profile', V(-3.6, 1.3, 2.1)],
  ['02', 'Expertise', '#expertise', V(4.3, 7, -2.6)],
  ['03', 'Projects', '#works', V(0, 5.4, -2.6)],
  ['04', 'Career', '#career', V(3.5, 1.2, -.2)],
  ['05', 'Contact', '#contact', V(-3.2, .3, 2.6)],
];
const pinEls = PINS.map(([n, label, href]) => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'pin'; b.innerHTML = `<b>${n}</b>${label}`;
  b.addEventListener('click', () => { setExplore(false); setTimeout(() => $(href).scrollIntoView({ behavior: 'smooth' }), 50); });
  $('#pins').append(b); return b;
});

const clashTag = document.createElement('div');
clashTag.className = 'clash-tag mono'; clashTag.innerHTML = '<b></b>Clash 014 · duct × beam — resolved';
$('#pins').append(clashTag);

// ---------------------------------------------------------------- render loop
let prevT = performance.now(), sy = 0, intro = reduce ? 1 : 0, ready = false, readyAt = 0;
const mouse = new THREE.Vector2();
addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') mouse.set(e.clientX / innerWidth - .5, e.clientY / innerHeight - .5); });
function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.fov = innerWidth < 700 ? 34 : 26;
  renderer.setSize(innerWidth, innerHeight, false);
  layout();
}
addEventListener('resize', resize);
resize();
new ResizeObserver(layout).observe(document.body);
const works = $('#works');

renderer.setAnimationLoop(() => {
  const now = performance.now(), dt = Math.min((now - prevT) / 1000, .1);
  prevT = now;
  if (ready) intro = reduce ? 1 : Math.min((now - readyAt) / 2600, 1);
  if (works.getBoundingClientRect().top <= 0 && !exploring) { clashTag.style.opacity = 0; return; }   // opaque sections now cover the model: skip the GPU work

  sy = reduce ? scrollY : damp(sy, scrollY, 6, dt);
  const t = target(sy);
  for (const k of KEYS) cur[k] = damp(cur[k], t[k], 5, dt);
  if (!drag) { userYaw += yawVel; yawVel *= Math.pow(.02, dt); }

  // layers: exploded axonometric + x-ray drawing
  const ex = cur.explode * ease(intro);
  layers.forEach((g, i) => { g.position.y = ex * i * 1.15; });
  core.position.y = ex * 1.2; canopy.position.y = -ex * .2;
  const xr = cur.xray;
  for (const m of xrayMats) { m.opacity = 1 - xr * .86; m.depthWrite = xr < .5; }
  acrylic.opacity = .3 * (1 - xr * .7);
  ink.opacity = Math.max(xr, .06);
  mepMat.opacity = xr;
  clash.material.opacity = xr * (.55 + .45 * Math.sin(now * .006));
  clash.scale.setScalar(1 + .25 * Math.sin(now * .006));

  // intro: the model rises from its plinth while the camera settles
  model.scale.y = Math.max(ease(clamp(intro * 1.4, 0, 1)), .001);
  const phone = innerWidth < 900;
  const rot = cur.rot + userYaw + (reduce ? 0 : now * .00004) + mouse.x * .15;
  const elev = cur.elev - mouse.y * .06 + (1 - ease(intro)) * .5;
  const dist = cur.dist * (phone ? 1.28 : Math.max(1, 1.55 / camera.aspect)) + (1 - ease(intro)) * 14;   // narrow windows: step back so the model clears the text
  lookAt.set(0, cur.ty, 0);
  desired.set(Math.sin(rot) * Math.cos(elev) * dist, Math.sin(elev) * dist + cur.ty, Math.cos(rot) * Math.cos(elev) * dist);
  if (exploring) controls.update();
  else {
    camera.position.lerp(desired, 1 - Math.exp(-dt * 6));
    camera.lookAt(lookAt);
  }
  const W = innerWidth, H = innerHeight;
  if (phone) camera.setViewOffset(W, H, 0, H * .2, W, H);   // model sits in the upper half on phones
  else camera.setViewOffset(W, H, exploring ? 0 : -cur.sx * W, 0, W, H);

  clashTag.style.opacity = xr > .6 && !exploring ? 1 : 0;
  if (xr > .05) {
    tmp.copy(clash.position).applyMatrix4(model.matrixWorld).project(camera);
    clashTag.style.transform = `translate(${(tmp.x * .5 + .5) * W + 22}px, ${(-tmp.y * .5 + .5) * H - 14}px)`;
  }
  if (exploring) PINS.forEach(([, , , p], k) => {
    tmp.copy(p).applyMatrix4(model.matrixWorld).project(camera);
    pinEls[k].style.transform = `translate(${(tmp.x * .5 + .5) * W - 18}px, ${(-tmp.y * .5 + .5) * H - 18}px)`;
  });
  renderer.render(scene, camera);
});

// ================================================================ PROJECT STAGE (one at a time, dissolve)
const stageCanvas = $('#stage-canvas');
const sr = new THREE.WebGLRenderer({ canvas: stageCanvas, antialias: false, powerPreference: 'high-performance' });
sr.setPixelRatio(Math.min(devicePixelRatio, 2));
const sScene = new THREE.Scene(), sCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const blank = new THREE.DataTexture(new Uint8Array([217, 209, 193, 255]), 1, 1); blank.needsUpdate = true;
const sMat = new THREE.ShaderMaterial({
  uniforms: { uA: { value: blank }, uB: { value: blank }, uP: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uSa: { value: new THREE.Vector2(1, 1) }, uSb: { value: new THREE.Vector2(1, 1) }, uDir: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
  fragmentShader: `uniform sampler2D uA, uB; uniform float uP, uDir; uniform vec2 uRes, uSa, uSb; varying vec2 vUv;
    vec2 cover(vec2 uv, vec2 img){ float r = uRes.x/uRes.y, ir = img.x/img.y; vec2 s = r > ir ? vec2(1., ir/r) : vec2(r/ir, 1.); return (uv-.5)*s+.5; }
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+1.),f.x), f.y); }
    void main(){
      float nz = n(vUv*4.)*.55 + n(vUv*11.)*.3 + n(vUv*29.)*.15;
      float sweep = uDir > 0. ? vUv.x : 1.-vUv.x;
      float m = smoothstep(uP*1.5-.25, uP*1.5-.05, sweep*.55 + nz*.45);   // 1 = the old image still shows
      vec2 uva = (vUv-.5)*(1.-uP*.06)+.5 + vec2(uDir*uP*.03, 0.);
      vec2 uvb = (vUv-.5)*(1.+(1.-uP)*.1)+.5;
      vec3 a = texture2D(uA, cover(uva, uSa)).rgb, b = texture2D(uB, cover(uvb, uSb)).rgb;
      vec3 col = mix(b, a, m);
      col = mix(col, vec3(.95,.92,.86), smoothstep(.0,.5,m*(1.-m))*.9);   // a paper-coloured seam along the dissolve
      gl_FragColor = vec4(col, 1.);
      #include <colorspace_fragment>
    }`,
});
sScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), sMat));
const texCache = new Map();
function tex(i) {
  // the first image gates the loader; the rest load on demand
  if (!texCache.has(i)) texCache.set(i, new Promise((res) => (texCache.size === 0 ? loader : new THREE.TextureLoader()).load(P[i].images[0] + '-m.webp', (t) => { t.colorSpace = THREE.SRGBColorSpace; res(t); })));
  return texCache.get(i);
}
const size = (t) => new THREE.Vector2(t.image.width, t.image.height);
const sRender = () => sr.render(sScene, sCam);
new ResizeObserver(() => {
  const w = stageCanvas.clientWidth, h = stageCanvas.clientHeight;
  sr.setSize(w, h, false); sMat.uniforms.uRes.value.set(w, h); sRender();
}).observe(stageCanvas);

const cats = ['All', ...new Set(P.map((p) => p.category))];
let list = P.map((_, i) => i), pos = 0, busy = false, queued = null;
$('#filters').innerHTML = cats.map((c, k) => `<button type="button" aria-pressed="${k === 0}">${esc(c)}</button>`).join('');
$$('#filters button').forEach((b, k) => b.addEventListener('click', () => {
  $$('#filters button').forEach((x) => x.setAttribute('aria-pressed', x === b));
  list = P.map((_, i) => i).filter((i) => k === 0 || P[i].category === cats[k]);
  renderRail(); show(0, 1, true);
}));
function renderRail() {
  $('#rail').innerHTML = list.map((i, k) => `<button type="button" role="listitem" data-k="${k}"><img src="${P[i].images[0]}-s.webp" alt="" loading="lazy"><span>${P[i].sheet} · ${esc(clip(P[i].title, 22))}</span></button>`).join('');
  $$('#rail button').forEach((b) => b.addEventListener('click', () => show(+b.dataset.k, +b.dataset.k >= pos ? 1 : -1)));
  $('#st-total').textContent = String(list.length).padStart(2, '0');
}
async function show(k, dir, force) {
  k = (k + list.length) % list.length;
  if (k === pos && !force) return;
  if (busy) { queued = [k, dir, force]; return; }
  busy = true; pos = k;
  const p = P[list[k]];
  const copy = $('.stage-copy');
  copy.classList.add('swap');
  setTimeout(() => {
    $('#st-sheet').textContent = p.sheet; $('#st-firm').textContent = p.firm;
    $('#st-title').textContent = p.title; $('#st-cat').textContent = p.category;
    $('#st-stats').innerHTML = p.stats.map((s) => `<div><dt>${esc(s.l)}</dt><dd>${esc(s.v)}</dd></div>`).join('');
    $('#st-desc').textContent = clip(p.desc, 260);
    $('#st-n').textContent = String(k + 1).padStart(2, '0');
    copy.classList.remove('swap');
  }, 380);
  $$('#rail button').forEach((b, j) => b.classList.toggle('on', j === k));
  const on = $(`#rail button[data-k="${k}"]`);
  if (on) $('#rail').scrollTo({ left: on.offsetLeft - $('#rail').clientWidth / 2 + 75, behavior: 'smooth' });
  const t = await tex(list[k]);
  [list[(k + 1) % list.length], list[(k - 1 + list.length) % list.length]].forEach(tex);   // preload neighbours
  const u = sMat.uniforms;
  u.uB.value = t; u.uSb.value = size(t); u.uDir.value = dir;
  const t0 = performance.now(), dur = reduce ? 1 : 1100;
  await new Promise((res) => {
    const step = () => { const g = Math.min((performance.now() - t0) / dur, 1); u.uP.value = ease(g); sRender(); if (g < 1) requestAnimationFrame(step); else res(); };
    step();
  });
  u.uA.value = t; u.uSa.value = size(t); u.uP.value = 0; sRender();
  busy = false;
  if (queued) { const q = queued; queued = null; show(...q); }
}
$('#st-prev').addEventListener('click', () => show(pos - 1, -1));
$('#st-next').addEventListener('click', () => show(pos + 1, 1));
$('#st-open').addEventListener('click', () => openProject(list[pos]));
let sDrag = null;
stageCanvas.addEventListener('pointerdown', (e) => { sDrag = { x: e.clientX, y: e.clientY }; });
stageCanvas.addEventListener('pointerup', (e) => {
  if (!sDrag) return;
  const dx = e.clientX - sDrag.x, dy = e.clientY - sDrag.y;
  sDrag = null;
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(pos + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  else if (Math.abs(dx) < 6 && Math.abs(dy) < 6) openProject(list[pos]);
});
let stageVisible = false;
new IntersectionObserver(([e]) => { stageVisible = e.isIntersecting; }, { threshold: .4 }).observe(works);
addEventListener('keydown', (e) => {
  if (!stageVisible || lb.open || document.body.classList.contains('menu-open')) return;
  if (e.key === 'ArrowRight') show(pos + 1, 1);
  if (e.key === 'ArrowLeft') show(pos - 1, -1);
});
renderRail();
show(0, 1, true);

// ================================================================ LIGHTBOX
const lb = $('#lb'), lbImg = $('#lb-img');
let lp = null, li = 0;
function openProject(i) {
  lp = P[i]; li = 0;
  $('#lb-meta').textContent = `${lp.sheet} · ${lp.firm}`;
  $('#lb-title').textContent = lp.title;
  $('#lb-desc').textContent = lp.desc;
  $('#lb-stats').innerHTML = lp.stats.map((s) => `<div><dt>${esc(s.l)}</dt><dd>${esc(s.v)}</dd></div>`).join('');
  $('#lb-scope').innerHTML = lp.scope.map((s) => `<li>${esc(s)}</li>`).join('');
  $('#lb-thumbs').innerHTML = lp.images.map((src, k) => `<button type="button" data-k="${k}" aria-label="Photo ${k + 1}"><img src="${src}-s.webp" alt="" loading="lazy"></button>`).join('');
  lbShow(0);
  lb.showModal();
}
function lbShow(k) {
  li = (k + lp.images.length) % lp.images.length;
  const src = lp.images[li];
  lbImg.srcset = `${src}-m.webp 1200w, ${src}.jpg 1800w`;
  lbImg.sizes = '(max-width: 900px) 100vw, 70vw';
  lbImg.src = src + '-m.webp';
  lbImg.alt = `${lp.title} — photo ${li + 1}`;
  $('#lb-count').textContent = `${String(li + 1).padStart(2, '0')} / ${String(lp.images.length).padStart(2, '0')}`;
  $$('#lb-thumbs button').forEach((b, j) => b.classList.toggle('on', j === li));
}
lb.addEventListener('click', (e) => {
  if (e.target === lb || e.target.closest('.lb-close')) lb.close();
  else if (e.target.closest('.prev')) lbShow(li - 1);
  else if (e.target.closest('.next')) lbShow(li + 1);
  else if (e.target.closest('[data-k]')) lbShow(+e.target.closest('[data-k]').dataset.k);
});
lb.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') lbShow(li - 1); if (e.key === 'ArrowRight') lbShow(li + 1); });

// ================================================================ MENU
const menuBtn = $('#menu-btn');
function setMenu(on) {
  document.body.classList.toggle('menu-open', on);
  menuBtn.setAttribute('aria-expanded', on);
  $('#menu').hidden = false;
  if (on) setTimeout(() => $('#menu a').focus(), 50);
}
menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
$$('#menu a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); } });

// ================================================================ LOADER
const ldN = $('#ld-n'), ldBar = $('#ld-bar');
manager.onProgress = (_, a, b) => { const v = Math.round((a / b) * 100); ldN.textContent = v; ldBar.style.width = v + '%'; };
manager.onLoad = () => setTimeout(() => {
  $('#loader').classList.add('done');
  document.body.classList.remove('loading');
  ready = true; readyAt = performance.now();
  $$('.split, .numbers').forEach((el) => io.observe(el));
}, 300);

function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
