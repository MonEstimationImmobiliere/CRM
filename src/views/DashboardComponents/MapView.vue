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
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
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
}>();

const emit = defineEmits<{
  'edit-property': [property: Address];
}>();

const dashboard = useDashboardStore();
const remindersStore = useRemindersStore();

let dpePopup: maplibregl.Popup | null = null;
let map: maplibregl.Map | null = null;
let mapLoaded = false;

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

}



function buildDvfSaleHtml(props: any, compact = false): string {
  const builtItems = props.built_items ? JSON.parse(props.built_items) : [];

  const builtHtml = builtItems
    .map((item: any) => {
      const label = item.type_local || 'Bâti';
      const surface = item.surface_reelle_bati
        ? `${item.surface_reelle_bati} m²`
        : '';
      const pieces = item.nombre_pieces_principales
        ? `${item.nombre_pieces_principales} pièce(s)`
        : '';

        const lots =
  item.lots && item.lots.length
    ? ` — lot ${item.lots.join(', ')}`
    : '';

      const showCount =
        item.type_local?.toLowerCase().includes('dépendance') &&
        !item.surface_reelle_bati &&
        item.count &&
        item.count > 1;

      const count = showCount ? ` x${item.count}` : '';

      return `
        <li style="margin-bottom:3px;">
          ${label}${count}
          ${surface ? ` — ${surface}` : ''}
          ${pieces ? ` — ${pieces}` : ''}
          ${lots}
        </li>
      `;
    })
    .join('');

  const totalTerrain = props.total_surface_terrain
    ? Number(props.total_surface_terrain).toLocaleString('fr-FR') + ' m²'
    : null;

  return `
    <div style="
      ${compact ? 'padding:8px 0;border-bottom:1px solid #e5e7eb;' : ''}
    ">
      <div style="font-size:11px;color:#9ca3af;">
        Mutation : ${props.id_mutation || '-'}
      </div>

      <div style="font-weight:700;font-size:${compact ? '13px' : '15px'};margin-top:3px;">
        ${
          props.valeur_fonciere
            ? new Intl.NumberFormat('fr-FR').format(props.valeur_fonciere) + ' €'
            : 'Prix inconnu'
        }
      </div>

      <div style="margin-top:5px;font-size:12px;">
        ${props.adresse || ''}
      </div>

      <div style="font-size:11px;color:#6b7280;">
        ${props.date_mutation || ''}
      </div>

      ${
        builtHtml
          ? `
            <div style="font-size:11px;color:#374151;margin-top:6px;">
              <strong>Bâti :</strong>
              <ul style="padding-left:16px;margin:3px 0 0;overflow-wrap:anywhere;">
                ${builtHtml}
              </ul>
            </div>
          `
          : ''
      }

      ${
        totalTerrain
          ? `
            <div style="font-size:11px;color:#374151;margin-top:6px;">
              <strong>Terrain :</strong>
              <span style="color:#6b7280;">${totalTerrain}</span>
            </div>
          `
          : ''
      }
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

    const leaves = (await source.getClusterLeaves(
      clusterId,
      50,
      0
    )) as any[];

    const html = leaves
      .map((leaf: any) => buildDvfSaleHtml(leaf.properties, true))
      .join('');

    new maplibregl.Popup()
      .setLngLat((cluster.geometry as any).coordinates)
      .setHTML(`
        <div style="
          width:320px;
          max-height:360px;
          overflow:auto;
          overflow-wrap:anywhere;
          word-break:break-word;
        ">
          <div style="font-weight:700;font-size:14px;margin-bottom:6px;">
            ${leaves.length} ventes DVF
          </div>

          ${html}
        </div>
      `)
      .addTo(map!);
  });

  // Clic sur une vente DVF simple
  map.on('click', 'dvf-dots', e => {
    const feature = e.features?.[0];
    if (!feature) return;

    const props: any = feature.properties;

    new maplibregl.Popup()
      .setLngLat((feature.geometry as any).coordinates)
      .setHTML(`
        <div style="
          width:260px;
          max-width:260px;
          overflow-wrap:anywhere;
          word-break:break-word;
        ">
          <div style="font-weight:700;font-size:15px;margin-bottom:4px;">
            Vente DVF
          </div>

          ${buildDvfSaleHtml(props)}
        </div>
      `)
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
      .addTo(map);
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
    () => dashboard.selectedCity,
    newCity => {
      popups.close();
      if (!newCity) return;
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
</style>
