<template>
  <section class="mapContainer">
    <div class="map-layout">
      <div class="map-wrapper">
        <div id="map" class="map"></div>

        <button class="recenter-btn" title="Recentrer la carte" @click="handleRecenter">
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

        <button
          class="map-style-btn"
          :class="`style-${baseMapStyle}`"
          title="Changer le fond de carte"
          @click="cycleMapStyle"
        >
          {{ mapStyleLabel }}
        </button>
      </div>

      <aside
        class="map-side-panel"
        :class="{ empty: !selectedMapItem && !selectedMapItems.length }"
      >
        <div class="side-panel-header">
          <div>
            <div class="side-panel-eyebrow">{{ sidePanelEyebrow }}</div>
            <h3>{{ sidePanelTitle }}</h3>
          </div>

          <button
            v-if="selectedMapItem || selectedMapItems.length"
            class="side-close"
            title="Fermer"
            @click="closeSidePanel"
          >
            ×
          </button>
        </div>

        <div v-if="!selectedMapItem && !selectedMapItems.length" class="side-empty">
          Cliquez sur une pastille, une vente DVF, un DPE ou une parcelle pour afficher les détails
          ici.
        </div>

        <div v-else class="side-content">
          <template v-if="selectedMapType === 'address'">
            <div class="detail-card">
              <div class="muted">Adresse</div>

              <div class="detail-title">
                {{ formatAddressSideTitle(selectedMapItem) }}
              </div>

              <div class="detail-grid">
                <div>
                  <span>Numéro</span>
                  <strong>{{
                    selectedMapItem.numero_full || selectedMapItem.numero || '-'
                  }}</strong>
                </div>

                <div>
                  <span>Voie</span>
                  <strong>{{ selectedMapItem.nom_voie || selectedMapItem.adresse || '-' }}</strong>
                </div>

                <div>
                  <span>Commune</span>
                  <strong>{{ selectedMapItem.nom_commune || '-' }}</strong>
                </div>

                <div>
                  <span>Code postal</span>
                  <strong>{{ selectedMapItem.code_postal || '-' }}</strong>
                </div>

                <div>
                  <span>Parcelle</span>
                  <strong>
                    {{ selectedMapItem.id_parcelle || selectedMapItem.cad_parcelles || '-' }}
                  </strong>
                </div>

                <div>
                  <span>Terrain</span>
                  <strong>
                    {{
                      formatSurface(
                        selectedMapItem.contenance ||
                          selectedMapItem.surface_terrain ||
                          selectedMapItem.total_surface_terrain
                      )
                    }}
                  </strong>
                </div>

                <div>
                  <span>Unités</span>
                  <strong>
                    {{
                      selectedMapItem.units_count ||
                      selectedMapItem.nombre_unites ||
                      selectedMapItem.nombre_units ||
                      '-'
                    }}
                  </strong>
                </div>

                <div>
                  <span>Ventes DVF</span>
                  <strong>{{ selectedMapItem.nombre_ventes || 0 }}</strong>
                </div>

                <div>
                  <span>Dernière MAJ</span>
                  <strong>{{ formatDate(selectedMapItem.date_maj) }}</strong>
                </div>

                <div>
                  <span>Prix estimé</span>
                  <strong>{{ formatCurrency(selectedMapItem.dernier_prix_estime) }}</strong>
                </div>
              </div>

              <!-- Liste des biens à l'adresse -->

              <div v-if="selectedAddressUnits.length > 1" class="sub-section">
                <h4>Biens à cette adresse</h4>

                <div
                  v-for="(unit, index) in selectedAddressUnits"
                  :key="unit.unit_id || unit.id || index"
                  class="list-row"
                  @click="openAddressUnit(unit)"
                >
                  <strong>{{ formatAddressUnitLabel(unit) }}</strong>

                  <span>
                    {{ unit.row_type === 'unit' ? 'Appartement / lot' : 'Immeuble principal' }}
                  </span>

                  <small v-if="unit.dernier_prix_estime">
                    Estimé : {{ formatCurrency(unit.dernier_prix_estime) }}
                  </small>
                </div>
              </div>

              <!-- Rue groupée -->

              <button
                v-if="isStreetGroupPoint(selectedMapItem)"
                class="primary-action"
                @click="openStreetFromMap(selectedMapItem)"
              >
                Afficher la rue
              </button>

              <!-- Adresse unique -->

              <button
                v-else-if="selectedAddressUnits.length === 1 && canOpenProperty(selectedMapItem)"
                class="primary-action"
                @click="emitEditSelectedAddress"
              >
                Ouvrir / modifier la fiche
              </button>
            </div>
          </template>

          <template v-else-if="selectedMapType === 'dvf'">
            <div class="detail-card">
              <div
                v-for="(sale, saleIndex) in selectedDvfSalesSorted"
                :key="sale.id_mutation || saleIndex"
                class="sub-section dvf-sale-section"
              >
                <div class="sale-header">
                  <span :class="getSaleBadgeClass(sale)">
                    {{ getSaleBadgeLabel(sale) }}
                  </span>

                  <div class="price">{{ formatCurrency(sale.valeur_fonciere) }}</div>
                </div>

                <div class="muted">
                  Vendu le {{ formatDate(sale.date_mutation) }}{{ getBuiltLotLabel(sale) }}
                </div>

                <div class="detail-grid dvf-simple-grid">
                  <div v-if="sale.total_surface_terrain">
                    <span>Terrain</span>
                    <strong>{{ formatSurface(sale.total_surface_terrain) }}</strong>
                  </div>

                  <div
                    v-for="(item, index) in parseJsonArray(sale.built_items).filter(
                      (i: any) => !isDependance(i)
                    )"
                    :key="index"
                  >
                    <span>{{ item.type_local || 'Bien' }}</span>
                    <strong>
                      <template v-if="item.surface_reelle_bati">
                        {{ item.surface_reelle_bati }} m²
                      </template>
                      <template v-if="item.nombre_pieces_principales">
                        · {{ item.nombre_pieces_principales }} pièce(s)
                      </template>
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template v-else-if="selectedMapType === 'dvfCluster'">
            <div class="detail-card">
              <div
                v-for="(sale, saleIndex) in selectedMapItemsSorted"
                :key="sale.id_mutation || saleIndex"
                class="sub-section dvf-sale-section"
              >
                <div class="sale-header">
                  <span :class="getSaleBadgeClass(sale)">
                    {{ getSaleBadgeLabel(sale) }}
                  </span>

                  <div class="price">{{ formatCurrency(sale.valeur_fonciere) }}</div>
                </div>

                <div class="muted">
                  Vendu le {{ formatDate(sale.date_mutation) }}{{ getBuiltLotLabel(sale) }}
                </div>

                <div class="detail-grid dvf-simple-grid">
                  <div v-if="sale.total_surface_terrain">
                    <span>Terrain</span>
                    <strong>{{ formatSurface(sale.total_surface_terrain) }}</strong>
                  </div>

                  <div
                    v-for="(item, index) in parseJsonArray(sale.built_items).filter(
                      (i: any) => !isDependance(i)
                    )"
                    :key="index"
                  >
                    <span>{{ item.type_local || 'Bien' }}</span>
                    <strong>
                      <template v-if="item.surface_reelle_bati">
                        {{ item.surface_reelle_bati }} m²
                      </template>
                      <template v-if="item.nombre_pieces_principales">
                        · {{ item.nombre_pieces_principales }} pièce(s)
                      </template>
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template v-else-if="selectedMapType === 'dpe'">
            <div class="detail-card">
              <div class="detail-title">{{ selectedMapItem.adresse || 'Adresse inconnue' }}</div>

              <div class="dpe-badge" :class="`dpe-${selectedMapItem.etiquette || 'x'}`">
                DPE {{ selectedMapItem.etiquette || '-' }}
              </div>

              <div class="detail-grid">
                <div>
                  <span>Type</span>
                  <strong>{{ selectedMapItem.type || '-' }}</strong>
                </div>
                <div>
                  <span>Date diagnostic</span>
                  <strong>{{ formatDate(selectedMapItem.date) }}</strong>
                </div>
              </div>
            </div>
          </template>

          <template v-else-if="selectedMapType === 'parcelle'">
            <div class="detail-card">
              <div class="detail-title">Parcelle cadastrale</div>

              <div class="detail-grid">
                <div>
                  <span>Parcelle</span>
                  <strong>{{ selectedMapItem.id_parcelle || selectedMapItem.id || '-' }}</strong>
                </div>
                <div>
                  <span>Surface terrain</span>
                  <strong>{{ formatSurface(selectedMapItem.contenance) }}</strong>
                </div>
                <div>
                  <span>Section</span>
                  <strong>{{ selectedMapItem.section || '-' }}</strong>
                </div>
                <div>
                  <span>Numéro</span>
                  <strong>{{ selectedMapItem.numero || '-' }}</strong>
                </div>
              </div>
            </div>
          </template>
        </div>
      </aside>
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
import {
  COLORS,
  MAP_STYLE_STREETS,
  MAP_STYLE_SATELLITE,
  MAP_STYLE_HYBRID,
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

let map: maplibregl.Map | null = null;
let mapLoaded = false;

const showParcelles = ref(false);

type MapSidePanelType = 'address' | 'dvf' | 'dvfCluster' | 'dpe' | 'parcelle' | null;

const selectedMapType = ref<MapSidePanelType>(null);
const selectedMapItem = ref<any | null>(null);
const selectedMapItems = ref<any[]>([]);

const sidePanelEyebrow = computed(() => {
  if (selectedMapType.value === 'dvf' || selectedMapType.value === 'dvfCluster') {
    return 'Historique des ventes';
  }

  return 'Détail carte';
});

const selectedDvfSalesSorted = computed(() => {
  return [...selectedDvfSales.value].sort((a: any, b: any) =>
    String(b.date_mutation || '').localeCompare(String(a.date_mutation || ''))
  );
});

const selectedMapItemsSorted = computed(() => {
  return [...selectedMapItems.value].sort((a: any, b: any) =>
    String(b.date_mutation || '').localeCompare(String(a.date_mutation || ''))
  );
});
const sidePanelTitle = computed(() => {
  switch (selectedMapType.value) {
    case 'address':
      return 'Adresse / propriété';
    case 'dvf':
      return (
        selectedMapItem.value?.adresse || selectedDvfSales.value[0]?.adresse || 'Adresse inconnue'
      );
    case 'dvfCluster':
      return selectedMapItemsSorted.value[0]?.adresse || 'Adresse inconnue';
    case 'dpe':
      return 'Diagnostic DPE';
    case 'parcelle':
      return 'Parcelle';
    default:
      return 'Aucun élément sélectionné';
  }
});

function openAddressUnit(unit: any) {
  emit('edit-property', unit as Address);
}

function getSaleTypeLabel(sale: any): string {
  const builtItem = parseJsonArray(sale?.built_items).find((item: any) => !isDependance(item));
  const label = builtItem?.type_local || sale?.type_local || sale?.main_type || 'Bien';

  return String(label).trim() || 'Bien';
}

function normalizeTypeForClass(value: any): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function getSaleBadgeClass(sale: any): string {
  const type = normalizeTypeForClass(getSaleTypeLabel(sale));

  if (type.includes('maison')) return 'sale-badge sale-badge-green';
  if (type.includes('appartement')) return 'sale-badge sale-badge-blue';
  if (type.includes('local')) return 'sale-badge sale-badge-orange';
  if (type.includes('dependance')) return 'sale-badge sale-badge-purple';
  if (type.includes('terrain') || type.includes('sol')) return 'sale-badge sale-badge-brown';

  return 'sale-badge sale-badge-gray';
}

function getSaleBadgeLabel(sale: any): string {
  return getSaleTypeLabel(sale);
}

function getBuiltLotLabel(sale: any): string {
  const item = parseJsonArray(sale.built_items).find((i: any) => !isDependance(i));
  const lots = Array.isArray(item?.lots) ? item.lots : [];
  const lot = lots[0] || item?.lot_number || item?.lot || null;

  return lot ? ` · Lot ${lot}` : '';
}

function formatAddressUnitLabel(unit: any): string {
  if (unit.row_type === 'unit') {
    return unit.unit_type
      ? `${unit.unit_type} / ${unit.apart_number || unit.lot_number || unit.unit_id || '-'}`
      : `Lot ${unit.apart_number || unit.lot_number || unit.unit_id || '-'}`;
  }

  return unit.property_type || unit.type || 'Immeuble';
}

const currentMode = computed(() => dashboard.activeMainMode || 'prospection');

const selectedDvfSales = computed(() => {
  if (selectedMapType.value !== 'dvf' || !selectedMapItem.value) {
    return [];
  }

  const sales = parseJsonArray(selectedMapItem.value.sales_detail);

  return sales.length ? sales : [selectedMapItem.value];
});

const selectedDvfLineCount = computed(() => {
  return selectedDvfSales.value.reduce((total: number, sale: any) => {
    return total + Number(sale.line_count || parseJsonArray(sale.built_items).length || 1);
  }, 0);
});

const selectedDvfDependanceCount = computed(() => {
  return selectedDvfSales.value.reduce((total: number, sale: any) => {
    return total + countDependances(parseJsonArray(sale.built_items));
  }, 0);
});

const selectedDvfTotalTerrain = computed(() => {
  return selectedDvfSales.value.reduce((total: number, sale: any) => {
    return total + Number(sale.total_surface_terrain || 0);
  }, 0);
});

// Computed: Set des property_id ayant un rappel
const reminderPropertyIds = computed(() => {
  const allReminders = [...remindersStore.reminders, ...remindersStore.agencyReminders];
  return new Set(allReminders.map((r) => r.property_id));
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
      const hasReminder = addr.id !== null && reminderPropertyIds.value.has(addr.id);
      return hasReminder ? COLORS.rappels : COLORS.none;
    }

    case 'favorites':
      return Number(addr.favorite) === 1 || addr.favorite === true ? COLORS.favorites : COLORS.none;

    case 'maj':
      return addr.date_maj ? COLORS.maj : COLORS.none;

    case 'dpe':
      return COLORS.none;

    case 'dvf':
      return addr.nombre_ventes && addr.nombre_ventes > 0 ? COLORS.dvf : COLORS.none;

    default:
      return COLORS.none;
  }
}

