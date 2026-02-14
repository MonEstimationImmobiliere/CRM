/// <reference types="vite/client" />

/**
 * Typage des variables d'environnement Vite (préfixées VITE_).
 * Voir .env.example pour la documentation de chaque variable.
 */
interface ImportMetaEnv {
  /** URL de base de l'API backend */
  readonly VITE_API_URL: string;
  /** Activer le système de mocks ("true" | "false") */
  readonly VITE_MOCK_ENABLED: string;
  /** Clé API MapTiler */
  readonly VITE_MAPTILER_KEY: string;
  /** Titre de l'application */
  readonly VITE_APP_TITLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
