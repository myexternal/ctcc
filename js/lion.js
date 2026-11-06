// The crest's gold lion as a real 3D mesh. Drag to turn it: 1:1 tracking, velocity hand-off,
// momentum decay, rubber-banded tilt that springs back. Renders only while visible.
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from '../vendor/jsm/environments/RoomEnvironment.js';

const host = document.getElementById('lion');
const canvas = host?.querySelector('canvas');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function webglOK() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } }

if (host && canvas && webglOK()) init();

function init() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0.15, 7.4);

  // warm key from the upper left, cool navy rim from behind so the silhouette reads on the dark page
  const key = new THREE.DirectionalLight(0xfff1d0, 2.4); key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x6f8cff, 2.2); rim.position.set(3, 1.5, -4); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xfff3d6, 0x0c255e, 0.5));

  const gold = new THREE.MeshPhysicalMaterial({
    color: 0xf0bd3a, metalness: 1, roughness: 0.26, clearcoat: 0.35, clearcoatRoughness: 0.25,
    envMapIntensity: 1.25,
  });

  const pivot = new THREE.Group(); scene.add(pivot);   // spins (Y) and tilts (X)
  const holder = new THREE.Group(); pivot.add(holder); // carries the mesh, centred

  new GLTFLoader().load('media/lion.glb', (gltf) => {
    const root = gltf.scene;
    root.traverse((o) => { if (o.isMesh) { o.material = gold; o.geometry.computeVertexNormals(); } });
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    root.position.sub(c);
    const s = 2.7 / Math.max(size.x, size.y, size.z);
    holder.scale.setScalar(s);
    holder.add(root);
    resize(); host.classList.add('ready'); kick();
  }, undefined, () => { /* keep the flat crest lion as the fallback */ });

  /* ---------- sizing ---------- */
  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    // keep the whole lion in frame on narrow screens
    camera.position.z = w / h < 1 ? 7.4 / Math.max(0.62, w / h) * 0.9 : 7.4;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(() => { resize(); kick(); }).observe(host);

  /* ---------- interaction state ---------- */
  const REST_Y = Number(new URLSearchParams(location.search).get('ry') ?? -1.25); // crest's side-on pose
  let rotY = REST_Y - 0.9, velY = 0;       // starts turned, settles into pose on load
  let tiltX = 0, tiltV = 0, tiltTarget = 0;
  let dragging = false, lastX = 0, lastY = 0, hist = [];
  const SWAY = reduce ? 0 : 0.42;          // idle: slow sway around the crest pose (period ~16s), never edge-on
  let clock = 0;

  host.addEventListener('pointerdown', (e) => {
    dragging = true; host.classList.add('touched'); host.setPointerCapture(e.pointerId);
    lastX = e.clientX; lastY = e.clientY; hist = [{ x: e.clientX, t: performance.now() }]; velY = 0; kick();
  });
  host.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
    rotY += dx * 0.011;                                        // 1:1 feel: ~1 turn per 570px
    tiltTarget = rubber(tiltTarget + dy * 0.004, 0.32);        // soft limit, resists past the edge
    const t = performance.now(); hist.push({ x: e.clientX, t }); if (hist.length > 5) hist.shift();
  });
  const release = () => {
    if (!dragging) return; dragging = false;
    const a = hist[0], b = hist[hist.length - 1], dt = Math.max(16, b.t - a.t);
    velY = ((b.x - a.x) / dt) * 1000 * 0.011;                  // hand the finger's velocity to the spin
    velY = Math.max(-14, Math.min(14, velY));
    tiltTarget = 0;                                            // tilt springs home
  };
  host.addEventListener('pointerup', release); host.addEventListener('pointercancel', release);

  function rubber(v, lim) { const a = Math.abs(v); if (a <= lim) return v; const over = a - lim; return Math.sign(v) * (lim + over * 0.25 / (1 + over)); }

  /* ---------- scroll couples a little turn to the page ---------- */
  let scrollTurn = 0;
  addEventListener('scroll', () => { scrollTurn = Math.min(1, scrollY / innerHeight) * 0.6; kick(); }, { passive: true });

  /* ---------- loop: runs only while visible and needed ---------- */
  let visible = true, raf = 0, last = performance.now(), settledFrames = 0;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }, { threshold: 0 }).observe(host);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });

  function kick() { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  function frame(t) {
    raf = 0;
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    clock += dt;
    if (!dragging) {
      // momentum carries the spin, decaying exponentially; once slow, a critically damped
      // spring pulls the lion back to the nearest crest-facing pose, which drifts in a slow sway
      velY *= Math.exp(-dt * 1.8);
      const sway = REST_Y + SWAY * Math.sin(clock * (2 * Math.PI / 16));
      const turns = Math.round((rotY - sway) / (2 * Math.PI));
      const target = sway + turns * 2 * Math.PI;
      const pull = Math.max(0, 1 - Math.abs(velY) / 3);          // spring takes over as momentum fades
      const k = 2 * Math.PI / 0.9;
      velY += (k * k * (target - rotY) - 2 * k * velY) * dt * pull;
      rotY += velY * dt;
    }
    // critically damped spring for tilt (response ~0.35s)
    const w = 2 * Math.PI / 0.35;
    const acc = w * w * (tiltTarget - tiltX) - 2 * w * tiltV;
    tiltV += acc * dt; tiltX += tiltV * dt;

    pivot.rotation.y = rotY + scrollTurn;
    pivot.rotation.x = tiltX + 0.06;
    holder.position.y = -0.05;
    renderer.render(scene, camera);

    const moving = dragging || Math.abs(velY) > 0.002 || Math.abs(tiltV) > 0.001 || Math.abs(tiltTarget - tiltX) > 0.001 || SWAY > 0;
    settledFrames = moving ? 0 : settledFrames + 1;
    if (visible && !document.hidden && settledFrames < 2) raf = requestAnimationFrame(frame);
  }
}
