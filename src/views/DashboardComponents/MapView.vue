<template>
  <section class="mapContainer">
    <div class="map-wrapper">
      <div id="map" class="map"></div>
      <button
        class="recenter-btn"
        title="Recentrer la carte"
        @click="handleRecenter"
      >
        <el-icon :size="20"><MapLocation /></el-icon>
      </button>
      <button
  class="parcelles-btn"
  :class="{ active: showParcelles }"
  title="Afficher / masquer les parcelles"
  @click="toggleParcelles"
>
  Parcelles
</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch, nextTick, computed, ref } from 'vue';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapLocation } from '@element-plus/icons-vue';
import { useDashboardStore } from '@/stores/dashboard';
import { useRemindersStore } from '@/stores/reminders';
import { useMapPopups, type MapAddress } from '@/composables/useMapPopups';
import {
  COLORS,
  MAP_STYLE,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
} from '@/utils/mapConstants';

import type { IAddressDetail, IAddressGrouped } from '@/types/address';



type Address = IAddressDetail | IAddressGrouped;

interface CityCenter {
  lat: number;
  lon: number;
}

interface DpePoint {
  lat: number;
  lon: number;
  adresse: string;
  etiquette: string;
  type: string;
  date: string;
}

interface DvfPoint {
  lat: number;
  lon: number;

  id_mutation?: string;
  numero_disposition?: number | null;

  adresse: string;
  date_mutation: string;
  valeur_fonciere: number | null;

  main_type?: string;
  line_count?: number;
  built_items?: any[];
  land_items?: any[];
  total_surface_terrain?: number | null;
}

const props = defineProps<{  
  addresses: Address[];
  cityCenter?: CityCenter | null;
  dpePoints?: DpePoint[];
  dvfPoints?: DvfPoint[];
  parcellesGeojson?: GeoJSON.FeatureCollection;
}>();

const emit = defineEmits<{
  'edit-property': [property: Address];
}>();

const dashboard = useDashboardStore();
const remindersStore = useRemindersStore();

let dpePopup: maplibregl.Popup | null = null;
let map: maplibregl.Map | null = null;
let mapLoaded = false;

const showParcelles = ref(false);

const currentMode = computed(() => dashboard.activeMainMode || 'prospection');

// Popup composable
const popups = useMapPopups({
  getAddresses: () => props.addresses as MapAddress[],
  onEditProperty: (property: MapAddress) =>
    emit('edit-property', property as Address),
  flyTo,
});

// Computed: Set des property_id ayant un rappel
const reminderPropertyIds = computed(() => {
  const allReminders = [
    ...remindersStore.reminders,
    ...remindersStore.agencyReminders,
  ];
  return new Set(allReminders.map(r => r.property_id));
});

/* -------------------------------------
   COULEUR DES POINTS ADRESSES
------------------------------------- */
function getProspectionFreshnessColor(dateMaj: any): string {
  if (!dateMaj) {
    return '#9ca3af'; // gris visible
  }

  const majDate = new Date(dateMaj);
  if (Number.isNaN(majDate.getTime())) {
    return '#9ca3af';
  }

  const now = new Date();
  const diffMs = now.getTime() - majDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 30) {
    return '#15803d'; // vert foncé
  }

  if (diffDays <= 90) {
    return '#22c55e'; // vert moyen
  }

  if (diffDays <= 180) {
    return '#86efac'; // vert clair
  }

  return '#9ca3af'; // gris si trop ancien
}



function getPointColor(address: Address, mode: string): string {
  const addr = address as any;

  switch (mode) {
    case 'prospection':
      return getProspectionFreshnessColor(addr.date_maj);

    case 'estimations':
      return addr.dernier_prix_estime !== null && addr.dernier_prix_estime > 0
        ? COLORS.estimations
        : COLORS.none;

    case 'rappels': {
      const hasReminder =
        addr.id !== null && reminderPropertyIds.value.has(addr.id);
      return hasReminder ? COLORS.rappels : COLORS.none;
    }

    case 'favorites':
      return Number(addr.favorite) === 1 || addr.favorite === true
        ? COLORS.favorites
        : COLORS.none;

    case 'maj':
      return addr.date_maj ? COLORS.maj : COLORS.none;

    case 'dpe':
      return COLORS.none;

    case 'dvf':
      return addr.nombre_ventes && addr.nombre_ventes > 0
        ? COLORS.dvf
        : COLORS.none;

    default:
      return COLORS.none;
  }
}

