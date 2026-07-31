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
