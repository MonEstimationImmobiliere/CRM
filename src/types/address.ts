// filepath: /Users/yogann-henry/Documents/Develop/Projets-Perso/CRM_V2/CRM/src/types/address.ts

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
  type_bien: string;
  nombre_ventes: number;
  date_derniere_vente: string | null;
  dernier_prix_vente: number | null;
  nombre_estimations: number;
  date_maj: string | null;
  date_rappel: string | null;
  dernier_prix_estime: number | null;
  id: number | null;
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
