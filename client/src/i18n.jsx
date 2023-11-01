import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Importing translation files

import translationEN from "./locales/en/translation.json";
import translationJP from "./locales/jp/translation.json";

const initLanguage = (defaultValue) => {
  const value = localStorage.getItem('language');
  if(value) {
    return value;
   } else {
    localStorage.setItem('language', defaultValue);
    return defaultValue
   }
}

//Creating object with the variables of imported translation files
const resources = {
  en: {
    translation: translationEN,
  },
  jp: {
    translation: translationJP,
  },
};

//i18N Initialization

i18n.use(initReactI18next).init({
  resources,
  lng: initLanguage('jp'), //code asli
  // lng: 'jp', //hardcode jp
  // keySeparator: false,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
