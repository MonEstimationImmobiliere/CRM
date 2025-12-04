<template>
  <section class="mapContainer">
    <div id="map" class="map"></div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, watch, nextTick } from "vue";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useDashboardStore } from "@/stores/dashboard";

const dashboard = useDashboardStore();

let map: maplibregl.Map | null = null;
let mapLoaded = false;

const MAPTILER_KEY = "qnb10ErHP2vBlMq3fo5B";
const STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

/* -------------------------------------
   INITIALISATION CARTE
------------------------------------- */
onMounted(() => {
  map = new maplibregl.Map({
    container: "map",
    style: STYLE,
    center: [2.35, 48.85],
    zoom: 13
  });

  map.addControl(new maplibregl.NavigationControl());

  map.on("load", () => {
    mapLoaded = true;

    // Source DVF (points)
    map.addSource("dvf_points", {
      type: "geojson",
      data: emptyGeoJSON()
    });

    // Layer points bleus
    map.addLayer({
      id: "dvf-dots",
      type: "circle",
      source: "dvf_points",
      paint: {
        "circle-radius": 7,
        "circle-color": "#4287f5",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff"
      }
    });

    setupWatchers();
    setupPopupClick();
  });
});

/* -------------------------------------
   CLICK POPUP (3 modes : ville / rue / numéro)
------------------------------------- */
function setupPopupClick() {
  map!.on("click", "dvf-dots", (e) => {
    const f = e.features?.[0];
    if (!f) return;
    const p = f.properties;

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
        document.getElementById("map-view-street")?.addEventListener("click", (ev) => {
          ev.preventDefault();

          dashboard.selectedStreet = {
            value: p.nom_voie,
            idFantoir: p.id_fantoir
          };

          dashboard.selectedCodeIdFantoir = p.id_fantoir;
          dashboard.selectedNumero = "";
          dashboard.selectedRep = "";
          dashboard.selectedNumeroFull = null;

          dashboard.querySearchAddress();

          flyTo(f.geometry.coordinates[0], f.geometry.coordinates[1], 16);
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
        document.getElementById("map-view-num")?.addEventListener("click", (ev) => {
          ev.preventDefault();

          dashboard.selectedNumeroFull = {
            numero: p.numero,
            rep: p.rep || "",
            value: p.rep ? `${p.numero} ${p.rep}` : `${p.numero}`
          };

          dashboard.selectedNumero = p.numero;
          dashboard.selectedRep = p.rep || "";
          dashboard.querySearchAddress();

          flyTo(f.geometry.coordinates[0], f.geometry.coordinates[1], 19);
        });
      }, 50);

      return;
    }

    /* ---------------------------------
        3️⃣ MODE NUMÉRO (1 seul bien)
    ---------------------------------- */
    if (dashboard.addresses.length === 1) {
      const html = `
        <b>${p.numero || ""} ${p.rep || ""} ${p.nom_voie}</b><br>
        ${p.code_postal} ${p.nom_commune}<br><br>
        <a href="#" id="map-open-property">Ouvrir la fiche</a>
      `;

      showPopup(f, html);

      setTimeout(() => {
        document.getElementById("map-open-property")?.addEventListener("click", (ev) => {
          ev.preventDefault();

          const property = dashboard.addresses[0];

          window.dispatchEvent(
            new CustomEvent("map-open-property", { detail: property })
          );
        });
      }, 50);

      return;
    }
  });
}

/* -------------------------------------
   AFFICHAGE POPUP
------------------------------------- */
function showPopup(feature, html) {
  new maplibregl.Popup()
    .setLngLat(feature.geometry.coordinates)
    .setHTML(html)
    .addTo(map!);
}

/* -------------------------------------
   UPDATE DES POINTS
------------------------------------- */
function updatePoints() {
  if (!mapLoaded) return;

  const features = dashboard.addresses
    .filter(a => a.lat && a.lon)
    .map(a => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [parseFloat(a.lon), parseFloat(a.lat)]
      },
      properties: { ...a }
    }));

  setSourceData("dvf_points", features);
}

/* -------------------------------------
   RECENTRAGE LOGIQUE
------------------------------------- */
async function recenterMap() {
  await nextTick();

  if (!mapLoaded) return;

  // 1️⃣ Numéro → centrer sur l'adresse
  if (dashboard.selectedNumeroFull && dashboard.addresses.length === 1) {
    const a = dashboard.addresses[0];
    flyTo(a.lon, a.lat, 19);
    return;
  }

  // 2️⃣ Rue → centre moyen
  if (dashboard.selectedStreet && dashboard.addresses.length > 0) {
    const lats = dashboard.addresses.map(a => Number(a.lat));
    const lons = dashboard.addresses.map(a => Number(a.lon));
    flyTo(avg(lons), avg(lats), 16);
    return;
  }

  // 3️⃣ Ville → cityCenter
  if (dashboard.selectedCity && dashboard.cityCenter) {
    flyTo(dashboard.cityCenter.lon, dashboard.cityCenter.lat, 14);
    return;
  }
}

/* -------------------------------------
   OUTILS
------------------------------------- */
function avg(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function flyTo(lon, lat, zoom) {
  map!.flyTo({
    center: [parseFloat(lon), parseFloat(lat)],
    zoom,
    speed: 1.1
  });
}

function emptyGeoJSON() {
  return { type: "FeatureCollection", features: [] };
}

function setSourceData(sourceName: string, features) {
  const src = map!.getSource(sourceName);
  src.setData({
    type: "FeatureCollection",
    features
  });
}

/* -------------------------------------
   WATCHERS (sync carte <-> dashboard)
------------------------------------- */
function setupWatchers() {
  watch(() => dashboard.addresses, () => {
    updatePoints();
    recenterMap();
  }, { deep: true, immediate: true });

  watch(() => dashboard.selectedCity, () => recenterMap());
  watch(() => dashboard.selectedStreet, () => recenterMap());
  watch(() => dashboard.selectedNumeroFull, () => recenterMap());
}
</script>

<style scoped>
.map {
  width: 100%;
  height: calc(100vh - 80px);
}
</style>
