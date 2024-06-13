import { createI18n } from "vue-i18n";

import fr from "./fr.json";

export {
  fr
};

export const i18n = createI18n({
  legacy: false,
  locale: "fr",
  messages: {
    fr
  }
});