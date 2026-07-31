# Portfolio 2026 Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernizar el portafolio estático de Jhoan Alzate: fondo Three.js rehecho con shader de aurora, nueva sección Experience en timeline, skills reorganizados desde el CV, MiduGuard como tercer proyecto y toggle bilingüe ES/EN.

**Architecture:** Sitio estático de un solo HTML servido desde `public/` en Netlify. Tailwind CLI compila `public/styles.css` → `public/dist/output.css`. Los `.js` bajo `public/dist/` son fuentes escritas a mano (no hay bundler) y se separan por responsabilidad: `background.js` (WebGL), `animations.js` (GSAP), `i18n.js` (idioma), `script.js` (navegación). Ningún módulo comparte estado con otro.

**Tech Stack:** HTML5, Tailwind CSS 3.4 (CLI), GSAP 3.12.5 + ScrollTrigger (CDN), Three.js r128 (CDN, build global `THREE`), GLSL, ffmpeg (solo build-time para assets).

**Spec:** `docs/superpowers/specs/2026-07-31-portfolio-2026-redesign-design.md`

## Global Constraints

- **No se introduce framework ni bundler.** HTML + Tailwind + GSAP vanilla. Nada de npm scripts nuevos aparte del `build:css` existente.
- **No se rompe el deploy.** Netlify sirve `public/`. Todos los `.js` y `.css` bajo `public/dist/` se versionan en git.
- **Three.js queda fijado en r128** (`https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`). Es el último build global con `THREE` en `window`; r160+ es solo ESM y rompería el patrón sin módulos.
- **GSAP unificado en 3.12.5.** El HTML actual carga gsap 3.11.4 y ScrollTrigger 3.12.5 — versiones distintas. Ambos pasan a 3.12.5.
- **Paleta exacta:** fondo `#050510`, cyan `#22d3ee`, violeta `#8b5cf6`, índigo `#6366f1`, texto tenue `#e5e7eb`.
- **Presupuesto WebGL:** `setPixelRatio(Math.min(devicePixelRatio, 1.5))`; aurora renderizada a 0.6× en render target; bucle detenido con `visibilitychange`; `resize` con debounce de 150 ms.
- **Degradación obligatoria, en este orden de precedencia:** (1) `prefers-reduced-motion: reduce` → un frame estático, sin partículas; (2) viewport `< 768px` → solo aurora, sin partículas; (3) sin WebGL → canvas oculto y gradiente CSS visible.
- **Ningún contenido puede depender de que una animación corra.** Todo elemento que arranca en `opacity: 0` debe volverse visible por CSS bajo `html.no-anim`.
- **Idioma por defecto inglés.** Clave de `localStorage`: `portfolio-lang`. Valores válidos: `en`, `es`. El HTML lleva el inglés hardcodeado como contenido base.
- **Los textos en español son los del CV, literales.** Los de inglés son su traducción.
- **Iconos monocromos.** Todos los SVG de skills usan `fill="currentColor"`; el color de marca se aplica solo en hover vía la custom property `--glow`.
- **Ningún video supera 2 MB.** El MP4 original no se versiona.
- **No hay framework de test y no se introduce uno.** Cada tarea termina con verificación manual explícita en navegador y `git commit`.

## File Structure

| Archivo | Responsabilidad | Acción |
|---|---|---|
| `public/index.html` | Marcado y atributos `data-i18n` | Modificar |
| `public/styles.css` | Fuente Tailwind + capas custom (glass, glow, timeline, `no-anim`) | Modificar |
| `public/dist/output.css` | Generado por Tailwind CLI | Generado |
| `public/dist/background.js` | Escena WebGL. Expone `initBackground()` | Crear (reemplaza `three.js`) |
| `public/dist/animations.js` | Timelines GSAP + guardas de degradación | Crear (reemplaza `gsap.js`) |
| `public/dist/i18n.js` | Diccionario ES/EN. Expone `setLanguage(lang)` | Crear |
| `public/dist/script.js` | Nav, smooth scroll, typewriter | Modificar |
| `public/dist/three.js` | — | Eliminar |
| `public/dist/gsap.js` | — | Eliminar |
| `public/img/svgs/*.svg` | Iconos monocromos de skills y tags | Crear/reemplazar |
| `public/img/about.webp` | Foto de About Me | Crear |
| `public/img/foto2.png` | — | Eliminar |
| `public/videos/miduguard.webm` | Demo de MiduGuard | Crear |
| `public/cv/Jhoan_Sebastian_Alzate_CV.pdf` | CV descargable | Crear |
| `tailwind.config.js` | Tokens de color y keyframes | Modificar |
| `.gitignore` | Ignorar `*.mp4` | Modificar |

---

## Task 1: Fundación — tokens, capas CSS y separación de scripts

Prepara el terreno sin cambiar contenido: tokens de Tailwind, capas CSS reutilizables, renombrado de scripts por responsabilidad y las guardas de degradación. Al terminar, el sitio se ve igual que antes pero con la infraestructura nueva.

**Files:**
- Modify: `tailwind.config.js`
- Modify: `public/styles.css`
- Modify: `public/index.html:14-18` (tags de `<head>`), `public/index.html:379-381` (tags de scripts)
- Create: `public/dist/animations.js` (contenido migrado de `public/dist/gsap.js`)
- Create: `public/dist/background.js` (contenido migrado de `public/dist/three.js`)
- Delete: `public/dist/gsap.js`, `public/dist/three.js`

**Interfaces:**
- Consumes: nada (primera tarea).
- Produces:
  - CSS: clases `.glass`, `.reveal`, `.skill-chip`, `.gradient-border`, y `html.no-anim` como interruptor global de degradación.
  - Tailwind: colores `ink`, `ink-soft`, `ink-card`, `accent-cyan`, `accent-violet`, `accent-indigo`; animaciones `pulse-ring`, `border-spin`.
  - `animations.js`: función `initReveals()` que anima todo `.reveal`; constante exportada al scope global `PREFERS_REDUCED` (boolean).
  - `background.js`: `window.initBackground()`.

- [ ] **Step 1: Añadir tokens y keyframes a Tailwind**

Reemplazar `tailwind.config.js` completo:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/**/*.html', './public/dist/*.js'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#050510',
          soft: '#0a0a18',
          card: '#0e0e1f',
        },
        accent: {
          cyan: '#22d3ee',
          violet: '#8b5cf6',
          indigo: '#6366f1',
        },
      },
      keyframes: {
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(34, 211, 238, 0.55)' },
          '70%': { boxShadow: '0 0 0 12px rgba(34, 211, 238, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(34, 211, 238, 0)' },
        },
        'border-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'border-spin': 'border-spin 4s linear infinite',
      },
    },
  },
  plugins: [],
}
```

`content` incluye `./public/dist/*.js` porque `animations.js` alterna clases de utilidad (`scale-[1.03]`) que Tailwind no vería de otro modo.

- [ ] **Step 2: Escribir las capas CSS custom**

Reemplazar `public/styles.css` completo:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Color de marca del chip; cada chip lo sobreescribe inline */
    --glow: #22d3ee;
  }

  body {
    background-color: #050510;
    /* Respaldo visible si WebGL no está disponible */
    background-image:
      radial-gradient(60% 50% at 20% 0%, rgba(34, 211, 238, 0.10), transparent 70%),
      radial-gradient(50% 50% at 85% 15%, rgba(139, 92, 246, 0.12), transparent 70%),
      radial-gradient(70% 60% at 50% 100%, rgba(99, 102, 241, 0.08), transparent 70%);
    background-attachment: fixed;
  }

  :focus-visible {
    outline: 2px solid #22d3ee;
    outline-offset: 3px;
    border-radius: 4px;
  }

  #background-canvas {
    position: fixed;
    inset: 0;
    z-index: -10;
    display: block;
  }
}

@layer components {
  .glass {
    @apply bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl;
  }

  /* Estado inicial de todo lo que revela GSAP al hacer scroll */
  .reveal {
    opacity: 0;
    transform: translateY(28px);
  }

  .skill-chip {
    @apply glass flex flex-col items-center justify-center gap-2 px-3 py-4 transition-all duration-300;
    color: rgba(229, 231, 235, 0.7);
  }

  .skill-chip:hover {
    color: var(--glow);
    border-color: color-mix(in srgb, var(--glow) 45%, transparent);
    box-shadow: 0 0 24px -6px var(--glow);
    transform: translateY(-2px);
  }

  .skill-chip svg {
    @apply h-7 w-7;
    fill: currentColor;
  }

  /* Borde de gradiente animado, activado en hover del contenedor */
  .gradient-border {
    position: relative;
    isolation: isolate;
  }

  .gradient-border::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: inherit;
    padding: 2px;
    background: conic-gradient(
      from var(--angle, 0deg),
      #22d3ee,
      #8b5cf6,
      #6366f1,
      #22d3ee
    );
    opacity: 0;
    transition: opacity 0.35s ease;
    z-index: -1;
  }

  .gradient-border:hover::before {
    opacity: 1;
    animation: border-spin 4s linear infinite;
  }
}

@layer utilities {
  /* Interruptor global de degradación: sin GSAP o con reduced-motion,
     todo lo que dependía de una animación queda en su estado final. */
  html.no-anim .reveal,
  html.no-anim .videos,
  html.no-anim .linkedin,
  html.no-anim .project-info,
  html.no-anim .skills,
  html.no-anim .aboutme,
  html.no-anim #profesion,
  html.no-anim #mainImage {
    opacity: 1 !important;
    transform: none !important;
  }

  html.no-anim .gradient-border:hover::before {
    animation: none;
  }

  html.no-anim .timeline-progress {
    height: 100% !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .reveal {
    opacity: 1;
    transform: none;
  }
}
```

`--glow` se declara en `:root` como fallback; cada chip lo sobreescribe con `style="--glow: #61DAFB"` en la Task 8.

- [ ] **Step 3: Migrar `gsap.js` → `animations.js` con las guardas de degradación**

Crear `public/dist/animations.js`. Se copia la lógica existente de `dist/gsap.js` y se envuelve en las guardas, añadiendo `initReveals()` para uso de tareas posteriores:

```js
// Timelines GSAP. Único dueño de las animaciones de scroll.
// Si GSAP no está disponible o el usuario pidió menos movimiento,
// marca <html class="no-anim"> y sale: el CSS deja todo en su estado final.

const PREFERS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const GSAP_READY = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

if (!GSAP_READY || PREFERS_REDUCED) {
  document.documentElement.classList.add('no-anim');
} else {
  gsap.registerPlugin(ScrollTrigger);
  initReveals();
  initHero();
  initProjectVideos();
}

// Revela cualquier elemento .reveal al entrar en viewport.
// Los hijos con .reveal-child entran en stagger.
function initReveals() {
  document.querySelectorAll('.reveal').forEach((el) => {
    gsap.to(el, {
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      duration: 0.7,
      opacity: 1,
      y: 0,
      ease: 'power2.out',
    });
  });

  document.querySelectorAll('[data-stagger]').forEach((group) => {
    const children = group.querySelectorAll('.reveal-child');
    if (!children.length) return;
    gsap.fromTo(
      children,
      { opacity: 0, y: 24 },
      {
        scrollTrigger: { trigger: group, start: 'top 85%', once: true },
        duration: 0.6,
        opacity: 1,
        y: 0,
        stagger: 0.08,
        ease: 'power2.out',
      }
    );
  });
}

function initHero() {
  gsap.fromTo('#mainImage', { opacity: 0, scale: 0.94 }, { duration: 0.8, opacity: 1, scale: 1, ease: 'power2.out' });
  gsap.fromTo('#profesion', { y: 24, opacity: 0 }, { duration: 1.2, y: 0, opacity: 0.6, delay: 0.2 });
  gsap.to('.linkedin', { duration: 1.4, opacity: 1, delay: 0.5 });
}