/* -------------------------------------
   INITIALISATION CARTE
------------------------------------- */
onMounted(async () => {
  await remindersStore.loadReminders();

  map = new maplibregl.Map({
    container: 'map',
    style: MAP_STYLE,
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  });

  map.addControl(new maplibregl.NavigationControl());

  map.on('load', () => {
    mapLoaded = true;

    // Source des adresses normales
    map!.addSource('address_points', {
      type: 'geojson',
      data: emptyGeoJSON(),
    });

    map!.addLayer({
      id: 'address-dots',
      type: 'circle',
      source: 'address_points',
      paint: {
        'circle-radius': 7,
        'circle-color': COLORS.none,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });

    // Source des points DPE
    map!.addSource('dpe_points', {
      type: 'geojson',
      data: emptyGeoJSON(),
    });

    map!.addLayer({
      id: 'dpe-dots',
      type: 'circle',
      source: 'dpe_points',
      paint: {
        'circle-radius': 6,
        'circle-color': [
          'match',
          ['get', 'etiquette'],
          'A',
          '#10b981',
          'B',
          '#22c55e',
          'C',
          '#84cc16',
          'D',
          '#eab308',
          'E',
          '#f97316',
          'F',
          '#ef4444',
          'G',
          '#991b1b',
          '#6b7280',
        ],
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#ffffff',
      },
    });

    map!.addSource('parcelles_cadastre', {
  type: 'geojson',
  data: emptyGeoJSON(),
});

map!.addLayer({
  id: 'parcelles-fill',
  type: 'fill',
  source: 'parcelles_cadastre',
  paint: {
    'fill-color': '#2563eb',
    'fill-opacity': 0.08,
  },
  layout: {
    visibility: 'none',
  },
});

map!.addLayer({
  id: 'parcelles-line',
  type: 'line',
  source: 'parcelles_cadastre',
  paint: {
    'line-color': '#2563eb',
    'line-width': 1,
    'line-opacity': 0.45,
  },
  layout: {
    visibility: 'none',
  },
});

    map!.addSource('dvf_points', {
      type: 'geojson',
      data: emptyGeoJSON(),
      cluster: true,
      clusterMaxZoom: 18,
      clusterRadius: 35,
    });

    map!.addLayer({
      id: 'dvf-clusters',
      type: 'circle',
      source: 'dvf_points',
      filter: ['has', 'point_count'],
      paint: {
        'circle-radius': 15,
        'circle-color': '#111827',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });

    map!.addLayer({
      id: 'dvf-cluster-labels',
      type: 'symbol',
      source: 'dvf_points',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['to-string', ['get', 'point_count']],
        'text-size': 12,
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#ffffff',
      },
    });

    map!.addLayer({
      id: 'dvf-dots',
      type: 'circle',
      filter: ['!', ['has', 'point_count']],
      source: 'dvf_points',
      paint: {
        'circle-radius': 9,
        'circle-color': [
          'match',
          ['get', 'main_type'],
          'maison',
          '#ef4444',
          'appartement',
          '#8b5cf6',
          'terrain',
          '#22c55e',
          'dependance',
          '#f97316',
          'local_commercial',
          '#3b82f6',
          '#6b7280',
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });

    map!.addLayer({
      id: 'dvf-labels',
      type: 'symbol',
      filter: ['!', ['has', 'point_count']],
      source: 'dvf_points',
      layout: {
        'text-field': ['to-string', ['get', 'line_count']],
        'text-size': 11,
        'text-font': ['Open Sans Bold'],
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#ffffff',
      },
    });

    setupWatchers();
    popups.setup(map!);
    setupDpeInteractions();
    setupDvfInteractions();
    updateDvfPoints();
    updateAddressPoints();
    updateAddressPointsWithColors();
    updateDpePoints();
    updateLayerVisibility();
    recenterMap();
  });
});

onUnmounted(() => {
  if (dpePopup) {
    dpePopup.remove();
    dpePopup = null;
  }
  popups.close();
  if (map) {
    map.remove();
    map = null;
  }
});

function updateDvfPoints() {
  if (!mapLoaded || !map) return;

  const features = (props.dvfPoints || [])
    .filter(p => p.lat && p.lon)
    .map(p => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(String(p.lon)), parseFloat(String(p.lat))],
      },
      properties: {
        ...p,

        adresse: p.adresse || '',
        date_mutation: p.date_mutation || '',

        valeur_fonciere: p.valeur_fonciere ?? null,

        main_type: p.main_type || 'autre',
        line_count: p.line_count || 1,

        id_mutation: p.id_mutation || '',

        built_items: JSON.stringify(p.built_items || []),
        land_items: JSON.stringify(p.land_items || []),
        total_surface_terrain: p.total_surface_terrain ?? null,
      },
    }));

  setSourceData('dvf_points', features);
}

