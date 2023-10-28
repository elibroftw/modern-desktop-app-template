import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

export const defaultLng = 'en';
// this is exported in order to avoid hard coding supported languages in more than 1 place
const resources = {
  en: {
    translations: {
      transExample: 'This template is located on <0>github.com{{variable}}</0>'
    }
  },
  fr: {
    translations: {
      'Minimize': 'Réduire',
      'Maximize': 'Agrandir',
      'Restore Down': 'Niveau inf.',
      'Close': 'Fermer',
      Home: 'Accueil',
      'Monday to Saturday': 'Lundi à Samedi',
      transExample: 'Ce modèle se trouve sur <0>github.com{{variable}}</0>',
      'Update v{{ v }} available': 'Mise à jour v{{ v }} disponible',
      'Install update and relaunch': 'Installer la mise à jour et relancer',
      'Installing update v{{ v }}': 'Installation de la mise à jour v{{ v }}',
      'Will relaunch afterwards': 'Relancera ensuite'
    }
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // we init with resources
    resources,
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
