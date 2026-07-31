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

    'hero.badge': 'Open to work',
    'hero.greeting': "Hey! I'm",
    'hero.role': 'Software Developer',
    'hero.focus': 'Integrations & Frontend · Banking, Insurance & Health',
    'hero.cv': 'Download CV',
    'hero.linkedin': 'LinkedIn',
    'hero.photoAlt': 'Portrait of Jhoan Sebastian Alzate Franco',

    'skills.heading': 'Skills',
    'skills.frontend': 'Frontend',
    'skills.backend': 'Backend',
    'skills.databases': 'Databases',
    'skills.integration': 'Integration & Middleware',
    'skills.devops': 'DevOps & Tools',
    'skills.ai': 'AI Tooling',

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

    'hero.badge': 'Disponible para trabajar',
    'hero.greeting': 'Hola, soy',
    'hero.role': 'Software Developer',
    'hero.focus': 'Integraciones y Frontend · Banca, Seguros y Salud',
    'hero.cv': 'Descargar CV',
    'hero.linkedin': 'LinkedIn',
    'hero.photoAlt': 'Retrato de Jhoan Sebastian Alzate Franco',

    'skills.heading': 'Skills',
    'skills.frontend': 'Frontend',
    'skills.backend': 'Backend',
    'skills.databases': 'Bases de datos',
    'skills.integration': 'Integración y Middleware',
    'skills.devops': 'DevOps y Herramientas',
    'skills.ai': 'Herramientas de IA',

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
