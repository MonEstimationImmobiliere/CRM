<template>
  <section class="mapContainer">
    <!-- Sidebar Component -->
    <SideBarMapView
      @mode-change="handleModeChange"
      @sidebar-toggle="handleSidebarToggle"
      :addresses="addresses as any"
    />

    <!-- Map -->
    <div class="map-wrapper">
      <div id="map" class="map"></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, watch, nextTick, ref, computed, onUnmounted } from 'vue';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useDashboardStore } from '@/stores/dashboard';
import { useRemindersStore } from '@/stores/reminders';
import SideBarMapView from './SideBarMapView.vue';

/* -------------------------------------
   PROPS & EMITS
------------------------------------- */
import type { IAddressDetail, IAddressGrouped } from '@/types/address';

type Address =
  | IAddressDetail
  | IAddressGrouped
  | {
      lat: string | number;
      lon: string | number;
      numero?: string;
      rep?: string;
      nom_voie?: string;
      code_postal?: string;
      nom_commune?: string;
      id_fantoir?: string;
      id_fantoir_long?: string;
      total_adresses?: number;
      [key: string]: any;
    };

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
  (e: 'edit-property', property: Address): void;
}>();

const dashboard = useDashboardStore();
const remindersStore = useRemindersStore();
console.log('📍 MapView store addresses:', dashboard.addresses);

let map: maplibregl.Map | null = null;
let mapLoaded = false;

let currentPopup: maplibregl.Popup | null = null;

// Current display mode
const currentMode = ref<string>('prospection');

// Constantes de couleurs (même que SideBarMapView)
const COLORS = {
  prospection: '#4287f5',
  estimation: '#9333ea',
  rappel: '#06b6d4',
  favoris: '#f97316',
  dpe: '#10b981',
  none: '#d1d5db',
};

// Computed: Set des property_id ayant un rappel
const reminderPropertyIds = computed(() => {
  const allReminders = [
    ...remindersStore.reminders,
    ...remindersStore.agencyReminders,
  ];
  return new Set(allReminders.map(r => r.property_id));
});

const MAPTILER_KEY = 'qnb10ErHP2vBlMq3fo5B';
const STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

/* -------------------------------------
   SIDEBAR EVENT HANDLERS
------------------------------------- */
function handleModeChange(mode: string) {
  currentMode.value = mode;
  console.log('🔄 Mode changed to:', mode);
  updatePointsWithColors();
}

function handleSidebarToggle(open: boolean) {
  console.log('📂 Sidebar toggled:', open);
}

/**
 * Détermine la couleur d'un point selon le mode et les données de l'adresse
 */
function getPointColor(address: Address, mode: string): string {
  // Cast to any for dynamic property access since Address can be multiple types
  const addr = address as any;

  switch (mode) {
    case 'prospection':
      // Prospection: basé sur la présence de données CRM
      const hasProspectionData =
        addr.date_maj !== null ||
        (addr.nombre_ventes && addr.nombre_ventes > 0) ||
        (addr.nombre_estimations && addr.nombre_estimations > 0);
      return hasProspectionData ? COLORS.prospection : COLORS.none;

    case 'estimation':
      // Estimation: basé sur dernier_prix_estime
      return addr.dernier_prix_estime !== null && addr.dernier_prix_estime > 0
        ? COLORS.estimation
        : COLORS.none;

    case 'rappel':
      // Rappel: vérifie si l'adresse a un rappel dans le store reminders
      const hasReminder =
        addr.id !== null && reminderPropertyIds.value.has(addr.id);
      return hasReminder ? COLORS.rappel : COLORS.none;

    case 'favoris':
      // Favoris: basé sur address.favorite === 'true'
      return addr.favorite === 'true' ? COLORS.favoris : COLORS.none;

    case 'dpe':
      // DPE: logique à compléter selon les données disponibles
      return COLORS.none;

    default:
      return COLORS.none;
  }
}

/* -------------------------------------
   INITIALISATION CARTE
------------------------------------- */
onMounted(async () => {
  // Charger les reminders pour le mode rappel
  await remindersStore.loadReminders();

  map = new maplibregl.Map({
    container: 'map',
    style: STYLE,
    center: [2.35, 48.85],
    zoom: 13,
  });

  map.addControl(new maplibregl.NavigationControl());

  map.on('load', () => {
    mapLoaded = true;

    // Source DVF (points)
    map!.addSource('dvf_points', {
      type: 'geojson',
      data: emptyGeoJSON(),
    });

    // Layer points avec couleur dynamique
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
    setupPopupClick();

    // Appliquer les couleurs initiales
    updatePointsWithColors();
  });
});

