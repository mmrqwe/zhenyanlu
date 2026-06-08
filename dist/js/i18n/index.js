const STORAGE_KEY = 'mzd-quote-locale';
const DEFAULT_LOCALE = 'en';

const SUPPORTED_LOCALES = [
  { code: 'zh-Hans', nativeName: '简体中文' },
  { code: 'zh-Hant', nativeName: '繁體中文' },
  { code: 'en', nativeName: 'English' },
  { code: 'ja', nativeName: '日本語' },
  { code: 'ko', nativeName: '한국어' },
  { code: 'fr', nativeName: 'Français' },
  { code: 'de', nativeName: 'Deutsch' },
];

const LOCALE_LOADERS = {
  'zh-Hans': () => import('./locales/zh-Hans.js'),
  'zh-Hant': () => import('./locales/zh-Hant.js'),
  en: () => import('./locales/en.js'),
  ja: () => import('./locales/ja.js'),
  ko: () => import('./locales/ko.js'),
  fr: () => import('./locales/fr.js'),
  de: () => import('./locales/de.js'),
};

const loadedLocales = new Map();
const loadingLocales = new Map();

const LANGUAGE_ALIASES = {
  en: 'en',
  'en-us': 'en',
  'en-gb': 'en',
  ja: 'ja',
  'ja-jp': 'ja',
  ko: 'ko',
  'ko-kr': 'ko',
  fr: 'fr',
  'fr-fr': 'fr',
  de: 'de',
  'de-de': 'de',
};

function normalizeChineseLocale(normalized) {
  if (!normalized.startsWith('zh')) {
    return null;
  }

  try {
    const locale = new Intl.Locale(normalized);
    if (locale.language !== 'zh') {
      return null;
    }

    if (locale.script === 'Hant') {
      return 'zh-Hant';
    }

    if (locale.script === 'Hans') {
      return 'zh-Hans';
    }

    if (['TW', 'HK', 'MO'].includes(locale.region || '')) {
      return 'zh-Hant';
    }

    return 'zh-Hans';
  } catch {
    if (/(^zh$|-hant$|-tw$|-hk$|-mo$)/.test(normalized)) {
      return /(hant|tw|hk|mo)/.test(normalized) ? 'zh-Hant' : 'zh-Hans';
    }
    return null;
  }
}

function deepGet(messages, key) {
  return key.split('.').reduce((value, segment) => {
    if (value && typeof value === 'object') {
      return value[segment];
    }
    return undefined;
  }, messages);
}

export function normalizeLocale(input) {
  if (!input) {
    return null;
  }

  const normalized = String(input).trim().replace(/_/g, '-').toLowerCase();
  if (!normalized) {
    return null;
  }

  const chineseLocale = normalizeChineseLocale(normalized);
  if (chineseLocale) {
    return chineseLocale;
  }

  if (LANGUAGE_ALIASES[normalized]) {
    return LANGUAGE_ALIASES[normalized];
  }

  return LANGUAGE_ALIASES[normalized.split('-')[0]] || null;
}

export function getSupportedLocales() {
  return SUPPORTED_LOCALES.map(({ code, nativeName }) => ({ code, nativeName }));
}

export function getMessages(localeCode) {
  const normalized = normalizeLocale(localeCode) || DEFAULT_LOCALE;
  return loadedLocales.get(normalized) || loadedLocales.get(DEFAULT_LOCALE) || null;
}

export async function ensureMessages(localeCode) {
  const normalized = normalizeLocale(localeCode) || DEFAULT_LOCALE;

  if (loadedLocales.has(normalized)) {
    return loadedLocales.get(normalized);
  }

  if (!loadingLocales.has(normalized)) {
    const load = LOCALE_LOADERS[normalized] || LOCALE_LOADERS[DEFAULT_LOCALE];
    const pending = load()
      .then((module) => {
        loadedLocales.set(normalized, module.default);
        return module.default;
      })
      .finally(() => {
        loadingLocales.delete(normalized);
      });

    loadingLocales.set(normalized, pending);
  }

  try {
    return await loadingLocales.get(normalized);
  } catch (error) {
    if (normalized !== DEFAULT_LOCALE) {
      return ensureMessages(DEFAULT_LOCALE);
    }
    throw error;
  }
}

export function translate(messages, key, params = {}) {
  const value = deepGet(messages, key);
  if (typeof value === 'function') {
    return value(params);
  }
  return value ?? key;
}

export function detectLocale() {
  const queryLocale = normalizeLocale(new URLSearchParams(window.location.search).get('lang'));
  if (queryLocale) {
    return queryLocale;
  }

  try {
    const savedLocale = normalizeLocale(window.localStorage.getItem(STORAGE_KEY));
    if (savedLocale) {
      return savedLocale;
    }
  } catch {
    // Ignore storage access failures.
  }

  const browserLocales = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language];

  for (const candidate of browserLocales) {
    const locale = normalizeLocale(candidate);
    if (locale) {
      return locale;
    }
  }

  return DEFAULT_LOCALE;
}

export function saveLocale(localeCode) {
  const normalized = normalizeLocale(localeCode);
  if (!normalized) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    // Ignore storage access failures.
  }
}
