import type { DvfSaleIdentity } from './dvf';

/**
 * Interface pour une adresse groupée par rue
 * Utilisé par l'endpoint /address-city-grouped/{codeInsee}
 */
export interface IAddressGrouped {
  id_fantoir: string;
  nom_voie: string;
  nom_commune: string;
  code_postal: string;
  total_adresses: number;
  lat: number;
  lon: string;
}

/**
 * Interface pour une adresse détaillée
 * Utilisé par l'endpoint /addresses/{id_fantoir}?type=adress
 */
export interface IAddressDetail {
  dvf_address_history_count?: number;
  unit_id?: number | string | null;
  display_estimate?: import('@/views/DashboardComponents/ProspectionEstimatedPrice.vue').DisplayEstimate | null;
  prospection_address_key?: string | null;
  prospection_street_key?: string | null;
  id_fantoir_long: string;
  code_insee: string;
  id_fantoir: string;
  numero: string;
  rep: string;
  nom_voie: string;
  nom_commune: string;
  code_postal: string;
  lat: string;
  lon: string;
  surface: number | null;
  bedrooms: number | null;
  area: number | null;
  price: number | null;
  favorite: string;
  apart_number: string;
  unit_label?: string | null;
  owner?: string | null;
  type_bien: string;
  nombre_ventes: number;
  date_derniere_vente: string | null;
  dernier_prix_vente: number | null;
  dernier_prix_vente_m2?: number | null;
  derniere_vente_surface_batie?: number | null;
  derniere_vente_residentielle?: boolean;
  derniere_vente_code_type_local?: '1' | '2' | '4' | null;
  derniere_vente_dvf?: (DvfSaleIdentity & { lots: string[] }) | null;
  date_mutation_dvf_ambigue?: string;
  nombre_estimations: number;
  date_maj: string | null;
  date_rappel: string | null;
  dernier_prix_estime: number | null;
  id: number | null;
  bathrooms: number | null;
}

/**
 * Liste d'adresses groupées
 */
export type AddressGroupedList = IAddressGrouped[];

/**
 * Liste d'adresses détaillées
 */
export type AddressDetailList = IAddressDetail[];

/**
 * Interface pour l'item d'autocomplete d'adresse
 */
export interface IAddressAutocompleteItem {
  value: string;
  city?: string;
  codeInsee?: string;
  idFantoir?: string;
}
