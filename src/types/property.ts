

/**
 * Types de propriétés disponibles
 */
export type PropertyType = 'maison' | 'appartement' | null;

/**
 * Types de chauffage
 */
export type HeatingType = 'electrique' | 'gaz' | 'fioul' | 'bois' | 'pompe_chaleur' | 'autre' | null;

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
export type PropertyOrientation = 'nord' | 'sud' | 'est' | 'ouest' | 'nord-est' | 'nord-ouest' | 'sud-est' | 'sud-ouest' | null;

/**
 * Types de toiture
 */
export type RoofType = 'tuiles' | 'ardoises' | 'zinc' | 'toit_plat' | 'autre' | null;

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
  numero: number;
  rep: string | null;
  city: string | null;
  apart_number: string | null;
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
  update_by: number | null;
  date_rappel: string | null;
  code_agence: string;
  id_agence: number | null;
  created_at: string;
  updated_at: string;
  favorite: boolean;
  /** Indique si le bien est loué */
  rented: boolean;
}

/**
 * Interface pour la création/mise à jour d'une propriété
 */
export interface IPropertyFormData {
  id?: number;
  id_fantoir_long?: string;
  id_fantoir?: string;
  code_insee?: string;
  code_postal?: string;
  nom_voie?: string;
  numero?: number;
  rep?: string | null;
  city?: string | null;
  apart_number?: string | null;
  property_type?: PropertyType;
  surface?: number;
  area?: number | null;
  floor_number?: number | null;
  total_floors?: number | null;
  year_built?: number | null;
  year_buy?: number | null;
  property_condition?: PropertyCondition;
  orientation?: PropertyOrientation;
  rooms?: number | null;
  bedrooms?: number | null;
  bathrooms?: number;
  fitted_kitchen?: boolean;
  equipped_kitchen?: boolean;
  american_kitchen?: boolean;
  scullery?: boolean;
  heating_type?: HeatingType;
  window?: string | null;
  window_type?: WindowType;
  shutter?: string | null;
  cheminee?: boolean;
  district_heating?: boolean;
  patio?: boolean;
  garage?: number;
  pool?: boolean;
  veranda?: boolean;
  garden?: boolean;
  parking?: boolean;
  basement?: boolean;
  dependency?: boolean;
  carport?: number;
  kitchen_ext?: boolean;
  property_tax?: number | null;
  roof?: RoofType;
  adjoining?: boolean;
  sanitation?: SanitationType;
  ground?: boolean;
  charge?: number | null;
  elevator?: boolean;
  balcony?: boolean;
  cellar?: boolean;
  bike_room?: boolean;
  guardian?: boolean;
  email?: string | null;
  phone?: string | null;
  owner?: string | null;
  price?: number | null;
  comment?: string | null;
  favorite?: boolean;
  rented?: boolean;
}

/**
 * @deprecated Utiliser IProperty à la place
 * Ancienne interface pour la compatibilité
 */
export interface PropertyData {
  id_fantoir_long: string;
  id_fantoir?: string;
  numero?: string;
  rep?: string;
  nom_voie?: string;
  numero_appartement?: string;
  code_postal?: string;
  city?: string;
  nom_commune?: string;
  owner: string;
  email: string;
  phone: string;
  property_type: string;
  year_built: number;
  year_buy: number;
  surface: number;
  area: number;
  orientation: string;
  property_condition: string;
  bedrooms: number;
  bathrooms: number;
  fitted_kitchen: boolean;
  equipped_kitchen: boolean;
  american_kitchen: boolean;
  scullery: boolean;
  heating_type: string;
  window: string;
  window_type: string;
  shutter: string;
  cheminee: boolean;
  district_heating: boolean;
  patio: boolean;
  Garage: boolean;
  pool: boolean;
  veranda: boolean;
  garden: boolean;
  parking: boolean;
  Carport: boolean;
  kitchen_ext: boolean;
  elevator: boolean;
  balcony: boolean;
  cellar: boolean;
  bike_room: boolean;
  guardian: boolean;
  roof: string;
  adjoining: boolean;
  basement: boolean;
  dependency: boolean;
  ground: boolean;
  comment: string;
  date_rappel: string | null;
  comment_rappel?: string;
  id?: number;
  price?: number;
  is_custom?: boolean;
  user_id?: number;
  agency_id?: number;
  favorite?: boolean;
}

/**
 * Liste de propriétés (favoris)
 */
export type PropertyList = IProperty[];

/**
 * Liste de favoris (alias)
 */
export type FavoriteList = IProperty[];
