import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import fr from "./fr.json";

i18next.use(initReactI18next).init({
  lng: navigator.language.split("-")[0] ?? "en",
  fallbackLng: false,
  interpolation: {
    skipOnVariables: false,
  },
  resources: {
    en: {
      ...en,
    },
    fr: {
      ...fr,
    },
  },
});