function initProjectVideos() {
  document.querySelectorAll('.videos').forEach((video) => {
    gsap.to(video, {
      scrollTrigger: { trigger: video, start: 'top 92%', once: true },
      duration: 0.5,
      opacity: 1,
    });

    video.addEventListener('mouseenter', () => {
      // play() devuelve una promesa que rechaza en algunos navegadores
      video.play().catch(() => {});
      video.classList.remove('scale-[1.03]');
    });

    video.addEventListener('mouseleave', () => {
      video.classList.add('scale-[1.03]');
      video.pause();
      video.currentTime = 0;
    });
  });
}
```

Nota: se elimina el patrón `toggleActions: 'restart reset restart reset'` del archivo viejo. Volvía a esconder el contenido al salir del viewport, lo que hacía que las secciones parpadearan al hacer scroll rápido. Ahora todo usa `once: true`.

- [ ] **Step 4: Migrar `three.js` → `background.js` sin cambios de lógica**

Copiar `public/dist/three.js` tal cual a `public/dist/background.js`, cambiando solo el selector del contenedor por el canvas nuevo:

```js
// Placeholder migrado. La Task 4 reescribe este archivo por completo.
function initBackground() {
  const canvas = document.getElementById('background-canvas');
  if (!canvas) return;
  // ... contenido existente de dist/three.js, con renderer sobre `canvas`
}

document.addEventListener('DOMContentLoaded', initBackground);
```

Migrar literalmente el cuerpo de `dist/three.js` (escena, 1500 partículas, `animate`, `handleResize`), reemplazando `container.appendChild(renderer.domElement)` por `new THREE.WebGLRenderer({ canvas, alpha: true })`.

- [ ] **Step 5: Actualizar `index.html`: canvas, CDNs y tags de script**

En `public/index.html`, reemplazar los tres `<script>` de CDN del `<head>` (líneas 16-18) por versiones unificadas:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
```

Reemplazar el `div` de fondo (línea 22):

```html
<canvas id="background-canvas" aria-hidden="true"></canvas>
```

Reemplazar los tags de script del final del `<body>` (líneas 379-381):

```html
<script src="dist/background.js"></script>
<script src="dist/animations.js"></script>
<script src="dist/script.js"></script>
```

- [ ] **Step 6: Borrar los archivos viejos**

```bash
git rm public/dist/gsap.js public/dist/three.js
```

- [ ] **Step 7: Compilar y verificar**

```bash
npx tailwindcss -i ./public/styles.css -o ./public/dist/output.css
```

Expected: compila sin errores.

Servir y abrir en Chrome:

```bash
npx --yes serve public -l 5501
```

Verificar:
1. Consola sin errores.
2. El sitio se ve igual que antes (mismas secciones, mismas animaciones al hacer scroll).
3. En DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`, recargar: todo el contenido es visible, nada queda en `opacity: 0`.
4. Bloquear `cdnjs.cloudflare.com` en DevTools → Network → Block request domain, recargar: `<html>` tiene la clase `no-anim` y todo el contenido es visible.

- [ ] **Step 8: Commit**

```bash
git add tailwind.config.js public/styles.css public/index.html public/dist/
git commit -m "refactor: separar scripts por responsabilidad y añadir tokens de diseño

- dist/gsap.js -> dist/animations.js, dist/three.js -> dist/background.js
- unificar GSAP en 3.12.5 (antes 3.11.4 + ScrollTrigger 3.12.5)
- tokens ink/accent y keyframes pulse-ring/border-spin en Tailwind
- capas .glass, .reveal, .skill-chip, .gradient-border
- guarda html.no-anim: el contenido nunca depende de que corra una animacion
- reemplazar toggleActions restart/reset por once (causaba parpadeo)"
```

---

## Task 2: Assets — video, foto y CV

Convierte los tres assets que dio el usuario a formatos web y los coloca en su ruta final.

**Files:**
- Create: `public/videos/miduguard.webm`, `public/img/about.webp`, `public/cv/Jhoan_Sebastian_Alzate_CV.pdf`
- Modify: `.gitignore`
- Delete: `public/img/foto2.png`
- Source (no versionados): `20260731-1544-10.8812199.mp4`, `Jhoan Sebastian Alzate Franco (1).jpg`, `Jhoan_Sebastian_Alzate_CV (1).pdf`

**Interfaces:**
- Consumes: nada.
- Produces: rutas `videos/miduguard.webm` (Task 9), `img/about.webp` (Task 10), `cv/Jhoan_Sebastian_Alzate_CV.pdf` (Task 6).

- [ ] **Step 1: Instalar ffmpeg**

```powershell
winget install --id Gyan.FFmpeg --accept-source-agreements --accept-package-agreements
```

Abrir una shell nueva (winget actualiza el PATH) y verificar:

```bash
ffmpeg -version
```

Expected: imprime la versión. Si el PATH no se refrescó, usar la ruta absoluta que reporte `winget list Gyan.FFmpeg`.

- [ ] **Step 2: Inspeccionar el video de origen**

```bash
ffprobe -v error -show_entries format=duration,size -show_entries stream=width,height,codec_name -of default=noprint_wrappers=1 "20260731-1544-10.8812199.mp4"
```

Anotar duración y resolución. Guían el recorte del paso siguiente.

- [ ] **Step 3: Convertir a WebM VP9**

Si la duración es ≤ 15 s, convertir completo:

```bash
mkdir -p public/videos
ffmpeg -y -i "20260731-1544-10.8812199.mp4" \
  -c:v libvpx-vp9 -crf 36 -b:v 0 -an \
  -vf "scale=1000:-2,fps=24" \
  -row-mt 1 -deadline good -cpu-used 2 \
  public/videos/miduguard.webm
```

Si excede 15 s, añadir `-ss <inicio> -t 15` antes de `-i` para quedarse con el segmento donde se ve el terminal SQL en uso (es la mecánica que vende el proyecto).

- [ ] **Step 4: Verificar el peso del video**

```bash
ls -l public/videos/
```

Expected: `miduguard.webm` entre 1 MB y 2 MB, en línea con `aqui.webm` (1.4 MB) y `este.webm` (1.0 MB). Si supera 2 MB, subir `-crf` a 40 y reconvertir. Si baja de 600 KB y se ve con artefactos, bajar `-crf` a 32.

- [ ] **Step 5: Convertir la foto a WebP**

La foto es 1080×1080 sobre fondo gris claro uniforme. Se recorta circular por CSS, así que solo hace falta reescalar y comprimir:

```bash
ffmpeg -y -i "Jhoan Sebastian Alzate Franco (1).jpg" \
  -vf "scale=560:560" -c:v libwebp -quality 82 \
  public/img/about.webp
```

Expected: archivo de 30–70 KB.

- [ ] **Step 6: Colocar el CV**

```bash
mkdir -p public/cv
cp "Jhoan_Sebastian_Alzate_CV (1).pdf" public/cv/Jhoan_Sebastian_Alzate_CV.pdf
```

- [ ] **Step 7: Ignorar los fuentes pesados**

Reemplazar `.gitignore` (hoy contiene solo `node_modules/` sin newline final):

```gitignore
node_modules/

# Fuentes de assets, no se versionan; solo entran las versiones web convertidas
*.mp4
/Jhoan Sebastian Alzate Franco*.jpg
/Jhoan_Sebastian_Alzate_CV*.pdf
```

El CV sí se versiona, pero en su ruta final `public/cv/`, no en la raíz.

- [ ] **Step 8: Borrar la foto vieja**

```bash
git rm public/img/foto2.png
```

`index.html:346` la referencia; la Task 10 actualiza ese `src`. Hasta entonces la imagen de About queda rota, que es un estado intermedio esperado.

- [ ] **Step 9: Verificar que el video reproduce**

Abrir `public/videos/miduguard.webm` en Chrome. Expected: reproduce, sin audio, contenido legible.

```bash
git status --short
```

Expected: los tres archivos de origen en la raíz **no** aparecen como untracked.

- [ ] **Step 10: Commit**

```bash
git add .gitignore public/videos/miduguard.webm public/img/about.webp public/cv/
git commit -m "assets: agregar demo de MiduGuard, foto nueva y CV descargable

