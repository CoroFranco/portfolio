# Portfolio 2026 — Diseño de rediseño y actualización

**Fecha:** 2026-07-31
**Autor:** Jhoan Sebastian Alzate Franco
**Estado:** Aprobado

## Contexto

El portafolio (`https://jhoan-alzate.netlify.app/`) es un sitio estático de un solo
archivo HTML con Tailwind CLI, GSAP + ScrollTrigger y Three.js, desplegado en Netlify
desde `public/`. No se actualiza desde ~septiembre 2024.

Tres desfases con la realidad actual:

1. **Contenido obsoleto.** El sitio se presenta como "Full Stack developer in training"
   y clasifica React y TypeScript como "Learning". El CV actual acredita más de año y
   medio de experiencia profesional en Cidenet, con React en producción y una
   especialidad en middleware Oracle que el sitio no menciona.
2. **No existe sección de experiencia laboral.** Es la omisión más costosa: el
   diferenciador real (integraciones bancarias, seguros, salud) es invisible.
3. **El fondo Three.js está roto.** `#background-container` mide `w-[50px]` y las
   partículas tienen `size: 0.0005`, así que la escena es efectivamente invisible.

## Objetivos

- Reflejar el perfil profesional actual (Software Developer, no "in training").
- Exponer la experiencia laboral y la especialidad en integración/middleware.
- Modernizar el lenguaje visual y las animaciones sin cambiar de stack ni de deploy.
- Incorporar MiduGuard como tercer proyecto.
- Servir tanto a reclutadores internacionales como locales (bilingüe).

## No objetivos

- Migrar a Astro, React o cualquier framework. Se mantiene HTML + Tailwind + GSAP.
- Cambiar el pipeline de build o la configuración de Netlify.
- Rediseñar los proyectos existentes (Artist Page, Nimi) más allá de su presentación.
- Backend, formulario de contacto o CMS. El contacto sigue siendo `mailto:`.

## Decisiones tomadas

| Decisión | Elección |
|---|---|
| Alcance | Modernizar el HTML actual (vanilla) |
| Idioma | Bilingüe con toggle, default inglés |
| Video de MiduGuard | Instalar ffmpeg y convertir a WebM |
| Experiencia laboral | Sí, timeline animado |
| Dirección visual | Dark tech / aurora |
| Fondo 3D | Mantener Three.js, rehacerlo bien |

## Arquitectura

Se conserva la estructura de archivos existente, con los scripts separados por
responsabilidad en lugar de por librería:

```
public/
  index.html            # marcado, con atributos data-i18n
  styles.css            # fuente Tailwind + capas custom
  dist/output.css        # generado por Tailwind CLI (no editar)
  dist/background.js     # escena Three.js (antes three.js)
  dist/animations.js     # timelines GSAP + ScrollTrigger (antes gsap.js)
  dist/i18n.js           # diccionario ES/EN y toggle
  dist/script.js         # nav, smooth scroll, typewriter
  cv/Jhoan_Sebastian_Alzate_CV.pdf
  img/svgs/*.svg         # + ~18 iconos nuevos
  img/about.webp         # foto nueva (reemplaza foto2.png)
  videos/miduguard.webm
```

`dist/` ya está versionado en git y no lo genera ningún bundler (solo `output.css`
proviene de Tailwind CLI); los `.js` bajo `dist/` son fuentes escritas a mano. Se
mantiene esa convención para no alterar el deploy, pero se renombran los archivos
para que el nombre describa su función y no su dependencia.

### Límites entre módulos

Cada script es independiente y no comparte estado con los demás:

- **`background.js`** — expone `initBackground()`. Dueño exclusivo del canvas WebGL.
  No conoce el DOM del contenido.
- **`animations.js`** — dueño exclusivo de los timelines GSAP. Lee el DOM por clases
  (`.reveal`, `.timeline-item`, `.skill-chip`), no por IDs frágiles.
- **`i18n.js`** — expone `setLanguage(lang)`. Único módulo que escribe texto en el
  DOM. Emite un evento `languagechange` para que otros módulos reaccionen si lo
  necesitan, en vez de acoplarse.
