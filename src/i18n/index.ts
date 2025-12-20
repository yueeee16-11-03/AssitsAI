import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

import vi from './vi.json';
import en from './en.json';

const resources = {
  vi: { translation: vi },
  en: { translation: en },
};

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: (cb: (lng: string) => void) => {
    AsyncStorage.getItem('appLanguage')
      .then(saved => {
        if (saved) return cb(saved);
        const locales = RNLocalize.getLocales();
        cb(locales?.[0]?.languageCode ?? 'vi');
      })
      .catch(() => cb('vi'));
  },
  init: () => {},
  cacheUserLanguage: (lng: string) => AsyncStorage.setItem('appLanguage', lng),
};

i18n
  .use(languageDetector as any)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'vi',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export default i18n;