- MP4 de 27.8 MB convertido a WebM VP9 (<2 MB), sin audio, 1000px
- foto nueva a WebP 560x560
- CV a public/cv/ para descarga desde el hero
- ignorar los fuentes pesados (*.mp4, jpg y pdf de la raiz)"
```

---

## Task 3: Set de iconos monocromos

Descarga los SVG de Simple Icons y los normaliza a `currentColor`. Reemplaza también los iconos de colores existentes: mezclar SVGs de marca a color con monocromos se ve incoherente, y el look "dark tech" pide iconos uniformes que se tiñen en hover.

**Files:**
- Create/Replace: `public/img/svgs/*.svg` (~33 archivos)
- Create: `scripts/fetch-icons.sh`

**Interfaces:**
- Consumes: nada.
- Produces: archivos `img/svgs/<nombre>.svg`, todos con `fill="currentColor"` y sin atributos de color. Los consumen la Task 8 (skills) y la Task 9 (tags de proyecto). Nombres exactos en la tabla del Step 1.

- [ ] **Step 1: Escribir el script de descarga**

Crear `scripts/fetch-icons.sh`. La primera columna es el nombre del archivo local; la segunda, el slug de Simple Icons:

```bash
#!/usr/bin/env bash
# Descarga iconos de Simple Icons y los normaliza a currentColor.
# Uso: bash scripts/fetch-icons.sh
set -u

OUT="public/img/svgs"
VER="13"
mkdir -p "$OUT"

# local_name simpleicons_slug
ICONS="
react react
next nextdotjs
astro astro
angular angular
vue vuedotjs
ts typescript
js javascript
tailwindcss tailwindcss
sass sass
gsap greensock
threejs threedotjs
node nodedotjs
nestjs nestjs
spring springboot
laravel laravel
express express
php php
postgres postgresql
oracle oracle
mysql mysql
mongo mongodb
docker docker
kubernetes kubernetes
git git
github github
gitlab gitlab
bitbucket bitbucket
figma figma
mcp modelcontextprotocol
turso turso
clerk clerk
html html5
css css3
"

FAILED=""

echo "$ICONS" | while read -r name slug; do
  [ -z "$name" ] && continue
  url="https://cdn.jsdelivr.net/npm/simple-icons@${VER}/icons/${slug}.svg"
  if curl -fsSL "$url" -o "$OUT/${name}.svg"; then
    # Simple Icons entrega paths sin fill; forzar currentColor explicito
    # y quitar cualquier fill de color fijo.
    sed -i 's/<svg /<svg fill="currentColor" /; s/fill="#[0-9A-Fa-f]\{3,6\}"//g' "$OUT/${name}.svg"
    echo "ok    ${name} <- ${slug}"
  else
    echo "FALLO ${name} <- ${slug}"
    FAILED="${FAILED} ${name}"
  fi
done

echo "---"
echo "Revisar manualmente los marcados FALLO; requieren glifo propio."
```

- [ ] **Step 2: Ejecutar el script**

```bash
bash scripts/fetch-icons.sh
```

Anotar qué slugs fallaron. `turso`, `clerk` y `modelcontextprotocol` son los candidatos probables a no existir en la versión 13 de Simple Icons.

- [ ] **Step 3: Escribir a mano los glifos que falten**

Para cada slug fallido y para los dos que Simple Icons no cubre por definición, crear el SVG a mano. Todos con `viewBox="0 0 24 24"` y `fill="currentColor"` para que encajen con el resto.

`public/img/svgs/opencode.svg` — terminal con cursor:

```svg
<svg fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>OpenCode</title><path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h17A1.5 1.5 0 0 1 22 3.5v17a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 20.5v-17Zm2 .5v16h16V4H4Zm2.4 3.6 1.2-1.2 3.3 3.3-3.3 3.3-1.2-1.2 2.1-2.1-2.1-2.1Zm5.6 5.4h5.4v1.7H10v-1.7Z"/></svg>
```

`public/img/svgs/prompt.svg` — destello / sparkle:

```svg
<svg fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Prompt &amp; Skill Design</title><path d="M11 2 12.9 8.1 19 10l-6.1 1.9L11 18l-1.9-6.1L3 10l6.1-1.9L11 2Zm7.5 10.5.95 3.05L22.5 16.5l-3.05.95L18.5 20.5l-.95-3.05L14.5 16.5l3.05-.95.95-3.05Z"/></svg>
```

Si `turso` falló, `public/img/svgs/turso.svg` — base de datos en el borde:

```svg
<svg fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Turso</title><path d="M12 2c3.9 0 7 1.2 7 2.7v14.6C19 20.8 15.9 22 12 22s-7-1.2-7-2.7V4.7C5 3.2 8.1 2 12 2Zm0 1.7c-3.1 0-5.3.8-5.3 1s2.2 1 5.3 1 5.3-.8 5.3-1-2.2-1-5.3-1Zm5.3 3.1c-1.4.6-3.3.9-5.3.9s-3.9-.3-5.3-.9v3.4c1.4.6 3.3.9 5.3.9s3.9-.3 5.3-.9V6.8Zm0 5.5c-1.4.6-3.3.9-5.3.9s-3.9-.3-5.3-.9v3.4c1.4.6 3.3.9 5.3.9s3.9-.3 5.3-.9v-3.4Z"/></svg>
```

Si `clerk` falló, `public/img/svgs/clerk.svg` — candado:

```svg
<svg fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Clerk</title><path d="M12 2a5 5 0 0 1 5 5v2h1.2A1.8 1.8 0 0 1 20 10.8v9.4A1.8 1.8 0 0 1 18.2 22H5.8A1.8 1.8 0 0 1 4 20.2v-9.4A1.8 1.8 0 0 1 5.8 9H7V7a5 5 0 0 1 5-5Zm0 1.8A3.2 3.2 0 0 0 8.8 7v2h6.4V7A3.2 3.2 0 0 0 12 3.8Zm0 9.4a1.9 1.9 0 0 0-1 3.5v1.6a1 1 0 0 0 2 0v-1.6a1.9 1.9 0 0 0-1-3.5Z"/></svg>
```

Si `modelcontextprotocol` falló, `public/img/svgs/mcp.svg` — nodos conectados:

```svg
<svg fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Model Context Protocol</title><path d="M12 2a3 3 0 0 1 1 5.83v1.4l3.6 2.08a3 3 0 1 1-1 1.73L12 10.96l-3.6 2.08a3 3 0 1 1-1-1.73L11 9.23v-1.4A3 3 0 0 1 12 2Zm0 1.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2ZM5.9 13.2a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Zm12.2 0a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Z"/></svg>
```

- [ ] **Step 4: Verificar que todos los iconos son monocromos**

```bash
grep -l 'fill="#' public/img/svgs/*.svg
```

Expected: sin resultados. Si alguno aparece, quitarle el `fill` de color a mano.

```bash
ls public/img/svgs/*.svg | wc -l
```

Expected: al menos 33.

- [ ] **Step 5: Verificar el render en una página de prueba**

Crear un archivo temporal `public/_icons.html`:

```html
<!DOCTYPE html>
<html><body style="background:#050510;color:#e5e7eb;display:flex;flex-wrap:wrap;gap:1rem;padding:2rem">
<script>
  const names = "react next astro angular vue ts js tailwindcss sass gsap threejs node nestjs spring laravel express php postgres oracle mysql mongo docker kubernetes git github gitlab bitbucket figma mcp turso clerk html css opencode prompt".split(" ");
  document.write(names.map(n => `<figure style="width:90px;text-align:center"><img src="img/svgs/${n}.svg" width="32" height="32" onerror="this.parentElement.style.outline='2px solid red'"><figcaption style="font:12px system-ui">${n}</figcaption></figure>`).join(""));
</script>
</body></html>
```

Abrir `http://localhost:5501/_icons.html`. Expected: los 35 iconos visibles, ninguno con borde rojo. Los SVGs se ven negros sobre negro porque `currentColor` no hereda a través de `<img>` — eso es esperado: en la Task 8 se inyectan inline. Verificar aquí solo que **existen** y tienen forma (usar el inspector o cambiar el `background` del body a blanco temporalmente).

Borrar el archivo de prueba:

```bash
rm public/_icons.html
```

- [ ] **Step 6: Commit**

```bash
git add scripts/fetch-icons.sh public/img/svgs/
git commit -m "assets: set de iconos monocromos para skills y tags

- ~33 iconos de Simple Icons normalizados a currentColor
- glifos propios para OpenCode y prompt/skill design
- reemplaza los SVG de marca a color: el hover tiñe con --glow
- script reproducible en scripts/fetch-icons.sh"
```

---

## Task 4: Fondo Three.js — shader de aurora y partículas con parallax

Reescribe `background.js` por completo. Es el cambio de mayor impacto visual.

**Files:**
- Replace: `public/dist/background.js`

**Interfaces:**
- Consumes: `#background-canvas` del DOM (Task 1); global `THREE` r128.
- Produces: `window.initBackground()`. No expone nada más; no lee ni escribe DOM de contenido.

- [ ] **Step 1: Escribir la escena completa**

Reemplazar `public/dist/background.js`:

```js
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
    } else if (!running) {
      running = true;
      loop();
    }
  });

  loop();
}

document.addEventListener('DOMContentLoaded', initBackground);
```

- [ ] **Step 2: Verificar el render**

Recargar `http://localhost:5501`. Expected:
1. Cortinas de aurora cyan/violeta fluyendo lento sobre fondo casi negro, a pantalla completa.
2. Puntos de luz visibles, que se desplazan al mover el mouse con inercia.
3. Consola sin errores ni warnings de compilación de shader. Un error de GLSL aparece como `THREE.WebGLProgram: shader error`.

- [ ] **Step 3: Verificar que no se rompe el contenido**

El canvas es `-z-10` y `aria-hidden`. Expected: se puede seleccionar texto, los enlaces del nav responden al click, y el canvas no captura eventos.

- [ ] **Step 4: Verificar la degradación**

| Condición | Cómo probarla | Expected |
|---|---|---|
| reduced-motion | DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`, recargar | Aurora estática visible, sin partículas, sin animación |
| Móvil | DevTools → device toolbar → iPhone SE (375px), recargar | Aurora visible, cero partículas |
| Sin WebGL | En consola: `HTMLCanvasElement.prototype.getContext = () => null`, recargar con esa línea en un breakpoint, o usar `chrome://flags` para desactivar WebGL | Canvas oculto, gradiente CSS visible, sin excepciones en consola |
| Tab en background | Abrir otra pestaña 5 s, en Performance monitor verificar que el uso de CPU cae | El bucle se detiene y se reanuda al volver |

- [ ] **Step 5: Medir el costo**

DevTools → Performance → grabar 5 s con la página quieta. Expected: FPS estable en 60 en desktop; el frame del fondo no supera ~4 ms.

- [ ] **Step 6: Commit**

```bash
git add public/dist/background.js
git commit -m "feat: fondo WebGL con shader de aurora y particulas con parallax

Reemplaza el fondo roto anterior: el contenedor medía 50px de ancho y las
particulas tenian size 0.0005, asi que la escena era invisible.

- aurora fBm en GLSL a 0.6x en render target, escalada a pantalla
- 800 particulas en 3 planos con parallax de mouse (lerp) y scroll
- pixelRatio capado a 1.5, resize con debounce, bucle detenido en background
- degradacion: reduced-motion, <768px sin particulas, sin WebGL sin canvas"
```

---

## Task 5: Motor de i18n y toggle ES/EN

Infraestructura de idioma. El diccionario arranca con el contenido existente (nav, hero, footer); cada tarea posterior añade sus propias claves.

**Files:**
- Create: `public/dist/i18n.js`
- Modify: `public/index.html` (script inline en `<head>`, tag de `i18n.js`, botón en el nav, atributos `data-i18n` en nav/hero/footer)

**Interfaces:**
- Consumes: nada de otras tareas.
- Produces:
  - `window.setLanguage(lang)` — `lang` es `'en'` o `'es'`. Aplica el idioma, persiste en `localStorage`, actualiza `<html lang>`, `<title>` y `meta[name="description"]`, y emite `languagechange`.
  - Contrato de marcado que usan las Tasks 6–10:
    - `data-i18n="clave"` → reemplaza `textContent`.
    - `data-i18n-html="clave"` → reemplaza `innerHTML` (para textos con `<span>` o `<br>`).
    - `data-i18n-attr="alt:clave"` → reemplaza ese atributo. Varios pares separados por coma.
  - Objeto `I18N` con la forma `{ en: { clave: 'texto' }, es: { clave: 'texto' } }`. Las tareas siguientes **añaden claves a ambos idiomas**, nunca a uno solo.

- [ ] **Step 1: Escribir el motor con las claves del contenido existente**

Crear `public/dist/i18n.js`:

```js
// Unico modulo que escribe texto en el DOM.
// Contrato de marcado:
//   data-i18n="clave"            -> textContent
//   data-i18n-html="clave"       -> innerHTML (textos con span/br)
//   data-i18n-attr="alt:clave"   -> atributo; varios pares con coma

const I18N = {
  en: {
    'meta.title': 'Jhoan Alzate — Software Developer',
    'meta.description':
      'Software developer with over a year and a half orchestrating processes across systems for banking, insurance and health. Backend integrations (OSB/OIC, Node.js) and clean, functional React interfaces.',

    'nav.home': 'Home',
    'nav.experience': 'Experience',
    'nav.projects': 'Projects',
    'nav.skills': 'Skills',
    'nav.about': 'About',
    'nav.contact': 'Contact',

    'hero.badge': 'Open to work',
    'hero.greeting': "Hey! I'm",
    'hero.role': 'Software Developer',
    'hero.focus': 'Integrations & Frontend · Banking, Insurance & Health',
    'hero.cv': 'Download CV',
    'hero.linkedin': 'LinkedIn',
    'hero.photoAlt': 'Portrait of Jhoan Sebastian Alzate Franco',

    'lang.label': 'Change language',

    'footer.contact': 'Contact',
  },

  es: {
    'meta.title': 'Jhoan Alzate — Software Developer',
    'meta.description':
      'Software developer con más de un año y medio de experiencia orquestando procesos entre sistemas para banca, seguros y salud. Integraciones de backend (OSB/OIC, Node.js) e interfaces limpias y funcionales en React.',

    'nav.home': 'Inicio',
    'nav.experience': 'Experiencia',
    'nav.projects': 'Proyectos',
    'nav.skills': 'Skills',
    'nav.about': 'Sobre mí',
    'nav.contact': 'Contacto',

    'hero.badge': 'Disponible para trabajar',
    'hero.greeting': 'Hola, soy',
    'hero.role': 'Software Developer',
    'hero.focus': 'Integraciones y Frontend · Banca, Seguros y Salud',
    'hero.cv': 'Descargar CV',
    'hero.linkedin': 'LinkedIn',
    'hero.photoAlt': 'Retrato de Jhoan Sebastian Alzate Franco',

    'lang.label': 'Cambiar idioma',

    'footer.contact': 'Contacto',
  },
};

const STORAGE_KEY = 'portfolio-lang';
const DEFAULT_LANG = 'en';

function readStoredLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'es' || stored === 'en' ? stored : DEFAULT_LANG;
  } catch (err) {
    return DEFAULT_LANG;
  }
}

function setLanguage(lang) {
  const dict = I18N[lang] || I18N[DEFAULT_LANG];

  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    const value = dict[el.dataset.i18n];
    // Clave faltante: se deja el texto que ya estaba, nunca "undefined"
    if (typeof value === 'string') el.textContent = value;
  });

  document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
    const value = dict[el.dataset.i18nHtml];
    if (typeof value === 'string') el.innerHTML = value;
  });

  document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
    el.dataset.i18nAttr.split(',').forEach(function (pair) {
      const parts = pair.split(':');
      if (parts.length !== 2) return;
      const attr = parts[0].trim();
      const value = dict[parts[1].trim()];
      if (typeof value === 'string') el.setAttribute(attr, value);
    });
  });

  if (typeof dict['meta.title'] === 'string') document.title = dict['meta.title'];

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && typeof dict['meta.description'] === 'string') {
    metaDesc.setAttribute('content', dict['meta.description']);
  }

  document.documentElement.lang = lang;
  document.documentElement.dataset.lang = lang;

  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (err) {
    /* modo privado: la preferencia no persiste, el resto funciona */
  }

  document.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: lang } }));
}

window.setLanguage = setLanguage;

// Se aplica en cuanto el script deferido corre (tras el parseo, antes del
// evento DOMContentLoaded) para minimizar el flash de texto en ingles.
setLanguage(readStoredLang());

document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('lang-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', function () {
    setLanguage(document.documentElement.dataset.lang === 'es' ? 'en' : 'es');
  });
});
```

- [ ] **Step 2: Añadir el script inline anti-flash y el tag de `i18n.js` en el `<head>`**

En `public/index.html`, dentro de `<head>` y antes de los CDN de GSAP:

```html
<meta name="description" content="Software developer with over a year and a half orchestrating processes across systems for banking, insurance and health.">
<meta name="theme-color" content="#050510">

<script>
  // Fija el idioma en el elemento raiz antes de pintar, para que el CSS
  // del toggle no arranque en el estado equivocado.
  (function () {
    var lang = 'en';
    try {
      var stored = localStorage.getItem('portfolio-lang');
      if (stored === 'es' || stored === 'en') lang = stored;
    } catch (e) { /* sin localStorage: queda el default */ }
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
  })();