- **`script.js`** — interacción de navegación. Sin dependencias de GSAP ni Three.

## Componentes

### 1. Fondo Three.js

Dos capas dentro de un único `WebGLRenderer` sobre `#background-canvas`, posicionado
`fixed inset-0 -z-10`.

**Capa aurora.** Un `PlaneGeometry` fullscreen con `ShaderMaterial` propio. El
fragment shader genera fBm (ruido de valor con 4 octavas) desplazado en el tiempo
para producir cortinas verticales suaves. Paleta interpolada de `#050510` (fondo) a
`#22d3ee` (cyan) y `#8b5cf6` (violeta), con un tercer acento índigo en los picos.
Uniforms: `uTime`, `uResolution`, `uMouse`, `uIntensity`.

**Capa partículas.** Tres `Points` en z = -1, 0, 1 con ~800 vértices en total,
`PointsMaterial` con textura de glow radial generada en canvas (sin fetch), blending
aditivo y `depthWrite: false`. Cada capa rota a distinta velocidad y responde al
mouse con parallax interpolado (`lerp` con factor 0.05), más un desplazamiento
vertical ligado al progreso de scroll.

**Presupuesto de rendimiento.** Estas son restricciones de implementación, no
aspiraciones:

- `renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))`.
- El shader se renderiza a 0.6× de la resolución del viewport y se escala.
- El bucle de render se detiene con `document.visibilitychange` (tab en background).
- `resize` con debounce de 150 ms.
- Sin geometría por partícula: un solo `BufferGeometry` por capa.

**Degradación.** En orden de precedencia:

1. `prefers-reduced-motion: reduce` → un único frame del shader, sin bucle de
   animación y sin partículas.
2. Viewport `< 768px` → solo capa aurora, sin partículas.
3. Sin contexto WebGL → se oculta el canvas y actúa el gradiente CSS de respaldo
   definido en `styles.css`.

### 2. Sección Experience

Nueva sección entre Projects y Skills. Timeline vertical: una línea de gradiente
cyan→violeta cuya altura se anima con `ScrollTrigger` en modo `scrub`, de modo que
se dibuja al bajar y se recoge al subir.

Cidenet es el encabezado (empleador, Enero 2025 – Actualidad) y cada cliente es un
nodo:

| Cliente | Periodo | Contenido |
|---|---|---|
| Banco Ficohsa | Ene 2025 – Oct 2025 | Diseño, desarrollo, pruebas y despliegue de flujos e integraciones SOAP/REST para la capa media con Oracle Service Bus (11g/12c) y OIC, en Scrum |
| SURA | Oct 2025 – Dic 2025 | Migración de formularios Oracle Forms en la modernización de aplicaciones internas |
| PSF · Seguros | Ene 2026 – Mar 2026 | Funcionalidades con React y Node.js; modelado en PostgreSQL; despliegue con Docker |
| CYSNET · MiTuSalud | Abr 2026 – Actualidad | Dos portales React del sector salud (pacientes y profesionales); diseño de interfaces e implementación de servicios |

Cada nodo entra con `y: 30 → 0` y opacidad, en stagger de 0.12 s. El punto del nodo
activo (MiTuSalud) lleva un badge "Now" / "Ahora" con animación de pulso en CSS.

### 3. Skills

Seis categorías en lugar de cuatro, tomadas del CV. Se elimina la categoría
"Learning", que subrepresenta el nivel actual.

- **Frontend** — React, Next.js, Astro, Angular, Vue, TypeScript, JavaScript,
  Tailwind, Sass, GSAP, Three.js
- **Backend** — Node.js, NestJS, Spring Boot, Laravel, Express, PHP
- **Databases** — PostgreSQL, Oracle, MySQL, MongoDB
- **Integration & Middleware** — Oracle Service Bus (11g/12c), Oracle Integration
  Cloud, OCI
