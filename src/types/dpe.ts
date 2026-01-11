// filepath: /Users/yogann-henry/Documents/Develop/Projets-Perso/CRM_V2/CRM/src/types/dpe.ts

/**
 * Type de bâtiment pour le DPE
 */
export type DpeBuildingType = 'maison' | 'appartement';

/**
 * Étiquettes DPE possibles (A à G)
 */
export type DpeLabel = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

/**
 * Interface pour un résultat DPE individuel
 */
export interface IDpeResult {
  adresse_ban: string;
  _geopoint: string;
  type_batiment: DpeBuildingType;
  date_etablissement_dpe: string;
  etiquette_dpe: DpeLabel;
  _score: number | null;
}

/**
 * Interface pour la réponse paginée de l'API DPE
 */
export interface IDpeResponse {
  total: number;
  results: IDpeResult[];
}

/**
 * Interface pour les filtres de recherche DPE
 */
export interface IDpeFilters {
  codeInsee?: string;
  typeBatiment?: DpeBuildingType;
  etiquetteMin?: DpeLabel;
  etiquetteMax?: DpeLabel;
  dateMin?: string;
  dateMax?: string;
}
