<template>
  <section class="mapContainer">
    <!-- Sidebar Component -->
    <SideBarMapView
      @mode-change="handleModeChange"
      :addresses="addresses as any"
    />

    <!-- Map -->
    <div class="map-wrapper">
      <div id="map" class="map"></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch, nextTick, ref, computed } from 'vue';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useDashboardStore } from '@/stores/dashboard';
import { useRemindersStore } from '@/stores/reminders';
import SideBarMapView from './SideBarMapView.vue';
import { useMapPopups, type MapAddress } from '@/composables/useMapPopups';
import {
  COLORS,
  MAP_STYLE,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  type MapDisplayMode,
} from '@/utils/mapConstants';

/* -------------------------------------
   PROPS & EMITS
------------------------------------- */
import type { IAddressDetail, IAddressGrouped } from '@/types/address';

type Address = IAddressDetail | IAddressGrouped;

interface CityCenter {
  lat: number;
  lon: number;
}

interface DpePoint {
  lat: number;
  lon: number;
  [key: string]: any;
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

let map: maplibregl.Map | null = null;
let mapLoaded = false;

// Current display mode
const currentMode = ref<MapDisplayMode>('prospection');

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
   SIDEBAR EVENT HANDLERS
------------------------------------- */
function handleModeChange(mode: string) {
  currentMode.value = mode as MapDisplayMode;
  updatePointsWithColors();
}

/**
 * Détermine la couleur d'un point selon le mode et les données de l'adresse
 */
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

    case 'estimation':
      return addr.dernier_prix_estime !== null && addr.dernier_prix_estime > 0
        ? COLORS.estimation
        : COLORS.none;

    case 'rappel': {
      const hasReminder =
        addr.id !== null && reminderPropertyIds.value.has(addr.id);
      return hasReminder ? COLORS.rappel : COLORS.none;
    }

    case 'favoris':
      return addr.favorite === 'true' ? COLORS.favoris : COLORS.none;

    case 'dpe':
      return COLORS.none;

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

    map!.addSource('dvf_points', {
      type: 'geojson',
      data: emptyGeoJSON(),
    });

    map!.addLayer({
      id: 'dvf-dots',
      type: 'circle',
      source: 'dvf_points',
      paint: {
        'circle-radius': 7,
        'circle-color': COLORS.none,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });

    setupWatchers();
    popups.setup(map!);
    updatePointsWithColors();
  });
});

onUnmounted(() => {
  popups.close();
  if (map) {
    map.remove();
    map = null;
  }
});

/* -------------------------------------
   UPDATE DES POINTS
------------------------------------- */
function updatePoints() {
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

  setSourceData('dvf_points', features);
}

/**
 * Met à jour les couleurs des points selon le mode actuel
 */
function updatePointsWithColors() {
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
    map.setPaintProperty('dvf-dots', 'circle-color', colorExpression);
  } catch (error) {
    console.error('Error updating map colors:', error);
    map.setPaintProperty('dvf-dots', 'circle-color', COLORS.prospection);
  }
}

/* -------------------------------------
   RECENTRAGE LOGIQUE
------------------------------------- */
async function recenterMap() {
  await nextTick();
  if (!mapLoaded) return;

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
   WATCHERS (sync carte <-> dashboard)
------------------------------------- */
function setupWatchers() {
  watch(
    () => props.addresses,
    () => {
      updatePoints();
      updatePointsWithColors();
      recenterMap();
    },
    { deep: true, immediate: true }
  );

  watch(
    () => props.cityCenter,
    () => recenterMap()
  );

  watch(
    () => [remindersStore.reminders, remindersStore.agencyReminders],
    () => {
      if (currentMode.value === 'rappel') {
        updatePointsWithColors();
      }
    },
    { deep: true }
  );

  watch(
    () => dashboard.selectedStreet,
    () => {
      popups.close();
      recenterMap();
    }
  );
  watch(
    () => dashboard.selectedNumeroFull,
    () => {
      popups.close();
      recenterMap();
    }
  );
  watch(
    () => dashboard.selectedCity,
    () => {
      popups.close();
      recenterMap();
    }
  );
}
</script>

<style scoped>
.mapContainer {
  display: flex;
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