- **DevOps & Tools** — Docker, Kubernetes, Git, GitHub, GitLab, Bitbucket, Figma
- **AI Tooling** — OpenCode, MCP (Model Context Protocol), prompt & skill design

Cada skill es un chip de vidrio (`backdrop-blur`, borde `white/10`). En hover el
icono se eleva 2 px y proyecta un glow del color de marca, declarado por chip con
una custom property `--glow`. Las categorías entran con stagger al scroll.

*Integration & Middleware* se ubica en primera posición de la segunda fila y lleva un
borde de acento: es la categoría que distingue el perfil.

**Iconos.** Faltan aproximadamente 18 SVGs (Next.js, Angular, Vue, NestJS, Spring
Boot, PostgreSQL, Oracle, Docker, Kubernetes, GitLab, Bitbucket, GSAP, Three.js,
Turso, Clerk, Zustand y los de OSB/OIC/OCI). Se descargan de Simple Icons vía
jsDelivr a `public/img/svgs/`. Para las marcas sin icono en Simple Icons (OSB, OIC,
MCP, OpenCode) se usa un glifo SVG propio monocromo, coherente con el resto.

### 4. Projects

Tres proyectos con layout alternado (video izquierda / texto derecha, invertido en el
segundo). Cambios sobre las cards actuales:

- Se elimina el estado inicial `scale-[1.5]`, que recorta el contenido del video. Se
  reemplaza por `scale-[1.03]` en reposo → `scale-1` en hover.
- Borde de gradiente animado en hover mediante pseudo-elemento con `conic-gradient`.
- Overlay con icono de play que desaparece al reproducir.
- Se conservan `playsinline` y `muted`; se añade `preload="metadata"` para no
  descargar los tres videos al cargar.

**MiduGuard** (nuevo): juego educativo que combina la mecánica de gestión de
fronteras de *Papers, Please* con el aprendizaje práctico de SQL. El jugador es
oficial de inmigración en Midulandia y verifica datos de visitantes escribiendo
consultas SQL, con dificultad progresiva. Tags: Next.js, Turso, Clerk, Zustand,
Tailwind, GSAP. Botones: Code (`github.com/CoroFranco/MiduGuard`) y Preview
(`midu-guard.vercel.app`).

**Video.** Se instala ffmpeg con `winget install Gyan.FFmpeg` y se convierte
`20260731-1544-10.8812199.mp4` (27.8 MB) a WebM VP9: ancho 1000 px, sin audio, CRF
ajustado para quedar en el rango de 1–2 MB de los videos existentes. Si el clip
excede 15 s se recorta al segmento más representativo. El MP4 original no se
versiona: se añade `*.mp4` a `.gitignore`.

### 5. Toggle ES/EN

Cada nodo de texto traducible lleva `data-i18n="clave"`; los atributos usan
`data-i18n-attr="alt:clave"`. `i18n.js` contiene un diccionario plano con las claves
en ambos idiomas.

- Control tipo píldora en el nav con indicador deslizante entre EN y ES.
- Default inglés. La preferencia persiste en `localStorage` bajo `portfolio-lang`.
- Al cambiar: actualiza los textos, el atributo `lang` de `<html>`, el `<title>` y
  las meta description, y emite el evento `languagechange`.
- Los textos en español provienen literalmente del CV; los de inglés son su
  traducción.
- Sin FOUC: el idioma se resuelve en un script inline en `<head>` antes de pintar.

### 6. Contenido, meta y accesibilidad

- **Hero:** el título pasa a "Software Developer", con subtítulo "Integrations &
  Frontend · Banking, Insurance & Health". Se conserva el typewriter del nombre y el
  badge "Open to work".
- **Botón "Download CV"** en el hero, junto a LinkedIn, apuntando a
  `cv/Jhoan_Sebastian_Alzate_CV.pdf`.
- **About Me** reescrito a partir del resumen del CV: más de año y medio orquestando
  procesos entre sistemas para banca, seguros y salud, combinando integraciones de
  backend con interfaces en React.
