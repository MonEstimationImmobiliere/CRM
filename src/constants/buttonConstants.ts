/**
 * Types et constantes pour les boutons
 * Utilisé par les composants Button et autres composants utilisant des boutons
 */

/**
 * Types de bouton disponibles
 */
export enum BUTTON_TYPE {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  PRIMARY_GRADIENT = 'primary-gradient',
  SUBMIT = 'submit',
}

/**
 * Formes de bouton disponibles
 */
export enum BUTTON_SHAPE {
  DEFAULT = 'default',
  ROUND = 'round',
  CIRCLE = 'circle',
}

/**
 * Type dérivé pour les types de bouton
 */
export type ButtonType = `${BUTTON_TYPE}`;

/**
 * Type dérivé pour les formes de bouton
 */
export type ButtonShape = `${BUTTON_SHAPE}`;
