/**
 * Configuration de l'application.
 *
 * Les valeurs sont lues depuis les variables d'environnement (voir .env.example).
 * Des valeurs par defaut raisonnables sont fournies pour chaque variable.
 */

/** Titre affiche dans l'onglet du navigateur */
export const appTitle: string =
  import.meta.env.VITE_APP_TITLE ?? 'CRM Immobilier';

/**
 * Active le systeme de mocks (intercepte les appels reseau avec MockJS).
 * Par defaut desactive - mettre VITE_MOCK_ENABLED=true dans .env pour activer.
 * Les mocks ne sont jamais actives en production, meme si la variable est a true.
 */
export const isMockEnabled: boolean =
  import.meta.env.VITE_MOCK_ENABLED === 'true' && import.meta.env.DEV;

/**
 * Transitions disponibles pour les changements de route.
 */
export enum transitions {
  fade = 'fade',
  fadeScale = 'fade-scale',
  slideLeft = 'slide-left',
  slideRight = 'slide-right',
  slideUp = 'slide-up',
  slideDown = 'slide-down',
}
