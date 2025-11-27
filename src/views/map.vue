<template>
  <section class="mapContainer">
    <div id="map" class="map"></div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useDashboardStore } from "@/stores/dashboard";
const dashboard = useDashboardStore();

let map: maplibregl.Map | null = null;
let mapLoaded = false;

const MAPTILER_KEY = "qnb10ErHP2vBlMq3fo5B";
const STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

onMounted(() => initMap());

/* --------------------------------------------------
   1️⃣ Initialisation carte
-------------------------------------------------- */
function initMap() {
  map = new maplibregl.Map({
    container: "map",
    style: STYLE,
    center: [2.35, 48.85],
    zoom: 13
  });

  map.addControl(new maplibregl.NavigationControl());

  map.on("load", () => {
    mapLoaded = true;
    addDVFSource();
    addDVFLayer();
    setupWatchers();
  });
}

/* --------------------------------------------------
   2️⃣ Source DVF (tes points d’adresses)
-------------------------------------------------- */
function addDVFSource() {
  map!.addSource("dvf_points", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: []
    }
  });
}

/* --------------------------------------------------
   3️⃣ Layer des points DVF
-------------------------------------------------- */
function addDVFLayer() {
  map!.addLayer({
    id: "dvf-points",
    type: "circle",
    source: "dvf_points",
    paint: {
      "circle-radius": 6,
      "circle-color": "#4287f5",
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1.5
    }
  });

  // Layer pour les points verts (rue sélectionnée)
  map!.addLayer({
    id: "dvf-highlight",
    type: "circle",
    source: "dvf_points",
    paint: {
      "circle-radius": 9,
      "circle-color": "#00ff55",
      "circle-stroke-color": "#004d1a",
      "circle-stroke-width": 2
    },
    filter: ["==", "isSelected", true]
  });

  // Popup au clic
  map!.on("click", "dvf-points", (e) => {
    const f = e.features?.[0];
    if (!f) return;

    new maplibregl.Popup()
      .setLngLat(f.geometry.coordinates)
      .setHTML(`
        <b>${f.properties.nom_voie} ${f.properties.numero || ""}</b><br>
        ${f.properties.code_postal} ${f.properties.nom_commune}
      `)
      .addTo(map!);
  });
}

/* --------------------------------------------------
   4️⃣ Mise à jour du GeoJSON DVF
-------------------------------------------------- */
function updateDVFPoints() {
  if (!mapLoaded) return;

  const features = dashboard.addresses
    .filter(a => a.lat && a.lon)
    .map(a => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [parseFloat(a.lon), parseFloat(a.lat)]
      },
      properties: {
        id_fantoir: a.id_fantoir,
        id_fantoir_long: a.id_fantoir_long,
        nom_voie: a.nom_voie,
        numero: a.numero,
        code_postal: a.code_postal,
        nom_commune: a.nom_commune,
        isSelected: false
      }
    }));

  const geojson = {
    type: "FeatureCollection",
    features
  };

  (map!.getSource("dvf_points") as any).setData(geojson);
}

/* --------------------------------------------------
   5️⃣ Mise en évidence de la rue sélectionnée
-------------------------------------------------- */
function highlightStreet(street: any) {
  if (!street || !mapLoaded) return;

  // 1) Reset : tout repasse en bleu
  updateDVFPoints();

  // 2) appliquer la sélection
  const geojson = (map!.getSource("dvf_points") as any)._data;

  geojson.features.forEach((f: any) => {
    if (f.properties.id_fantoir === street.id_fantoir) {
      f.properties.isSelected = true;
    }
  });

  // 3) mise à jour source
  (map!.getSource("dvf_points") as any).setData(geojson);

  // 4) zoom sur la rue (centre du premier point)
  const first = geojson.features.find((f: any) => f.properties.isSelected);
  if (first) {
    map!.flyTo({
      center: first.geometry.coordinates,
      zoom: 18,
      speed: 0.8
    });
  }
}

/* --------------------------------------------------
   6️⃣ Watchers
-------------------------------------------------- */
function setupWatchers() {
  // Mise à jour des points DVF quand une ville change
  watch(
    () => dashboard.addresses,
    () => updateDVFPoints(),
    { deep: true, immediate: true }
  );

  // centrage quand cityCenter change
  watch(
    () => dashboard.cityCenter,
    (center) => {
      if (!mapLoaded || !center) return;

      map!.flyTo({
        center: [center.lon, center.lat],
        zoom: 15,
        speed: 1.2
      });
    },
    { immediate: true }
  );

  // surlignage d'une rue
  watch(
    () => dashboard.selectedStreet,
    (street) => {
      highlightStreet(street);
    }
  );
}
</script>

<style scoped>
.map {
  width: 100%;
  height: calc(100vh - 80px);
}
</style>
