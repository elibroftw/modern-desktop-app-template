import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
// translations is used by App.js to create a language selector
// import './i18n';
export const defaultLng = 'en';
export const translations = {
  en: {
    translations: {
      contactUsMessage: 'If you have any questions or requests, feel free to send an email to',
    }
  },
  fr: {
    translations: {
      Home: 'Accueil',
      contactUsMessage: "Si vous avez des questions ou des demandes, n'hésitez pas à envoyer un email à",
      'Monday to Saturday': 'Lundi à Samedi'
    }
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // we init with resources
    resources: translations,
    fallbackLng: defaultLng,
    debug: false,

    // have a common namespace used around the full app
    ns: ['translations'],
    defaultNS: 'translations',

    keySeparator: false, // we use content as keys

    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
