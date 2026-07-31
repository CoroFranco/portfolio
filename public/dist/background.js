// Fondo WebGL. Dueño exclusivo del canvas; no conoce el DOM del contenido.
//
// Dos capas en un solo renderer:
//   1. Aurora: quad fullscreen con shader fBm, renderizado a 0.6x en un
//      render target y escalado. Es lo que da el color de fondo.
//   2. Particulas: 3 planos de profundidad con parallax de mouse y scroll.
//
// Degradacion, en orden de precedencia:
//   reduced-motion -> un frame estatico, sin particulas
//   viewport <768px -> solo aurora
//   sin WebGL -> canvas oculto, queda el gradiente CSS de styles.css

const AURORA_SCALE = 0.6;
const PARTICLE_COUNT = 800;
const MOBILE_BREAKPOINT = 768;

const VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAG = `
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float asp = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = vec2((vUv.x - 0.5) * asp, vUv.y - 0.5);
    p += uMouse * 0.06;

    float t = uTime * 0.04;

    // Distorsion que curva las cortinas
    float q = fbm(vec2(p.x * 2.2 + t, p.y * 1.1 - t * 1.6));
    float curtain = fbm(vec2(p.x * 3.4 + q * 1.4, p.y * 0.7 + t * 0.8));

    // Banda difusa desplazada por la distorsion
    float band = smoothstep(0.62, 0.10, abs(p.y - 0.10 + curtain * 0.45));
    float glow = pow(band, 1.6) * (0.55 + 0.45 * curtain);

    vec3 base   = vec3(0.020, 0.020, 0.063);  // #050510
    vec3 cyan   = vec3(0.133, 0.827, 0.933);  // #22d3ee
    vec3 violet = vec3(0.545, 0.361, 0.965);  // #8b5cf6
    vec3 indigo = vec3(0.388, 0.400, 0.945);  // #6366f1

    vec3 col = base;
    col = mix(col, cyan, glow * 0.55);
    col = mix(col, violet, glow * curtain * 0.75);
    col += indigo * pow(glow, 3.0) * 0.35;

    // Vineta
    float vig = smoothstep(1.25, 0.25, length(p));
    col *= 0.55 + 0.45 * vig;

    gl_FragColor = vec4(col, 1.0);
  }
`;

// Textura de glow generada en canvas: evita pedir un PNG por red.
function makeGlowTexture() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0.0, 'rgba(255, 255, 255, 1)');
  g.addColorStop(0.25, 'rgba(190, 230, 255, 0.55)');
  g.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

function makeParticleLayer(count, spread, z, size, texture) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 2] = z + (Math.random() - 0.5) * 0.4;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: size,
    map: texture,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: 0x9fd8ff,
    opacity: 0.75,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
}

function initBackground() {
  const canvas = document.getElementById('background-canvas');
  if (!canvas) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false });
  } catch (err) {
    canvas.style.display = 'none';
    return;
  }

  if (!renderer || !renderer.getContext()) {
    canvas.style.display = 'none';
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  // --- Capa 1: aurora en render target ---
  const auroraScene = new THREE.Scene();
  const quadCamera = new THREE.Camera();

  const auroraMaterial = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uMouse: { value: new THREE.Vector2(0, 0) },
    },
    depthTest: false,
    depthWrite: false,
  });

  auroraScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), auroraMaterial));

  const target = new THREE.WebGLRenderTarget(
    Math.max(1, Math.floor(window.innerWidth * AURORA_SCALE)),
    Math.max(1, Math.floor(window.innerHeight * AURORA_SCALE)),
    { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false }
  );

  // Composita el target escalado a pantalla
  const compositeScene = new THREE.Scene();
  const compositeMaterial = new THREE.MeshBasicMaterial({ map: target.texture, depthTest: false });
  compositeScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), compositeMaterial));

  // --- Capa 2: particulas ---
  const useParticles = !reducedMotion && window.innerWidth >= MOBILE_BREAKPOINT;
  const particleScene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 3;

  const layers = [];
  if (useParticles) {
    const tex = makeGlowTexture();
    layers.push(makeParticleLayer(Math.round(PARTICLE_COUNT * 0.45), 8, -1.5, 0.030, tex));
    layers.push(makeParticleLayer(Math.round(PARTICLE_COUNT * 0.35), 6, 0.0, 0.022, tex));
    layers.push(makeParticleLayer(Math.round(PARTICLE_COUNT * 0.20), 4, 1.2, 0.016, tex));
    layers.forEach(function (layer) { particleScene.add(layer); });
  }

  // --- Entrada: mouse y scroll ---
  const mouse = new THREE.Vector2(0, 0);
  const smoothMouse = new THREE.Vector2(0, 0);
  let scrollProgress = 0;

  if (!reducedMotion) {
    window.addEventListener('pointermove', function (e) {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });

    window.addEventListener('scroll', function () {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress = max > 0 ? window.scrollY / max : 0;
    }, { passive: true });
  }

  // --- Resize con debounce ---
  let resizeTimer = null;
  function handleResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    auroraMaterial.uniforms.uResolution.value.set(w, h);
    target.setSize(
      Math.max(1, Math.floor(w * AURORA_SCALE)),
      Math.max(1, Math.floor(h * AURORA_SCALE))
    );
    // Reasignar canvas.width limpia el drawing buffer. Con reduced-motion no
    // hay bucle que lo repinte, asi que hay que redibujar el frame estatico.
    if (reducedMotion) renderFrame(0);
  }

  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(handleResize, 150);
  });

  // --- Render ---
  function renderFrame(elapsed) {
    auroraMaterial.uniforms.uTime.value = elapsed;

    smoothMouse.x += (mouse.x - smoothMouse.x) * 0.05;
    smoothMouse.y += (mouse.y - smoothMouse.y) * 0.05;
    auroraMaterial.uniforms.uMouse.value.set(smoothMouse.x, smoothMouse.y);

    renderer.setRenderTarget(target);
    renderer.render(auroraScene, quadCamera);
    renderer.setRenderTarget(null);

    renderer.autoClear = true;
    renderer.render(compositeScene, quadCamera);

    if (layers.length) {
      layers.forEach(function (layer, i) {
        const depth = 1 + i * 0.6;
        layer.rotation.y = elapsed * 0.01 * depth;
        layer.position.x = smoothMouse.x * 0.22 * depth;
        layer.position.y = smoothMouse.y * 0.18 * depth - scrollProgress * 1.4 * depth;
      });
      renderer.autoClear = false;
      renderer.render(particleScene, camera);
      renderer.autoClear = true;
    }
  }

  // reduced-motion: un solo frame, sin bucle
  if (reducedMotion) {
    renderFrame(0);
    return;
  }

  const clock = new THREE.Clock();
  let running = true;
  let frameId = null;

  function loop() {
    if (!running) return;
    frameId = requestAnimationFrame(loop);
    renderFrame(clock.getElapsedTime());
  }

  // No quemar bateria con la pestaña en background
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      running = false;
      if (frameId) cancelAnimationFrame(frameId);
      frameId = null;
    } else if (!running) {
      running = true;
      loop();
    }
  });

  loop();
}

document.addEventListener('DOMContentLoaded', initBackground);
