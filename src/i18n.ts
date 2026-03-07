import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ru from './locales/ru.json';
import en from './locales/en.json';
import zh from './locales/zh.json';
import fa from './locales/fa.json';

const LANGUAGE_STORAGE_KEY = 'cabinet_language';
const SUPPORTED_LANGUAGES = ['ru', 'en', 'zh', 'fa'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const normalizeLanguage = (raw: string | null | undefined): SupportedLanguage => {
  if (!raw) return 'ru';
  const normalized = raw.toLowerCase().replace('_', '-').split('-')[0];
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(normalized)
    ? (normalized as SupportedLanguage)
    : 'ru';
};

const detectInitialLanguage = (): SupportedLanguage => {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored) return normalizeLanguage(stored);
  } catch {
    // localStorage may be unavailable in constrained environments
  }
  return normalizeLanguage(typeof navigator !== 'undefined' ? navigator.language : 'ru');
};

const resources = {
  ru: { translation: ru },
  en: { translation: en },
  zh: { translation: zh },
  fa: { translation: fa },
};

i18n.use(initReactI18next).init({
  resources,
  lng: detectInitialLanguage(),
  fallbackLng: 'ru',
  supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
  load: 'languageOnly',
  cleanCode: true,
  nonExplicitSupportedLngs: true,

  interpolation: {
    escapeValue: false,
  },

  react: {
    useSuspense: false,
  },
  // Initialize synchronously with bundled resources to avoid first-paint i18n key flicker.
  initImmediate: false,
});

i18n.on('languageChanged', (nextLanguage) => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizeLanguage(nextLanguage));
  } catch {
    // localStorage may be unavailable in constrained environments
  }
});

export default i18n;