/* -------------------------------------
   INITIALISATION CARTE
------------------------------------- */

type BaseMapStyle = 'streets' | 'satellite' | 'hybrid';

const baseMapStyle = ref<BaseMapStyle>('streets');

const mapStyleLabel = computed(() => {
  if (baseMapStyle.value === 'streets') return 'Plan';
  if (baseMapStyle.value === 'satellite') return 'Satellite';
  return 'Hybride';
});

function getBaseMapStyleUrl() {
  switch (baseMapStyle.value) {
    case 'satellite':
      return MAP_STYLE_SATELLITE;
    case 'hybrid':
      return MAP_STYLE_HYBRID;
    default:
      return MAP_STYLE_STREETS;
  }
}

function cycleMapStyle() {
  if (!map) return;

  if (baseMapStyle.value === 'streets') {
    baseMapStyle.value = 'satellite';
  } else if (baseMapStyle.value === 'satellite') {
    baseMapStyle.value = 'hybrid';
  } else {
    baseMapStyle.value = 'streets';
  }

  mapLoaded = false;

  map.once('idle', () => {
    mapLoaded = true;
    rebuildMapLayers();
    map?.resize();
  });

  map.setStyle(getBaseMapStyleUrl(), { diff: false });
}

onMounted(async () => {
  await remindersStore.loadReminders();

  map = new maplibregl.Map({
    container: 'map',
    style: MAP_STYLE_STREETS,
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  });

  map.addControl(new maplibregl.NavigationControl());

  map.on('load', () => {
    mapLoaded = true;

    rebuildMapLayers();
    setupWatchers();
    setupAddressInteractions();
    setupDpeInteractions();
    setupDvfInteractions();
    recenterMap();
  });
});

