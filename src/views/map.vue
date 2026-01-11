<!-- <template>
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

    addDPESource();
    addDPELayer();

    setupWatchers();
  });
}

/* --------------------------------------------------
   2️⃣ Source DVF (tes points d’adresses)
-------------------------------------------------- */
function addDVFSource() {
  map!.addSource("dvf_points", {
    type: "geojson",
    data: emptyGeoJSON()
  });
}

/* --------------------------------------------------
   Layer DVF
-------------------------------------------------- */
function addDVFLayer() {
  // Points bleus
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

  // Points verts = rue sélectionnée
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

  // Popup DVF
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
   3️⃣ Source DPE
-------------------------------------------------- */
function addDPESource() {
  map!.addSource("dpe_points", {
    type: "geojson",
    data: emptyGeoJSON()
  });
}

/* --------------------------------------------------
   Layer DPE
-------------------------------------------------- */
function addDPELayer() {
  map!.addLayer({
    id: "dpe-points",
    type: "circle",
    source: "dpe_points",
    paint: {
      "circle-radius": 7,
      "circle-color": [
        "match",
        ["get", "etiquette"],
        "A", "#00ff00",
        "B", "#7fff00",
        "C", "#ffff00",
        "D", "#ffbf00",
        "E", "#ff7f00",
        "F", "#ff4000",
        "G", "#ff0000",
        "#cccccc"
      ],
      "circle-stroke-color": "#000000",
      "circle-stroke-width": 1.5
    }
  });

  // Popup DPE
  map!.on("click", "dpe-points", (e) => {
    const f = e.features?.[0];
    if (!f) return;

    new maplibregl.Popup()
      .setLngLat(f.geometry.coordinates)
      .setHTML(`
        <b>${f.properties.adresse}</b><br>
        Type : ${f.properties.type}<br>
        DPE : <b>${f.properties.etiquette}</b><br>
        Date : ${f.properties.date}
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

  setSourceData("dvf_points", features);
}

/* --------------------------------------------------
   5️⃣ Mise à jour des points DPE
-------------------------------------------------- */
function updateDPEPoints() {
  if (!mapLoaded) return;

  const features = dashboard.dpePoints.map(p => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [p.lon, p.lat]
    },
    properties: {
      adresse: p.adresse,
      etiquette: p.etiquette,
      type: p.type,
      date: p.date
    }
  }));

  setSourceData("dpe_points", features);
}

/* --------------------------------------------------
   6️⃣ Surlignage rue sélectionnée
-------------------------------------------------- */
function highlightStreet(street: any) {
  if (!street || !mapLoaded) return;

  updateDVFPoints();

  const source: any = map!.getSource("dvf_points");
  const geojson = source._data;

  geojson.features.forEach((f: any) => {
    if (f.properties.id_fantoir === street.id_fantoir) {
      f.properties.isSelected = true;
    }
  });

  source.setData(geojson);

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
   UTIL
-------------------------------------------------- */
function emptyGeoJSON() {
  return { type: "FeatureCollection", features: [] };
}

function setSourceData(sourceName: string, features: any[]) {
  const src: any = map!.getSource(sourceName);
  src.setData({
    type: "FeatureCollection",
    features
  });
}

/* --------------------------------------------------
   7️⃣ Watchers
-------------------------------------------------- */
function setupWatchers() {

  // DVF
  watch(
    () => dashboard.addresses,
    () => updateDVFPoints(),
    { deep: true, immediate: true }
  );

  // DPE
  watch(
    () => dashboard.dpePoints,
    () => updateDPEPoints(),
    { deep: true, immediate: true }
  );

  // centrage
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

  // rue
  watch(
    () => dashboard.selectedStreet,
    (street) => highlightStreet(street)
  );
}
</script>

<style scoped>
.map {
  width: 100%;
  height: calc(100vh - 80px);
}
</style> -->
