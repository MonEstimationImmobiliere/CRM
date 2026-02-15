// filepath: src/utils/mapConstants.ts
// Constantes partagées pour la carte MapLibre (MapView + SideBarMapView)

/* ----------------------------------------
   MapTiler
---------------------------------------- */
export const MAPTILER_KEY =
  import.meta.env.VITE_MAPTILER_KEY ?? 'qnb10ErHP2vBlMq3fo5B';

export const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

/* ----------------------------------------
   Defaults
---------------------------------------- */
export const DEFAULT_CENTER: [number, number] = [2.35, 48.85]; // Paris
export const DEFAULT_ZOOM = 13;

/* ----------------------------------------
   Display modes
---------------------------------------- */
export type MapDisplayMode =
  | 'prospection'
  | 'estimation'
  | 'rappel'
  | 'favoris'
  | 'dpe';

export const MAP_MODES: { value: MapDisplayMode; label: string }[] = [
  { value: 'prospection', label: 'Prospection' },
  { value: 'estimation', label: 'Estimations' },
  { value: 'rappel', label: 'Rappels' },
  { value: 'favoris', label: 'Favoris' },
  { value: 'dpe', label: 'DPE' },
];

/* ----------------------------------------
   Map marker colors (by mode)
---------------------------------------- */
export const COLORS: Record<MapDisplayMode | 'none', string> = {
  prospection: '#4287f5',
  estimation: '#9333ea',
  rappel: '#06b6d4',
  favoris: '#f97316',
  dpe: '#10b981',
  none: '#d1d5db',
};