onUnmounted(() => {
  closeSidePanel();

  if (map) {
    map.remove();
    map = null;
  }
});

function rebuildMapLayers() {
  if (!map || !map.isStyleLoaded()) return;

  try {
    addParcellesLayer();

    addAddressLayer();
    addDpeLayer();
    addDvfLayer();

    updateParcelles();
    updateAddressPoints();
    updateAddressPointsWithColors();
    updateDpePoints();
    updateDvfPoints();
    updateLayerVisibility();
  } catch (error) {
    console.error('Erreur pendant la reconstruction des layers MapLibre :', error);
  }
}

function addAddressLayer() {
  if (!map) return;

  if (!map.getSource('address_points')) {
    map.addSource('address_points', {
      type: 'geojson',
      data: emptyGeoJSON(),
    });
  }

  if (!map.getLayer('address-dots')) {
    map.addLayer({
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
  }
}

function addDpeLayer() {
  if (!map) return;

  if (!map.getSource('dpe_points')) {
    map.addSource('dpe_points', {
      type: 'geojson',
      data: emptyGeoJSON(),
    });
  }

  if (!map.getLayer('dpe-dots')) {
    map.addLayer({
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
  }
}

function pointInRing(point: [number, number], ring: any[]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = Number(ring[i][0]);
    const yi = Number(ring[i][1]);
    const xj = Number(ring[j][0]);
    const yj = Number(ring[j][1]);

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

function getParcelleLabelPoint(feature: any): [number, number] | null {
  const geometry = feature.geometry;
  if (!geometry) return null;

  let polygons: any[] = [];

  if (geometry.type === 'Polygon') {
    polygons = [geometry.coordinates];
  }

  if (geometry.type === 'MultiPolygon') {
    polygons = geometry.coordinates || [];
  }

  for (const polygon of polygons) {
    const outerRing = polygon?.[0];
    if (!outerRing?.length) continue;

    const lons = outerRing.map((c: any) => Number(c[0]));
    const lats = outerRing.map((c: any) => Number(c[1]));

    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const candidates: [number, number][] = [
      [(minLon + maxLon) / 2, (minLat + maxLat) / 2],
      [avg(lons), avg(lats)],
      [minLon + (maxLon - minLon) * 0.35, minLat + (maxLat - minLat) * 0.5],
      [minLon + (maxLon - minLon) * 0.65, minLat + (maxLat - minLat) * 0.5],
      [minLon + (maxLon - minLon) * 0.5, minLat + (maxLat - minLat) * 0.35],
      [minLon + (maxLon - minLon) * 0.5, minLat + (maxLat - minLat) * 0.65],
    ];

    for (const candidate of candidates) {
      if (pointInRing(candidate, outerRing)) {
        return candidate;
      }
    }

    return outerRing[0] as [number, number];
  }

  return null;
}

const selectedAddressUnits = computed<any[]>(() => {
  if (selectedMapType.value !== 'address' || !selectedMapItem.value) {
    return [];
  }

  const key = selectedMapItem.value.id_fantoir_long || selectedMapItem.value.id_fantoir || '';

  if (!key) return [];

  return props.addresses.filter((a: any) => {
    return a.id_fantoir_long === key || a.id_fantoir === key;
  });
});

function buildParcellesLabelsGeojson(
  sourceGeojson: GeoJSON.FeatureCollection
): GeoJSON.FeatureCollection {
  const labelsByParcelle = new Map<string, GeoJSON.Feature>();

  const features = sourceGeojson?.features || [];

  features.forEach((feature: any) => {
    const props = feature.properties || {};
    const id = String(
      props.id_parcelle || props.id || props.parcelle || JSON.stringify(feature.geometry)
    );

    if (labelsByParcelle.has(id)) return;

    const point = getParcelleLabelPoint(feature);
    if (!point) return;

    labelsByParcelle.set(id, {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: point,
      },
      properties: {
        id_parcelle: id,
        label: `${props.contenance || ''} m²`,
      },
    } as GeoJSON.Feature);
  });

  return {
    type: 'FeatureCollection',
    features: Array.from(labelsByParcelle.values()),
  };
}

function addParcellesLayer() {
  if (!map) return;

  if (!map.getSource('parcelles_cadastre')) {
    map.addSource('parcelles_cadastre', {
      type: 'geojson',
      data: emptyGeoJSON(),
    });
  }

  if (!map.getSource('parcelles_labels')) {
    map.addSource('parcelles_labels', {
      type: 'geojson',
      data: emptyGeoJSON(),
    });
  }

  if (!map.getLayer('parcelles-fill')) {
    map.addLayer({
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
  }

  if (!map.getLayer('parcelle-highlight')) {
    map.addLayer({
      id: 'parcelle-highlight',
      type: 'fill',
      source: 'parcelles_cadastre',
      filter: ['==', ['get', 'id_parcelle'], ''],
      paint: {
        'fill-color': '#facc15',
        'fill-opacity': 0.35,
      },
      layout: {
        visibility: 'none',
      },
    });
  }

  if (!map.getLayer('parcelles-line')) {
    map.addLayer({
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
  }

  if (!map.getLayer('parcelles-labels')) {
    map.addLayer({
      id: 'parcelles-labels',
      type: 'symbol',
      source: 'parcelles_labels',
      minzoom: 17,
      layout: {
        'text-field': ['get', 'label'],
        'text-size': 11,
        'text-allow-overlap': false,
        'text-ignore-placement': false,
        visibility: 'none',
      },
      paint: {
        'text-color': '#111827',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.5,
      },
    });
  }
}

function styleSupportsTextLayers() {
  return Boolean(map?.getStyle()?.glyphs);
}

function addDvfLayer() {
  if (!map) return;

  if (!map.getSource('dvf_points')) {
    map.addSource('dvf_points', {
      type: 'geojson',
      data: emptyGeoJSON(),
      cluster: true,
      clusterMaxZoom: 18,
      clusterRadius: 35,
      clusterProperties: {
        sale_count: ['+', ['get', 'sale_count']],
      },
    });
  }

  if (!map.getLayer('dvf-clusters')) {
    map.addLayer({
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
  }

  if (styleSupportsTextLayers() && !map.getLayer('dvf-cluster-labels')) {
    map.addLayer({
      id: 'dvf-cluster-labels',
      type: 'symbol',
      source: 'dvf_points',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['to-string', ['coalesce', ['get', 'sale_count'], ['get', 'point_count']]],
        'text-size': 12,
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#ffffff',
      },
    });
  }

  if (!map.getLayer('dvf-dots')) {
    map.addLayer({
      id: 'dvf-dots',
      type: 'circle',
      filter: ['!', ['has', 'point_count']],
      source: 'dvf_points',
      paint: {
        'circle-radius': 9,
        'circle-color': '#111827',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });
  }

  if (styleSupportsTextLayers() && !map.getLayer('dvf-labels')) {
    map.addLayer({
      id: 'dvf-labels',
      type: 'symbol',
      filter: ['!', ['has', 'point_count']],
      source: 'dvf_points',
      layout: {
        'text-field': ['to-string', ['get', 'sale_count']],
        'text-size': 11,
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#ffffff',
      },
    });
  }
}

function normalizeDvfStreet(adresse: string): string {
  return String(adresse || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^\s*\d+\s*(BIS|TER|QUATER)?\s+/i, '')
    .replace(/\bRUE\b/g, 'RUE')
    .replace(/\bAVENUE\b/g, 'AV')
    .replace(/\bBOULEVARD\b/g, 'BD')
    .replace(/\bROUTE\b/g, 'RTE')
    .replace(/\bCHEMIN\b/g, 'CHE')
    .replace(/\s+/g, ' ')
    .trim();
}

function getDvfPointKey(p: any): string {
  return getDvfSaleKey(p);
}
function getDvfSaleKey(p: any): string {
  const date = String(p.date_mutation || '').substring(0, 10);
  const price = Number(p.valeur_fonciere || 0);

  return `${date}|${price}`;
}
function updateDvfPoints() {
  if (!mapLoaded || !map) return;

  const grouped = new Map<string, any[]>();

  (props.dvfPoints || [])
    .filter((p: any) => p.lat && p.lon)
    .forEach((p: any) => {
      const key = getDvfPointKey(p);

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }

      grouped.get(key)!.push(p);
    });

  const features = Array.from(grouped.values()).map((group: any[]) => {
    const first = group[0];
    const salesMap = new Map<string, any>();

    group.forEach((p: any) => {
      const saleKey = getDvfSaleKey(p);

      if (!salesMap.has(saleKey)) {
        salesMap.set(saleKey, {
          ...p,
          built_items: [],
          land_items: [],
          parcelles_ids: [],
          line_count: 0,
          total_surface_terrain: 0,
        });
      }

      const sale = salesMap.get(saleKey);

      sale.line_count += Number(p.line_count ?? 1);

      // Parcelle directe de la ligne DVF
      const directParcelleId = p.id_parcelle || p.numero_plan || p.parcelle || null;

      if (directParcelleId) {
        sale.parcelles_ids.push(String(directParcelleId).trim());
      }

      sale.built_items.push(...parseJsonArray(p.built_items));

      const uniqueBuiltItems = new Map<string, any>();

      sale.built_items.forEach((built: any) => {
        const key = [
          built.type_local || '',
          built.surface_reelle_bati || '',
          built.nombre_pieces_principales || '',
        ].join('|');

        if (!uniqueBuiltItems.has(key)) {
          uniqueBuiltItems.set(key, built);
        }
      });

      sale.built_items = Array.from(uniqueBuiltItems.values());
      sale.land_items.push(...parseJsonArray(p.land_items));

      // Déduplication des terrains
      const uniqueLandItems = new Map<string, any>();

      sale.land_items.forEach((land: any) => {
        const key = [
          land.nature_culture || '',
          land.surface_terrain || land.contenance || land.surface || '',
          land.id_parcelle || land.numero_plan || land.parcelle || '',
        ].join('|');

        if (!uniqueLandItems.has(key)) {
          uniqueLandItems.set(key, land);
        }

        const parcelleId = land.id_parcelle || land.numero_plan || land.parcelle;

        if (parcelleId) {
          sale.parcelles_ids.push(String(parcelleId).trim());
        }
      });

      sale.land_items = Array.from(uniqueLandItems.values());

      sale.parcelles_ids = Array.from(new Set(sale.parcelles_ids));

      sale.total_surface_terrain = sale.land_items.reduce(
        (total: number, land: any) =>
          total + Number(land.contenance || land.surface_terrain || land.surface || 0),
        0
      );
    });

    const sales = Array.from(salesMap.values()).sort((a: any, b: any) =>
      String(b.date_mutation || '').localeCompare(String(a.date_mutation || ''))
    );

    // Centre de toutes les parcelles regroupées
    const validLats = group
      .map((p: any) => Number(p.lat ?? p.latitude))
      .filter((v: number) => !Number.isNaN(v));

    const validLons = group
      .map((p: any) => Number(p.lon ?? p.longitude))
      .filter((v: number) => !Number.isNaN(v));

    const centerLat = avg(validLats);
    const centerLon = avg(validLons);

    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [centerLon, centerLat],
      },
      properties: {
        ...first,

        adresse: first.adresse || '',
        date_mutation: first.date_mutation || '',
        valeur_fonciere: first.valeur_fonciere ?? null,
        main_type: first.main_type || 'autre',

        sale_count: sales.length,

        line_count: sales.reduce((sum: number, sale: any) => sum + Number(sale.line_count || 0), 0),

        sales_detail: JSON.stringify(sales),

        built_items: JSON.stringify(sales.flatMap((sale: any) => sale.built_items || [])),

        land_items: JSON.stringify(sales.flatMap((sale: any) => sale.land_items || [])),

        parcelles_ids: JSON.stringify(
          Array.from(new Set(sales.flatMap((sale: any) => sale.parcelles_ids || [])))
        ),

        total_surface_terrain: sales.reduce(
          (sum: number, sale: any) => sum + Number(sale.total_surface_terrain || 0),
          0
        ),
      },
    };
  });

  setSourceData('dvf_points', features);
}
/* -------------------------------------
   UPDATE DES POINTS ADRESSES
------------------------------------- */
function updateAddressPoints() {
  if (!mapLoaded || !map) return;

  const features = props.addresses
    .filter((a) => a.lat && a.lon)
    .map((a) => ({
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
    .filter((p) => p.lat && p.lon)
    .map((p) => ({
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

  const parcellesData = (props.parcellesGeojson || emptyGeoJSON()) as GeoJSON.FeatureCollection;

  const src = map.getSource('parcelles_cadastre') as maplibregl.GeoJSONSource | undefined;
  if (src) {
    src.setData(parcellesData);
  }

  const labelSrc = map.getSource('parcelles_labels') as maplibregl.GeoJSONSource | undefined;
  if (labelSrc) {
    labelSrc.setData(buildParcellesLabelsGeojson(parcellesData));
  }
}

function setLayerVisibility(layerId: string, visibility: 'visible' | 'none') {
  if (!map || !map.getLayer(layerId)) return;
  map.setLayoutProperty(layerId, 'visibility', visibility);
}

function updateLayerVisibility() {
  if (!mapLoaded || !map) return;

  const isDpeMode = dashboard.activeMainMode === 'dpe';
  const isDvfMode = dashboard.activeMainMode === 'dvf';

  setLayerVisibility('address-dots', isDpeMode || isDvfMode ? 'none' : 'visible');
  setLayerVisibility('dpe-dots', isDpeMode ? 'visible' : 'none');
  setLayerVisibility('dvf-dots', isDvfMode ? 'visible' : 'none');
  setLayerVisibility('dvf-labels', isDvfMode ? 'visible' : 'none');
  setLayerVisibility('dvf-clusters', isDvfMode ? 'visible' : 'none');
  setLayerVisibility('dvf-cluster-labels', isDvfMode ? 'visible' : 'none');

  setLayerVisibility('parcelles-fill', showParcelles.value ? 'visible' : 'none');
  setLayerVisibility('parcelles-line', showParcelles.value ? 'visible' : 'none');

  setLayerVisibility('parcelle-highlight', showParcelles.value ? 'visible' : 'none');

  setLayerVisibility('parcelles-labels', showParcelles.value ? 'visible' : 'none');
}

function getIdsParcellesFromDvfItem(item: any): string[] {
  const directIds = parseJsonArray(item?.parcelles_ids);

  if (directIds.length) {
    return directIds.map((id: any) => String(id).trim()).filter(Boolean);
  }

  const sales = parseJsonArray(item?.sales_detail);
  const source = sales.length ? sales : [item];

  const ids = new Set<string>();

  source.forEach((sale: any) => {
    parseJsonArray(sale.parcelles_ids).forEach((id: any) => {
      if (id) ids.add(String(id).trim());
    });

    parseJsonArray(sale.land_items).forEach((land: any) => {
      const id = land.id_parcelle || land.numero_plan || land.parcelle;
      if (id) ids.add(String(id).trim());
    });

    const directId = sale.id_parcelle || sale.numero_plan || sale.parcelle;
    if (directId) ids.add(String(directId).trim());
  });

  return Array.from(ids);
}

function highlightParcelles(idsParcelles?: string[] | null) {
  if (!map || !map.getLayer('parcelle-highlight')) return;

  const ids = (idsParcelles || []).map((id) => String(id).trim()).filter(Boolean);

  if (!ids.length) {
    map.setFilter('parcelle-highlight', ['==', ['get', 'id_parcelle'], '']);
    return;
  }

  map.setFilter('parcelle-highlight', ['in', ['get', 'id_parcelle'], ['literal', ids]]);
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
      const surfaceBati = item.surface_reelle_bati ? `${item.surface_reelle_bati} m²` : '-';
      const pieces = item.nombre_pieces_principales ? `${item.nombre_pieces_principales}` : '-';

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

function setupAddressInteractions() {
  if (!map) return;

  map.on('click', 'address-dots', (e) => {
    const feature = e.features?.[0];
    if (!feature) return;

    const props = feature.properties || {};
    openSidePanel('address', props);
  });

  map.on('mouseenter', 'address-dots', () => {
    if (map) map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'address-dots', () => {
    if (map) map.getCanvas().style.cursor = '';
  });
}

function setupDvfInteractions() {
  if (!map) return;

  map.on('click', 'dvf-clusters', async (e) => {
    const features = map!.queryRenderedFeatures(e.point, {
      layers: ['dvf-clusters'],
    });

    const cluster = features[0];
    if (!cluster) return;

    const clusterId = cluster.properties?.cluster_id;
    if (clusterId === undefined || clusterId === null) return;

    const source = map!.getSource('dvf_points') as any;
    const leaves = (await source.getClusterLeaves(clusterId, 50, 0)) as any[];

    const sales = leaves.flatMap((leaf: any) => {
      const props = leaf.properties || {};
      const details = parseJsonArray(props.sales_detail);

      return details.length ? details : [props];
    });

    openSidePanel('dvfCluster', null, sales);
  });

  /*map.on('click', 'dvf-dots', e => {
  const feature = e.features?.[0];
  if (!feature) return;

  const props = feature.properties || {};

  highlightParcelle(
    props.id_parcelle ||
    props.numero_plan ||
    null
  );

  openSidePanel('dvf', props);
});*/

  map.on('click', 'dvf-dots', (e) => {
    const feature = e.features?.[0];
    if (!feature) return;

    const props = feature.properties || {};

    console.log('DVF CLICK PROPS =', props);

    openSidePanel('dvf', props);
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

  map.on('click', 'dpe-dots', (e) => {
    const feature = e.features?.[0];
    if (!feature) return;

    openSidePanel('dpe', feature.properties || {});
  });

  map.on('mouseenter', 'dpe-dots', () => {
    if (map) map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'dpe-dots', () => {
    if (map) map.getCanvas().style.cursor = '';
  });
}

function openSidePanel(type: Exclude<MapSidePanelType, null>, item: any | null, items: any[] = []) {
  selectedMapType.value = type;
  selectedMapItem.value = item;
  selectedMapItems.value = items;

  if (type === 'dvf') {
    highlightParcelles(getIdsParcellesFromDvfItem(item));
  } else if (type === 'address' || type === 'dpe') {
    highlightParcelles([getIdParcelleFromItem(item)].filter(Boolean) as string[]);
  } else {
    highlightParcelles(null);
  }
}

function closeSidePanel() {
  selectedMapType.value = null;
  selectedMapItem.value = null;
  selectedMapItems.value = [];

  highlightParcelles(null);
}

function getIdParcelleFromItem(item: any): string | null {
  if (!item) return null;

  const raw = item.id_parcelle || item.cad_parcelles || item.numero_plan || item.parcelle || null;

  if (!raw) return null;

  const text = String(raw);

  // Si plusieurs parcelles sont stockées en CSV/JSON simple, on prend la première.
  return (
    text.replace('[', '').replace(']', '').replaceAll('"', '').split(/[;,|]/)[0].trim() || null
  );
}

function formatAddressTitle(item: any): string {
  const numero = item?.numero_full || item?.numero || '';
  const voie = item?.nom_voie || item?.adresse || '';
  const title = `${numero} ${voie}`.trim();

  return title || 'Adresse';
}

function formatAddressSideTitle(item: any): string {
  if (!item) return 'Adresse';

  const numero = item.numero_full || item.numero || '';
  const voie = item.nom_voie || item.adresse || '';

  if (!numero && voie) {
    return String(voie).toUpperCase();
  }

  const title = `${numero} ${voie}`.trim();
  return title ? title.toUpperCase() : 'Adresse';
}

function canOpenProperty(item: any): boolean {
  if (!item) return false;
  return Boolean(item.numero || item.numero_full);
}

function isDependance(item: any): boolean {
  const type = String(item?.type_local || '').toLowerCase();
  return type.includes('dépendance') || type.includes('dependance');
}

function countDependances(items: any[]): number {
  return items.filter((item: any) => {
    const type = String(item.type_local || '').toLowerCase();
    return type.includes('dépendance') || type.includes('dependance');
  }).length;
}
function emitEditSelectedAddress() {
  if (!selectedMapItem.value) return;
  emit('edit-property', selectedMapItem.value as Address);
}

function formatCurrency(value: any): string {
  const numberValue = Number(value);

  if (!value || Number.isNaN(numberValue)) {
    return 'Prix inconnu';
  }

  return new Intl.NumberFormat('fr-FR').format(numberValue) + ' €';
}

function formatSurface(value: any): string {
  const numberValue = Number(value);

  if (!value || Number.isNaN(numberValue)) {
    return '-';
  }

  return new Intl.NumberFormat('fr-FR').format(numberValue) + ' m²';
}

function formatDate(value: any): string {
  if (!value) return '-';

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return String(value);
  }

  return d.toLocaleDateString('fr-FR');
}

function parseJsonArray(value: any): any[] {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isStreetGroupPoint(item: any): boolean {
  if (!item) return false;

  const hasNumero = Boolean(item.numero || item.numero_full);

  return !hasNumero && Boolean(item.id_fantoir || item.nom_voie || item.adresse);
}

async function openStreetFromMap(item: any) {
  const streetName = item.nom_voie || item.adresse || '';
  const idFantoir = item.id_fantoir || item.codeIdFantoir || item.id_fantoir_long || '';

  if (!streetName || !idFantoir) {
    openSidePanel('address', item);
    return;
  }

  closeSidePanel();

  dashboard.selectedStreet = {
    value: streetName,
    idFantoir,
  };

  dashboard.selectedCodeIdFantoir = idFantoir;
  dashboard.selectedNumero = '';
  dashboard.selectedRep = '';
  dashboard.selectedNumeroFull = null;

  await dashboard.querySearchAddress();
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
      const lats = points.map((p) => Number(p.lat));
      const lons = points.map((p) => Number(p.lon));
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
      const lats = points.map((p) => Number(p.lat));
      const lons = points.map((p) => Number(p.lon));
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
    const lats = props.addresses.map((a) => Number(a.lat));
    const lons = props.addresses.map((a) => Number(a.lon));
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
    (newCenter) => {
      if (!newCenter) return;
      closeSidePanel();
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
    (newStreet) => {
      closeSidePanel();
      if (!newStreet) return;
      recenterMap();
    }
  );

  watch(
    () => dashboard.selectedNumeroFull,
    (newNumero) => {
      closeSidePanel();
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
    (newCity) => {
      closeSidePanel();

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
    (newType) => {
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

.map-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 12px;
  width: 100%;
  min-width: 0;
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

.map-side-panel {
  height: 700px;
  overflow-y: auto;
  background: #ffffff;
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 1px 8px rgba(15, 23, 42, 0.12);
  border: 1px solid #e5e7eb;
}

.side-panel-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.side-panel-eyebrow {
  font-size: 11px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.side-panel-header h3 {
  margin: 2px 0 0;
  font-size: 18px;
  color: #111827;
}

.side-close {
  border: none;
  background: #f3f4f6;
  color: #111827;
  border-radius: 10px;
  width: 32px;
  height: 32px;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.side-close:hover {
  background: #e5e7eb;
}

.side-empty {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 14px;
  padding: 16px;
}

.side-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-card {
  background: #ffffff;
}

.detail-title {
  font-size: 16px;
  font-weight: 800;
  color: #1e1b4b;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.muted {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.price {
  font-size: 24px;
  font-weight: 800;
  color: #1e1b4b;
  margin-bottom: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
}

.detail-grid > div {
  background: #f8fafc;
  border-radius: 12px;
  padding: 10px;
  min-width: 0;
}

.detail-grid span {
  display: block;
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 4px;
}

.detail-grid strong {
  display: block;
  font-size: 13px;
  color: #111827;
  overflow-wrap: anywhere;
}

.primary-action {
  width: 100%;
  margin-top: 14px;
  border: none;
  border-radius: 12px;
  background: #2563eb;
  color: #ffffff;
  font-weight: 700;
  padding: 10px 12px;
  cursor: pointer;
}

.primary-action:hover {
  background: #1d4ed8;
}

.sub-section {
  margin-top: 16px;
}

.sub-section h4 {
  margin: 0 0 8px;
  color: #111827;
}

.mini-card,
.list-row {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px;
  margin-bottom: 8px;
  background: #ffffff;
}

.mini-card span,
.list-row span,
.list-row small {
  display: block;
  color: #6b7280;
  font-size: 12px;
  margin-top: 2px;
}

.list-row {
  cursor: pointer;
}

.list-row:hover {
  background: #f9fafb;
}

.dpe-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  padding: 6px 12px;
  border-radius: 999px;
  color: #ffffff;
  font-weight: 800;
  margin: 6px 0 12px;
  background: #6b7280;
}

.dpe-A {
  background: #10b981;
}
.dpe-B {
  background: #22c55e;
}
.dpe-C {
  background: #84cc16;
}
.dpe-D {
  background: #eab308;
}
.dpe-E {
  background: #f97316;
}
.dpe-F {
  background: #ef4444;
}
.dpe-G {
  background: #991b1b;
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

.map-style-btn {
  position: absolute;
  top: 96px;
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

.map-style-btn.style-satellite,
.map-style-btn.style-hybrid {
  background: #111827;
  color: #fff;
}

@media (max-width: 1100px) {
  .map-layout {
    grid-template-columns: 1fr;
  }

  .map-side-panel {
    height: auto;
    max-height: 420px;
  }
}

.mini-card-full {
  width: 100%;
}

.mini-card-full span {
  display: block;
}

.dvf-sale-section {
  padding-bottom: 18px;
  border-bottom: 1px solid #e5e7eb;
}

.dvf-sale-section:last-child {
  border-bottom: none;
}

.dvf-simple-grid {
  margin-top: 12px;
}

.sale-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.sale-header .price {
  margin-bottom: 0;
}

.sale-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 9px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  white-space: nowrap;
}

.sale-badge-green {
  background: #dcfce7;
  color: #166534;
}

.sale-badge-blue {
  background: #dbeafe;
  color: #1d4ed8;
}

.sale-badge-orange {
  background: #ffedd5;
  color: #c2410c;
}

.sale-badge-purple {
  background: #f3e8ff;
  color: #7e22ce;
}

.sale-badge-brown {
  background: #fef3c7;
  color: #92400e;
}

.sale-badge-gray {
  background: #f3f4f6;
  color: #374151;
}
</style>
