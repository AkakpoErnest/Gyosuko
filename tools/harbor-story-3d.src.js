// Interactive 3D harbor scene for the landing page (source), realistic look: reflective ocean, morning sky, lofted boat hull, wooden dock.
// Bundled with esbuild + three.js into public/js/harbor-story.bundle.js.
// Build: node_modules/.bin/esbuild tools/harbor-story-3d.src.js --bundle --minify --format=esm --outfile=public/js/harbor-story.bundle.js
// Concept scene inspired by Kesennuma (boat -> dock -> landed tuna -> Gyosoku on a phone). Not real harbor footage.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

const TAU = Math.PI * 2;
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function waterNormals() { // procedural tileable normal map (summed sines)
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), img = g.createImageData(N, N);
  const h = (x, y) => { const u = x / N * TAU, v = y / N * TAU; return Math.sin(u * 3 + Math.sin(v * 2) * 1.5) * 0.5 + Math.sin(v * 5 + u * 2) * 0.35 + Math.sin(u * 9 - v * 7) * 0.18 + Math.sin(u * 14 + v * 11) * 0.1; };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = h((x + 1) % N, y) - h((x - 1 + N) % N, y), dy = h(x, (y + 1) % N) - h(x, (y - 1 + N) % N);
    const nx = -dx * 0.9, ny = -dy * 0.9, l = Math.hypot(nx, ny, 1), i = (y * N + x) * 4;
    img.data[i] = (nx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (ny / l * 0.5 + 0.5) * 255; img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

export function mountHarbor(host, opts = {}) {
  const reduced = !!opts.reducedMotion;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700 || /Android|iPhone|iPad/i.test(navigator.userAgent); // lighter settings for phones
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.78;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.append(renderer.domElement);
  const canvas = renderer.domElement;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 2000);
  scene.fog = new THREE.FogExp2(0xdfe6df, 0.0052);

  // sky + sun (early morning) and an environment map for reflections
  const sky = new Sky(); sky.scale.setScalar(1500); scene.add(sky);
  const sunDir = new THREE.Vector3(); sunDir.setFromSphericalCoords(1, THREE.MathUtils.degToRad(84), THREE.MathUtils.degToRad(-52));
  const U = sky.material.uniforms; U.turbidity.value = 7; U.rayleigh.value = 2.6; U.mieCoefficient.value = 0.008; U.mieDirectionalG.value = 0.9; U.sunPosition.value.copy(sunDir);
  const pmrem = new THREE.PMREMGenerator(renderer); const envScene = new THREE.Scene(); envScene.add(sky.clone());
  scene.environment = pmrem.fromScene(envScene, 0.02).texture; scene.environmentIntensity = 0.9;
  const sun = new THREE.DirectionalLight(0xffe2b8, 3.2); sun.position.copy(sunDir).multiplyScalar(40); sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048); Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 90 }); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.02; scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xbcd6f2, 0x8a7d62, 0.55));

  // ocean: real-time reflections, animated ripples, sun glitter
  const water = new Water(new THREE.PlaneGeometry(2400, 2400), { textureWidth: small ? 320 : 512, textureHeight: small ? 320 : 512, waterNormals: waterNormals(), sunDirection: sunDir.clone(), sunColor: 0xfff0d6, waterColor: 0x0f5a66, distortionScale: 2.2, fog: true });
  water.rotation.x = -Math.PI / 2; water.material.uniforms.size.value = 2.4; scene.add(water);

  const M = (color, rough = 0.6, metal = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
  const mesh = (geo, mat, x = 0, y = 0, z = 0, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; return m; };

  // distant land: hills, town, harbor cranes (silhouettes in haze)
  const land = new THREE.Group(); scene.add(land);
  const hill = (x, z, w, h, c) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: c, roughness: 1 })); m.scale.set(w, h, w * 0.6); m.position.set(x, -1, z); land.add(m); };
  hill(-60, -230, 120, 38, 0x4d6f58); hill(30, -260, 150, 52, 0x56795f); hill(150, -240, 110, 40, 0x486a54); hill(-170, -250, 100, 30, 0x5b7f68); hill(260, -270, 130, 46, 0x557a60);
  const townMat = M(0xe9e4d8, 0.95); for (let i = 0; i < 46; i++) { const w = 3 + Math.random() * 5, h = 2 + Math.random() * 4; const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 3 + Math.random() * 3), townMat); b.position.set(-110 + i * 5.3 + Math.random() * 2, h / 2, -196 - Math.random() * 14); land.add(b); }
  const craneMat = M(0x2a3239, 0.7); [-70, -20, 40].forEach((x) => { const c = new THREE.Group(); c.position.set(x, 0, -188); c.add(mesh(new THREE.BoxGeometry(1.4, 26, 1.4), craneMat, 0, 13, 0, false), mesh(new THREE.BoxGeometry(18, 1.2, 1.2), craneMat, 5, 26, 0, false)); land.add(c); });
  land.add(mesh(new THREE.BoxGeometry(560, 3.5, 12), M(0x6f6f68, 0.95), 0, 1, -190, false));

  // wooden dock (right)
  const woodTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#b98a55'; g.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(${60 + Math.random() * 40},${35 + Math.random() * 25},15,${0.1 + Math.random() * 0.18})`; g.lineWidth = 0.6 + Math.random() * 1.6; g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x * 0.04 + i) * 3); g.stroke(); } });
  const dock = new THREE.Group(); dock.position.set(2.6, 0, 0.2); scene.add(dock);
  for (let i = 0; i < 16; i++) { const p = mesh(new RoundedBoxGeometry(0.27, 0.12, 4.2, 2, 0.02), M(new THREE.Color().setHSL(0.08, 0.38, 0.5 + Math.random() * 0.12), 0.85, 0, { map: woodTex }), -1.25 + i * 0.165, 0.46, 0); p.rotation.y = (Math.random() - 0.5) * 0.02; dock.add(p); }
  [-1.9, 1.9].forEach((z) => [-1.2, 1.35].forEach((x) => dock.add(mesh(new THREE.CylinderGeometry(0.11, 0.13, 1.9, 12), M(0x6a4d36, 0.95, 0, { map: woodTex }), x, -0.1, z))));
  [-1.9, 1.9].forEach((z) => dock.add(mesh(new THREE.BoxGeometry(2.8, 0.14, 0.18), M(0x7a5b40, 0.9, 0, { map: woodTex }), 0.1, 0.32, z)));
  [-1.0, 0.1, 1.2].forEach((z) => { const t = mesh(new THREE.TorusGeometry(0.2, 0.09, 12, 24), M(0x15181b, 0.9), -1.32, 0.12, z); t.rotation.y = Math.PI / 2; dock.add(t); });
  [-1.7, 1.55].forEach((z) => dock.add(mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.28, 14), M(0x20272c, 0.5, 0.5), -1.12, 0.65, z)));

  // fish: reusable tuna model
  const silver = M(0xaab6c1, 0.28, 0.75), blue = M(0x16315f, 0.3, 0.55), finM = M(0x0e2347, 0.4, 0.4), yellow = M(0xf2c71c, 0.4);
  const makeFish = () => {
    const fish = new THREE.Group();
    const body = mesh(new THREE.SphereGeometry(0.3, 40, 24), blue); body.scale.set(2.1, 0.58, 0.68); fish.add(body);
    const belly = mesh(new THREE.SphereGeometry(0.296, 36, 18, 0, TAU, Math.PI * 0.55, Math.PI * 0.45), silver, 0, -0.012); belly.scale.set(2.08, 0.56, 0.67); fish.add(belly);
    const tail = mesh(new THREE.ConeGeometry(0.2, 0.36, 3), finM, -0.74, 0, 0); tail.rotation.z = Math.PI / 2; tail.scale.set(1, 1, 0.22); fish.add(tail);
    const d1 = mesh(new THREE.ConeGeometry(0.09, 0.26, 3), finM, 0.05, 0.2, 0); d1.scale.set(1, 1, 0.2); fish.add(d1);
    for (let i = 0; i < 6; i++) fish.add(mesh(new THREE.ConeGeometry(0.022, 0.07, 4), yellow, -0.34 - i * 0.07, -0.1, 0, false));
    [0.17, -0.17].forEach((z2) => fish.add(mesh(new THREE.SphereGeometry(0.04, 12, 10), M(0x050505, 0.1, 0.2), 0.62, 0.05, z2, false)));
    return fish;
  };
  // fish crates with ice
  const crate = (x, z, rot, withFish) => {
    const g = new THREE.Group(); g.position.set(x, 0.52, z); g.rotation.y = rot; scene.add(g);
    g.add(mesh(new RoundedBoxGeometry(1.15, 0.42, 0.78, 3, 0.04), M(0x3d93a3, 0.55), 0, 0.2, 0), mesh(new RoundedBoxGeometry(1.02, 0.1, 0.66, 2, 0.03), M(0xeef7fb, 0.25), 0, 0.43, 0));
    if (withFish) { const f = makeFish(); f.position.set(0, 0.62, 0); g.add(f); g.userData.fish = f; }
    return g;
  };
  crate(2.2, 0.55, -0.25, true); const destCrate = crate(2.35, -0.55, 0.15, true); crate(2.0, 1.4, 0.3, true);
  const destFish = destCrate.userData.fish; destFish.visible = false; // the tuna the fisherman brings in

  // phone standing on the dock, screen glowing
  const phone = new THREE.Group(); phone.position.set(3.35, 1.18, -1.1); phone.rotation.set(-0.12, -0.7, 0); scene.add(phone);
  phone.add(mesh(new RoundedBoxGeometry(0.9, 1.62, 0.08, 4, 0.1), M(0x101316, 0.3, 0.6), 0, 0, 0));
  const cv = document.createElement('canvas'); cv.width = 380; cv.height = 680; const cx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const drawScreen = (k) => {
    cx.fillStyle = '#f6f3ec'; cx.fillRect(0, 0, 380, 680); cx.fillStyle = '#0b3a45'; cx.fillRect(0, 0, 380, 118);
    cx.fillStyle = '#fff'; cx.font = '700 40px system-ui,sans-serif'; cx.fillText('Gyosoku', 28, 74); cx.fillStyle = '#ff8a4c'; cx.beginPath(); cx.arc(330, 60, 14, 0, 7); cx.fill();
    cx.fillStyle = '#5a7176'; cx.font = '600 24px system-ui,sans-serif'; cx.fillText('Today', 28, 170);
    cx.fillStyle = '#0b3a45'; cx.font = '800 76px system-ui,sans-serif'; const n = String(Math.round(800 * k)); cx.fillText(n, 28, 262); cx.font = '600 28px system-ui,sans-serif'; cx.fillText('kg', 28 + cx.measureText(n).width + 8, 262);
    [0.4, 0.75, 0.55, 1, 0.6, 0.3, 0.2].forEach((v, i) => { cx.fillStyle = i === 3 ? '#ff8a4c' : '#14786f'; const bh = 170 * v * k; cx.beginPath(); cx.roundRect(28 + i * 46, 470 - bh, 32, bh, 8); cx.fill(); });
    cx.fillStyle = '#ff8a4c'; cx.beginPath(); cx.roundRect(28, 520, 324, 86, 22); cx.fill(); cx.fillStyle = '#fff'; cx.font = '700 30px system-ui,sans-serif'; cx.fillText('Skipjack  800 kg', 70, 574); tex.needsUpdate = true;
  };
  drawScreen(1);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.45), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.85, roughness: 0.2 })); screen.position.z = 0.045; phone.add(screen);

  // fishing boat: lofted hull (sheer, tumblehome, pointed bow) with painted bands via vertex colors
  const boat = new THREE.Group(); boat.position.set(-2.4, 0, 0.6); boat.rotation.y = 0.32; scene.add(boat);
  const L0 = -2.2, L1 = 2.6, NS = 40, NR = 16; const hv = [], hc = [], hi = [];
  const white = new THREE.Color(0xf2efe7), red = new THREE.Color(0xc23b22), dark = new THREE.Color(0x1b2a3a);
  const beam = (t) => 0.86 * Math.pow(Math.max(0, 1 - Math.pow(Math.max(0, (t - 0.5) / 0.5), 2.2)), 0.7) * Math.min(1, 0.45 + t * 2.4);
  for (let i = 0; i <= NS; i++) {
    const t = i / NS, x = L0 + (L1 - L0) * t, w = beam(t), deckY = 0.62 + 0.3 * Math.pow(t, 3) + 0.05 * Math.pow(1 - t, 2), keelY = -0.4 + 0.42 * Math.pow(t, 4);
    for (let j = 0; j <= NR; j++) {
      const th = (j / NR - 0.5) * Math.PI, c = Math.cos(th), s = Math.sin(th), y = keelY + (deckY - keelY) * (1 - c);
      hv.push(x, y, s * w * (0.85 + 0.15 * (1 - c)));
      const col = y < 0.02 ? dark : y < 0.17 ? red : white; hc.push(col.r, col.g, col.b);
    }
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NR; j++) { const a = i * (NR + 1) + j, b = a + 1, c2 = a + NR + 1, d = c2 + 1; hi.push(a, b, c2, b, d, c2); }
  const hullGeo = new THREE.BufferGeometry(); hullGeo.setAttribute('position', new THREE.Float32BufferAttribute(hv, 3)); hullGeo.setAttribute('color', new THREE.Float32BufferAttribute(hc, 3)); hullGeo.setIndex(hi); hullGeo.computeVertexNormals();
  boat.add(mesh(hullGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.05, side: THREE.DoubleSide })));
  const deck = mesh(new THREE.BoxGeometry(4.6, 0.05, 1.0), M(0xa8774a, 0.85, 0, { map: woodTex }), 0.35, 0.8, 0); boat.add(deck);
  boat.add(mesh(new RoundedBoxGeometry(1.5, 0.95, 1.05, 3, 0.05), M(0xf6f2ea, 0.4), -0.35, 1.3, 0), mesh(new RoundedBoxGeometry(1.7, 0.1, 1.2, 2, 0.04), M(0x274b78, 0.45), -0.35, 1.82, 0));
  [0.54, -0.54].forEach((z) => boat.add(mesh(new THREE.BoxGeometry(0.9, 0.3, 0.06), M(0x0a1218, 0.08, 0.6), 0.2, 1.42, z, false)));
  boat.add(mesh(new THREE.BoxGeometry(0.06, 0.3, 0.8), M(0x0a1218, 0.08, 0.6), 0.76, 1.42, 0, false));
  boat.add(mesh(new THREE.CylinderGeometry(0.045, 0.06, 2.6, 10), M(0xc9d0d4, 0.35, 0.7), -0.7, 3.0, 0));
  const boom = mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.0, 8), M(0xc9d0d4, 0.35, 0.7), 0.35, 2.55, 0); boom.rotation.z = 1.0; boat.add(boom);
  boat.add(mesh(new THREE.SphereGeometry(0.1, 14, 10), M(0xff8a4c, 0.4), -0.7, 4.34, 0, false));
  [0.5, -0.5].forEach((z) => { const r = mesh(new THREE.CylinderGeometry(0.018, 0.018, 3.4, 6), M(0xd8dde0, 0.3, 0.8), 0.1, 1.08, z * 0.9, false); r.rotation.z = Math.PI / 2; boat.add(r); });
  boat.add(mesh(new THREE.TorusGeometry(0.2, 0.05, 10, 22), M(0xd9482b, 0.5), 0.2, 1.3, 0.55, false));

  // ---- the fisherman (low-poly person: orange waders, navy cap) who acts out the story as the page scrolls
  const man = new THREE.Group(); scene.add(man);
  const skin = M(0xd9a679, 0.7), orange = M(0xe9801f, 0.6), navy = M(0x1e2f4d, 0.7), bootM = M(0x1b2024, 0.8);
  const body2 = mesh(new THREE.CapsuleGeometry(0.2, 0.42, 6, 14), orange, 0, 1.12, 0); body2.scale.set(1, 1, 0.8); man.add(body2);
  const head = mesh(new THREE.SphereGeometry(0.16, 20, 16), skin, 0, 1.64, 0); man.add(head);
  const cap = mesh(new THREE.SphereGeometry(0.17, 20, 12, 0, TAU, 0, Math.PI * 0.5), navy, 0, 1.69, 0); man.add(cap);
  const brim = mesh(new THREE.BoxGeometry(0.2, 0.025, 0.14), navy, 0, 1.675, 0.16); man.add(brim);
  const mkLimb = (len, r, mat, x, y) => { const piv = new THREE.Group(); piv.position.set(x, y, 0); const m = mesh(new THREE.CapsuleGeometry(r, len, 5, 10), mat, 0, -len / 2 - r * 0.6, 0); piv.add(m); man.add(piv); return piv; };
  const legL = mkLimb(0.5, 0.085, orange, -0.1, 0.78), legR = mkLimb(0.5, 0.085, orange, 0.1, 0.78);
  const armL = mkLimb(0.42, 0.065, orange, -0.27, 1.38), armR = mkLimb(0.42, 0.065, orange, 0.27, 1.38);
  [legL, legR].forEach((l) => l.add(mesh(new THREE.BoxGeometry(0.15, 0.12, 0.25), bootM, 0, -0.62, 0.05)));
  const carry = makeFish(); carry.scale.setScalar(0.62); man.add(carry); carry.position.set(0, 1.0, 0.36); carry.rotation.y = Math.PI / 2; // tuna held in front of him
  man.scale.setScalar(1.05);

  // buoys + gulls
  const buoys = [[-0.4, -3.2, 0xff7a3d], [0.9, 3.6, 0xffc233], [-5.2, 2.8, 0xff7a3d]].map(([x, z, c]) => { const b = new THREE.Group(); b.position.set(x, 0, z); b.add(mesh(new THREE.SphereGeometry(0.17, 18, 14), M(c, 0.4), 0, 0.09, 0), mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 8), M(0x222222, 0.6), 0, 0.34, 0)); scene.add(b); return b; });
  const gullMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f2, roughness: 0.7, side: THREE.DoubleSide });
  const gulls = [0, 1, 2].map((i) => { const g = new THREE.Group(); const wing = (sd) => { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.2), gullMat); w.position.x = sd * 0.35; const p = new THREE.Group(); p.add(w); g.add(p); return p; }; g.userData = { l: wing(-1), r: wing(1), i }; g.add(mesh(new THREE.SphereGeometry(0.09, 10, 8), gullMat, 0, 0, 0, false)); scene.add(g); return g; });

  // ---- scroll story: progress 0..1 (set by the page) drives the boat, the fisherman, the tuna and the phone
  const clamp01 = (x) => Math.max(0, Math.min(1, x)), sm = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
  const seg = (p, a, b) => sm((p - a) / (b - a));
  const BOAT_END = new THREE.Vector3(-2.4, 0, 0.6), BOAT_START = new THREE.Vector3(-17, 0, -10);
  const DECK = new THREE.Vector3(0.9, 0.9, 0), DOCK_IN = new THREE.Vector3(1.25, 0.58, 0.5), CRATE = new THREE.Vector3(1.55, 0.58, -0.35), AT_PHONE = new THREE.Vector3(2.75, 0.58, -0.55);
  let prog = reduced ? 1 : 0, progT = prog, manPrev = new THREE.Vector3(), walk = 0, kShown = -1;
  const lerpV = (a, b, t) => new THREE.Vector3().lerpVectors(a, b, t);
  function applyStory(dt, t) {
    prog += (progT - prog) * Math.min(1, dt * 1.5); // slow, gentle catch-up so each step plays out
    const p = prog;
    // boat sails in
    const sail = seg(p, 0.0, 0.3), pos = lerpV(BOAT_START, BOAT_END, sail);
    boat.position.set(pos.x, Math.sin(t * 1.2) * 0.06, pos.z); boat.rotation.y = 0.32 + (1 - sail) * 0.55;
    // fisherman path
    const deckW = boat.localToWorld(DECK.clone()); const deckFinal = new THREE.Vector3(-2.4 + 0.9 * Math.cos(0.32), 0.9, 0.6 - 0.9 * Math.sin(0.32));
    let mp = deckW.clone(), face = 0.32 + Math.PI / 2;
    const w1 = seg(p, 0.30, 0.46), w2 = seg(p, 0.52, 0.66), w3 = seg(p, 0.66, 0.8);
    if (p >= 0.30 && p < 0.52) mp = lerpV(deckFinal, DOCK_IN, w1); else if (p >= 0.52) mp = lerpV(DOCK_IN, CRATE, w2);
    if (p >= 0.66) mp = lerpV(CRATE, AT_PHONE, w3);
    man.position.copy(mp);
    const d = new THREE.Vector3().subVectors(mp, manPrev); const speed = d.length() / Math.max(dt, 0.001); manPrev.copy(mp);
    if (speed > 0.15) face = Math.atan2(d.x, d.z); else face = p < 0.3 ? 1.9 : p < 0.66 ? 2.6 : 3.7; // idle: look at the crate / phone
    man.rotation.y += (Math.atan2(Math.sin(face - man.rotation.y), Math.cos(face - man.rotation.y))) * Math.min(1, dt * 8);
    const moving = speed > 0.15 && (p > 0.3 && p < 0.8); walk += dt * (moving ? 6 : 0);
    const sw = moving ? Math.sin(walk) * 0.7 : 0; legL.rotation.x = sw; legR.rotation.x = -sw;
    const holding = p > 0.3 && p < 0.55; armL.rotation.x = holding ? -1.15 : -sw * 0.8; armR.rotation.x = holding ? -1.15 : sw * 0.8;
    if (p >= 0.78) { armR.rotation.x = -1.4 + Math.sin(t * 2) * 0.1; } // points at the phone
    man.position.y = mp.y + (moving ? Math.abs(Math.sin(walk)) * 0.04 : 0);
    carry.visible = p > 0.28 && p < 0.55; destFish.visible = p >= 0.55;
    if (p >= 0.28 && p < 0.3) carry.visible = false;
    // phone numbers grow once the fish is landed
    const k = reduced ? 1 : 0.12 + 0.88 * seg(p, 0.62, 0.9); if (Math.abs(k - kShown) > 0.004) { kShown = k; drawScreen(k); }
  }

  // camera orbit
  const target = new THREE.Vector3(0.1, 1.0, 0);
  const HOME = { az: 0.5, el: 0.24 }; const view = { az: HOME.az, el: HOME.el, dist: 15, tAz: HOME.az, tEl: HOME.el };
  const place = () => { camera.position.set(target.x + view.dist * Math.cos(view.el) * Math.sin(view.az), Math.max(0.7, target.y + view.dist * Math.sin(view.el)), target.z + view.dist * Math.cos(view.el) * Math.cos(view.az)); camera.lookAt(target); };
  let dirty = true;
  const resize = () => { const w = host.clientWidth || 400, h = host.clientHeight || 300; renderer.setSize(w, h, false); camera.aspect = w / h; view.dist = w / h < 1.15 ? 18 : 13.5; camera.updateProjectionMatrix(); dirty = true; };
  new ResizeObserver(resize).observe(host);

  let drag = null, lastInput = -1e9;
  canvas.style.touchAction = 'pan-y'; canvas.tabIndex = 0; canvas.setAttribute('role', 'img'); canvas.style.cursor = 'grab';
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, az: view.tAz, el: view.tEl, touch: e.pointerType === 'touch' }; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; lastInput = performance.now(); });
  canvas.addEventListener('pointermove', (e) => { if (!drag) return; view.tAz = Math.min(1.5, Math.max(-1.1, drag.az - (e.clientX - drag.x) * 0.008)); if (!drag.touch) view.tEl = Math.min(0.75, Math.max(0.06, drag.el + (e.clientY - drag.y) * 0.004)); lastInput = performance.now(); dirty = true; });
  const end = () => { drag = null; canvas.style.cursor = 'grab'; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('keydown', (e) => { const k = { ArrowLeft: [-0.2, 0], ArrowRight: [0.2, 0], ArrowUp: [0, -0.05], ArrowDown: [0, 0.05] }[e.key]; if (!k) return; e.preventDefault(); view.tAz = Math.min(1.5, Math.max(-1.1, view.tAz + k[0])); view.tEl = Math.min(0.75, Math.max(0.06, view.tEl + k[1])); lastInput = performance.now(); dirty = true; });

  let running = false, raf = 0; const t0 = performance.now();
  const frame = (now) => {
    raf = 0; if (!running) return; const t = (now - t0) / 1000, dt = Math.min(0.05, Math.max(0.001, (now - (frame.last || now)) / 1000)); frame.last = now;
    applyStory(dt, t);
    if (!reduced) {
      water.material.uniforms.time.value = t * 0.35;
      if (!drag && now - lastInput > 4000) view.tAz = HOME.az + (prog - 0.35) * 0.7 + Math.sin(t * 0.18) * 0.08;
      boat.rotation.z = Math.sin(t * 1.0) * 0.03; boat.rotation.x = Math.cos(t * 0.8) * 0.018;
      buoys.forEach((b, i) => { b.position.y = Math.sin(t * 1.4 + i * 2) * 0.05; b.rotation.z = Math.sin(t * 1.1 + i) * 0.1; });
      phone.position.y = 1.18 + Math.sin(t * 1.0) * 0.012;
      gulls.forEach((g) => { const i = g.userData.i, a = t * (0.16 + i * 0.03) + i * 2.1; g.position.set(Math.cos(a) * (7 + i * 2.5) - 2, 5.2 + i * 0.9 + Math.sin(a * 2) * 0.3, Math.sin(a) * (4.5 + i) - 4); g.rotation.y = -a + Math.PI / 2; const f = Math.sin(t * 6 + i) * 0.45; g.userData.l.rotation.z = f; g.userData.r.rotation.z = -f; });
    }
    view.az += (view.tAz - view.az) * 0.12; view.el += (view.tEl - view.el) * 0.12; place(); renderer.render(scene, camera); dirty = false;
    if (running && (!reduced || Math.abs(view.tAz - view.az) > 0.0005 || Math.abs(view.tEl - view.el) > 0.0005 || dirty)) raf = requestAnimationFrame(frame);
  };
  const start = () => { if (running) return; running = true; raf = requestAnimationFrame(frame); };
  const stop = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; };
  const wake = () => { if (reduced && running && !raf) raf = requestAnimationFrame(frame); };
  ['pointermove', 'keydown'].forEach((ev) => canvas.addEventListener(ev, wake));
  resize(); applyStory(0.016, 0); place(); renderer.render(scene, camera);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); host.dispatchEvent(new CustomEvent('harbor:lost')); });
  return { setProgress(p) { progT = reduced ? 1 : clamp01(p); wake(); }, start, stop, reset() { view.tAz = HOME.az; view.tEl = HOME.el; lastInput = performance.now(); dirty = true; wake(); start(); }, canvas };
}
