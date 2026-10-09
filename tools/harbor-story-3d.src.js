// Interactive 3D harbor diorama for the landing page (source). Bundled with esbuild + three.js into public/js/harbor-story.bundle.js.
// Build: node_modules/.bin/esbuild tools/harbor-story-3d.src.js --bundle --minify --format=esm --outfile=public/js/harbor-story.bundle.js
// Concept scene inspired by Kesennuma: boat -> dock -> landed tuna -> Gyosoku on a phone. Not real harbor footage.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export function mountHarbor(host, opts = {}) {
  const reduced = !!opts.reducedMotion;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.append(renderer.domElement);
  const canvas = renderer.domElement;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  const target = new THREE.Vector3(0.2, 0.55, 0);

  // ---- light: warm sun + cool sky, real daylight colors
  scene.add(new THREE.HemisphereLight(0xe3f1ff, 0xa89a78, 1.15));
  const sun = new THREE.DirectionalLight(0xfff0d6, 2.6);
  sun.position.set(-5, 8, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 25 });
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  const M = (color, rough = 0.6, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
  const mesh = (geo, mat, x = 0, y = 0, z = 0, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; return m; };

  // ---- sea block (top surface is animated)
  const SEA = 9, SEG = 72;
  const seaGeo = new THREE.PlaneGeometry(SEA, SEA, SEG, SEG); seaGeo.rotateX(-Math.PI / 2);
  const seaTop = new THREE.Mesh(seaGeo, new THREE.MeshStandardMaterial({ color: 0x2bb0c4, roughness: 0.38, metalness: 0.0, emissive: 0x0b4f63, emissiveIntensity: 0.35 }));
  seaTop.receiveShadow = false; seaTop.position.y = 0.0; scene.add(seaTop);
  const pos = seaGeo.attributes.position; const base = Float32Array.from(pos.array);
  const seaBlock = mesh(new THREE.BoxGeometry(SEA, 0.9, SEA), M(0x167f95, 0.55), 0, -0.72, 0, false); scene.add(seaBlock);
  const seaEdge = (t) => { for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3], z = base[i * 3 + 2];
    const e = Math.min(1, (SEA / 2 - Math.max(Math.abs(x), Math.abs(z))) / 0.7); // 0 at the edge so it meets the block
    pos.setY(i, e * (Math.sin(x * 1.1 + t * 1.4) * 0.07 + Math.cos(z * 1.3 + t * 1.1) * 0.06 + Math.sin((x + z) * 0.7 + t * 0.8) * 0.05));
  } pos.needsUpdate = true; seaGeo.computeVertexNormals(); };

  // ---- dock (right): planks, posts, bollards
  const dock = new THREE.Group(); dock.position.set(2.25, 0.05, 0.1); scene.add(dock);
  const woods = [0xd9a463, 0xcf9a5a, 0xe0b074, 0xc9904f];
  for (let i = 0; i < 14; i++) dock.add(mesh(new RoundedBoxGeometry(0.3, 0.14, 3.4, 2, 0.02), M(woods[i % 4], 0.8), -1.05 + i * 0.16, 0.18, 0));
  [-1.55, 1.55].forEach((z) => [-1.1, 1.2].forEach((x) => dock.add(mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.7, 14), M(0x6b4a2e, 0.9), x, 0.0, z))));
  [-1.45, 1.45].forEach((z) => dock.add(mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.2, 14), M(0x222a30, 0.5, 0.3), -1.05, 0.34, z)));

  // ---- crate with ice and a tuna
  const crate = new THREE.Group(); crate.position.set(1.95, 0.32, 0.55); crate.rotation.y = -0.3; scene.add(crate);
  crate.add(mesh(new RoundedBoxGeometry(1.15, 0.38, 0.8, 3, 0.04), M(0x2f8f86, 0.55), 0, 0.12, 0));
  crate.add(mesh(new RoundedBoxGeometry(1.0, 0.1, 0.66, 2, 0.03), M(0xe6f3f7, 0.35), 0, 0.34, 0));
  const fish = new THREE.Group(); fish.position.set(0, 0.5, 0); crate.add(fish);
  const body = mesh(new THREE.SphereGeometry(0.3, 28, 18), M(0x1d3f7a, 0.35, 0.25), 0, 0, 0); body.scale.set(1.9, 0.62, 0.72); fish.add(body);
  const belly = mesh(new THREE.SphereGeometry(0.29, 24, 14, 0, Math.PI * 2, Math.PI * 0.52, Math.PI * 0.48), M(0xd6dde2, 0.3, 0.2), 0, -0.01, 0); belly.scale.set(1.88, 0.6, 0.71); fish.add(belly);
  const tail = mesh(new THREE.ConeGeometry(0.2, 0.34, 3), M(0x16336a, 0.4, 0.2), -0.66, 0, 0); tail.rotation.set(0, 0, Math.PI / 2); tail.scale.set(1, 1, 0.3); fish.add(tail);
  const fin = mesh(new THREE.ConeGeometry(0.1, 0.24, 3), M(0x16336a, 0.4), 0.02, 0.2, 0); fin.scale.set(1, 1, 0.25); fish.add(fin);
  fish.add(mesh(new THREE.SphereGeometry(0.035, 10, 8), M(0x0b0b0b, 0.2), 0.5, 0.06, 0.17, false), mesh(new THREE.SphereGeometry(0.035, 10, 8), M(0x0b0b0b, 0.2), 0.5, 0.06, -0.17, false));
  for (let i = 0; i < 5; i++) fish.add(mesh(new THREE.ConeGeometry(0.025, 0.07, 4), M(0xf2c71c, 0.4), -0.28 - i * 0.07, -0.13, 0, false)); // yellow finlets

  // ---- phone standing on the dock, showing the app
  const phone = new THREE.Group(); phone.position.set(2.7, 1.12, -0.95); phone.rotation.y = -0.55; scene.add(phone);
  phone.add(mesh(new RoundedBoxGeometry(0.95, 1.7, 0.08, 4, 0.1), M(0x14181c, 0.35, 0.4), 0, 0, 0));
  const cv = document.createElement('canvas'); cv.width = 380; cv.height = 680; const cx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const drawScreen = (k) => {
    cx.fillStyle = '#f6f3ec'; cx.fillRect(0, 0, 380, 680);
    cx.fillStyle = '#0b3a45'; cx.fillRect(0, 0, 380, 118);
    cx.fillStyle = '#fff'; cx.font = '700 40px system-ui,sans-serif'; cx.fillText('Gyosoku', 28, 74);
    cx.fillStyle = '#ff8a4c'; cx.beginPath(); cx.arc(330, 60, 14, 0, 7); cx.fill();
    cx.fillStyle = '#5a7176'; cx.font = '600 24px system-ui,sans-serif'; cx.fillText('Today', 28, 170);
    cx.fillStyle = '#0b3a45'; cx.font = '800 76px system-ui,sans-serif'; cx.fillText(String(Math.round(800 * k)), 28, 262);
    cx.font = '600 28px system-ui,sans-serif'; cx.fillText('kg', 28 + cx.measureText(String(Math.round(800 * k))).width * 0 + 168, 262);
    const h = [0.4, 0.75, 0.55, 1, 0.6, 0.3, 0.2];
    h.forEach((v, i) => { cx.fillStyle = i === 3 ? '#ff8a4c' : '#14786f'; const bh = 170 * v * k; cx.beginPath(); cx.roundRect(28 + i * 46, 470 - bh, 32, bh, 8); cx.fill(); });
    cx.fillStyle = '#ff8a4c'; cx.beginPath(); cx.roundRect(28, 520, 324, 86, 22); cx.fill();
    cx.fillStyle = '#fff'; cx.font = '700 30px system-ui,sans-serif'; cx.fillText('Skipjack  800 kg', 70, 574);
    tex.needsUpdate = true;
  };
  drawScreen(1);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.52), new THREE.MeshBasicMaterial({ map: tex })); screen.position.z = 0.045; phone.add(screen);
  const ring = mesh(new THREE.TorusGeometry(0.17, 0.028, 12, 36), M(0xf29a4a, 0.4, 0.3), 0, 1.0, 0, false); phone.add(ring);

  // ---- fishing boat (left): hull, stripe, cabin, roof, mast
  const boat = new THREE.Group(); boat.position.set(-1.7, 0.08, 0.2); boat.rotation.y = 0.35; scene.add(boat);
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-1.35, -0.5); hullShape.lineTo(0.85, -0.5); hullShape.quadraticCurveTo(1.7, -0.3, 1.9, 0); hullShape.quadraticCurveTo(1.7, 0.3, 0.85, 0.5); hullShape.lineTo(-1.35, 0.5); hullShape.closePath();
  const hullGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 0.45, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 }); hullGeo.rotateX(-Math.PI / 2);
  boat.add(mesh(hullGeo, M(0x1b7380, 0.45), 0, 0.02, 0));
  const deckGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 0.1, bevelEnabled: false }); deckGeo.rotateX(-Math.PI / 2); const deck = mesh(deckGeo, M(0xf4f0e8, 0.6), 0, 0.46, 0); deck.scale.set(0.96, 1, 0.9); boat.add(deck);
  const stripeGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 0.06, bevelEnabled: false }); stripeGeo.rotateX(-Math.PI / 2); const stripe = mesh(stripeGeo, M(0xd9482b, 0.5), 0, 0.36, 0, false); stripe.scale.set(1.02, 1, 1.02); boat.add(stripe);
  boat.add(mesh(new RoundedBoxGeometry(0.85, 0.7, 0.8, 3, 0.05), M(0xf1e7d6, 0.65), -0.15, 0.9, 0));
  boat.add(mesh(new RoundedBoxGeometry(1.0, 0.1, 0.95, 2, 0.04), M(0xf0c28f, 0.6), -0.15, 1.3, 0));
  [0.4, -0.4].forEach((z) => boat.add(mesh(new THREE.BoxGeometry(0.45, 0.28, 0.02), M(0x1c2a33, 0.15, 0.4), 0.18, 0.95, z * 1.02, false)));
  boat.add(mesh(new THREE.BoxGeometry(0.02, 0.28, 0.42), M(0x1c2a33, 0.15, 0.4), 0.29, 0.95, 0, false));
  boat.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 10), M(0x9aa4a8, 0.4, 0.6), -0.3, 1.78, 0), mesh(new THREE.SphereGeometry(0.075, 14, 10), M(0xff8a4c, 0.4), -0.3, 2.26, 0));
  boat.add(mesh(new THREE.TorusGeometry(0.2, 0.04, 8, 20), M(0xd9482b, 0.5), 0.75, 0.62, 0.0).rotateX(Math.PI / 2)); // life ring

  // soft contact shadows on the water (cheap, no shadow map banding)
  const blob = (x, z, sx, sz, rot = 0, o = 0.28) => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(6,50,66,1)'); gr.addColorStop(1, 'rgba(6,50,66,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity: o, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.rotation.z = rot; m.position.set(x, 0.035, z); m.scale.set(sx, sz, 1); scene.add(m); };
  blob(-1.7, 0.25, 4.6, 2.4, -0.35); blob(2.35, 0.1, 3.4, 4.6, 0, 0.32);

  // ---- buoys
  const buoys = [[-0.2, -2.5, 0xff7a3d], [0.8, 2.6, 0xffc233], [-3.1, 2.3, 0xff7a3d]].map(([x, z, c]) => { const b = new THREE.Group(); b.position.set(x, 0.0, z); b.add(mesh(new THREE.SphereGeometry(0.16, 16, 12), M(c, 0.45), 0, 0.08, 0), mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.35, 8), M(0x555, 0.6), 0, 0.3, 0)); scene.add(b); return b; });

  // ---- camera orbit
  const view = { az: 0.55, el: 0.52, dist: 17.5, tAz: 0.55, tEl: 0.52 };
  const HOME = { az: 0.55, el: 0.52 };
  const place = () => { camera.position.set(target.x + view.dist * Math.cos(view.el) * Math.sin(view.az), target.y + view.dist * Math.sin(view.el), target.z + view.dist * Math.cos(view.el) * Math.cos(view.az)); camera.lookAt(target); };
  const resize = () => { const w = host.clientWidth || 400, h = host.clientHeight || 300; renderer.setSize(w, h, false); camera.aspect = w / h; view.dist = w / h < 1.15 ? 21 : 17.5; camera.updateProjectionMatrix(); dirty = true; };
  let dirty = true;
  new ResizeObserver(resize).observe(host);

  // ---- input: drag to turn (horizontal on touch so the page can still scroll), arrow keys, reset
  let drag = null, lastInput = -1e9;
  canvas.style.touchAction = 'pan-y'; canvas.tabIndex = 0; canvas.setAttribute('role', 'img');
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, az: view.tAz, el: view.tEl, touch: e.pointerType === 'touch' }; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; lastInput = performance.now(); });
  canvas.addEventListener('pointermove', (e) => { if (!drag) return; view.tAz = drag.az - (e.clientX - drag.x) * 0.012; if (!drag.touch) view.tEl = Math.min(1.05, Math.max(0.18, drag.el + (e.clientY - drag.y) * 0.008)); lastInput = performance.now(); dirty = true; });
  const end = () => { drag = null; canvas.style.cursor = 'grab'; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end); canvas.style.cursor = 'grab';
  canvas.addEventListener('keydown', (e) => { const k = { ArrowLeft: [-0.25, 0], ArrowRight: [0.25, 0], ArrowUp: [0, -0.08], ArrowDown: [0, 0.08] }[e.key]; if (!k) return; e.preventDefault(); view.tAz += k[0]; view.tEl = Math.min(1.05, Math.max(0.18, view.tEl + k[1])); lastInput = performance.now(); dirty = true; });

  // ---- loop
  let running = false, raf = 0, t0 = performance.now();
  const frame = (now) => {
    raf = 0; if (!running) return;
    const t = (now - t0) / 1000;
    if (!reduced) {
      if (!drag && now - lastInput > 4000) view.tAz = HOME.az + Math.sin(t * 0.25) * 0.35; // gentle idle sway
      seaEdge(t);
      boat.position.y = 0.08 + Math.sin(t * 1.5) * 0.05; boat.rotation.z = Math.sin(t * 1.2) * 0.035; boat.rotation.x = Math.cos(t * 1.0) * 0.02;
      buoys.forEach((b, i) => { b.position.y = Math.sin(t * 1.6 + i * 2) * 0.05; b.rotation.z = Math.sin(t * 1.3 + i) * 0.12; });
      fish.rotation.z = Math.sin(t * 2.2) * 0.03; ring.rotation.y = t * 1.2; phone.position.y = 1.12 + Math.sin(t * 1.1) * 0.03;
      const k = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 0.9)); if (Math.floor(t * 20) % 2 === 0) drawScreen(k);
    }
    view.az += (view.tAz - view.az) * 0.12; view.el += (view.tEl - view.el) * 0.12;
    place(); renderer.render(scene, camera); dirty = false;
    if (running && (!reduced || Math.abs(view.tAz - view.az) > 0.0005 || Math.abs(view.tEl - view.el) > 0.0005 || dirty)) raf = requestAnimationFrame(frame);
  };
  const start = () => { if (running) return; running = true; raf = requestAnimationFrame(frame); };
  const stop = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; };
  const wake = () => { if (reduced && running && !raf) raf = requestAnimationFrame(frame); };
  ['pointermove', 'keydown'].forEach((ev) => canvas.addEventListener(ev, wake));
  resize(); seaEdge(0); place(); renderer.render(scene, camera);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); host.dispatchEvent(new CustomEvent('harbor:lost')); });
  return { start, stop, reset() { view.tAz = HOME.az; view.tEl = HOME.el; lastInput = performance.now(); dirty = true; wake(); start(); }, canvas };
}
