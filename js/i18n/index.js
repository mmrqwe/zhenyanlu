import zhHans from './locales/zh-Hans.js';
import zhHant from './locales/zh-Hant.js';
import en from './locales/en.js';
import ja from './locales/ja.js';
import ko from './locales/ko.js';
import fr from './locales/fr.js';
import de from './locales/de.js';

const STORAGE_KEY = 'mzd-quote-locale';
const DEFAULT_LOCALE = 'en';

const LOCALES = {
  'zh-Hans': zhHans,
  'zh-Hant': zhHant,
  en,
  ja,
  ko,
  fr,
  de,
};

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
  return Object.values(LOCALES).map(({ code, nativeName }) => ({
    code,
    nativeName,
  }));
}

export function getMessages(localeCode) {
  const normalized = normalizeLocale(localeCode) || DEFAULT_LOCALE;
  return LOCALES[normalized] || LOCALES[DEFAULT_LOCALE];
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
