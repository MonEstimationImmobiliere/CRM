export interface IUnit {
  id?: number | null;

  id_fantoir_long?: string;
  id_fantoir?: string;

  code_insee?: string;
  code_postal?: string;

  nom_voie?: string;

  numero?: string | number | null;
  rep?: string | null;

  city?: string | null;

  unit_type?: string | null;
  unit_label?: string | null;

  apart_number?: number | null;
  floor_number?: number | null;

  staircase?: string | null;
  building?: string | null;

  lot_number?: string | null;
}