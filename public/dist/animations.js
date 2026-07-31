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
  initTimeline();
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
