import React from "react";
import ReactDOM from "react-dom";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import EN_TRANSLATIONS from "./generated/en.json";
import App from "./App";
import * as serviceWorker from "./serviceWorker";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: EN_TRANSLATIONS
    }
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

ReactDOM.render(<App />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
