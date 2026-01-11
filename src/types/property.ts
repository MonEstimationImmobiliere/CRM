

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
  /** Identifiant unique de la propriété */
  id: number;
  /** Identifiant FANTOIR long */
  id_fantoir_long: string;
  /** Identifiant FANTOIR de la voie */
  id_fantoir: string;
  /** Code INSEE de la commune */
  code_insee: string;
  /** Code postal */
  code_postal: string;
  /** Nom de la voie */
  nom_voie: string;
  /** Numéro de rue */
  numero: number;
  /** Répétition (bis, ter, etc.) */
  rep: string | null;
  /** Ville */
  city: string | null;
  /** Numéro d'appartement */
  apart_number: string | null;
  /** Type de propriété */
  property_type: PropertyType;
  /** Surface habitable en m² */
  surface: number;
  /** Surface du terrain en m² */
  area: number | null;
  /** Étage de l'appartement */
  floor_number: number | null;
  /** Nombre total d'étages du bâtiment */
  total_floors: number | null;
  /** Année de construction */
  year_built: number | null;
  /** Année d'achat */
  year_buy: number | null;
  /** État de la propriété */
  property_condition: PropertyCondition;
  /** Orientation */
  orientation: PropertyOrientation;
  /** Nombre de pièces */
  rooms: number | null;
  /** Nombre de chambres */
  bedrooms: number | null;
  /** Nombre de salles de bain */
  bathrooms: number;
  /** Cuisine aménagée */
  fitted_kitchen: boolean;
  /** Cuisine équipée */
  equipped_kitchen: boolean;
  /** Cuisine américaine */
  american_kitchen: boolean;
  /** Arrière-cuisine */
  scullery: boolean;
  /** Type de chauffage */
  heating_type: HeatingType;
  /** Type de fenêtres (matériau) */
  window: string | null;
  /** Type de vitrage */
  window_type: WindowType;
  /** Type de volets */
  shutter: string | null;
  /** Cheminée */
  cheminee: boolean;
  /** Chauffage collectif */
  district_heating: boolean;
  /** Patio */
  patio: boolean;
  /** Nombre de garages */
  garage: number;
  /** Piscine */
  pool: boolean;
  /** Véranda */
  veranda: boolean;
  /** Jardin */
  garden: boolean;
  /** Parking */
  parking: boolean;
  /** Sous-sol */
  basement: boolean;
  /** Dépendances */
  dependency: boolean;
  /** Nombre de carports */
  carport: number;
  /** Cuisine extérieure */
  kitchen_ext: boolean;
  /** Taxe foncière */
  property_tax: number | null;
  /** Type de toiture */
  roof: RoofType;
  /** Mitoyen */
  adjoining: boolean;
  /** Type d'assainissement */
  sanitation: SanitationType;
  /** Terrain */
  ground: boolean;
  /** Charges mensuelles */
  charge: number | null;
  /** Ascenseur */
  elevator: boolean;
  /** Balcon */
  balcony: boolean;
  /** Cave */
  cellar: boolean;
  /** Local vélos */
  bike_room: boolean;
  /** Gardien */
  guardian: boolean;
  /** Email du propriétaire */
  email: string | null;
  /** Téléphone du propriétaire */
  phone: string | null;
  /** Nom du propriétaire */
  owner: string | null;
  /** Prix */
  price: number | null;
  /** Commentaire */
  comment: string | null;
  /** ID de l'utilisateur qui a mis à jour */
  update_by: number | null;
  /** Date de rappel */
  date_rappel: string | null;
  /** Code de l'agence */
  code_agence: string;
  /** ID de l'agence */
  id_agence: number | null;
  /** Date de création (ISO 8601) */
  created_at: string;
  /** Date de mise à jour (ISO 8601) */
  updated_at: string;
  /** Indique si c'est un favori */
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
