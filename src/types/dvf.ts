export interface IDvfBuiltItem {
  type_local: string | null;
  surface_reelle_bati: number | null;
  nombre_pieces_principales: number | null;
}

export interface IDvfLandItem {
  nature_culture: string | null;
  surface_terrain: number | null;
  id_parcelle: string | null;
}

export interface IDvfPoint {
  lat: number;
  lon: number;

  id_mutation?: string;
  numero_disposition?: number | null;

  adresse: string;
  date_mutation: string;
  valeur_fonciere: number | null;

  main_type?: string;
  line_count?: number;

  built_items?: IDvfBuiltItem[];
  land_items?: IDvfLandItem[];
  total_surface_terrain?: number | null;
}