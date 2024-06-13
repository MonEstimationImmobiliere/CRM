import type { ComposerTranslation } from "vue-i18n";

import { SIREN_LENGTH, SIRET_LENGTH } from "../constants/common";
import type { TranslatedCustomValidator } from "../types/common";
import { checkLuhn } from "./common";

export const alphaNumericValidator: TranslatedCustomValidator = (translate: ComposerTranslation) => {
  return (_, value: string): boolean | Error => {
    if (!value.length || /^[A-Za-zÀ-ÿ0-9\s]*$/gi.test(value)) {
      return true;
    }

    return new Error(translate("common.form.validation.custom.alphaNumeric"));
  };
};

export const alphaValidator: TranslatedCustomValidator = (translate: ComposerTranslation) => {
  return (_, value: string): boolean | Error => {
    if (!value.length || /^[A-ZÀ-ÿ\s]*$/gi.test(value)) {
      return true;
    }

    return new Error(translate("common.form.validation.custom.alpha"));
  };
};

export const decimalValidator: TranslatedCustomValidator = (translate: ComposerTranslation) => {
  return (_, value: string): boolean | Error => {
    if (!value.length || /^[-]?([0-9]+[,.]?[0-9]*)$/gi.test(value)) {
      return true;
    }

    return new Error(translate("common.form.validation.custom.decimal"));
  };
};

export const numericValidator: TranslatedCustomValidator = (translate: ComposerTranslation) => {
  return (_, value): boolean | Error => {
    if (!value.length || /^[0-9]*$/.test(value)) {
      return true;
    }

    return new Error(translate("common.form.validation.custom.numeric"));
  };
};

export const sirenValidator: TranslatedCustomValidator = (translate: ComposerTranslation) => {
  return (_, value: string|number): boolean | Error => {
    const _value = value.toString();

    if (!_value.length) return true;
    if (numericValidator(translate)(_, _value) === true && _value.length === SIREN_LENGTH && checkLuhn(_value)) return true;

    return new Error(translate("common.form.validation.custom.siren"));
  };
};

export const siretValidator: TranslatedCustomValidator = (translate: ComposerTranslation) => {
  return (_, value: string|number): boolean | Error => {
    const _value = value.toString();
    if (!_value) return true;
    if (numericValidator(translate)(_, _value) === true && _value.length === SIRET_LENGTH && checkLuhn(_value)) return true;

    return new Error(translate("common.form.validation.custom.siret"));
  };
};

export const urlValidator: TranslatedCustomValidator = (translate: ComposerTranslation) => {
  return (_, value): boolean | Error => {
    if (!value) return true;
    try {
      new URL(value);
      return true;
    } catch (e) {
      return new Error(translate("common.form.validation.custom.url"));
    }
  };
};