/* -------------------------------------
   UPDATE DES POINTS ADRESSES
------------------------------------- */
function updateAddressPoints() {
  if (!mapLoaded || !map) return;

  const features = props.addresses
    .filter(a => a.lat && a.lon)
    .map(a => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(String(a.lon)), parseFloat(String(a.lat))],
      },
      properties: { ...a },
    }));

  setSourceData('address_points', features);
}

/* -------------------------------------
   UPDATE DES POINTS DPE
------------------------------------- */
function updateDpePoints() {
  if (!mapLoaded || !map) return;

  const features = (props.dpePoints || [])
    .filter(p => p.lat && p.lon)
    .map(p => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(String(p.lon)), parseFloat(String(p.lat))],
      },
      properties: {
        ...p,
        etiquette: p.etiquette || '',
        adresse: p.adresse || '',
        type: p.type || '',
        date: p.date || '',
      },
    }));

  setSourceData('dpe_points', features);
}

/* -------------------------------------
   COULEURS DES POINTS ADRESSES
------------------------------------- */
function updateAddressPointsWithColors() {
  if (!mapLoaded || !map) return;

  if (!props.addresses.length) {
    map.setPaintProperty('address-dots', 'circle-color', COLORS.none);
    return;
  }

  const mode = currentMode.value;

  const colorExpression: any[] = [
    'match',
    ['coalesce', ['get', 'id_fantoir_long'], ['get', 'id_fantoir']],
  ];

  for (const address of props.addresses) {
    const addr = address as any;
    const id = addr.id_fantoir_long || addr.id_fantoir;
    if (id) {
      colorExpression.push(id, getPointColor(address, mode));
    }
  }

  colorExpression.push(COLORS.none);

  try {
    map.setPaintProperty('address-dots', 'circle-color', colorExpression);
  } catch (error) {
    console.error('Error updating map colors:', error);
    map.setPaintProperty('address-dots', 'circle-color', COLORS.prospection);
  }
}

/* -------------------------------------
   VISIBILITE DES COUCHES
------------------------------------- */
function toggleParcelles() {
  showParcelles.value = !showParcelles.value;
  updateParcelles();
  updateLayerVisibility();
}

function updateParcelles() {
  if (!mapLoaded || !map) return;

  const src = map.getSource('parcelles_cadastre') as maplibregl.GeoJSONSource | undefined;

  if (src) {
    src.setData(props.parcellesGeojson || emptyGeoJSON());
  }
}

function updateLayerVisibility() {
  if (!mapLoaded || !map) return;

  const isDpeMode = dashboard.activeMainMode === 'dpe';
  const isDvfMode = dashboard.activeMainMode === 'dvf';

  map.setLayoutProperty(
    'address-dots',
    'visibility',
    isDpeMode || isDvfMode ? 'none' : 'visible'
  );

  map.setLayoutProperty(
    'dpe-dots',
    'visibility',
    isDpeMode ? 'visible' : 'none'
  );

  map.setLayoutProperty(
    'dvf-dots',
    'visibility',
    isDvfMode ? 'visible' : 'none'
  );

  map.setLayoutProperty(
    'dvf-labels',
    'visibility',
    isDvfMode ? 'visible' : 'none'
  );

  map.setLayoutProperty(
    'dvf-clusters',
    'visibility',
    isDvfMode ? 'visible' : 'none'
  );

  map.setLayoutProperty(
    'dvf-cluster-labels',
    'visibility',
    isDvfMode ? 'visible' : 'none'
  );
  map.setLayoutProperty(
  'parcelles-fill',
  'visibility',
  isDvfMode && showParcelles.value ? 'visible' : 'none'
);

map.setLayoutProperty(
  'parcelles-line',
  'visibility',
  isDvfMode && showParcelles.value ? 'visible' : 'none'
);
}

