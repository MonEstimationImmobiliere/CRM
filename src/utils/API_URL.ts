/**
 * URL de base de l'API.
 * Lue depuis la variable d'environnement VITE_API_URL (voir .env.example).
 * Un fallback est fourni pour éviter un crash si la variable est absente.
 */
export const API_URL: string =
  import.meta.env.VITE_API_URL ??
  'https://monestimationimmobiliere.fr/myimmo/public/api';

export default API_URL;
