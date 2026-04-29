import zhHans from './quotes/locales/zh-Hans.js';
import zhHant from './quotes/locales/zh-Hant.js';
import en from './quotes/locales/en.js';
import ja from './quotes/locales/ja.js';
import ko from './quotes/locales/ko.js';
import fr from './quotes/locales/fr.js';
import de from './quotes/locales/de.js';

const QUOTE_LOCALES = {
  'zh-Hans': zhHans,
  'zh-Hant': zhHant,
  en,
  ja,
  ko,
  fr,
  de,
};

const DEFAULT_QUOTE_LOCALE = 'zh-Hans';
const QUOTE_COUNT = zhHans.length;
const COMPACT_SUMMARY_LOCALES = new Set(['zh-Hans', 'zh-Hant', 'ja', 'ko']);

function getLocaleRecords(localeCode) {
  const records = QUOTE_LOCALES[localeCode];
  if (!Array.isArray(records) || records.length !== QUOTE_COUNT) {
    return QUOTE_LOCALES[DEFAULT_QUOTE_LOCALE];
  }
  return records;
}

export function getQuoteCount() {
  return QUOTE_COUNT;
}

export function getQuotes(localeCode = DEFAULT_QUOTE_LOCALE) {
  const records = getLocaleRecords(localeCode);
  return records.map((record, index) => ({
    ...QUOTE_LOCALES[DEFAULT_QUOTE_LOCALE][index],
    ...record,
    index,
  }));
}

export function getQuoteByIndex(localeCode, index) {
  const fallback = QUOTE_LOCALES[DEFAULT_QUOTE_LOCALE][index];
  if (!fallback) {
    return null;
  }

  return {
    ...fallback,
    ...getLocaleRecords(localeCode)[index],
    index,
  };
}

export function getQuoteSummary(localeCode, index) {
  const quote = getQuoteByIndex(localeCode, index)?.q || '';
  const limit = COMPACT_SUMMARY_LOCALES.has(localeCode) ? 15 : 28;
  return quote.length > limit ? `${quote.slice(0, limit)}…` : quote;
}