- **Foto final:** `Jhoan Sebastian Alzate Franco (1).jpg` reemplaza a `foto2.png`,
  convertida a WebP como `img/about.webp`, en crop circular con ring de gradiente y
  ligero ajuste de contraste para que el fondo claro no compita con el tema oscuro.
  La foto del hero (`foto1.PNG`) no cambia.
- **LinkedIn:** el hero tiene hoy dos URLs distintas (`/in/jhoan-sebastian-alzate-
  franco-a05053314/` y `/in/coro-franco/`). Se unifica en `/in/coro-franco`, la del
  CV.
- **Meta:** se actualizan `og:title`, `og:description` e `og:image`; se añaden
  `twitter:card`, `description`, `theme-color` y favicon.
- **Accesibilidad:** `alt` descriptivos en todos los iconos, `aria-label` en el
  toggle de idioma, foco visible en los enlaces del nav, contraste AA sobre el fondo
  oscuro, y respeto global a `prefers-reduced-motion` (las animaciones GSAP se
  reducen a estados finales).

## Flujo de datos

El sitio no tiene backend ni estado compartido. Los dos únicos flujos son:

1. **Idioma:** `localStorage` → script inline en `<head>` → `setLanguage()` → DOM.
   El click en el toggle escribe `localStorage` y vuelve a llamar `setLanguage()`.
2. **Scroll:** `ScrollTrigger` observa el scroll y avanza los timelines; el mismo
   progreso se lee en `background.js` para el desplazamiento de las partículas.

## Manejo de errores

Sin red ni entradas de usuario, los modos de fallo son de entorno:

- **WebGL ausente o `createShader` falla:** `initBackground()` envuelve la
  inicialización en `try/catch`; ante error oculta el canvas y no lanza. El gradiente
  CSS de `styles.css` queda visible.
- **GSAP o ScrollTrigger no cargan (CDN caído):** `animations.js` verifica
  `typeof gsap` y, si falta, añade una clase `no-anim` a `<html>` que fuerza los
  estados finales por CSS. El contenido nunca queda invisible por depender de una
  animación que no corrió.
- **Clave de i18n faltante:** `setLanguage` deja el texto existente en lugar de
  escribir `undefined`.
- **Video que no reproduce:** el `play()` en hover se envuelve en `.catch(() => {})`,
  ya que devuelve una promesa que rechaza en algunos navegadores.

## Verificación

No hay framework de test y no se introduce uno; sería infraestructura
desproporcionada para un sitio estático de una página. La verificación es manual y
explícita, ejecutada antes de dar el trabajo por terminado:

1. `npx tailwindcss -i ./public/styles.css -o ./public/dist/output.css` compila sin
   errores.
2. Se sirve `public/` y se revisa en Chrome: consola sin errores, las tres secciones
   nuevas visibles, el fondo aurora renderizando.
3. Toggle de idioma: EN→ES→EN sin texto sin traducir ni `undefined`; recarga
   conserva el idioma.
4. Responsive en 375 px, 768 px y 1440 px: sin scroll horizontal, timeline legible,
   chips sin desbordar.
5. Los tres videos reproducen en hover y ninguno supera 2 MB.
6. Con `prefers-reduced-motion: reduce` activado en DevTools: todo el contenido es
   visible y no hay animación en bucle.
7. Lighthouse en móvil: Performance ≥ 85, Accessibility ≥ 95.

## Riesgos

- **El fondo WebGL en móviles de gama baja.** Mitigado por el presupuesto de
  rendimiento y la degradación por viewport, pero es el punto a vigilar en la
  verificación con Lighthouse.
- **Descarga de iconos.** Requiere acceso a jsDelivr. Si falla, el respaldo es
  dibujar glifos monocromos propios, con pérdida de fidelidad de marca.

## Decisión pendiente

El botón **Code** de *Nimi Platform* apunta a `github.com/CoroFranco/artist-page`,
que es el repositorio del proyecto del artista, no de Nimi. Es un bug del sitio
actual. A falta de la URL correcta, la implementación **elimina el botón** en vez de
enlazar a un repo equivocado. Si la URL existe, se sustituye.