/* -------------------------------------
   CLICK POPUP (3 modes : ville / rue / numéro)
------------------------------------- */
function setupPopupClick() {
  map!.on('click', 'dvf-dots', e => {
    const f = e.features?.[0];
    if (!f) return;
    const p = f.properties;

    // Get coordinates safely
    const geom = f.geometry as GeoJSON.Point;
    const coords = geom.coordinates;

    /* ---------------------------------
        1️⃣ MODE VILLE (groupé par rue)
    ---------------------------------- */
    if (p.total_adresses) {
      const html = `
        <b>${p.nom_voie}</b><br>
        ${p.code_postal} ${p.nom_commune}<br>
        <i>${p.total_adresses} adresses</i><br><br>
        <a href="#" id="map-view-street">Voir la rue</a>
      `;

      showPopup(f, html);

      setTimeout(() => {
        document
          .getElementById('map-view-street')
          ?.addEventListener('click', ev => {
            ev.preventDefault();

            dashboard.selectedStreet = {
              value: p.nom_voie,
              idFantoir: p.id_fantoir,
            };

            dashboard.selectedCodeIdFantoir = p.id_fantoir;
            dashboard.selectedNumero = '';
            dashboard.selectedRep = '';
            dashboard.selectedNumeroFull = null;

            dashboard.querySearchAddress();

            flyTo(coords[0], coords[1], 16);
          });
      }, 50);

      return;
    }

    /* ---------------------------------
        2️⃣ MODE RUE (liste des numéros)
    ---------------------------------- */
    if (p.numero && dashboard.selectedStreet && !dashboard.selectedNumeroFull) {
      const fullNum = p.rep ? `${p.numero} ${p.rep}` : p.numero;

      const html = `
        <b>${fullNum}</b> ${p.nom_voie}<br>
        ${p.code_postal} ${p.nom_commune}<br><br>
        <a href="#" id="map-view-num">Voir ce numéro</a>
      `;

      showPopup(f, html);

      setTimeout(() => {
        document
          .getElementById('map-view-num')
          ?.addEventListener('click', ev => {
            ev.preventDefault();

            dashboard.selectedNumeroFull = {
              numero: p.numero,
              rep: p.rep || '',
              value: p.rep ? `${p.numero} ${p.rep}` : `${p.numero}`,
            };

            dashboard.selectedNumero = p.numero;
            dashboard.selectedRep = p.rep || '';
            dashboard.querySearchAddress();

            flyTo(coords[0], coords[1], 19);
          });
      }, 50);

      return;
    }

    /* ---------------------------------
        3️⃣ MODE NUMÉRO (1 seul bien)
    ---------------------------------- */
    if (props.addresses.length === 1) {
      const html = `
        <b>${p.numero || ''} ${p.rep || ''} ${p.nom_voie}</b><br>
        ${p.code_postal} ${p.nom_commune}<br><br>
        <a href="#" id="map-open-property">Ouvrir la fiche</a>
      `;

      showPopup(f, html);

      setTimeout(() => {
        document
          .getElementById('map-open-property')
          ?.addEventListener('click', ev => {
            ev.preventDefault();

            const property = props.addresses[0];

            // Émettre l'événement via l'emit au lieu du CustomEvent
            emit('edit-property', property);
          });
      }, 50);

      return;
    }
  });
}

/* -------------------------------------
   AFFICHAGE POPUP
------------------------------------- */
function showPopup(feature: any, html: string) {
  if (currentPopup) {
    currentPopup.remove();
  }

  currentPopup = new maplibregl.Popup()
    .setLngLat(feature.geometry.coordinates)
    .setHTML(html)
    .addTo(map!);
}

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
 * Met à jour les points avec les couleurs selon le mode actuel
 */
function updatePointsWithColors() {
  if (!mapLoaded || !map) return;

  const mode = currentMode.value;

  // Construire l'expression de couleur match pour chaque point
  const colorExpression: any[] = ['match', ['get', 'id_fantoir_long']];

  for (const address of props.addresses) {
    const addr = address as any;
    const id = addr.id_fantoir_long || addr.id_fantoir;
    if (id) {
      const color = getPointColor(address, mode);
      colorExpression.push(id, color);
    }
  }

  // Couleur par défaut (fallback)
  colorExpression.push(COLORS.none);

  // Appliquer l'expression de couleur au layer
  try {
    map.setPaintProperty('dvf-dots', 'circle-color', colorExpression);
    console.log('🎨 Colors updated for mode:', mode);
  } catch (error) {
    console.error('❌ Error updating colors:', error);
    // Fallback: couleur statique
    map.setPaintProperty('dvf-dots', 'circle-color', COLORS.prospection);
  }
}

/* -------------------------------------
   RECENTRAGE LOGIQUE
------------------------------------- */
async function recenterMap() {
  await nextTick();

  if (!mapLoaded) return;

  // 1️⃣ Numéro → centrer sur l'adresse
  if (dashboard.selectedNumeroFull && props.addresses.length === 1) {
    const a = props.addresses[0];
    flyTo(a.lon, a.lat, 19);
    return;
  }

  // 2️⃣ Rue → centre moyen
  if (dashboard.selectedStreet && props.addresses.length > 0) {
    const lats = props.addresses.map(a => Number(a.lat));
    const lons = props.addresses.map(a => Number(a.lon));
    flyTo(avg(lons), avg(lats), 16);
    return;
  }

  // 3️⃣ Ville → cityCenter (utiliser props.cityCenter)
  if (dashboard.selectedCity && props.cityCenter) {
    flyTo(props.cityCenter.lon, props.cityCenter.lat, 14);
    return;
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

function emptyGeoJSON(): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection' as const, features: [] };
}

function setSourceData(sourceName: string, features: any[]) {
  const src = map!.getSource(sourceName) as
    | maplibregl.GeoJSONSource
    | undefined;
  if (src) {
    src.setData({
      type: 'FeatureCollection',
      features,
    });
  }
}

/* -------------------------------------
   WATCHERS (sync carte <-> dashboard)
------------------------------------- */

function closePopup() {
  if (currentPopup) {
    currentPopup.remove();
    currentPopup = null;
  }
}

function setupWatchers() {
  // Watcher sur les props.addresses
  watch(
    () => props.addresses,
    () => {
      updatePoints();
      updatePointsWithColors();
      recenterMap();
    },
    { deep: true, immediate: true }
  );

  // Watcher sur props.cityCenter
  watch(
    () => props.cityCenter,
    () => {
      recenterMap();
    }
  );

  // Watcher sur les reminders pour mettre à jour les couleurs en mode rappel
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
      closePopup();
      recenterMap();
    }
  );

  watch(
    () => dashboard.selectedNumeroFull,
    () => {
      closePopup();
      recenterMap();
    }
  );

  watch(
    () => dashboard.selectedCity,
    () => {
      closePopup();
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
