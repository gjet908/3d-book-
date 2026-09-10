/* =========================================================================
   THE LAST CHAPTER — an interactive 3D book
   Three.js scene driven by scroll (GSAP ScrollTrigger) + gentle mouse parallax.
   ========================================================================= */

import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

/* ---------------------------------------------------------------------
   0. Environment / quality tiers
   --------------------------------------------------------------------- */

const isMobile = window.matchMedia('(max-width: 768px)').matches ||
                  (navigator.maxTouchPoints > 2 && window.innerWidth < 1024);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const QUALITY = {
  dustCount: isMobile ? 140 : 420,
  glowCount: isMobile ? 12 : 40,
  shadowMapSize: isMobile ? 768 : 1536,
  pixelRatioCap: isMobile ? 1.6 : 2,
  rays: isMobile ? 1 : 3,
};

/* ---------------------------------------------------------------------
   1. Renderer / scene / camera
   --------------------------------------------------------------------- */

const canvas = document.getElementById('webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, QUALITY.pixelRatioCap));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const BG_COLOR = 0x0a0908;
scene.background = new THREE.Color(BG_COLOR);
scene.fog = new THREE.FogExp2(BG_COLOR, 0.095);

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 60);
camera.position.set(2.2, 2.05, 7.1);

/* ---------------------------------------------------------------------
   2. Lighting — warm key, soft fill, cool rim
   --------------------------------------------------------------------- */

const hemi = new THREE.HemisphereLight(0x4a3b2a, 0x07060a, 0.4);
scene.add(hemi);

const keyLight = new THREE.SpotLight(0xffd9ac, 6.5, 22, Math.PI / 6.2, 0.45, 1.6);
keyLight.position.set(2.6, 5.4, 3.2);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(QUALITY.shadowMapSize, QUALITY.shadowMapSize);
keyLight.shadow.bias = -0.0018;
keyLight.shadow.radius = 5;
keyLight.shadow.camera.near = 2;
keyLight.shadow.camera.far = 14;
scene.add(keyLight);
scene.add(keyLight.target);
keyLight.target.position.set(0, 0.95, 0);

const fillLight = new THREE.PointLight(0xffb27a, 0.5, 10, 2);
fillLight.position.set(-2.1, 0.9, 3.4);
scene.add(fillLight);

const rimLight = new THREE.PointLight(0x6b7dd6, 1.0, 13, 2);
rimLight.position.set(-1.6, 2.6, -3.3);
scene.add(rimLight);

/* ---------------------------------------------------------------------
   3. Ground + soft contact glow (cheap "reflection")
   --------------------------------------------------------------------- */

