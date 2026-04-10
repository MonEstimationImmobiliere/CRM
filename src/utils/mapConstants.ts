// filepath: src/utils/mapConstants.ts

/* ----------------------------------------
   MapTiler
---------------------------------------- */
export const MAPTILER_KEY =
  import.meta.env.VITE_MAPTILER_KEY ?? 'qnb10ErHP2vBlMq3fo5B';

export const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

/* ----------------------------------------
   Defaults
---------------------------------------- */
export const DEFAULT_CENTER: [number, number] = [2.35, 48.85];
export const DEFAULT_ZOOM = 13;

/* ----------------------------------------
   Display modes
---------------------------------------- */
export type MapDisplayMode =
  | 'prospection'
  | 'favorites'
  | 'estimations'
  | 'rappels'
  | 'maj'
  | 'dpe'
  | 'dvf';

export const MAP_MODES: { value: MapDisplayMode; label: string }[] = [
  { value: 'prospection', label: 'Prospection' },
  { value: 'favorites', label: 'Favoris' },
  { value: 'estimations', label: 'Estimations' },
  { value: 'rappels', label: 'Rappels' },
  { value: 'maj', label: 'MAJ' },
  { value: 'dpe', label: 'DPE' },
  { value: 'dvf', label: 'DVF' },
];

/* ----------------------------------------
   Map marker colors
---------------------------------------- */
export const COLORS: Record<MapDisplayMode | 'none', string> = {
  prospection: '#4287f5',
  favorites: '#f97316',
  estimations: '#9333ea',
  rappels: '#06b6d4',
  maj: '#8b5cf6',
  dpe: '#10b981',
  dvf: '#ef4444',
  none: '#9ca3af',
};