</script>
<script defer src="dist/i18n.js"></script>
```

- [ ] **Step 3: Añadir el toggle al nav**

En `public/index.html`, dentro de `<nav class="nav ...">`, después del `<ul>`:

```html
<button id="lang-toggle" type="button"
    class="absolute right-4 top-1/2 -translate-y-1/2 glass flex items-center gap-1 px-1 py-1 text-[0.7rem] font-bold tracking-wide"
    aria-label="Change language" data-i18n-attr="aria-label:lang.label">
    <span class="rounded-full px-2 py-0.5 transition-colors duration-200"
        data-lang-opt="en">EN</span>
    <span class="rounded-full px-2 py-0.5 transition-colors duration-200"
        data-lang-opt="es">ES</span>
</button>
```

El `<nav>` necesita `relative` para que el `absolute` del botón ancle:

```html
<nav class="nav relative flex bg-ink/90 backdrop-blur-md py-4 border-b border-white/5">
```

- [ ] **Step 4: Estilar el indicador del toggle en `styles.css`**

Añadir dentro de `@layer components`:

```css
  [data-lang-opt] {
    color: rgba(229, 231, 235, 0.45);
  }

  html[lang='en'] [data-lang-opt='en'],
  html[lang='es'] [data-lang-opt='es'] {
    background: linear-gradient(135deg, #22d3ee, #8b5cf6);
    color: #050510;
  }
```

El estado activo se deriva del atributo `lang` del elemento raíz, que el script inline ya fijó antes de pintar. Sin JS extra y sin flash.

- [ ] **Step 5: Marcar el contenido existente con `data-i18n`**

En `public/index.html`, añadir los atributos a los nodos que ya existen. Los items del nav:

```html
<li><a href="#home" data-i18n="nav.home">Home</a></li>
<li><a href="#projects" data-i18n="nav.projects">Projects</a></li>
<li><a href="#skills" data-i18n="nav.skills">Skills</a></li>
<li><a href="#about" data-i18n="nav.about">About</a></li>
<li><a href="mailto:jhoans.alzatef@gmail.com" data-i18n="nav.contact">Contact</a></li>
```

El badge del hero, el saludo y el rol:

```html
<div class="inline-flex items-center justify-center w-full px-3 py-1 bg-transparent rounded-full cursor-pointer backdrop-blur-3xl whitespace-nowrap"
    data-i18n="hero.badge">Open to work</div>
```

```html
<h1 class="text-[2.5rem] font-bold md:block flex flex-col">
    <span data-i18n="hero.greeting">Hey! I'm</span>
    <span id="typewriter" class="text-accent-cyan"></span>
</h1>
<p id="profesion" class="text-[1.2rem] opacity-50 mb-4" data-i18n="hero.role">Software Developer</p>
```

El `<span>` del enlace de LinkedIn:

```html
<span data-i18n="hero.linkedin">LinkedIn</span>
```

El footer:

```html
<a class="hover:border-b-white hover:border-b-[1px]" href="mailto:jhoans.alzatef@gmail.com"
    data-i18n="footer.contact">Contact</a>
```

`nav.experience` ya está en el diccionario pero el item del nav se agrega en la Task 7, junto con la sección.

Nota: el typewriter escribe "Jhoan Alzate" en `#typewriter`, que no lleva `data-i18n` — un nombre propio no se traduce. `setLanguage` no lo toca.

- [ ] **Step 6: Corregir `hover:boder-b-white`**

`index.html:375` tiene `hover:boder-b-white` (falta la `r`). Es una clase inválida que Tailwind ignora en silencio. Corregir a `hover:border-b-white` como en el snippet anterior.

- [ ] **Step 7: Compilar y verificar el toggle**

```bash
npx tailwindcss -i ./public/styles.css -o ./public/dist/output.css
```

Recargar y verificar:
1. El toggle aparece a la derecha del nav con EN resaltado.
2. Click → todo el nav, el badge, el saludo, el rol y el footer pasan a español; ES queda resaltado.
3. `document.documentElement.lang` es `es`; el `<title>` cambió.
4. Recargar → sigue en español, sin flash de inglés perceptible.
5. Click de vuelta a EN → recargar → sigue en inglés.
6. En consola: `localStorage.setItem('portfolio-lang','xx'); location.reload()` → cae a inglés sin lanzar.
7. En modo incógnito con cookies bloqueadas: el toggle funciona en la sesión aunque no persista.

- [ ] **Step 8: Commit**

```bash
git add public/index.html public/styles.css public/dist/i18n.js public/dist/output.css
git commit -m "feat: motor de i18n y toggle ES/EN

- diccionario plano en dist/i18n.js, contrato data-i18n/-html/-attr
- default ingles, preferencia en localStorage bajo portfolio-lang
- script inline en head fija <html lang> antes de pintar (sin flash)
- indicador activo derivado de html[lang], sin JS extra
- clave faltante deja el texto existente, nunca escribe undefined
- corregir typo hover:boder-b-white -> hover:border-b-white"
```

---

## Task 6: Hero, meta y descarga de CV

Actualiza el posicionamiento profesional y los metadatos sociales.

**Files:**
- Modify: `public/index.html:8-13` (meta), `public/index.html:40-76` (hero)
- Modify: `public/dist/i18n.js` (nada nuevo; las claves ya están en la Task 5)

**Interfaces:**
- Consumes: `cv/Jhoan_Sebastian_Alzate_CV.pdf` (Task 2); claves `hero.*` (Task 5).
- Produces: nada que consuman otras tareas.

- [ ] **Step 1: Actualizar los meta tags**

Reemplazar el bloque de `og:` (líneas 8-12) por:

```html
<meta property="og:type" content="website" />
<meta property="og:title" content="Jhoan Alzate — Software Developer" />
<meta property="og:image" content="https://jhoan-alzate.netlify.app/img/port.jpg" />
<meta property="og:description"
    content="Software developer with over a year and a half orchestrating processes across systems for banking, insurance and health. Backend integrations (OSB/OIC, Node.js) and clean, functional React interfaces." />
<meta property="og:url" content="https://jhoan-alzate.netlify.app/" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Jhoan Alzate — Software Developer" />
<meta name="twitter:description"
    content="Backend integrations (OSB/OIC, Node.js) and clean, functional React interfaces for banking, insurance and health." />
<meta name="twitter:image" content="https://jhoan-alzate.netlify.app/img/port.jpg" />

<link rel="icon" href="img/favicon.svg" type="image/svg+xml" />
<title>Jhoan Alzate — Software Developer</title>
```

- [ ] **Step 2: Crear el favicon**

Crear `public/img/favicon.svg` — monograma JA sobre el gradiente de acento:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#22d3ee"/>
      <stop offset="1" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="#050510"/>
  <rect x="1" y="1" width="30" height="30" rx="7" fill="none" stroke="url(#g)" stroke-width="1.5"/>
  <text x="16" y="22" font-family="system-ui, sans-serif" font-size="15" font-weight="700"
        text-anchor="middle" fill="url(#g)">JA</text>
</svg>
```

- [ ] **Step 3: Reescribir el subtítulo y los botones del hero**

En `public/index.html`, sustituir el bloque desde `<p id="profesion" ...>` hasta el cierre del enlace de LinkedIn por:

```html
<p id="profesion" class="text-[1.2rem] opacity-50" data-i18n="hero.role">Software Developer</p>
<p class="mb-6 text-[0.85rem] text-white/40" data-i18n="hero.focus">
    Integrations &amp; Frontend · Banking, Insurance &amp; Health
</p>

<div class="linkedin opacity-0 flex flex-wrap justify-center gap-3">
    <a target="_blank" rel="noopener" href="https://www.linkedin.com/in/coro-franco/"
        class="glass inline-flex items-center gap-2 px-4 py-2 text-[0.85rem] font-bold transition-all duration-300 hover:border-accent-cyan/50 hover:text-accent-cyan">
        <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.5 8C7.32843 8 8 7.32843 8 6.5C8 5.67157 7.32843 5 6.5 5C5.67157 5 5 5.67157 5 6.5C5 7.32843 5.67157 8 6.5 8Z" />
            <path d="M5 10C5 9.44772 5.44772 9 6 9H7C7.55228 9 8 9.44771 8 10V18C8 18.5523 7.55228 19 7 19H6C5.44772 19 5 18.5523 5 18V10Z" />
            <path d="M11 19H12C12.5523 19 13 18.5523 13 18V13.5C13 12 16 11 16 13V18.0004C16 18.5527 16.4477 19 17 19H18C18.5523 19 19 18.5523 19 18V12C19 10 17.5 9 15.5 9C13.5 9 13 10.5 13 10.5V10C13 9.44771 12.5523 9 12 9H11C10.4477 9 10 9.44772 10 10V18C10 18.5523 10.4477 19 11 19Z" />
            <path fill-rule="evenodd" clip-rule="evenodd"
                d="M20 1C21.6569 1 23 2.34315 23 4V20C23 21.6569 21.6569 23 20 23H4C2.34315 23 1 21.6569 1 20V4C1 2.34315 2.34315 1 4 1H20ZM20 3C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3H20Z" />
        </svg>
        <span data-i18n="hero.linkedin">LinkedIn</span>
    </a>

    <a href="cv/Jhoan_Sebastian_Alzate_CV.pdf" download
        class="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-[0.85rem] font-bold text-ink transition-transform duration-300 hover:-translate-y-0.5"
        style="background-image: linear-gradient(135deg, #22d3ee, #8b5cf6);">
        <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span data-i18n="hero.cv">Download CV</span>
    </a>
</div>
```

Cambios respecto al original: se unifica LinkedIn en `/in/coro-franco/` (el hero tenía dos URLs distintas, líneas 46 y 60), se añade el botón de CV, y `.linkedin` pasa a envolver ambos botones para que la animación de entrada los cubra.

- [ ] **Step 4: Actualizar el `alt` de la foto del hero**

En `#mainImage`:

```html
<img class="w-full h-full object-cover" style="object-position: 73% 20%;"
    src="img/foto1.PNG" alt="Portrait of Jhoan Sebastian Alzate Franco"
    data-i18n-attr="alt:hero.photoAlt">
```

Nota: el `src` actual dice `img/foto1.png` en minúsculas y el archivo real es `foto1.PNG`. Funciona en Windows por ser case-insensitive, pero **falla en Netlify (Linux)**. Corregir a `foto1.PNG`.

- [ ] **Step 5: Compilar y verificar**

```bash
npx tailwindcss -i ./public/styles.css -o ./public/dist/output.css
```

Verificar:
1. El hero dice "Software Developer" con el subtítulo de foco debajo.
2. Los dos botones (LinkedIn y Download CV) aparecen con la animación de entrada.
3. Click en Download CV → descarga el PDF.
4. Toggle a ES → el subtítulo y "Descargar CV" cambian.
5. La foto del hero carga (pestaña Network: `foto1.PNG` responde 200, no 404).
6. El favicon aparece en la pestaña.
7. Pegar `http://localhost:5501` en un validador de OG o inspeccionar los meta: título y descripción nuevos.

- [ ] **Step 6: Commit**

```bash
git add public/index.html public/img/favicon.svg public/dist/output.css
git commit -m "feat: hero como Software Developer, descarga de CV y meta actualizados

- 'Fullstack Developer' -> 'Software Developer' + subtitulo de foco
- boton Download CV apuntando a public/cv/
- unificar LinkedIn en /in/coro-franco (el hero tenia dos URLs distintas)
- corregir src foto1.png -> foto1.PNG (fallaba en Netlify por case)
- og/twitter cards, description, theme-color y favicon SVG"
```

---

## Task 7: Sección Experience con timeline animado

La adición de mayor valor: hoy no existe historial laboral.

**Files:**
- Modify: `public/index.html` (nueva sección entre `#projects` y `#skills`, item nuevo en el nav)
- Modify: `public/styles.css` (estilos de timeline)
- Modify: `public/dist/animations.js` (línea de progreso con `scrub`)
- Modify: `public/dist/i18n.js` (claves `exp.*`)

**Interfaces:**
- Consumes: clase `.reveal` y `data-stagger` (Task 1); contrato `data-i18n` (Task 5).
- Produces: `#experience` como target de ancla del nav; clases `.timeline-track`, `.timeline-progress`, `.timeline-item`.

- [ ] **Step 1: Añadir las claves al diccionario**

En `public/dist/i18n.js`, añadir a `I18N.en`:

```js
    'exp.heading': 'Experience',
    'exp.company': 'Cidenet',
    'exp.role': 'Development Analyst',
    'exp.period': 'January 2025 – Present',
    'exp.now': 'Now',

    'exp.ficohsa.client': 'Banco Ficohsa',
    'exp.ficohsa.period': 'Jan 2025 – Oct 2025',
    'exp.ficohsa.body':
      'Design, development, testing and deployment of SOAP/REST flows and integrations for the bank’s middle tier with Oracle Service Bus (OSB 11g/12c) and Oracle Integration Cloud (OIC), working in Scrum teams.',

    'exp.sura.client': 'SURA',
    'exp.sura.period': 'Oct 2025 – Dec 2025',
    'exp.sura.body':
      'Migration of Oracle Forms as part of the modernization of internal applications.',

    'exp.psf.client': 'PSF · Insurance project',
    'exp.psf.period': 'Jan 2026 – Mar 2026',
    'exp.psf.body':
      'Feature development for an insurance platform, with React on the frontend and Node.js on the backend. Data modeling and management in PostgreSQL, with services deployed via Docker.',

    'exp.cysnet.client': 'CYSNET · MiTuSalud',
    'exp.cysnet.period': 'Apr 2026 – Present',
    'exp.cysnet.body':
      'Development with React of two healthcare web portals: one for patients and one for healthcare professionals. Collaboration on the design of clean, functional interfaces aligned with clinical care flows, and implementation of services.',
```

Y a `I18N.es`, con el texto literal del CV:

```js
    'exp.heading': 'Experiencia',
    'exp.company': 'Cidenet',
    'exp.role': 'Analista de Desarrollo',
    'exp.period': 'Enero 2025 – Actualidad',
    'exp.now': 'Ahora',

    'exp.ficohsa.client': 'Banco Ficohsa',
    'exp.ficohsa.period': 'Ene 2025 – Oct 2025',
    'exp.ficohsa.body':
      'Diseño, desarrollo, pruebas y despliegue de flujos e integraciones SOAP/REST para la capa media del banco con Oracle Service Bus (OSB 11g/12c) y Oracle Integration Cloud (OIC), en equipos con metodología Scrum.',

    'exp.sura.client': 'SURA',
    'exp.sura.period': 'Oct 2025 – Dic 2025',
    'exp.sura.body':
      'Migración de formularios de Oracle Forms como parte de la modernización de aplicaciones internas.',

    'exp.psf.client': 'PSF · Proyecto de seguros',
    'exp.psf.period': 'Ene 2026 – Mar 2026',
    'exp.psf.body':
      'Desarrollo de funcionalidades para plataforma de seguros, con React en el frontend y Node.js en el backend. Modelado y gestión de datos en PostgreSQL, con despliegue de servicios mediante Docker.',

    'exp.cysnet.client': 'CYSNET · Proyecto MiTuSalud',
    'exp.cysnet.period': 'Abr 2026 – Actualidad',
    'exp.cysnet.body':
      'Desarrollo con React de dos portales web del sector salud: uno para pacientes y otro para profesionales de la salud. Colaboración en el diseño de interfaces limpias y funcionales alineadas a los flujos de atención médica e implementación de servicios.',
```

- [ ] **Step 2: Añadir el item al nav**

En el `<ul>` del nav, entre Home y Projects:

```html
<li><a href="#experience" data-i18n="nav.experience">Experience</a></li>
```

- [ ] **Step 3: Insertar la sección**

En `public/index.html`, entre el cierre de `</section>` de `#projects` y la apertura de `<section id="skills">`:

```html
<section id="experience" class="py-20">
    <div class="max-w-[820px] w-[92%] m-auto">
        <div class="flex justify-center items-center gap-2 font-bold text-[2rem] mb-4">
            <svg class="size-7 text-accent-cyan" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
            <h2 data-i18n="exp.heading">Experience</h2>
        </div>

        <div class="reveal text-center mb-14">
            <p class="text-[1.15rem] font-bold text-white/90"><span data-i18n="exp.role">Development Analyst</span>
                · <span class="text-accent-cyan" data-i18n="exp.company">Cidenet</span></p>
            <p class="text-[0.85rem] text-white/40" data-i18n="exp.period">January 2025 – Present</p>
        </div>

        <ol class="timeline-track" data-stagger>
            <li class="timeline-item reveal-child">
                <div class="timeline-dot"></div>
                <div class="glass p-5">
                    <div class="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                        <h3 class="font-bold text-[1.05rem]" data-i18n="exp.ficohsa.client">Banco Ficohsa</h3>
                        <span class="text-[0.75rem] text-white/40" data-i18n="exp.ficohsa.period">Jan 2025 – Oct 2025</span>
                    </div>
                    <p class="text-[0.9rem] text-gray-300 text-pretty" data-i18n="exp.ficohsa.body">Design, development, testing and deployment of SOAP/REST flows and integrations for the bank's middle tier with Oracle Service Bus (OSB 11g/12c) and Oracle Integration Cloud (OIC), working in Scrum teams.</p>
                </div>
            </li>

            <li class="timeline-item reveal-child">
                <div class="timeline-dot"></div>
                <div class="glass p-5">
                    <div class="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                        <h3 class="font-bold text-[1.05rem]" data-i18n="exp.sura.client">SURA</h3>
                        <span class="text-[0.75rem] text-white/40" data-i18n="exp.sura.period">Oct 2025 – Dec 2025</span>
                    </div>
                    <p class="text-[0.9rem] text-gray-300 text-pretty" data-i18n="exp.sura.body">Migration of Oracle Forms as part of the modernization of internal applications.</p>
                </div>
            </li>

            <li class="timeline-item reveal-child">
                <div class="timeline-dot"></div>
                <div class="glass p-5">
                    <div class="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                        <h3 class="font-bold text-[1.05rem]" data-i18n="exp.psf.client">PSF · Insurance project</h3>
                        <span class="text-[0.75rem] text-white/40" data-i18n="exp.psf.period">Jan 2026 – Mar 2026</span>
                    </div>
                    <p class="text-[0.9rem] text-gray-300 text-pretty" data-i18n="exp.psf.body">Feature development for an insurance platform, with React on the frontend and Node.js on the backend. Data modeling and management in PostgreSQL, with services deployed via Docker.</p>
                </div>
            </li>

            <li class="timeline-item reveal-child">
                <div class="timeline-dot timeline-dot--active animate-pulse-ring"></div>
                <div class="glass p-5 border-accent-cyan/25">
                    <div class="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                        <h3 class="font-bold text-[1.05rem] flex items-center gap-2">
                            <span data-i18n="exp.cysnet.client">CYSNET · MiTuSalud</span>
                            <span class="rounded-full bg-accent-cyan/15 px-2 py-0.5 text-[0.65rem] font-bold text-accent-cyan"
                                data-i18n="exp.now">Now</span>
                        </h3>
                        <span class="text-[0.75rem] text-white/40" data-i18n="exp.cysnet.period">Apr 2026 – Present</span>
                    </div>
                    <p class="text-[0.9rem] text-gray-300 text-pretty" data-i18n="exp.cysnet.body">Development with React of two healthcare web portals: one for patients and one for healthcare professionals. Collaboration on the design of clean, functional interfaces aligned with clinical care flows, and implementation of services.</p>
                </div>
            </li>
        </ol>
    </div>
</section>
```

- [ ] **Step 4: Estilar el timeline**

En `public/styles.css`, dentro de `@layer components`:

```css
  .timeline-track {
    position: relative;
    padding-left: 2.25rem;
    list-style: none;
  }

  /* Riel apagado, siempre visible */
  .timeline-track::before {
    content: '';
    position: absolute;
    left: 0.5rem;
    top: 0.35rem;
    bottom: 0.35rem;
    width: 2px;
    background: rgba(255, 255, 255, 0.08);
  }

  /* Progreso de gradiente; la altura la anima GSAP con scrub */
  .timeline-progress {
    position: absolute;
    left: 0.5rem;
    top: 0.35rem;
    width: 2px;
    height: 0;
    background: linear-gradient(180deg, #22d3ee, #8b5cf6, #6366f1);
    box-shadow: 0 0 12px -2px #22d3ee;
  }

  .timeline-item {
    position: relative;
    padding-bottom: 1.75rem;
  }

  .timeline-item:last-child {
    padding-bottom: 0;
  }

  .timeline-dot {
    position: absolute;
    left: -2.25rem;
    top: 1.4rem;
    width: 0.75rem;
    height: 0.75rem;
    margin-left: 0.155rem;
    border-radius: 9999px;
    background: #0e0e1f;
    border: 2px solid rgba(255, 255, 255, 0.25);
  }

  .timeline-dot--active {
    background: #22d3ee;
    border-color: #22d3ee;
  }
```

- [ ] **Step 5: Animar la línea de progreso**

En `public/dist/animations.js`, añadir `initTimeline()` a la lista de llamadas dentro del `else`:

```js
  gsap.registerPlugin(ScrollTrigger);
  initReveals();
  initHero();
  initProjectVideos();
  initTimeline();
```

Y la función:

```js
// La linea de gradiente se dibuja al bajar y se recoge al subir.
// El nodo se inyecta desde JS: sin animacion no tiene sentido mostrarlo,
// y el riel apagado de ::before ya da la estructura visual.
function initTimeline() {
  const track = document.querySelector('.timeline-track');
  if (!track) return;

  const progress = document.createElement('div');
  progress.className = 'timeline-progress';
  track.appendChild(progress);

  gsap.to(progress, {
    scrollTrigger: {
      trigger: track,
      start: 'top 75%',
      end: 'bottom 65%',
      scrub: 0.6,
    },
    height: '100%',
    ease: 'none',
  });
}
```

- [ ] **Step 6: Compilar y verificar**

```bash
npx tailwindcss -i ./public/styles.css -o ./public/dist/output.css
```

Verificar:
1. La sección aparece entre Projects y Skills; el nav tiene "Experience" y el ancla hace scroll hasta ella.
2. Al bajar, la línea de gradiente se dibuja de arriba abajo siguiendo el scroll; al subir se recoge.
3. Las 4 tarjetas entran en stagger, una tras otra.
4. El nodo de MiTuSalud es cyan con anillo pulsante y badge "Now".
5. Toggle a ES → los 4 clientes, periodos y descripciones cambian al texto del CV; el badge dice "Ahora".
6. En 375 px: las tarjetas no desbordan, la línea y los nodos quedan alineados, los periodos hacen wrap sin romper el layout.
7. Con `prefers-reduced-motion: reduce`: las 4 tarjetas visibles, la línea al 100 % (por la regla `html.no-anim .timeline-progress`). Nota: bajo reduced-motion `initTimeline` no corre, así que el nodo `.timeline-progress` no se inyecta y solo se ve el riel apagado — comportamiento aceptable y sin contenido perdido.

- [ ] **Step 7: Commit**

```bash
git add public/index.html public/styles.css public/dist/animations.js public/dist/i18n.js public/dist/output.css
git commit -m "feat: seccion Experience con timeline animado

Cidenet como empleador y 4 nodos de cliente (Ficohsa, SURA, PSF, MiTuSalud)
tomados del CV. Linea de gradiente dibujada con ScrollTrigger scrub, tarjetas
en stagger y badge 'Now' pulsante en el proyecto actual."
```

---

## Task 8: Skills en 6 categorías

Reemplaza los 4 grupos actuales. Elimina la categoría "Learning", que clasificaba React y TypeScript como en aprendizaje cuando ya son producción.

**Files:**
- Modify: `public/index.html:202-336` (sección `#skills` completa)
- Modify: `public/dist/i18n.js` (claves `skills.*`)

**Interfaces:**
- Consumes: iconos de `img/svgs/` (Task 3); `.skill-chip`, `.glass`, `data-stagger`, `.reveal-child` (Task 1); `data-i18n` (Task 5).
- Produces: nada que consuman otras tareas.

- [ ] **Step 1: Añadir las claves de categoría**

En `I18N.en`:

```js
    'skills.heading': 'Skills',
    'skills.frontend': 'Frontend',
    'skills.backend': 'Backend',
    'skills.databases': 'Databases',
    'skills.integration': 'Integration & Middleware',
    'skills.devops': 'DevOps & Tools',
    'skills.ai': 'AI Tooling',
```

En `I18N.es`:

```js
    'skills.heading': 'Skills',
    'skills.frontend': 'Frontend',
    'skills.backend': 'Backend',
    'skills.databases': 'Bases de datos',
    'skills.integration': 'Integración y Middleware',
    'skills.devops': 'DevOps y Herramientas',
    'skills.ai': 'Herramientas de IA',
```

Los nombres de tecnología no se traducen y no llevan `data-i18n`.

- [ ] **Step 2: Reescribir la sección `#skills`**

Reemplazar todo el bloque `<section id="skills">…</section>` (líneas 202-336) por:

```html
<section id="skills" class="py-20">
    <div class="max-w-[1000px] w-[92%] m-auto">
        <div class="flex justify-center items-center gap-2 font-bold text-[2rem] mb-14">
            <svg class="size-7 text-accent-violet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2 15 9l7 .5-5.5 4.5L18.5 21 12 17.3 5.5 21l2-7L2 9.5 9 9l3-7Z" />
            </svg>
            <h2 data-i18n="skills.heading">Skills</h2>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
            <!-- Frontend -->
            <div class="skills glass p-5" data-stagger>
                <h3 class="mb-4 text-[1.05rem] font-bold text-accent-cyan" data-i18n="skills.frontend">Frontend</h3>
                <div class="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    <div class="skill-chip reveal-child" style="--glow:#61DAFB"><img src="img/svgs/react.svg" alt="React" class="h-7 w-7"><span class="text-[0.7rem]">React</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#E5E7EB"><img src="img/svgs/next.svg" alt="Next.js" class="h-7 w-7"><span class="text-[0.7rem]">Next.js</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#BC52EE"><img src="img/svgs/astro.svg" alt="Astro" class="h-7 w-7"><span class="text-[0.7rem]">Astro</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#DD0031"><img src="img/svgs/angular.svg" alt="Angular" class="h-7 w-7"><span class="text-[0.7rem]">Angular</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#4FC08D"><img src="img/svgs/vue.svg" alt="Vue" class="h-7 w-7"><span class="text-[0.7rem]">Vue</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#3178C6"><img src="img/svgs/ts.svg" alt="TypeScript" class="h-7 w-7"><span class="text-[0.7rem]">TypeScript</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#F7DF1E"><img src="img/svgs/js.svg" alt="JavaScript" class="h-7 w-7"><span class="text-[0.7rem]">JavaScript</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#06B6D4"><img src="img/svgs/tailwindcss.svg" alt="Tailwind CSS" class="h-7 w-7"><span class="text-[0.7rem]">Tailwind</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#CC6699"><img src="img/svgs/sass.svg" alt="Sass" class="h-7 w-7"><span class="text-[0.7rem]">Sass</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#88CE02"><img src="img/svgs/gsap.svg" alt="GSAP" class="h-7 w-7"><span class="text-[0.7rem]">GSAP</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#E5E7EB"><img src="img/svgs/threejs.svg" alt="Three.js" class="h-7 w-7"><span class="text-[0.7rem]">Three.js</span></div>
                </div>
            </div>

            <!-- Backend -->
            <div class="skills glass p-5" data-stagger>
                <h3 class="mb-4 text-[1.05rem] font-bold text-accent-violet" data-i18n="skills.backend">Backend</h3>
                <div class="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    <div class="skill-chip reveal-child" style="--glow:#5FA04E"><img src="img/svgs/node.svg" alt="Node.js" class="h-7 w-7"><span class="text-[0.7rem]">Node.js</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#E0234E"><img src="img/svgs/nestjs.svg" alt="NestJS" class="h-7 w-7"><span class="text-[0.7rem]">NestJS</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#6DB33F"><img src="img/svgs/spring.svg" alt="Spring Boot" class="h-7 w-7"><span class="text-[0.7rem]">Spring Boot</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#FF2D20"><img src="img/svgs/laravel.svg" alt="Laravel" class="h-7 w-7"><span class="text-[0.7rem]">Laravel</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#E5E7EB"><img src="img/svgs/express.svg" alt="Express" class="h-7 w-7"><span class="text-[0.7rem]">Express</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#777BB4"><img src="img/svgs/php.svg" alt="PHP" class="h-7 w-7"><span class="text-[0.7rem]">PHP</span></div>
                </div>
            </div>

            <!-- Integration & Middleware: la categoria diferenciadora, con borde de acento -->
            <div class="skills glass p-5 border-accent-cyan/30" data-stagger>
                <h3 class="mb-4 text-[1.05rem] font-bold text-accent-cyan" data-i18n="skills.integration">Integration &amp; Middleware</h3>
                <div class="grid grid-cols-3 gap-3">
                    <div class="skill-chip reveal-child" style="--glow:#F80000"><img src="img/svgs/oracle.svg" alt="Oracle Service Bus" class="h-7 w-7"><span class="text-[0.7rem] text-center">Service Bus</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#F80000"><img src="img/svgs/oracle.svg" alt="Oracle Integration Cloud" class="h-7 w-7"><span class="text-[0.7rem] text-center">Integration Cloud</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#F80000"><img src="img/svgs/oracle.svg" alt="Oracle Cloud Infrastructure" class="h-7 w-7"><span class="text-[0.7rem] text-center">OCI</span></div>
                </div>
            </div>

            <!-- Databases -->
            <div class="skills glass p-5" data-stagger>
                <h3 class="mb-4 text-[1.05rem] font-bold text-accent-violet" data-i18n="skills.databases">Databases</h3>
                <div class="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    <div class="skill-chip reveal-child" style="--glow:#4169E1"><img src="img/svgs/postgres.svg" alt="PostgreSQL" class="h-7 w-7"><span class="text-[0.7rem]">PostgreSQL</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#F80000"><img src="img/svgs/oracle.svg" alt="Oracle Database" class="h-7 w-7"><span class="text-[0.7rem]">Oracle</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#4479A1"><img src="img/svgs/mysql.svg" alt="MySQL" class="h-7 w-7"><span class="text-[0.7rem]">MySQL</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#47A248"><img src="img/svgs/mongo.svg" alt="MongoDB" class="h-7 w-7"><span class="text-[0.7rem]">MongoDB</span></div>
                </div>
            </div>

            <!-- DevOps & Tools -->
            <div class="skills glass p-5" data-stagger>
                <h3 class="mb-4 text-[1.05rem] font-bold text-accent-cyan" data-i18n="skills.devops">DevOps &amp; Tools</h3>
                <div class="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    <div class="skill-chip reveal-child" style="--glow:#2496ED"><img src="img/svgs/docker.svg" alt="Docker" class="h-7 w-7"><span class="text-[0.7rem]">Docker</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#326CE5"><img src="img/svgs/kubernetes.svg" alt="Kubernetes" class="h-7 w-7"><span class="text-[0.7rem]">Kubernetes</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#F05032"><img src="img/svgs/git.svg" alt="Git" class="h-7 w-7"><span class="text-[0.7rem]">Git</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#E5E7EB"><img src="img/svgs/github.svg" alt="GitHub" class="h-7 w-7"><span class="text-[0.7rem]">GitHub</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#FC6D26"><img src="img/svgs/gitlab.svg" alt="GitLab" class="h-7 w-7"><span class="text-[0.7rem]">GitLab</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#0052CC"><img src="img/svgs/bitbucket.svg" alt="Bitbucket" class="h-7 w-7"><span class="text-[0.7rem]">Bitbucket</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#F24E1E"><img src="img/svgs/figma.svg" alt="Figma" class="h-7 w-7"><span class="text-[0.7rem]">Figma</span></div>
                </div>
            </div>

            <!-- AI Tooling -->
            <div class="skills glass p-5" data-stagger>
                <h3 class="mb-4 text-[1.05rem] font-bold text-accent-violet" data-i18n="skills.ai">AI Tooling</h3>
                <div class="grid grid-cols-3 gap-3">
                    <div class="skill-chip reveal-child" style="--glow:#E5E7EB"><img src="img/svgs/opencode.svg" alt="OpenCode" class="h-7 w-7"><span class="text-[0.7rem] text-center">OpenCode</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#E5E7EB"><img src="img/svgs/mcp.svg" alt="Model Context Protocol" class="h-7 w-7"><span class="text-[0.7rem] text-center">MCP</span></div>
                    <div class="skill-chip reveal-child" style="--glow:#22D3EE"><img src="img/svgs/prompt.svg" alt="Prompt and skill design" class="h-7 w-7"><span class="text-[0.7rem] text-center">Prompt Design</span></div>
                </div>
            </div>
        </div>
    </div>
</section>
```

- [ ] **Step 3: Teñir los iconos en hover**

Los SVG se cargan con `<img>`, así que `currentColor` no los alcanza. Se tiñen con un filtro. Añadir en `styles.css`, dentro de `@layer components`, junto a las reglas de `.skill-chip`:

```css
  /* Los SVG entran por <img>, fuera del arbol de color del documento.
     Se normalizan a blanco tenue con brightness/invert y el hover
     sube la opacidad y proyecta el glow de marca. */
  .skill-chip img {
    filter: brightness(0) invert(1);
    opacity: 0.6;
    transition: opacity 0.3s ease, filter 0.3s ease;
  }

  .skill-chip:hover img {
    opacity: 1;
    filter: brightness(0) invert(1) drop-shadow(0 0 6px var(--glow));
  }
```

Se elimina la regla vieja `.skills svg:hover { opacity: 0.8; filter: brightness(1.2); }` — apuntaba a `svg` inline, que ya no existe en esta sección.

- [ ] **Step 4: Compilar y verificar**

```bash
npx tailwindcss -i ./public/styles.css -o ./public/dist/output.css
```

Verificar:
1. Seis tarjetas de categoría en grid de 2 columnas; en móvil, una columna.
2. Todos los iconos cargan (Network sin 404 en `img/svgs/`).
3. Hover en un chip → se eleva, el borde toma el color de marca y el icono proyecta glow de ese color.
4. Los chips entran en stagger al hacer scroll a cada categoría.
5. La tarjeta de Integration & Middleware tiene borde cyan visible.
6. Toggle a ES → los 6 títulos de categoría cambian ("Bases de datos", "Integración y Middleware", "DevOps y Herramientas", "Herramientas de IA"); los nombres de tecnología no.
7. En 375 px: 3 columnas de chips, ningún texto desborda su chip.
8. Ya no existe ninguna categoría "Learning".

- [ ] **Step 5: Commit**

```bash
git add public/index.html public/styles.css public/dist/i18n.js public/dist/output.css
git commit -m "feat: skills en 6 categorias desde el CV

- elimina 'Learning': React y TypeScript ya son produccion, no aprendizaje
- agrega Integration & Middleware (OSB, OIC, OCI) con borde de acento
- agrega AI Tooling (OpenCode, MCP, prompt design)
- completa Frontend/Backend/Databases/DevOps con el stack real del CV
- chips de vidrio con hover magnetico y glow del color de marca via --glow"
```

---

## Task 9: Projects — rediseño de cards y MiduGuard

**Files:**
- Modify: `public/index.html:78-200` (sección `#projects` completa)
- Modify: `public/dist/i18n.js` (claves `proj.*`)

**Interfaces:**
- Consumes: `videos/miduguard.webm` (Task 2); iconos `next`, `turso`, `clerk`, `tailwindcss`, `gsap`, `astro`, `laravel`, `mysql` (Task 3); `.gradient-border`, `.reveal` (Task 1); `data-i18n` (Task 5).
- Produces: nada que consuman otras tareas.

- [ ] **Step 1: Añadir las claves de proyecto**

En `I18N.en`:

```js
    'proj.heading': 'Projects',
    'proj.code': 'Code',
    'proj.preview': 'Preview',

    'proj.midu.title': 'MiduGuard',
    'proj.midu.body':
      'An educational game that blends the border-management mechanics of Papers, Please with hands-on SQL learning. You play an immigration officer in Midulandia and verify each visitor’s data by writing real SQL queries in an interactive terminal. Over 50 characters with their own storyline, escalating difficulty across days, Clerk authentication and auto-saved progress with Zustand.',

    'proj.artist.title': 'Portfolio, Gallery, Artist Page',
    'proj.artist.body':
      'Personal website of artist Felipe Franco, a space dedicated to showcasing his work and projects. Visitors can explore a full collection of his artistic output, including visual works, installations and collaborative projects.',

    'proj.nimi.title': 'Nimi Platform',
    'proj.nimi.body':
      'Nimi is a dynamic eLearning platform that acts as a knowledge marketplace, letting anyone take part as a learner or a teacher. The goal is to make knowledge exchange easy and to promote continuous learning that is accessible to everyone.',
```

En `I18N.es`:

```js
    'proj.heading': 'Proyectos',
    'proj.code': 'Código',
    'proj.preview': 'Ver demo',

    'proj.midu.title': 'MiduGuard',
    'proj.midu.body':
      'Juego educativo que combina la mecánica de gestión de fronteras de Papers, Please con el aprendizaje práctico de SQL. Eres oficial de inmigración en Midulandia y verificas los datos de cada visitante escribiendo consultas SQL reales en una terminal interactiva. Más de 50 personajes con su propia historia, dificultad progresiva por días, autenticación con Clerk y guardado automático del progreso con Zustand.',

    'proj.artist.title': 'Portafolio, Galería, Página de Artista',
    'proj.artist.body':
      'Sitio web personal del artista Felipe Franco, un espacio dedicado a mostrar su obra y sus proyectos. Permite explorar una colección completa de su trabajo artístico, incluyendo obras visuales, instalaciones y proyectos colaborativos.',

    'proj.nimi.title': 'Nimi Platform',
    'proj.nimi.body':
      'Nimi es una plataforma dinámica de eLearning que funciona como un marketplace de conocimiento, donde cualquiera puede participar como estudiante o como profesor. El objetivo es facilitar el intercambio de conocimiento y promover un aprendizaje continuo y accesible para todos.',
```

- [ ] **Step 2: Reescribir la sección `#projects`**

Reemplazar todo el bloque `<section id="projects">…</section>` (líneas 78-200) por:

```html
<section id="projects" class="py-20">
    <div class="max-w-[1100px] w-[95%] m-auto">
        <div class="flex justify-center items-center gap-2 font-bold text-[2rem] mb-16">
            <svg class="size-7 text-accent-cyan" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 8l-4 4l4 4"></path>
                <path d="M17 8l4 4l-4 4"></path>
                <path d="M14 4l-4 16"></path>
            </svg>
            <h2 data-i18n="proj.heading">Projects</h2>
        </div>

        <div class="flex flex-col gap-20">

            <!-- MiduGuard -->
            <article class="flex flex-col md:flex-row gap-6 md:gap-10 items-center">
                <div class="gradient-border w-full md:max-w-[520px] overflow-hidden rounded-xl">
                    <video class="videos opacity-0 scale-[1.03] w-full block transition-transform duration-500"
                        src="videos/miduguard.webm" muted loop playsinline preload="metadata"
                        aria-label="MiduGuard gameplay"></video>
                </div>
                <div class="project-info reveal max-w-[460px] flex flex-col gap-3">
                    <h3 class="text-[1.3rem] md:text-[1.5rem] font-bold" data-i18n="proj.midu.title">MiduGuard</h3>
                    <ul class="flex flex-wrap gap-2">
                        <li><span class="glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-bold"><img src="img/svgs/next.svg" alt="" class="h-3.5 w-3.5 opacity-70 invert">Next.js</span></li>
                        <li><span class="glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-bold"><img src="img/svgs/turso.svg" alt="" class="h-3.5 w-3.5 opacity-70 invert">Turso</span></li>
                        <li><span class="glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-bold"><img src="img/svgs/clerk.svg" alt="" class="h-3.5 w-3.5 opacity-70 invert">Clerk</span></li>
                        <li><span class="glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-bold"><img src="img/svgs/tailwindcss.svg" alt="" class="h-3.5 w-3.5 opacity-70 invert">Tailwind</span></li>
                        <li><span class="glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-bold"><img src="img/svgs/gsap.svg" alt="" class="h-3.5 w-3.5 opacity-70 invert">GSAP</span></li>
                    </ul>
                    <p class="md:text-[0.95rem] text-[0.85rem] text-gray-300 text-pretty" data-i18n="proj.midu.body">An educational game that blends the border-management mechanics of Papers, Please with hands-on SQL learning.</p>
                    <div class="mt-2 flex gap-2">
                        <a target="_blank" rel="noopener" href="https://github.com/CoroFranco/MiduGuard"
                            class="glass inline-flex items-center gap-2 px-4 py-1.5 text-[0.8rem] font-bold transition-colors duration-300 hover:text-accent-cyan hover:border-accent-cyan/50">
                            <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5"></path>
                            </svg>
                            <span data-i18n="proj.code">Code</span>
                        </a>
                        <a target="_blank" rel="noopener" href="https://midu-guard.vercel.app"
                            class="inline-flex items-center gap-2 rounded-2xl px-4 py-1.5 text-[0.8rem] font-bold text-ink transition-transform duration-300 hover:-translate-y-0.5"
                            style="background-image: linear-gradient(135deg, #22d3ee, #8b5cf6);">
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                            </svg>
                            <span data-i18n="proj.preview">Preview</span>
                        </a>
                    </div>
                </div>
            </article>

            <!-- Artist Page (invertido) -->
            <article class="flex flex-col md:flex-row-reverse gap-6 md:gap-10 items-center">
                <div class="gradient-border w-full md:max-w-[520px] overflow-hidden rounded-xl">
                    <video class="videos opacity-0 scale-[1.03] w-full block transition-transform duration-500"
                        src="videos/este.webm" muted loop playsinline preload="metadata"
                        aria-label="Artist page demo"></video>
                </div>
                <div class="project-info reveal max-w-[460px] flex flex-col gap-3">
                    <h3 class="text-[1.3rem] md:text-[1.5rem] font-bold" data-i18n="proj.artist.title">Portfolio, Gallery, Artist Page</h3>
                    <ul class="flex flex-wrap gap-2">
                        <li><span class="glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-bold"><img src="img/svgs/astro.svg" alt="" class="h-3.5 w-3.5 opacity-70 invert">Astro</span></li>
                        <li><span class="glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-bold"><img src="img/svgs/tailwindcss.svg" alt="" class="h-3.5 w-3.5 opacity-70 invert">Tailwind</span></li>
                    </ul>
                    <p class="md:text-[0.95rem] text-[0.85rem] text-gray-300 text-pretty" data-i18n="proj.artist.body">Personal website of artist Felipe Franco, a space dedicated to showcasing his work and projects.</p>
                    <div class="mt-2 flex gap-2">
                        <a target="_blank" rel="noopener" href="https://github.com/CoroFranco/artist-page"
                            class="glass inline-flex items-center gap-2 px-4 py-1.5 text-[0.8rem] font-bold transition-colors duration-300 hover:text-accent-cyan hover:border-accent-cyan/50">
                            <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5"></path>
                            </svg>
                            <span data-i18n="proj.code">Code</span>
                        </a>
                        <a target="_blank" rel="noopener" href="https://felipefranco.netlify.app/"
                            class="inline-flex items-center gap-2 rounded-2xl px-4 py-1.5 text-[0.8rem] font-bold text-ink transition-transform duration-300 hover:-translate-y-0.5"
                            style="background-image: linear-gradient(135deg, #22d3ee, #8b5cf6);">
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                            </svg>
                            <span data-i18n="proj.preview">Preview</span>
                        </a>
                    </div>
                </div>
            </article>

            <!-- Nimi Platform -->
            <article class="flex flex-col md:flex-row gap-6 md:gap-10 items-center">
                <div class="gradient-border w-full md:max-w-[520px] overflow-hidden rounded-xl">
                    <video class="videos opacity-0 scale-[1.03] w-full block transition-transform duration-500"
                        src="videos/aqui.webm" muted loop playsinline preload="metadata"
                        aria-label="Nimi Platform demo"></video>
                </div>
                <div class="project-info reveal max-w-[460px] flex flex-col gap-3">
                    <h3 class="text-[1.3rem] md:text-[1.5rem] font-bold" data-i18n="proj.nimi.title">Nimi Platform</h3>
                    <ul class="flex flex-wrap gap-2">
                        <li><span class="glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-bold"><img src="img/svgs/laravel.svg" alt="" class="h-3.5 w-3.5 opacity-70 invert">Laravel</span></li>
                        <li><span class="glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-bold"><img src="img/svgs/tailwindcss.svg" alt="" class="h-3.5 w-3.5 opacity-70 invert">Tailwind</span></li>
                        <li><span class="glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-bold"><img src="img/svgs/mysql.svg" alt="" class="h-3.5 w-3.5 opacity-70 invert">MySQL</span></li>
                    </ul>
                    <p class="md:text-[0.95rem] text-[0.85rem] text-gray-300 text-pretty" data-i18n="proj.nimi.body">Nimi is a dynamic eLearning platform that acts as a knowledge marketplace.</p>
                </div>
            </article>

        </div>
    </div>
</section>
```

Cambios sobre las cards viejas:
- **Nimi pierde el botón Code**, por decisión del usuario: apuntaba a `github.com/CoroFranco/artist-page`, el repo del proyecto del artista, no de Nimi.
- Se elimina el `bg-gray-800 bg-opacity-60` de la sección para que el fondo aurora se vea.
- `scale-[1.5]` → `scale-[1.03]`: el zoom de 1.5 recortaba el contenido del video.
- Se añade `playsinline` y `preload="metadata"` para no descargar los tres videos al cargar la página.
- Los textos de descripción en el HTML quedan abreviados a propósito: `i18n.js` los reemplaza por la versión completa al ejecutarse, y así el HTML no duplica párrafos largos.

- [ ] **Step 3: Compilar y verificar**

```bash
npx tailwindcss -i ./public/styles.css -o ./public/dist/output.css
```

Verificar:
1. Tres proyectos, con MiduGuard primero y layout alternado (el segundo invertido en desktop).
2. Los tres videos reproducen en hover, se pausan y rebobinan al salir, sin recorte del contenido.
3. Hover en el contenedor de video → borde de gradiente girando.
4. Botones de MiduGuard: Code abre el repo, Preview abre `midu-guard.vercel.app`.
5. Nimi no tiene botón Code.
6. Toggle a ES → los tres títulos y descripciones cambian; los botones dicen "Código" y "Ver demo".
7. Network: al cargar la página los `.webm` solo piden metadata, no el archivo completo.
8. En 375 px: los tres se apilan en columna, los videos ocupan el ancho completo, los tags hacen wrap.

- [ ] **Step 4: Commit**

```bash
git add public/index.html public/dist/i18n.js public/dist/output.css
git commit -m "feat: agregar MiduGuard y rediseñar las cards de proyecto

- MiduGuard como primer proyecto (Next.js, Turso, Clerk, Tailwind, GSAP)
- layout alternado, borde de gradiente animado en hover
- scale-[1.5] -> scale-[1.03]: el zoom recortaba el contenido del video
- playsinline y preload=metadata: no descarga los 3 videos al cargar
- quitar el boton Code de Nimi (apuntaba al repo del proyecto del artista)"
```

---

## Task 10: About Me y footer

**Files:**
- Modify: `public/index.html:338-376` (sección `#about` y footer)
- Modify: `public/dist/i18n.js` (claves `about.*`, `footer.*`)

**Interfaces:**
- Consumes: `img/about.webp` (Task 2); `.reveal` (Task 1); `data-i18n-html` (Task 5).
- Produces: nada.

- [ ] **Step 1: Añadir las claves**

En `I18N.en`:

```js
    'about.heading': 'About Me',
    'about.photoAlt': 'Portrait of Jhoan Sebastian Alzate Franco',
    'about.body':
      'I am a <span>software developer</span> with over a year and a half of experience orchestrating processes across systems for <span>banking, insurance and health</span>. I combine backend integrations — Oracle Service Bus, Oracle Integration Cloud, Node.js — with building clean, functional interfaces in <span>React</span>, always with an eye on scalability, maintainability and the quality of the final experience.<br><br>I studied Software Analysis and Development at SENA and completed Oracle Next Education’s Front-end React track. Day to day I work in Scrum teams, and I am currently building two healthcare portals: one for patients and one for healthcare professionals. I value <span>effective communication</span> and <span>collaboration</span>, and I am drawn to problems where a clean integration is the difference between a system that scales and one that does not.',
    'footer.contact': 'Contact',
```

En `I18N.es`:

```js
    'about.heading': 'Sobre mí',
    'about.photoAlt': 'Retrato de Jhoan Sebastian Alzate Franco',
    'about.body':
      'Soy <span>software developer</span> con más de un año y medio de experiencia orquestando procesos entre sistemas para <span>banca, seguros y salud</span>. Combino integraciones de backend — Oracle Service Bus, Oracle Integration Cloud, Node.js — con el desarrollo de interfaces limpias y funcionales en <span>React</span>, siempre con foco en escalabilidad, mantenimiento y calidad de la experiencia final.<br><br>Estudié Análisis y Desarrollo de Software en el SENA y completé el programa Front-end React de Oracle Next Education. Trabajo a diario en equipos con metodología Scrum y actualmente construyo dos portales del sector salud: uno para pacientes y otro para profesionales de la salud. Valoro la <span>comunicación efectiva</span> y la <span>colaboración</span>, y me atraen los problemas donde una integración bien hecha es la diferencia entre un sistema que escala y uno que no.',
    'footer.contact': 'Contacto',
```

`about.body` lleva markup, así que su nodo usa `data-i18n-html`, no `data-i18n`.

- [ ] **Step 2: Reescribir la sección**

Reemplazar el bloque `<section id="about">…</section>` y el `<footer>` por:

```html
<section id="about" class="py-20">
    <div class="max-w-[900px] w-[92%] m-auto">
        <h2 class="text-center text-[2rem] font-bold mb-12" data-i18n="about.heading">About Me</h2>
        <div class="flex flex-col md:flex-row gap-10 md:gap-16 items-center">

            <div class="about-photo flex-none w-[200px] h-[200px] rounded-full overflow-hidden">
                <img class="w-full h-full object-cover" src="img/about.webp"
                    alt="Portrait of Jhoan Sebastian Alzate Franco"
                    data-i18n-attr="alt:about.photoAlt" width="560" height="560" loading="lazy">
            </div>

            <p class="aboutme reveal text-pretty text-[0.95rem] leading-relaxed text-gray-300 [&>span]:text-accent-cyan [&>span]:font-semibold"
                data-i18n-html="about.body">
                I am a <span>software developer</span> with over a year and a half of experience orchestrating
                processes across systems for <span>banking, insurance and health</span>.
            </p>
        </div>
    </div>
</section>

<footer class="border-t border-white/5 py-8">
    <div class="max-w-[900px] w-[92%] m-auto flex flex-wrap justify-between gap-4 text-[0.8rem] text-gray-400">
        <p>&copy; 2026 Jhoan Sebastian Alzate Franco</p>
        <a class="transition-colors duration-300 hover:text-accent-cyan"
            href="mailto:jhoans.alzatef@gmail.com" data-i18n="footer.contact">Contact</a>
    </div>
</footer>
```

- [ ] **Step 3: Dar tratamiento a la foto**

La foto viene sobre fondo gris claro uniforme, que sobre el tema oscuro se lee como un círculo blanco. Se compensa con un ring de gradiente y un ajuste de contraste. Añadir en `styles.css`, dentro de `@layer components`:

```css
  .about-photo {
    position: relative;
    padding: 3px;
    background-image: linear-gradient(135deg, #22d3ee, #8b5cf6);
    box-shadow: 0 0 40px -12px rgba(34, 211, 238, 0.5);
  }

  .about-photo img {
    border-radius: 9999px;
    filter: contrast(1.05) saturate(1.05);
  }
```

- [ ] **Step 4: Compilar y verificar**

```bash
npx tailwindcss -i ./public/styles.css -o ./public/dist/output.css
```

Verificar:
1. La foto nueva aparece, circular, con ring de gradiente y glow.
2. El texto de About ya no dice "developer in training"; menciona banca, seguros y salud, y los `<span>` salen en cyan.
3. Toggle a ES → el texto pasa al español con el mismo markup de `<span>` intacto (verificar que los spans siguen en cyan, no texto plano con etiquetas visibles).
4. Network: `img/about.webp` responde 200. No hay petición a `foto2.png`.
5. En 375 px: la foto va arriba y el texto debajo, sin desborde.

- [ ] **Step 5: Commit**

```bash
git add public/index.html public/styles.css public/dist/i18n.js public/dist/output.css
git commit -m "feat: reescribir About Me con el perfil actual y foto nueva

- fuera 'developer in training': +1.5 años en banca, seguros y salud
- menciona OSB/OIC, React, SENA, Oracle Next Education y MiTuSalud
- foto nueva en WebP con ring de gradiente y ajuste de contraste
- footer con separador y hover de acento"
```

---

## Task 11: Verificación final

No añade features. Cierra el trabajo comprobando el spec completo antes de declararlo terminado.

**Files:**
- Modify: cualquier archivo donde la verificación encuentre un defecto.

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: nada.

- [ ] **Step 1: Compilar CSS limpio y verificar que no hay clases huérfanas**

```bash
npx tailwindcss -i ./public/styles.css -o ./public/dist/output.css
ls -l public/dist/output.css
```

Expected: compila sin warnings.

```bash
grep -rn "bg-gray-900\|bg-gray-800\|text-cyan-500\|bg-gray-700" public/index.html
```

Expected: sin resultados, o solo en lugares intencionales. Las clases viejas de gris deben haber cedido a los tokens `ink`/`accent`.

- [ ] **Step 2: Verificar que no quedan referencias a archivos borrados**

```bash
grep -rn "foto2\|dist/gsap.js\|dist/three.js\|artist-page" public/index.html
```

Expected: solo una coincidencia de `artist-page`, la del botón Code del proyecto del artista (legítima). Cero coincidencias de `foto2`, `dist/gsap.js`, `dist/three.js`.

- [ ] **Step 3: Verificar que las claves de i18n están completas en ambos idiomas**

En la consola del navegador:

```js
const a = Object.keys(I18N.en), b = Object.keys(I18N.es);
console.log('solo en EN:', a.filter(k => !b.includes(k)));
console.log('solo en ES:', b.filter(k => !a.includes(k)));
const used = [...document.querySelectorAll('[data-i18n],[data-i18n-html]')]
  .map(e => e.dataset.i18n || e.dataset.i18nHtml);
console.log('usadas sin definir:', used.filter(k => !a.includes(k)));
```

Expected: los tres arrays vacíos.

- [ ] **Step 4: Recorrido completo en ambos idiomas**

Para `en` y luego `es`, recorrer la página entera. Expected en cada caso:
- Consola sin errores ni 404.
- Ninguna cadena en el idioma equivocado.
- Ningún `undefined` visible.
- Recargar conserva el idioma.

- [ ] **Step 5: Verificación responsive**

En 375 px, 768 px y 1440 px:

```js
// en consola, en cada ancho
console.log('scroll horizontal:', document.documentElement.scrollWidth > window.innerWidth);
```

Expected: `false` en los tres. Además: timeline legible, chips sin texto desbordado, videos a ancho completo en móvil, el toggle de idioma no se superpone al `<ul>` del nav.

- [ ] **Step 6: Verificar el peso de los videos**

```bash
ls -l public/videos/
```

Expected: ninguno supera 2 MB.

- [ ] **Step 7: Verificación de degradación**

| Condición | Expected |
|---|---|
| `prefers-reduced-motion: reduce` | Todo el contenido visible, ninguna animación en bucle, aurora estática |
| Dominio `cdnjs.cloudflare.com` bloqueado | `html.no-anim` presente, todo el contenido visible, sin canvas |
| JavaScript desactivado | El contenido en inglés del HTML es legible; se pierden el fondo, las animaciones y el toggle, pero no hay bloques invisibles |

El caso de JS desactivado merece atención: `.reveal` arranca en `opacity: 0` por CSS y sin JS nada la sube. Si la verificación lo confirma, añadir a `styles.css` la contramedida estándar:

```css
  /* Sin JS no hay quien revele: el estado por defecto debe ser visible.
     El JS marca <html class="js"> y solo entonces se oculta. */
  html.js .reveal {
    opacity: 0;
    transform: translateY(28px);
  }
```

Cambiando la regla base de `.reveal` por esta, y añadiendo al script inline del `<head>`:

```js
document.documentElement.classList.add('js');
```

- [ ] **Step 8: Lighthouse**

Chrome DevTools → Lighthouse → Mobile, categorías Performance y Accessibility.

Expected: Performance ≥ 85, Accessibility ≥ 95.

Si Performance queda por debajo: revisar el frame time del canvas en el trace, y si el fondo es el cuello de botella, bajar `AURORA_SCALE` a 0.5 y `PARTICLE_COUNT` a 500 en `background.js`.

Si Accessibility queda por debajo: los sospechosos son contraste de `text-white/40` sobre el fondo y `alt` faltantes en los `<img>` de tags (llevan `alt=""` a propósito porque son decorativos junto a un texto que ya nombra la tecnología — eso es correcto y Lighthouse lo acepta).

- [ ] **Step 9: Verificar el deploy en Netlify**

```bash
grep -rn 'src="img/\|src="videos/\|href="cv/' public/index.html | grep -i "PNG\|JPG\|WEBP\|WEBM\|PDF\|SVG"
```

Revisar a mano que cada ruta coincide **exactamente** en mayúsculas y minúsculas con el archivo en disco. Netlify sirve desde Linux, que es case-sensitive; Windows no lo detecta en local.

```bash
ls public/img/ public/videos/ public/cv/ public/img/svgs/ | head -60
```

- [ ] **Step 10: Commit final**

```bash
git add -A
git commit -m "fix: correcciones de la verificacion final

Recorrido completo del spec: paridad de claves i18n, responsive en 375/768/1440,
degradacion sin GSAP / sin WebGL / sin JS / reduced-motion, y case exacto de
rutas de assets para el deploy en Linux."
```

---

## Self-Review

**Cobertura del spec.** Cada sección del spec tiene tarea asignada:

| Sección del spec | Tarea |
|---|---|
| Arquitectura / estructura de archivos | Task 1 |
| Límites entre módulos | Task 1 (interfaces declaradas por tarea) |
| Componente 1: fondo Three.js | Task 4 |
| Presupuesto de rendimiento y degradación | Task 4 (Steps 4-5), Task 11 (Step 7-8) |
| Componente 2: sección Experience | Task 7 |
| Componente 3: Skills | Task 8; iconos en Task 3 |
| Componente 4: Projects + MiduGuard | Task 9; video en Task 2 |
| Componente 5: toggle ES/EN | Task 5; claves repartidas en 6-10 |
| Componente 6: contenido, meta, accesibilidad | Task 6 (hero/meta/CV), Task 10 (about/footer) |
| Flujo de datos: idioma | Task 5 |
| Flujo de datos: scroll | Task 4 (partículas), Task 7 (timeline scrub) |
| Manejo de errores: sin WebGL | Task 4 (Step 1, try/catch) |
| Manejo de errores: sin GSAP | Task 1 (`no-anim`) |
| Manejo de errores: clave i18n faltante | Task 5 (Step 1) |
| Manejo de errores: `play()` rechazado | Task 1 (Step 3, `.catch`) |
| Verificación (7 puntos) | Task 11 |
| Decisión pendiente de Nimi | Task 9 (Step 2): se quita el botón |

**Hallazgos del review, ya incorporados al plan:**

1. **Sin JS, todo `.reveal` quedaba invisible.** El spec cubre "sin GSAP" pero no "sin JS", donde ni la clase `no-anim` llega a aplicarse. Añadido como Task 11 Step 7 con la contramedida `html.js .reveal`.
2. **`foto1.png` vs `foto1.PNG`.** El `src` actual no coincide en case con el archivo. Funciona en Windows y falla en Netlify. Añadido a Task 6 Step 4 y verificado en Task 11 Step 9.
3. **Versiones de GSAP desalineadas** (3.11.4 + ScrollTrigger 3.12.5). Unificado en Task 1 Step 5 y elevado a Global Constraint.
4. **`toggleActions: 'restart reset restart reset'`** en el `gsap.js` viejo escondía el contenido al salir del viewport. Reemplazado por `once: true` en Task 1 Step 3.
5. **`currentColor` no atraviesa `<img>`.** El spec asumía que bastaba con `fill="currentColor"`. Resuelto con `brightness(0) invert(1) drop-shadow(var(--glow))` en Task 8 Step 3.
6. **Typo `hover:boder-b-white`** en `index.html:375`. Corregido en Task 5 Step 6.
7. **`IntersectionObserver` sobre el canvas** que mencionaba el diseño inicial es redundante: un canvas `fixed inset-0` siempre intersecta. Solo se usa `visibilitychange`, como ya decía el spec escrito.
8. **Consistencia de nombres verificada:** `initBackground`, `setLanguage`, `initReveals`, `initTimeline`, `I18N`, `.reveal`, `.reveal-child`, `data-stagger`, `.timeline-progress`, `--glow` y `portfolio-lang` se usan con el mismo nombre en todas las tareas que los consumen.