const GROUND_Y = -0.05;

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(9, 64),
  new THREE.MeshStandardMaterial({ color: 0x0c0a08, roughness: 0.55, metalness: 0.2 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = GROUND_Y;
ground.receiveShadow = true;
scene.add(ground);

function makeRadialGlowTexture(inner, outer) {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const contactGlow = new THREE.Mesh(
  new THREE.CircleGeometry(2.4, 48),
  new THREE.MeshBasicMaterial({
    map: makeRadialGlowTexture('rgba(255,214,160,0.16)', 'rgba(255,214,160,0)'),
    transparent: true,
    depthWrite: false,
  })
);
contactGlow.rotation.x = -Math.PI / 2;
contactGlow.position.y = GROUND_Y + 0.01;
scene.add(contactGlow);

/* ---------------------------------------------------------------------
   4. Dust + glow particles
   --------------------------------------------------------------------- */

function makeDustSprite() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

const dustSprite = makeDustSprite();

function makeParticleField(count, { size, opacity, color, spread, speed }) {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * spread.x;
    positions[i * 3 + 1] = Math.random() * spread.y - 0.3;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread.z;
    velocities[i] = speed * (0.4 + Math.random() * 0.8);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    size, color, map: dustSprite, transparent: true, opacity,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  points.userData.velocities = velocities;
  points.userData.spread = spread;
  return points;
}

const dust = makeParticleField(QUALITY.dustCount, {
  size: 0.022, opacity: 0.45, color: 0xd8c9a3,
  spread: { x: 9, y: 5, z: 6 }, speed: 0.05,
});
dust.position.y = GROUND_Y;
scene.add(dust);

const glowMotes = makeParticleField(QUALITY.glowCount, {
  size: 0.075, opacity: 0.85, color: 0xffd9a0,
  spread: { x: 6, y: 4.5, z: 4 }, speed: 0.03,
});
glowMotes.position.y = GROUND_Y;
scene.add(glowMotes);

/* ---------------------------------------------------------------------
   5. Subtle light rays
   --------------------------------------------------------------------- */

function makeRayTexture() {
  const w = 64, h = 512;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(255,224,180,0.55)');
  g.addColorStop(0.6, 'rgba(255,224,180,0.08)');
  g.addColorStop(1, 'rgba(255,224,180,0)');
  const rg = ctx.createRadialGradient(w / 2, 0, 0, w / 2, 0, w / 2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = rg;
  rg.addColorStop(0, 'rgba(255,255,255,1)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillRect(0, 0, w, h);
  return new THREE.CanvasTexture(c);
}

const rayTexture = makeRayTexture();
const rays = new THREE.Group();
for (let i = 0; i < QUALITY.rays; i++) {
  const ray = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 7),
    new THREE.MeshBasicMaterial({
      map: rayTexture, transparent: true, opacity: 0.06 + i * 0.01,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    })
  );
  ray.position.set(0.6 + i * 0.7, 3.2, 1.0 - i * 0.7);
  ray.rotation.z = -0.32 + i * 0.05;
  ray.rotation.y = 0.4;
  rays.add(ray);
}
scene.add(rays);

/* ---------------------------------------------------------------------
   5b. Make sure the webfonts used inside canvas-baked textures are
   actually loaded before we bake them — otherwise the cover/page art
   would silently fall back to a generic serif and never update.
   --------------------------------------------------------------------- */

await Promise.all([
  document.fonts.load('600 96px "Cormorant Garamond"'),
  document.fonts.load('italic 400 64px "Cormorant Garamond"'),
  document.fonts.load('600 70px "Cormorant Garamond"'),
  document.fonts.load('italic 40px "Cormorant Garamond"'),
  document.fonts.load('300 26px "Inter"'),
]).catch(() => {});

/* ---------------------------------------------------------------------
   6. The book
   --------------------------------------------------------------------- */

const PAGE_W = 1.55;
const PAGE_H = 2.15;
const PAGE_T = 0.016;
const COVER_T = 0.05;
const LEAF_GAP = 0.012; // small spine gap so leaves read as distinct sheets

const COLORS = {
  coverBg: '#15100d',
  coverEdge: 0x0e0b09,
  pageBg: '#f1e6cf',
  pageEdge: 0xe6d8b8,
  endpaper: '#241a16',
  ink: '#241c14',
  brass: '#c9a769',
};

let fontsReady = false;

function paperGrain(ctx, w, h, alpha) {
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.15, w / 2, h / 2, h * 0.78);
  g.addColorStop(0, 'rgba(255,255,255,0.04)');
  g.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = `rgba(0,0,0,${(Math.random() * alpha).toFixed(3)})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function newCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function toTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeCoverFrontTexture() {
  const w = 1024, h = 1424;
  const c = newCanvas(w, h);
  const ctx = c.getContext('2d');
  ctx.fillStyle = COLORS.coverBg;
  ctx.fillRect(0, 0, w, h);
  paperGrain(ctx, w, h, 0.1);

  ctx.strokeStyle = 'rgba(201,167,105,0.55)';
  ctx.lineWidth = 4;
  ctx.strokeRect(46, 46, w - 92, h - 92);
  ctx.strokeStyle = 'rgba(201,167,105,0.22)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(60, 60, w - 120, h - 120);

  ctx.textAlign = 'center';
  const titleY = h * 0.47;

  ctx.font = '600 96px "Cormorant Garamond", serif';
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillText('THE LAST CHAPTER', w / 2 + 3, titleY + 3);
  ctx.fillStyle = '#ecdfc2';
  ctx.fillText('THE LAST CHAPTER', w / 2, titleY);

  ctx.beginPath();
  ctx.moveTo(w / 2 - 110, titleY + 46);
  ctx.lineTo(w / 2 + 110, titleY + 46);
  ctx.strokeStyle = 'rgba(201,167,105,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = 'italic 40px "Cormorant Garamond", serif';
  ctx.fillStyle = 'rgba(236,223,194,0.78)';
  ctx.fillText('A story waiting to be opened.', w / 2, titleY + 90);

  return toTexture(c);
}

function makeEndpaperTexture() {
  const w = 1024, h = 1424;
  const c = newCanvas(w, h);
  const ctx = c.getContext('2d');
  ctx.fillStyle = COLORS.endpaper;
  ctx.fillRect(0, 0, w, h);
  paperGrain(ctx, w, h, 0.08);
  ctx.strokeStyle = 'rgba(201,167,105,0.28)';
  ctx.lineWidth = 1;
  ctx.strokeRect(50, 50, w - 100, h - 100);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(Math.PI / 4);
  ctx.strokeStyle = 'rgba(201,167,105,0.35)';
  ctx.strokeRect(-14, -14, 28, 28);
  ctx.restore();
  return toTexture(c);
}

function makePageTexture(text, { final = false, pageNumber } = {}) {
  const w = 1024, h = 1424;
  const c = newCanvas(w, h);
  const ctx = c.getContext('2d');
  ctx.fillStyle = COLORS.pageBg;
  ctx.fillRect(0, 0, w, h);
  paperGrain(ctx, w, h, 0.045);

  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.ink;

  const fontSize = final ? 70 : 64;
  const style = final ? `600 ${fontSize}px "Cormorant Garamond", serif` : `italic 400 ${fontSize}px "Cormorant Garamond", serif`;
  ctx.font = style;

  const lines = wrapText(ctx, text, w * 0.66);
  const lh = fontSize * 1.25;
  const startY = h / 2 - ((lines.length - 1) * lh) / 2;
  lines.forEach((ln, i) => {
    ctx.fillText(ln, w / 2, startY + i * lh);
  });

  ctx.beginPath();
  ctx.moveTo(w / 2 - 60, startY + lines.length * lh + 6);
  ctx.lineTo(w / 2 + 60, startY + lines.length * lh + 6);
  ctx.strokeStyle = 'rgba(36,28,20,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  if (pageNumber) {
    ctx.font = '300 26px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(36,28,20,0.45)';
    ctx.fillText(String(pageNumber), w / 2, h - 80);
  }

  return toTexture(c);
}

function makePageVersoTexture() {
  const w = 1024, h = 1424;
  const c = newCanvas(w, h);
  const ctx = c.getContext('2d');
  ctx.fillStyle = COLORS.pageBg;
  ctx.fillRect(0, 0, w, h);
  paperGrain(ctx, w, h, 0.045);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.strokeStyle = 'rgba(36,28,20,0.16)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -16); ctx.lineTo(16, 0); ctx.lineTo(0, 16); ctx.lineTo(-16, 0); ctx.closePath();
  ctx.stroke();
  ctx.restore();
  return toTexture(c);
}

// A leaf is a hinge (Group, pivoted at the spine) containing a thin box mesh.
function makeLeaf({ width, height, thickness, frontTex, backTex, edgeColor, castShadow = true }) {
  const geo = new THREE.BoxGeometry(width, height, thickness, 1, 1, 1);
  const frontMat = new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.82, metalness: 0.03 });
  const backMat = new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.82, metalness: 0.03 });
  const edgeMat = new THREE.MeshStandardMaterial({ color: edgeColor, roughness: 0.75, metalness: 0.15 });
  // BoxGeometry material slot order: [+x, -x, +y, -y, +z(front), -z(back)]
  const mesh = new THREE.Mesh(geo, [edgeMat, edgeMat, edgeMat, edgeMat, frontMat, backMat]);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  mesh.position.x = width / 2 + LEAF_GAP;

  const pivot = new THREE.Group();
  pivot.add(mesh);
  return pivot;
}

const book = new THREE.Group();
book.position.set(-PAGE_W / 2, 1.02, 0);
scene.add(book);

const leafDepths = { back: 0, page4: 0.022, page3: 0.044, page2: 0.066, page1: 0.088, front: 0.112 };

// Static base — back cover (never opens)
const backCover = makeLeaf({
  width: PAGE_W + 0.02, height: PAGE_H + 0.02, thickness: COVER_T,
  frontTex: makeEndpaperTexture(), backTex: makeEndpaperTexture(),
  edgeColor: COLORS.coverEdge,
});
backCover.position.z = leafDepths.back;
book.add(backCover);

// Static content page — the final spread (revealed once page3 turns)
const page4 = makeLeaf({
  width: PAGE_W, height: PAGE_H, thickness: PAGE_T,
  frontTex: makePageTexture('THE END IS ONLY THE BEGINNING.', { final: true, pageNumber: 4 }),
  backTex: makePageVersoTexture(),
  edgeColor: COLORS.pageEdge,
});
page4.position.z = leafDepths.page4;
book.add(page4);

// Turning leaves, built bottom-up so each reveals the static leaf beneath it
const page3 = makeLeaf({
  width: PAGE_W, height: PAGE_H, thickness: PAGE_T,
  frontTex: makePageTexture('And some stories refuse to end.', { pageNumber: 3 }),
  backTex: makePageVersoTexture(),
  edgeColor: COLORS.pageEdge,
});
page3.position.z = leafDepths.page3;
book.add(page3);

const page2 = makeLeaf({
  width: PAGE_W, height: PAGE_H, thickness: PAGE_T,
  frontTex: makePageTexture('Some journeys change the person who takes them.', { pageNumber: 2 }),
  backTex: makePageVersoTexture(),
  edgeColor: COLORS.pageEdge,
});
page2.position.z = leafDepths.page2;
book.add(page2);

const page1 = makeLeaf({
  width: PAGE_W, height: PAGE_H, thickness: PAGE_T,
  frontTex: makePageTexture('Every story begins with a single page.', { pageNumber: 1 }),
  backTex: makePageVersoTexture(),
  edgeColor: COLORS.pageEdge,
});
page1.position.z = leafDepths.page1;
book.add(page1);

const frontCover = makeLeaf({
  width: PAGE_W + 0.02, height: PAGE_H + 0.02, thickness: COVER_T,
  frontTex: makeCoverFrontTexture(),
  backTex: makeEndpaperTexture(),
  edgeColor: COLORS.coverEdge,
});
frontCover.position.z = leafDepths.front;
book.add(frontCover);

const TURNING_LEAVES = { frontCover, page1, page2, page3 };

/* ---------------------------------------------------------------------
   7. Scroll choreography
   --------------------------------------------------------------------- */

const OPEN_ANGLE = -2.72; // radians a leaf rotates through when fully turned

const LEAF_RANGES = {
  frontCover: [0.10, 0.27],
  page1:      [0.27, 0.45],
  page2:      [0.45, 0.63],
  page3:      [0.63, 0.82],
};

// lookX shifts the camera's focus point from the closed cover's centre (0)
// toward the spine (-PAGE_W/2) once the book opens, since an open spread's
// visual centre is the spine while a closed cover's centre sits half a
// page-width to the right of it.
const SPINE_X = -PAGE_W / 2;

const CAM_KEYS = [
  { p: 0.00, radius: 7.6, height: 2.15, angle: 0.34, lookY: 1.02, lookX: 0 },
  { p: 0.10, radius: 5.8, height: 1.62, angle: 0.16, lookY: 1.02, lookX: 0 },
  { p: 0.24, radius: 4.55, height: 1.35, angle: -0.06, lookY: 1.05, lookX: SPINE_X },
  { p: 0.45, radius: 4.35, height: 1.30, angle: 0.08, lookY: 1.05, lookX: SPINE_X },
  { p: 0.63, radius: 4.30, height: 1.28, angle: -0.09, lookY: 1.05, lookX: SPINE_X },
  { p: 0.82, radius: 4.25, height: 1.26, angle: 0.05, lookY: 1.05, lookX: SPINE_X },
  { p: 1.00, radius: 5.10, height: 1.55, angle: 0.00, lookY: 1.18, lookX: SPINE_X },
];

function clamp01(v) { return Math.min(1, Math.max(0, v)); }
function smoothstep(t) { t = clamp01(t); return t * t * (3 - 2 * t); }
function mapRange(p, a, b) { return clamp01((p - a) / (b - a)); }
function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

function interpKeyed(p, keys) {
  if (p <= keys[0].p) return keys[0];
  if (p >= keys[keys.length - 1].p) return keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (p >= a.p && p <= b.p) {
      const t = smoothstep((p - a.p) / (b.p - a.p));
      return {
        radius: a.radius + (b.radius - a.radius) * t,
        height: a.height + (b.height - a.height) * t,
        angle: a.angle + (b.angle - a.angle) * t,
        lookY: a.lookY + (b.lookY - a.lookY) * t,
        lookX: a.lookX + (b.lookX - a.lookX) * t,
      };
    }
  }
  return keys[keys.length - 1];
}

// Live state, written by updateScene() (scroll) and read every frame by animate()
const camState = { radius: 7.6, height: 2.15, angle: 0.34, lookY: 1.02, lookX: 0 };
const sceneState = { rimIntensity: 1.0, fogDensity: 0.095, bookRotY: 0.05 };

const scrollHintEl = document.getElementById('scrollHint');
const finaleEl = document.getElementById('finaleUI');

function updateScene(p) {
  const cam = interpKeyed(p, CAM_KEYS);
  camState.radius = cam.radius;
  camState.height = cam.height;
  camState.angle = cam.angle;
  camState.lookY = cam.lookY;
  camState.lookX = cam.lookX;

  sceneState.bookRotY = 0.05 - cam.angle * 0.35;
  sceneState.rimIntensity = 0.75 + smoothstep(mapRange(p, 0.82, 1.0)) * 0.9;
  sceneState.fogDensity = 0.095 - smoothstep(p) * 0.03;

  for (const [name, [start, end]] of Object.entries(LEAF_RANGES)) {
    const t = easeInOutCubic(mapRange(p, start, end));
    const leaf = TURNING_LEAVES[name];
    leaf.rotation.y = OPEN_ANGLE * t;
    leaf.position.y = Math.sin(t * Math.PI) * 0.05; // gentle lift mid-turn
  }

  const hintOpacity = 1 - smoothstep(mapRange(p, 0.0, 0.045));
  scrollHintEl.style.opacity = hintOpacity.toFixed(3);

  const finaleOpacity = smoothstep(mapRange(p, 0.9, 1.0));
  finaleEl.style.opacity = finaleOpacity.toFixed(3);
  finaleEl.style.pointerEvents = finaleOpacity > 0.6 ? 'auto' : 'none';
}

updateScene(0);

ScrollTrigger.create({
  trigger: '.scroll-spacer',
  start: 'top top',
  end: 'bottom bottom',
  scrub: 1.1,
  onUpdate: (self) => updateScene(self.progress),
});

document.getElementById('readMoreBtn').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ---------------------------------------------------------------------
   8. Mouse parallax
   --------------------------------------------------------------------- */

const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
window.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
});

/* ---------------------------------------------------------------------
   9. Resize
   --------------------------------------------------------------------- */

function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', onResize);

/* ---------------------------------------------------------------------
   10. Animation loop
   --------------------------------------------------------------------- */

const clock = new THREE.Clock();
const parallaxStrength = reducedMotion ? 0 : 1;

function updateParticles(points, delta) {
  const pos = points.geometry.attributes.position;
  const vel = points.userData.velocities;
  const halfY = points.userData.spread.y / 2;
  for (let i = 0; i < vel.length; i++) {
    let y = pos.getY(i) + vel[i] * delta;
    if (y > halfY + 0.3) y = -0.3;
    pos.setY(i, y);
  }
  pos.needsUpdate = true;
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const t = clock.getElapsedTime();

  mouse.sx += (mouse.x - mouse.sx) * 0.04;
  mouse.sy += (mouse.y - mouse.sy) * 0.04;

  const bob = reducedMotion ? 0 : Math.sin(t * 0.55) * 0.035;
  book.position.y = 1.02 + bob;
  book.rotation.y = sceneState.bookRotY + mouse.sx * 0.05 * parallaxStrength;
  book.rotation.x = mouse.sy * 0.018 * parallaxStrength;

  const angle = camState.angle + mouse.sx * 0.05 * parallaxStrength;
  const height = camState.height + mouse.sy * 0.07 * parallaxStrength;
  camera.position.set(
    Math.sin(angle) * camState.radius,
    height,
    Math.cos(angle) * camState.radius
  );
  camera.lookAt(camState.lookX, camState.lookY, 0);

  rimLight.intensity = sceneState.rimIntensity;
  scene.fog.density = sceneState.fogDensity;

  rays.rotation.z = t * 0.015;
  rays.children.forEach((r, i) => { r.material.opacity = 0.05 + Math.sin(t * 0.4 + i) * 0.015; });

  dust.rotation.y = t * 0.008;
  dust.position.x = mouse.sx * 0.12 * parallaxStrength;
  updateParticles(dust, delta);

  glowMotes.rotation.y = -t * 0.006;
  updateParticles(glowMotes, delta);

  renderer.render(scene, camera);
}

/* ---------------------------------------------------------------------
   11. Boot
   --------------------------------------------------------------------- */

function hideLoader() {
  document.getElementById('loader').classList.add('hidden');
}

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    fontsReady = true;
    setTimeout(hideLoader, 250);
  });
  setTimeout(hideLoader, 1800); // fallback in case font loading stalls
} else {
  setTimeout(hideLoader, 600);
}

animate();
