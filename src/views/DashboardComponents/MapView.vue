<template>
  <section class="mapContainer">
    <div class="map-wrapper">
      <div id="map" class="map"></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
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

const props = defineProps<{
  addresses: Address[];
  cityCenter?: CityCenter | null;
  dpePoints?: DpePoint[];
}>();

const emit = defineEmits<{
  'edit-property': [property: Address];
}>();

const dashboard = useDashboardStore();
const remindersStore = useRemindersStore();

let dpePopup: maplibregl.Popup | null = null;
let map: maplibregl.Map | null = null;
let mapLoaded = false;
let lastRecenterCityKey = '';

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
function getPointColor(address: Address, mode: string): string {
  const addr = address as any;

  switch (mode) {
    case 'prospection': {
      const hasData =
        addr.date_maj !== null ||
        (addr.nombre_ventes && addr.nombre_ventes > 0) ||
        (addr.nombre_estimations && addr.nombre_estimations > 0);
      return hasData ? COLORS.prospection : COLORS.none;
    }

    case 'estimations':
      return addr.dernier_prix_estime !== null && addr.dernier_prix_estime > 0
        ? COLORS.estimation
        : COLORS.none;

    case 'rappels': {
      const hasReminder =
        addr.id !== null && reminderPropertyIds.value.has(addr.id);
      return hasReminder ? COLORS.rappel : COLORS.none;
    }

    case 'favorites':
      return Number(addr.favorite) === 1 || addr.favorite === true
        ? COLORS.favoris
        : COLORS.none;

    case 'maj':
      return addr.date_maj ? '#8b5cf6' : COLORS.none;

    case 'dpe':
      return COLORS.none;

    case 'dvf':
      return addr.nombre_ventes && addr.nombre_ventes > 0
        ? COLORS.dvf || '#ef4444'
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

    setupWatchers();
    popups.setup(map!);
    setupDpeInteractions();
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

/* -------------------------------------
   UPDATE DES POINTS ADRESSES
------------------------------------- */
function updateAddressPoints() {
  if (!mapLoaded) return;

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
  if (!mapLoaded) return;

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

  map.setLayoutProperty(
    'address-dots',
    'visibility',
    isDpeMode ? 'none' : 'visible'
  );

  map.setLayoutProperty(
    'dpe-dots',
    'visibility',
    isDpeMode ? 'visible' : 'none'
  );
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
      .setHTML(`
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
      `)
      .addTo(map);
  });

  map.on('mouseenter', 'dpe-dots', () => {
    if (map) map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'dpe-dots', () => {
    if (map) map.getCanvas().style.cursor = '';
  });
}


/* -------------------------------------
   RECENTRAGE LOGIQUE
------------------------------------- */
async function recenterMap() {
  await nextTick();
  if (!mapLoaded || !map) return;

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

function getCityKey() {
  const city = dashboard.selectedCity;
  if (!city) return '';
  return `${city.value || ''}|${dashboard.selectedCodeInsee || ''}`;
}

/* -------------------------------------
   OUTILS
------------------------------------- */
function avg(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function flyTo(lon: number | string, lat: number | string, zoom: number) {
  map!.flyTo({
    center: [parseFloat(String(lon)), parseFloat(String(lat))],
    zoom,
    speed: 1.1,
  });
}

function emptyGeoJSON() {
  return { type: 'FeatureCollection' as const, features: [] as any[] };
}

function setSourceData(sourceName: string, features: any[]) {
  const src = map!.getSource(sourceName) as
    | maplibregl.GeoJSONSource
    | undefined;
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
  () => props.dpePoints,
  () => {
    updateDpePoints();
    updateLayerVisibility();
  },
  { deep: true, immediate: true }
);

watch(
  () => props.cityCenter,
  newCenter => {
    if (!newCenter || !dashboard.selectedCity) return;

    const currentCityKey = getCityKey();

    if (currentCityKey && currentCityKey !== lastRecenterCityKey) {
      lastRecenterCityKey = currentCityKey;
      popups.close();
      recenterMap();
    }
  }
);

watch(
  () => dashboard.activeMainMode,
  () => {
    updateAddressPointsWithColors();
    updateLayerVisibility();
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
  () => {
    popups.close();
    lastRecenterCityKey = '';
  }
);
}
</script>

<style scoped>
.mapContainer {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(100vh - 80px);
  position: relative;
}

.map-wrapper {
  flex: 1;
  position: relative;
}

.map {
  width: 100%;
  height: 100%;
}
</style>