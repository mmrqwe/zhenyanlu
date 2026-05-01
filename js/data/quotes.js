const DEFAULT_QUOTE_LOCALE = 'zh-Hans';
const COMPACT_SUMMARY_LOCALES = new Set(['zh-Hans', 'zh-Hant', 'ja', 'ko']);

const QUOTE_LOADERS = {
  'zh-Hans': () => import('./quotes/locales/zh-Hans.js'),
  'zh-Hant': () => import('./quotes/locales/zh-Hant.js'),
  en: () => import('./quotes/locales/en.js'),
  ja: () => import('./quotes/locales/ja.js'),
  ko: () => import('./quotes/locales/ko.js'),
  fr: () => import('./quotes/locales/fr.js'),
  de: () => import('./quotes/locales/de.js'),
};

const loadedQuoteLocales = new Map();
const loadingQuoteLocales = new Map();

let quoteCount = 0;

function normalizeQuoteLocale(localeCode) {
  return QUOTE_LOADERS[localeCode] ? localeCode : DEFAULT_QUOTE_LOCALE;
}

async function loadQuoteLocale(localeCode) {
  const normalized = normalizeQuoteLocale(localeCode);

  if (loadedQuoteLocales.has(normalized)) {
    return loadedQuoteLocales.get(normalized);
  }

  if (!loadingQuoteLocales.has(normalized)) {
    const pending = QUOTE_LOADERS[normalized]()
      .then((module) => {
        const records = Array.isArray(module.default) ? module.default : [];
        loadedQuoteLocales.set(normalized, records);
        if (normalized === DEFAULT_QUOTE_LOCALE || quoteCount === 0) {
          quoteCount = records.length;
        }
        return records;
      })
      .finally(() => {
        loadingQuoteLocales.delete(normalized);
      });

    loadingQuoteLocales.set(normalized, pending);
  }

  return loadingQuoteLocales.get(normalized);
}

export async function ensureQuoteLocale(localeCode = DEFAULT_QUOTE_LOCALE) {
  const normalized = normalizeQuoteLocale(localeCode);

  if (normalized === DEFAULT_QUOTE_LOCALE) {
    return loadQuoteLocale(normalized);
  }

  const [records] = await Promise.all([
    loadQuoteLocale(normalized),
    loadQuoteLocale(DEFAULT_QUOTE_LOCALE),
  ]);

  return records;
}

function getLocaleRecords(localeCode) {
  const normalized = normalizeQuoteLocale(localeCode);
  const records = loadedQuoteLocales.get(normalized);
  const fallbackRecords = loadedQuoteLocales.get(DEFAULT_QUOTE_LOCALE) || [];

  if (!Array.isArray(records)) {
    return fallbackRecords;
  }

  if (quoteCount > 0 && records.length !== quoteCount) {
    return fallbackRecords;
  }

  return records;
}

export function getQuoteCount() {
  return quoteCount;
}

export function getQuotes(localeCode = DEFAULT_QUOTE_LOCALE) {
  const records = getLocaleRecords(localeCode);
  const fallbackRecords = loadedQuoteLocales.get(DEFAULT_QUOTE_LOCALE) || records;
  return records.map((record, index) => ({
    ...fallbackRecords[index],
    ...record,
    index,
  }));
}

export function getQuoteByIndex(localeCode, index) {
  const records = getLocaleRecords(localeCode);
  const fallbackRecords = loadedQuoteLocales.get(DEFAULT_QUOTE_LOCALE) || records;
  const fallback = fallbackRecords[index];
  const record = records[index];

  if (!fallback && !record) {
    return null;
  }

  return {
    ...fallback,
    ...record,
    index,
  };
}

export function getQuoteSummary(localeCode, index) {
  const quote = getQuoteByIndex(localeCode, index)?.q || '';
  const limit = COMPACT_SUMMARY_LOCALES.has(localeCode) ? 15 : 28;
  return quote.length > limit ? `${quote.slice(0, limit)}…` : quote;
}