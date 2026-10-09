import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Blender-authored geometry; all rendering and model requests stay on this origin.
export async function mountHarbor3D(host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  const panel = document.createElement('div');
  panel.className = 'harbor-3d';
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  const label = () => canvas.setAttribute('aria-label', document.documentElement.lang.startsWith('ja') ? '3Dのカツオ。ドラッグまたは左右の矢印キーで回転します。' : '3D skipjack. Drag or use left and right arrow keys to rotate.');
  label();
  new MutationObserver(label).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  panel.append(canvas);
  host.prepend(panel);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#082d3a');
  scene.fog = new THREE.FogExp2('#082d3a', .055);
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 40);
  camera.position.set(0, .6, 7.2);
  camera.lookAt(0, 0, 0);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, .04);
  scene.environment = env.texture;
  room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#c9f3ff', '#092334', 2));
  const key = new THREE.DirectionalLight('#edfaff', 3.4); key.position.set(2, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight('#51cfcc', 3); rim.position.set(-3, 1, -3); scene.add(rim);
  const water = new THREE.Group(); scene.add(water);
  for (let i = 0; i < 5; i++) {
    const ray = new THREE.Mesh(new THREE.PlaneGeometry(.2 + i * .05, 10), new THREE.MeshBasicMaterial({ color: '#82ddde', transparent: true, opacity: .035, depthWrite: false, side: THREE.DoubleSide }));
    ray.position.set((i - 2) * 1.5, 1, -2.5); ray.rotation.z = -.35; water.add(ray);
  }
  const count = 50, points = new Float32Array(count * 3), seeds = [];
  for (let i = 0; i < count; i++) { seeds.push([Math.random() * 10 - 5, Math.random() * 7 - 3.5, Math.random() * 5 - 3]); points.set(seeds[i], i * 3); }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(points, 3));
  scene.add(new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#b2eeee', size: .024, transparent: true, opacity: .55, depthWrite: false })));
  let model;
  try { model = (await new GLTFLoader().loadAsync('/public/models/skipjack.glb')).scene; }
  catch (error) { panel.remove(); renderer.dispose(); env.dispose(); throw error; }
  const fish = new THREE.Group(); fish.add(model); scene.add(fish);
  model.scale.setScalar(.96);
  const tail = model.getObjectByName('TailPivot');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, frame = 0, last = 0, yaw = -.25, drag = null, burstUntil = 0;
  function draw(now = 0) {
    frame = 0;
    if (now - last < 32 && !reduce.matches) { schedule(); return; }
    last = now;
    const t = reduce.matches ? 0 : now / 1000;
    const rect = host.closest('section').getBoundingClientRect();
    const progress = reduce.matches ? .5 : THREE.MathUtils.clamp((innerHeight - rect.top) / (innerHeight + rect.height), 0, 1);
    const burst = reduce.matches ? 0 : Math.max(0, (burstUntil - now) / 1300);
    fish.rotation.set(.04, yaw + (progress - .5) * .7, Math.sin(t * 1.3) * .035);
    fish.position.set((progress - .5) * .5 + Math.sin(t * .7) * .08, Math.sin(t * 1.7) * .07 + Math.sin(burst * Math.PI) * .32, 0);
    if (tail) tail.rotation.y = Math.sin(t * (6 + burst * 7)) * .24;
    for (let i = 0; i < count; i++) points[i * 3 + 1] = ((seeds[i][1] + 3.5 + t * (.07 + i % 4 * .018)) % 7) - 3.5;
    geometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    if (visible && !reduce.matches && !document.hidden) schedule();
  }
  function schedule() { if (!frame && !document.hidden) frame = requestAnimationFrame(draw); }
  const resize = () => { const { width, height } = panel.getBoundingClientRect(); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); schedule(); };
  new ResizeObserver(resize).observe(panel);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) schedule(); else { cancelAnimationFrame(frame); frame = 0; } }).observe(panel);
  canvas.addEventListener('pointerdown', (event) => { drag = { x: event.clientX, yaw }; canvas.setPointerCapture(event.pointerId); });
  canvas.addEventListener('pointermove', (event) => { if (!drag) return; yaw = drag.yaw + (event.clientX - drag.x) * .009; schedule(); });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(type, () => { drag = null; });
  canvas.addEventListener('keydown', (event) => { if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return; event.preventDefault(); yaw += event.key === 'ArrowLeft' ? -.2 : .2; schedule(); });
  host.querySelector('button')?.addEventListener('click', () => { burstUntil = performance.now() + 1300; schedule(); });
  reduce.addEventListener('change', schedule);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else if (visible) schedule(); });
  canvas.addEventListener('webglcontextlost', (event) => { event.preventDefault(); cancelAnimationFrame(frame); frame = 0; visible = false; host.classList.remove('has-3d'); panel.hidden = true; });
  host.classList.add('has-3d'); resize();
}
