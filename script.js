(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = matchMedia('(max-width: 700px)').matches || 'ontouchstart' in window;
  const COLORS = ['#9B87F5', '#F5D6A0', '#FFFFFF', '#6FA8FF', '#FF8FB8', '#7EE0C3', '#C9A0FF'];

  /* ============ 2D FX: confetti + sparkles ============ */
  const fx = $('fx');
  const fctx = fx.getContext('2d');
  let W = 0, H = 0;
  const pieces = [];
  const sparks = [];

  function sizeFx() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    fx.width = W * dpr; fx.height = H * dpr;
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makePiece(x, y, vx, vy, g, drag, max) {
    pieces.push({
      x, y, vx, vy, g, drag, max,
      w: rand(6, 11), h: rand(4, 8),
      rot: rand(0, 6.28), vr: rand(-6, 6),
      flip: rand(0, 6.28), vf: rand(4, 10),
      sway: rand(8, 36), sf: rand(1, 3), sp: rand(0, 6.28),
      c: pick(COLORS), round: Math.random() < 0.2, t: 0
    });
  }

  function rain(n) {
    for (let i = 0; i < n; i++) {
      makePiece(rand(0, W), rand(-H * 0.7, -10), rand(-20, 20), rand(90, 190), 40, 0.2, 250);
    }
  }

  function burst(n) {
    const k = Math.min(Math.max(Math.min(W, H) / 700, 0.6), 1.3);
    const per = Math.floor(n / 3);
    const origins = [
      [W / 2, H * 0.5, -Math.PI * 0.95, -Math.PI * 0.05, 1],
      [0, H, -Math.PI * 0.42, -Math.PI * 0.12, 1.15],
      [W, H, -Math.PI * 0.88, -Math.PI * 0.58, 1.15]
    ];
    origins.forEach(([ox, oy, a0, a1, boost]) => {
      for (let i = 0; i < per; i++) {
        const a = rand(a0, a1), s = rand(350, 950) * k * boost;
        makePiece(ox, oy, Math.cos(a) * s, Math.sin(a) * s, 900, 1.6, 340);
      }
    });
    for (let i = 0; i < n - per * 3; i++) makePiece(rand(0, W), rand(-H * 0.4, -10), rand(-30, 30), rand(120, 220), 60, 0.3, 280);
  }

  function sparkle(n, cx, cy, sx, sy) {
    for (let i = 0; i < n; i++) {
      const life = rand(0.7, 1.5);
      sparks.push({
        x: cx + rand(-sx, sx), y: cy + rand(-sy, sy),
        life, max: life, s: rand(6, 16), rot: rand(0, 3), vr: rand(-1.5, 1.5),
        c: pick(['#F5D6A0', '#FFFFFF', '#C9B8FF', '#F5D6A0'])
      });
    }
  }

  function drawStar(x, y, s, rot) {
    fctx.save();
    fctx.translate(x, y);
    fctx.rotate(rot);
    fctx.beginPath();
    fctx.moveTo(0, -s);
    fctx.quadraticCurveTo(0, 0, s, 0);
    fctx.quadraticCurveTo(0, 0, 0, s);
    fctx.quadraticCurveTo(0, 0, -s, 0);
    fctx.quadraticCurveTo(0, 0, 0, -s);
    fctx.fill();
    fctx.restore();
  }

  let fxWasEmpty = true;
  function stepFx(dt) {
    const empty = !pieces.length && !sparks.length;
    if (empty && fxWasEmpty) return;
    fxWasEmpty = empty;
    fctx.clearRect(0, 0, W, H);

    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      p.t += dt;
      p.vy = Math.min(p.vy + p.g * dt, p.max);
      const d = Math.exp(-p.drag * dt);
      p.vx *= d;
      if (p.g > 100) p.vy *= Math.exp(-p.drag * 0.5 * dt); // burst slows its upward launch
      p.x += (p.vx + Math.sin(p.t * p.sf + p.sp) * p.sway) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.flip += p.vf * dt;
      if (p.y > H + 30 || p.x < -60 || p.x > W + 60) { pieces.splice(i, 1); continue; }
      fctx.save();
      fctx.translate(p.x, p.y);
      fctx.rotate(p.rot);
      fctx.scale(1, Math.cos(p.flip));
      fctx.fillStyle = p.c;
      if (p.round) { fctx.beginPath(); fctx.arc(0, 0, p.h * 0.6, 0, 6.283); fctx.fill(); }
      else fctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      fctx.restore();
    }

    fctx.globalCompositeOperation = 'lighter';
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life -= dt;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      s.rot += s.vr * dt;
      const k = Math.sin(Math.PI * (1 - s.life / s.max));
      fctx.globalAlpha = k * 0.95;
      fctx.fillStyle = s.c;
      drawStar(s.x, s.y, s.s * (0.4 + k * 0.8), s.rot);
    }
    fctx.globalAlpha = 1;
    fctx.globalCompositeOperation = 'source-over';
  }

  /* ============ 3D SCENE ============ */
  function initThree() {
    if (!window.THREE) return null;
    const T = THREE;
    let renderer;
    try {
      renderer = new T.WebGLRenderer({ canvas: $('scene'), antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { return null; }
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(35, 1, 0.1, 200);
    let dist = 14;

    // Helpers
    const glowTex = (stops) => {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const g = c.getContext('2d');
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      stops.forEach(([o, col]) => gr.addColorStop(o, col));
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      return new T.CanvasTexture(c);
    };
    const additive = (map, opacity) => ({ map, transparent: true, opacity, blending: T.AdditiveBlending, depthWrite: false });

    // Studio environment for real reflections on gold + frosting
    try {
      const ec = document.createElement('canvas'); ec.width = 512; ec.height = 256;
      const e = ec.getContext('2d');
      const eg = e.createLinearGradient(0, 0, 0, 256);
      eg.addColorStop(0, '#2a2a5a'); eg.addColorStop(0.5, '#14183a'); eg.addColorStop(1, '#05060f');
      e.fillStyle = eg; e.fillRect(0, 0, 512, 256);
      e.fillStyle = '#fff1d6'; e.fillRect(60, 40, 90, 40); e.fillRect(330, 50, 70, 30);
      e.fillStyle = '#9B87F5'; e.fillRect(220, 70, 50, 70);
      e.fillStyle = '#6FA8FF'; e.fillRect(450, 60, 40, 60);
      const envTex = new T.CanvasTexture(ec);
      const pm = new T.PMREMGenerator(renderer);
      scene.environment = pm.fromEquirectangular(envTex).texture;
      pm.dispose();
    } catch (err) { /* lighting still works without env map */ }

    // Lights
    scene.add(new T.HemisphereLight(0xb7a8ff, 0x141432, 0.55));
    const key = new T.DirectionalLight(0xffe2b0, 1.1);
    key.position.set(4, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(isMobile ? 512 : 1024, isMobile ? 512 : 1024);
    Object.assign(key.shadow.camera, { left: -4, right: 4, top: 5, bottom: -5, near: 1, far: 20 });
    key.shadow.bias = -0.0008;
    scene.add(key);
    const rim = new T.DirectionalLight(0x4c7dff, 0.9); rim.position.set(-5, 3, -4); scene.add(rim);
    const fill = new T.PointLight(0x9b87f5, 0.8, 20); fill.position.set(-3, 1, 3); scene.add(fill);
    const flameLight = new T.PointLight(0xffb060, 1.2, 6); flameLight.position.set(0, 1.9, 0); scene.add(flameLight);

    // Glow behind + beneath the cake
    const halo = new T.Sprite(new T.SpriteMaterial(additive(glowTex([[0, 'rgba(155,135,245,.85)'], [0.45, 'rgba(120,100,230,.28)'], [1, 'rgba(8,11,24,0)']]), 0.6)));
    halo.position.set(0, 0, -1.8); halo.scale.set(9, 9, 1); halo.renderOrder = -2; scene.add(halo);
    const floorGlow = new T.Mesh(new T.PlaneGeometry(8, 8), new T.MeshBasicMaterial(additive(glowTex([[0, 'rgba(245,214,160,.55)'], [0.5, 'rgba(155,135,245,.18)'], [1, 'rgba(0,0,0,0)']]), 0.8)));
    floorGlow.rotation.x = -Math.PI / 2; floorGlow.position.y = -1.64; floorGlow.renderOrder = -1; scene.add(floorGlow);
    const shadowFloor = new T.Mesh(new T.PlaneGeometry(14, 14), new T.ShadowMaterial({ opacity: 0.4 }));
    shadowFloor.rotation.x = -Math.PI / 2; shadowFloor.position.y = -1.63; shadowFloor.receiveShadow = true; scene.add(shadowFloor);

    // Materials
    const gold = new T.MeshStandardMaterial({ color: 0xf5d6a0, metalness: 0.9, roughness: 0.28 });
    const frostMat = new T.MeshPhysicalMaterial({ color: 0xfff8ee, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.2 });
    const body = (c) => new T.MeshPhysicalMaterial({ color: c, roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.35 });

    // Cake (visual center sits at the world origin)
    const cake = new T.Group();
    scene.add(cake);
    const dummy = new T.Object3D();
    const BASE = -1.6;
    const tiers = [
      { r: 1.5, h: 0.9, c: 0x8e78ee },
      { r: 1.1, h: 0.8, c: 0xf0cf98 },
      { r: 0.75, h: 0.7, c: 0xb6a5f8 }
    ];
    let y = BASE;
    tiers.forEach((t, i) => {
      const m = new T.Mesh(new T.CylinderGeometry(t.r, t.r, t.h, 64), body(t.c));
      m.position.y = y + t.h / 2; m.castShadow = m.receiveShadow = true; cake.add(m);

      const cap = new T.Mesh(new T.CylinderGeometry(t.r, t.r, 0.04, 64), frostMat);
      cap.position.y = y + t.h; cap.castShadow = cap.receiveShadow = true; cake.add(cap);
      const lip = new T.Mesh(new T.TorusGeometry(t.r - 0.01, 0.07, 16, 64), frostMat);
      lip.rotation.x = Math.PI / 2; lip.position.y = y + t.h; cake.add(lip);

      const band = new T.Mesh(new T.TorusGeometry(t.r + 0.005, 0.035, 12, 64), gold);
      band.rotation.x = Math.PI / 2; band.position.y = y + 0.06; cake.add(band);

      // Frosting drips (one instanced draw call per tier)
      const n = Math.round(t.r * 14);
      const drips = new T.InstancedMesh(new T.SphereGeometry(1, 12, 12), frostMat, n);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + rand(-0.05, 0.05), len = rand(0.12, 0.36);
        dummy.position.set(Math.cos(a) * (t.r - 0.005), y + t.h - len * 0.5 - 0.02, Math.sin(a) * (t.r - 0.005));
        dummy.scale.set(0.065, len * 0.5, 0.065);
        dummy.updateMatrix(); drips.setMatrixAt(k, dummy.matrix);
      }
      cake.add(drips);
      y += t.h;
    });

    // Gold pearls around the base tier
    const pn = 36;
    const pearls = new T.InstancedMesh(new T.SphereGeometry(0.07, 14, 14), gold, pn);
    for (let k = 0; k < pn; k++) {
      const a = (k / pn) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * 1.62, BASE + 0.07, Math.sin(a) * 1.62);
      dummy.scale.set(1, 1, 1); dummy.updateMatrix(); pearls.setMatrixAt(k, dummy.matrix);
    }
    pearls.castShadow = true; cake.add(pearls);

    // Plate
    const plate = new T.Mesh(new T.CylinderGeometry(1.95, 2.05, 0.1, 80), gold);
    plate.position.y = BASE - 0.05; plate.receiveShadow = true; cake.add(plate);

    // Candles + flames
    const flameTex = glowTex([[0, 'rgba(255,255,240,1)'], [0.25, 'rgba(255,214,130,.9)'], [0.6, 'rgba(255,140,40,.3)'], [1, 'rgba(255,100,0,0)']]);
    const candleColors = [0xf5d6a0, 0xfff8ee, 0x9b87f5];
    const flames = [];
    const topY = y + 0.02;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
      const cx = Math.cos(a) * 0.4, cz = Math.sin(a) * 0.4;
      const candle = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, 0.5, 16),
        new T.MeshStandardMaterial({ color: candleColors[i % 3], roughness: 0.5, metalness: i % 3 === 0 ? 0.5 : 0 }));
      candle.position.set(cx, topY + 0.25, cz); candle.castShadow = true; cake.add(candle);
      const wick = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, 0.07, 6), new T.MeshBasicMaterial({ color: 0x20160c }));
      wick.position.set(cx, topY + 0.535, cz); cake.add(wick);

      const flame = new T.Group();
      flame.position.set(cx, topY + 0.68, cz);
      const core = new T.Mesh(new T.SphereGeometry(0.05, 12, 12), new T.MeshBasicMaterial({ color: 0xffe3a0, transparent: true, opacity: 0.95 }));
      core.scale.set(1, 2.3, 1);
      const glow = new T.Sprite(new T.SpriteMaterial(additive(flameTex, 0.9)));
      glow.scale.set(0.5, 0.5, 1);
      flame.add(core, glow); cake.add(flame);
      flames.push({ flame, core, glow, p: rand(0, 6.28), baseX: cx, baseZ: cz });
    }

    // Floating golden particles
    const gN = isMobile ? 70 : 130;
    const gPos = new Float32Array(gN * 3), gSpd = new Float32Array(gN);
    for (let i = 0; i < gN; i++) {
      gPos.set([rand(-7, 7), rand(-5.5, 5.5), rand(-4, 4)], i * 3);
      gSpd[i] = rand(0.08, 0.3);
    }
    const gGeo = new T.BufferGeometry();
    gGeo.setAttribute('position', new T.BufferAttribute(gPos, 3));
    const gold3d = new T.Points(gGeo, new T.PointsMaterial({
      size: 0.16, sizeAttenuation: true, depthWrite: false, blending: T.AdditiveBlending, transparent: true, opacity: 0.9,
      map: glowTex([[0, 'rgba(255,240,200,1)'], [0.35, 'rgba(245,214,160,.55)'], [1, 'rgba(245,214,160,0)']])
    }));
    scene.add(gold3d);

    // Twinkling star field (two layers twinkle in opposition)
    const bg = new T.Group(); scene.add(bg);
    const starTex = glowTex([[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(190,210,255,.6)'], [1, 'rgba(190,210,255,0)']]);
    const layers = [0, 1].map(() => {
      const n = isMobile ? 90 : 150, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const r = rand(24, 44), th = rand(0, 6.283), ph = Math.acos(rand(-0.6, 1));
        pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.8, -Math.abs(r * Math.sin(ph) * Math.sin(th)) - 6], i * 3);
      }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
      const mat = new T.PointsMaterial({ size: 0.6, map: starTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending });
      bg.add(new T.Points(g, mat));
      return mat;
    });

    // Celebration shockwave ring
    const ring = new T.Mesh(new T.RingGeometry(0.92, 1, 80), new T.MeshBasicMaterial({ color: 0xf5d6a0, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = BASE + 0.02; scene.add(ring);

    // State
    const mouse = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    let tEntry = 0, boostV = 0, ringT = 2, spin = 0;

    // Size the cake to fit the free space between the heading and the footer, centered on screen
    function fit() {
      const w = innerWidth, h = innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.75 : 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const topB = document.querySelector('.top').getBoundingClientRect().bottom;
      const botT = document.querySelector('.bottom').getBoundingClientRect().top;
      let zone = 2 * Math.min(h / 2 - topB, botT - h / 2) * 0.9;
      zone = Math.max(zone, h * 0.22);
      zone = Math.min(zone, w * 0.92 * (3.4 / 3.9));
      const visH = (3.4 * h) / zone;
      dist = visH / (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)));
      camera.updateProjectionMatrix();
    }

    function update(dt, t) {
      tEntry = Math.min(tEntry + dt, 2);
      const e = 1 - Math.pow(1 - tEntry / 2, 3);
      boostV = Math.max(0, boostV - dt * 0.55);
      ringT += dt;

      // Parallax
      cur.x += (mouse.x - cur.x) * Math.min(1, dt * 3);
      cur.y += (mouse.y - cur.y) * Math.min(1, dt * 3);
      camera.position.set(cur.x * dist * 0.07, dist * 0.22 - cur.y * dist * 0.04, dist * 0.975);
      camera.lookAt(0, 0, 0);
      bg.rotation.set(cur.y * 0.03, cur.x * 0.05, 0);
      gold3d.position.x = -cur.x * 0.45;

      // Cake: slow rotation, entrance, celebration pulse
      spin += dt * (reduce ? 0.05 : 0.16 + boostV * boostV * 2.4);
      cake.rotation.y = spin;
      const pulse = 1 + boostV * boostV * 0.05;
      cake.scale.setScalar((0.82 + 0.18 * e) * pulse);
      cake.position.y = (1 - e) * -0.7;

      // Flames
      flames.forEach((f) => {
        const k = 1 + 0.12 * Math.sin(t * 13 + f.p) + 0.08 * Math.sin(t * 23 + f.p * 2);
        f.core.scale.set(1 / Math.sqrt(k), 2.3 * k, 1 / Math.sqrt(k));
        f.flame.position.x = f.baseX + Math.sin(t * 7 + f.p) * 0.006;
        f.glow.material.opacity = 0.75 + 0.15 * Math.sin(t * 11 + f.p) + boostV * 0.2;
      });
      flameLight.intensity = 1.15 + 0.2 * Math.sin(t * 12) + 0.1 * Math.sin(t * 29) + boostV * 1.2;
      key.intensity = 1.1 + boostV * 0.8;
      halo.material.opacity = 0.6 + boostV * 0.4;
      halo.scale.setScalar(9 + boostV * 2);

      // Ring
      ring.material.opacity = Math.max(0, 0.9 * (1 - ringT / 1.5));
      ring.scale.setScalar(1 + ringT * 3.6);

      // Particles + stars
      for (let i = 0; i < gN; i++) {
        let py = gPos[i * 3 + 1] + gSpd[i] * dt;
        if (py > 5.5) py = -5.5;
        gPos[i * 3 + 1] = py;
        gPos[i * 3] += Math.sin(t * 0.6 + i) * 0.1 * dt;
      }
      gGeo.attributes.position.needsUpdate = true;
      layers[0].opacity = 0.55 + 0.35 * Math.sin(t * 1.3);
      layers[1].opacity = 0.55 + 0.35 * Math.sin(t * 1.3 + Math.PI);

      renderer.render(scene, camera);
    }

    return {
      fit, update,
      restart() { tEntry = 0; },
      boost() { boostV = 1; ringT = 0; },
      setMouse(x, y) { mouse.x = x; mouse.y = y; }
    };
  }

  /* ============ Sequence + interaction ============ */
  const three = initThree();
  const intro = $('intro'), main = $('main'), wish = $('wish'), actions = $('actions'), bgGlow = $('bgGlow');
  const stages = [intro, main, wish, actions];
  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const count = (full, mobile, min) => (reduce ? min : isMobile ? mobile : full);

  function play() {
    timers.forEach(clearTimeout); timers = [];
    stages.forEach((el) => el.classList.remove('in', 'out'));
    void document.body.offsetWidth;
    if (three) three.restart();
    rain(count(170, 110, 40));

    later(() => intro.classList.add('in'), 500);
    later(() => { intro.classList.remove('in'); intro.classList.add('out'); }, 3200);
    later(() => { main.classList.add('in'); sparkle(count(14, 9, 3), W / 2, H * 0.14, W * 0.25, 40); }, 3700);
    later(() => wish.classList.add('in'), 5000);
    later(() => actions.classList.add('in'), 5700);
  }

  function celebrate() {
    burst(count(340, 200, 80));
    if (three) three.boost();
    bgGlow.classList.remove('flash'); void bgGlow.offsetWidth; bgGlow.classList.add('flash');
    for (let i = 0; i < (reduce ? 3 : 14); i++) {
      later(() => sparkle(isMobile ? 3 : 5, W / 2, H / 2, W * 0.4, H * 0.32), i * 110);
    }
  }

  $('celebrate').addEventListener('click', celebrate);
  $('replay').addEventListener('click', play);

  // Parallax input
  addEventListener('pointermove', (e) => {
    if (three) three.setMouse((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => three && three.setMouse(0, 0));

  // Resize handling
  let resizeQueued = false;
  function onResize() {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => { resizeQueued = false; sizeFx(); if (three) three.fit(); });
  }
  addEventListener('resize', onResize);
  addEventListener('orientationchange', onResize);
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(onResize);
    ro.observe(document.querySelector('.top'));
    ro.observe(document.querySelector('.bottom'));
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);

  // Main loop
  let last = performance.now(), time = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now; time += dt;
    if (three) three.update(dt, time);
    stepFx(dt);
  }

  sizeFx();
  if (three) three.fit();
  play();
  requestAnimationFrame(loop);
})();
