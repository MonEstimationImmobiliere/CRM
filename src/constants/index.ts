/**
 * Point d'entrée centralisé pour les constantes communes
 *
 * Note: Toutes les constantes de navigation et layout ont été déplacées vers @/layouts/constants
 * Ce fichier ne sert plus qu'à réexporter pour compatibilité ascendante
 *
 * @module common/constants
 * @deprecated Utiliser @/layouts/constants directement
 *
 * @example
 * // Nouvelle façon (recommandée)
 * import { CATEGORY_ICONS, USER_CONTENT } from '@/layouts/constants';
 */

// Réexporter les types et constantes de bouton
export {
  BUTTON_TYPE,
  BUTTON_SHAPE,
  type ButtonType,
  type ButtonShape,
} from './buttonConstants';