function buildDvfSaleHtml(props: any, compact = false): string {
  const builtItems = props.built_items ? JSON.parse(props.built_items) : [];

  const totalTerrain = props.total_surface_terrain
    ? Number(props.total_surface_terrain).toLocaleString('fr-FR') + ' m²'
    : '-';

  const prixFormate = props.valeur_fonciere
    ? new Intl.NumberFormat('fr-FR').format(props.valeur_fonciere) + ' €'
    : 'Prix inconnu';

  const dateMutation = props.date_mutation
    ? new Date(props.date_mutation).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '-';

  if (compact) {
    return `
      <div style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <span style="font-size:11px;color:#9ca3af;">MUTATION : ${props.id_mutation || '-'}</span>
          <span style="font-weight:700;font-size:14px;color:#1e1b4b;">${prixFormate}</span>
        </div>
        <div style="font-weight:700;font-size:13px;color:#1e1b4b;margin-top:2px;">${(props.adresse || '').toUpperCase()}</div>
        <div style="font-size:11px;color:#6b7280;margin-top:2px;">Vendu le ${dateMutation}</div>
      </div>
    `;
  }

  // Build grid cards for each built item
  const builtCardsHtml = builtItems
    .map((item: any) => {
      const typeLocal = item.type_local || '-';
      const surfaceBati = item.surface_reelle_bati
        ? `${item.surface_reelle_bati} m²`
        : '-';
      const pieces = item.nombre_pieces_principales
        ? `${item.nombre_pieces_principales}`
        : '-';

      return `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;${builtItems.length > 1 ? 'padding-bottom:10px;margin-bottom:10px;border-bottom:1px solid #e5e7eb;' : ''}">
          <!-- Type -->
          <div style="background:#f8f8fa;border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e1b4b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <div>
              <div style="font-size:10px;color:#9ca3af;">Type</div>
              <div style="font-size:13px;font-weight:600;color:#1e1b4b;">${typeLocal}</div>
            </div>
          </div>

          <!-- Bâti -->
          <div style="background:#f8f8fa;border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e1b4b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="1 22 12 2 23 22"/><line x1="4" y1="16" x2="20" y2="16"/>
            </svg>
            <div>
              <div style="font-size:10px;color:#9ca3af;">Bâti</div>
              <div style="font-size:13px;font-weight:600;color:#1e1b4b;">${surfaceBati}</div>
            </div>
          </div>

          <!-- Pièces -->
          <div style="background:#f8f8fa;border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e1b4b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
            <div>
              <div style="font-size:10px;color:#9ca3af;">Pièces</div>
              <div style="font-size:13px;font-weight:600;color:#1e1b4b;">${pieces}</div>
            </div>
          </div>

          <!-- Terrain -->
          <div style="background:#f8f8fa;border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e1b4b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 20l7-7 4 4 9-11"/><path d="M2 20h20"/>
            </svg>
            <div>
              <div style="font-size:10px;color:#9ca3af;">Terrain</div>
              <div style="font-size:13px;font-weight:600;color:#1e1b4b;">${totalTerrain}</div>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  // Fallback if no built items
  const fallbackGrid =
    builtItems.length === 0
      ? `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div style="background:#f8f8fa;border-radius:8px;padding:20px 12px;display:flex;align-items:center;gap:8px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e1b4b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <div><div style="font-size:10px;color:#9ca3af;">Type</div><div style="font-size:13px;font-weight:600;color:#1e1b4b;">-</div></div>
        </div>
        <div style="background:#f8f8fa;border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:8px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e1b4b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="1 22 12 2 23 22"/><line x1="4" y1="16" x2="20" y2="16"/>
          </svg>
          <div><div style="font-size:10px;color:#9ca3af;">Bâti</div><div style="font-size:13px;font-weight:600;color:#1e1b4b;">-</div></div>
        </div>
        <div style="background:#f8f8fa;border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:8px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e1b4b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/>
          </svg>
          <div><div style="font-size:10px;color:#9ca3af;">Pièces</div><div style="font-size:13px;font-weight:600;color:#1e1b4b;">-</div></div>
        </div>
        <div style="background:#f8f8fa;border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:8px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e1b4b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 20l7-7 4 4 9-11"/><path d="M2 20h20"/>
          </svg>
          <div><div style="font-size:10px;color:#9ca3af;">Terrain</div><div style="font-size:13px;font-weight:600;color:#1e1b4b;">${totalTerrain}</div></div>
        </div>
      </div>
      `
      : '';

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.4;padding:12px;">
      <!-- Header: mutation + prix -->
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;gap:16px;">
        <span style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.3px;white-space:nowrap;">
          Mutation : ${props.id_mutation || '-'}
        </span>
        <span style="font-weight:700;font-size:20px;color:#1e1b4b;white-space:nowrap;">
          ${prixFormate}
        </span>
      </div>

      <!-- Adresse -->
      <div style="font-weight:700;font-size:16px;color:#1e1b4b;margin-bottom:6px;">
        ${(props.adresse || '').toUpperCase()}
      </div>

      <!-- Date + badge -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap;">
        <span style="font-size:12px;color:#6b7280;display:flex;align-items:center;gap:4px;white-space:nowrap;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Vendu le ${dateMutation}
        </span>
        <span style="font-size:11px;color:#1e1b4b;border:1px solid #1e1b4b;padding:2px 8px;border-radius:4px;font-weight:500;white-space:nowrap;">
          Prix de marché
        </span>
      </div>

      <!-- Grille des biens (scrollable si plusieurs) -->
      <div style="max-height:240px;overflow-y:auto;">
        ${builtCardsHtml}
        ${fallbackGrid}
      </div>
    </div>
  `;
}

function setupDvfInteractions() {
  if (!map) return;

  // Clic sur un cluster DVF : liste des ventes
  map.on('click', 'dvf-clusters', async e => {
    const features = map!.queryRenderedFeatures(e.point, {
      layers: ['dvf-clusters'],
    });

    const cluster = features[0];
    if (!cluster) return;

    const clusterId = cluster.properties?.cluster_id;
    if (clusterId === undefined || clusterId === null) return;

    const source = map!.getSource('dvf_points') as any;

    const leaves = (await source.getClusterLeaves(clusterId, 50, 0)) as any[];

    const html = leaves
      .map((leaf: any) => buildDvfSaleHtml(leaf.properties, true))
      .join('');

    new maplibregl.Popup({ maxWidth: 'none' })
      .setLngLat((cluster.geometry as any).coordinates)
      .setHTML(
        `
        <div style="
          min-width:300px;
          max-height:400px;
          overflow-y:auto;
          overflow-wrap:anywhere;
          word-break:break-word;
        ">
          <div style="font-weight:700;font-size:14px;margin-bottom:6px;">
            ${leaves.length} ventes DVF
          </div>

          ${html}
        </div>
      `
      )
      .addTo(map!);
  });

  // Clic sur une vente DVF simple
  map.on('click', 'dvf-dots', e => {
    const feature = e.features?.[0];
    if (!feature) return;

    const props: any = feature.properties;

    new maplibregl.Popup({ maxWidth: 'none' })
      .setLngLat((feature.geometry as any).coordinates)
      .setHTML(
        `
        <div style="
          min-width:300px;
          overflow-wrap:anywhere;
          word-break:break-word;
        ">
          ${buildDvfSaleHtml(props)}
        </div>
      `
      )
      .addTo(map!);
  });

  map.on('mouseenter', 'dvf-dots', () => {
    if (map) map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'dvf-dots', () => {
    if (map) map.getCanvas().style.cursor = '';
  });

  map.on('mouseenter', 'dvf-clusters', () => {
    if (map) map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'dvf-clusters', () => {
    if (map) map.getCanvas().style.cursor = '';
  });
}

function setupDpeInteractions() {
  if (!map) return;

  map.on('click', 'dpe-dots', e => {
    const feature = e.features?.[0];
    if (!feature) return;

    const coordinates = (feature.geometry as any).coordinates.slice();
    const props = feature.properties || {};

    const adresse = props.adresse || 'Adresse inconnue';
    const etiquette = props.etiquette || '-';
    const type = props.type || '-';
    const date = props.date
      ? new Date(props.date).toLocaleDateString('fr-FR')
      : '-';

    const dpeColors: Record<string, string> = {
      A: '#10b981',
      B: '#22c55e',
      C: '#84cc16',
      D: '#eab308',
      E: '#f97316',
      F: '#ef4444',
      G: '#991b1b',
    };

    const badgeColor = dpeColors[etiquette] || '#6b7280';

    if (dpePopup) dpePopup.remove();

    dpePopup = new maplibregl.Popup({
      closeButton: true,
      offset: 14,
    })
      .setLngLat(coordinates)
      .setHTML(
        `
        <div style="
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-width: 220px;
          line-height: 1.4;
        ">
          <div style="
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 6px;
          ">
            ${adresse}
          </div>

          <div style="
            display:flex;
            align-items:center;
            gap:8px;
            margin-bottom:6px;
          ">
            <span style="
              background:${badgeColor};
              color:white;
              font-weight:600;
              padding:2px 8px;
              border-radius:6px;
              font-size:12px;
            ">
              DPE ${etiquette}
            </span>

            <span style="
              font-size:12px;
              color:#6b7280;
            ">
              ${type}
            </span>
          </div>

          <div style="
            font-size:12px;
            color:#6b7280;
          ">
            Diagnostic réalisé le ${date}
          </div>
       
       </div>
      `
      )
      .addTo(map as any);
  });

  map.on('mouseenter', 'dpe-dots', () => {
    if (map) map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'dpe-dots', () => {});
}

/* -------------------------------------
   RECENTRAGE LOGIQUE
------------------------------------- */
async function recenterMap() {
  await nextTick();
  if (!mapLoaded || !map) return;

  if (dashboard.activeMainMode === 'dvf') {
    if (dashboard.selectedCity && props.cityCenter) {
      flyTo(props.cityCenter.lon, props.cityCenter.lat, 12);
      return;
    }

    const points = props.dvfPoints || [];

    if (points.length === 1) {
      flyTo(points[0].lon, points[0].lat, 17);
      return;
    }

    if (points.length > 1) {
      const lats = points.map(p => Number(p.lat));
      const lons = points.map(p => Number(p.lon));
      flyTo(avg(lons), avg(lats), 10);
      return;
    }

    return;
  }

  // MODE DPE : toujours prioriser la ville choisie
  if (dashboard.activeMainMode === 'dpe') {
    if (dashboard.selectedCity && props.cityCenter) {
      flyTo(props.cityCenter.lon, props.cityCenter.lat, 12);
      return;
    }

    const points = props.dpePoints || [];

    if (points.length === 1) {
      flyTo(points[0].lon, points[0].lat, 17);
      return;
    }

    if (points.length > 1) {
      const lats = points.map(p => Number(p.lat));
      const lons = points.map(p => Number(p.lon));
      flyTo(avg(lons), avg(lats), 10);
      return;
    }

    return;
  }

  if (dashboard.selectedNumeroFull && props.addresses.length === 1) {
    const a = props.addresses[0];
    flyTo(a.lon, a.lat, 19);
    return;
  }

  if (dashboard.selectedStreet && props.addresses.length > 0) {
    const lats = props.addresses.map(a => Number(a.lat));
    const lons = props.addresses.map(a => Number(a.lon));
    flyTo(avg(lons), avg(lats), 16);
    return;
  }

  if (dashboard.selectedCity && props.cityCenter) {
    flyTo(props.cityCenter.lon, props.cityCenter.lat, 14);
  }
}

function handleRecenter() {
  if (!map || !mapLoaded) return;
  map.resize();
  recenterMap();
}

/* -------------------------------------
   OUTILS
------------------------------------- */
function avg(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function flyTo(lon: number | string, lat: number | string, zoom: number) {
  const lng = parseFloat(String(lon));
  const lt = parseFloat(String(lat));
  if (Number.isNaN(lng) || Number.isNaN(lt) || !map) return;
  map.flyTo({
    center: [lng, lt],
    zoom,
    speed: 1.1,
  });
}

function emptyGeoJSON() {
  return { type: 'FeatureCollection' as const, features: [] as any[] };
}

function setSourceData(sourceName: string, features: any[]) {
  if (!map) return;
  const src = map.getSource(sourceName) as maplibregl.GeoJSONSource | undefined;
  if (src) {
    src.setData({ type: 'FeatureCollection', features });
  }
}

/* -------------------------------------
   WATCHERS
------------------------------------- */
function setupWatchers() {
  watch(
    () => props.addresses,
    () => {
      updateAddressPoints();
      updateAddressPointsWithColors();
      updateLayerVisibility();
    },
    { deep: true, immediate: true }
  );

  watch(
    () => props.dvfPoints,
    () => {
      updateDvfPoints();
      updateLayerVisibility();

      if (dashboard.activeMainMode === 'dvf') {
        recenterMap();
      }
    },
    { deep: true, immediate: true }
  );
  watch(
    () => props.dpePoints,
    () => {
      updateDpePoints();
      updateLayerVisibility();
    },
    { deep: true, immediate: true }
  );

  // Recentrer dès que le centre change (ville ou résultats)
  watch(
    () => props.cityCenter,
    newCenter => {
      if (!newCenter) return;
      popups.close();
      recenterMap();
    },
    { immediate: true }
  );

  watch(
    () => dashboard.activeMainMode,
    () => {
      updateAddressPointsWithColors();
      updateDpePoints();
      updateDvfPoints();
      updateLayerVisibility();
      recenterMap();
    },
    { immediate: true }
  );

  watch(
    () => [remindersStore.reminders, remindersStore.agencyReminders],
    () => {
      if (currentMode.value === 'rappels') {
        updateAddressPointsWithColors();
      }
    },
    { deep: true }
  );

  watch(
    () => dashboard.selectedStreet,
    newStreet => {
      popups.close();
      if (!newStreet) return;
      recenterMap();
    }
  );

  watch(
    () => dashboard.selectedNumeroFull,
    newNumero => {
      popups.close();
      if (!newNumero) return;
      recenterMap();
    }
  );

watch(
  () => props.parcellesGeojson,
  () => {
    updateParcelles();
  },
  { deep: true, immediate: true }
);
watch(
  () => dashboard.selectedCity,
  newCity => {
    popups.close();

    if (!newCity) {
      updateParcelles();
      updateLayerVisibility();
      return;
    }

    recenterMap();
  }
);

  // Quand on bascule sur la vue map → resize + recenter
  watch(
    () => dashboard.viewType,
    newType => {
      if (newType === 'map' && map && mapLoaded) {
        nextTick(() => {
          map!.resize();
          recenterMap();
        });
      }
    }
  );
}
</script>

<style scoped>
.mapContainer {
  width: 100%;
  position: relative;
  min-width: 0;
  overflow: hidden;
  max-height: 73vh;
  border-radius: 18px;
}

.map-wrapper {
  position: relative;
  width: 100%;
  height: 700px;
  max-width: 100%;
  overflow: hidden;
  border-radius: 18px;
}

.map {
  width: 100%;
  height: 100%;
}

.recenter-btn {
  position: absolute;
  top: 12px;
  right: 52px;
  z-index: 2;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: none;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  color: #333;
  transition:
    background 0.15s,
    color 0.15s;
}

.recenter-btn:hover {
  background: #f0f0f0;
  color: #2563eb;
}

.parcelles-btn {
  position: absolute;
  top: 56px;
  right: 52px;
  z-index: 2;
  height: 32px;
  padding: 0 10px;
  background: #fff;
  border: none;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}

.parcelles-btn.active {
  background: #2563eb;
  color: #fff;
}
</style>
