/**
 * Types de propriétés disponibles
 */
export type PropertyType = 'maison' | 'appartement' | 'immeuble' | 'terrain' | null;

/**
 * Types de chauffage
 */
export type HeatingType =
  | 'electrique'
  | 'gaz'
  | 'fioul'
  | 'bois'
  | 'pompe_chaleur'
  | 'autre'
  | null;

/**
 * Types de fenêtres
 */
export type WindowType = 'simple' | 'double' | 'triple' | null;

/**
 * État de la propriété
 */
export type PropertyCondition = 'neuf' | 'bon' | 'moyen' | 'a_renover' | null;

/**
 * Orientation
 */
export type PropertyOrientation =
  | 'nord'
  | 'sud'
  | 'est'
  | 'ouest'
  | 'nord-est'
  | 'nord-ouest'
  | 'sud-est'
  | 'sud-ouest'
  | null;

/**
 * Types de toiture
 */
export type RoofType =
  | 'tuiles'
  | 'ardoises'
  | 'zinc'
  | 'toit_plat'
  | 'autre'
  | null;

/**
 * Types d'assainissement
 */
export type SanitationType = 'tout_egout' | 'fosse_septique' | 'autre' | null;

/**
 * Interface complète pour une propriété (Favorite ou Property)
 * Basée sur le retour de l'API /property/favorite
 */
export interface IProperty {
  id: number;
  id_fantoir_long: string;
  id_fantoir: string;
  code_insee: string;
  code_postal: string;
  nom_voie: string;
  numero: number | string;
  rep: string | null;
  city: string | null;
  apart_number: string | null;
  /** Alias historique pour apart_number */
  numero_appartement?: string;
  /** Nom de la commune (utilisé par certaines vues) */
  nom_commune?: string;

  property_type: PropertyType;

  surface: number;
  area: number | null;
  floor_number: number | null;
  total_floors: number | null;
  year_built: number | null;
  year_buy: number | null;
  property_condition: PropertyCondition;
  orientation: PropertyOrientation;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number;
  fitted_kitchen: boolean;
  equipped_kitchen: boolean;
  american_kitchen: boolean;
  scullery: boolean;
  heating_type: HeatingType;
  window: string | null;
  window_type: WindowType;
  shutter: string | null;
  cheminee: boolean;
  district_heating: boolean;
  patio: boolean;
  garage: number;
  pool: boolean;
  veranda: boolean;
  garden: boolean;
  parking: boolean;
  basement: boolean;
  dependency: boolean;
  carport: number;
  kitchen_ext: boolean;
  property_tax: number | null;
  roof: RoofType;
  adjoining: boolean;
  sanitation: SanitationType;
  ground: boolean;
  charge: number | null;
  elevator: boolean;
  balcony: boolean;
  cellar: boolean;
  bike_room: boolean;
  guardian: boolean;
  email: string | null;
  phone: string | null;
  owner: string | null;
  price: number | null;
  comment: string | null;
  /** Commentaire de rappel (champ legacy) */
  comment_rappel?: string;
  update_by: number | null;
  date_rappel: string | null;
  code_agence: string;
  id_agence: number | null;
  created_at: string;
  updated_at: string;
  favorite: boolean;
  /** Indique si le bien est loué */
  rented: boolean;
  /** Indique si le bien est créé manuellement */
  is_custom?: boolean;

  /** Liaison vers une unit */
  unit_id?: number | null;
  unit_label?: string;
  row_type?: 'address' | 'unit' | string;

  /** Champs utiles pour le tableau principal */
  type_bien?: string | null;
  type_code?: string | null;
  label?: string | null;
  date_maj?: string | null;

  nombre_ventes?: number | null;
  date_derniere_vente?: string | null;
  dernier_prix_vente?: number | null;
  nombre_estimations?: number | null;
  dernier_prix_estime?: number | null;

  lat?: number | null;
  lon?: number | null;
}

/**
 * Interface pour la création/mise à jour d'une propriété.
 * Tous les champs sont optionnels (formulaire partiel).
 */
export type IPropertyFormData = Partial<IProperty>;

/**
 * @deprecated Utiliser IProperty à la place.
 * Alias conservé pour compatibilité ascendante.
 */
export type PropertyData = Partial<IProperty> & {
  id_fantoir_long: string;
  owner: string;
  email: string;
  phone: string;
  comment: string;
};

/**
 * Liste de propriétés (favoris)
 */
export type PropertyList = IProperty[];

/**
 * Liste de favoris (alias)
 */
export type FavoriteList = IProperty[];