<template>
  <section class="mapContainer">
    <div class="map-layout">
      <div class="map-wrapper">
        <div id="map" class="map"></div>

        <p v-if="currentMode === 'dvf' && dvfSearchError" class="dvf-search-status" role="status">
          {{ dvfSearchError }}
        </p>

        <button class="recenter-btn" title="Recentrer la carte" @click="handleRecenter">
          <el-icon :size="20"><MapLocation /></el-icon>
        </button>

        <button
          class="parcelles-btn"
          :class="{ active: showParcelles }"
          :aria-pressed="showParcelles"
          title="Afficher / masquer les parcelles"
          @click="toggleParcelles"
        >
          Parcelles
        </button>

        <p v-if="showParcelles && parcelViewportError" class="parcelles-status" role="status">
          {{ parcelViewportError }}
        </p>

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
        :class="{
          empty: !showStreetSummary && !showCommuneSummary && !selectedMapItem && !selectedMapItems.length,
          'prospection-address-panel': showCompactAddress,
        }"
      >
        <div class="side-panel-header">
          <div>
            <button
              v-if="canReturnToStreet"
              type="button"
              class="return-to-city"
              @click="returnToStreet"
            >
              ← Retour à la rue
            </button>
            <button
              v-else-if="showStreetSummary"
              type="button"
              class="return-to-city"
              @click="emit('return-to-city')"
            >
              ← Retour à la ville
            </button>
            <div class="side-panel-eyebrow">{{ sidePanelEyebrow }}</div>
            <template v-if="showCompactAddress">
              <h3 class="prospection-address-title">{{ prospectionAddressTitle }}</h3>
              <div class="muted">
                {{ prospectionAddressLocality }}
              </div>
            </template>
            <template v-else-if="showCommuneSummary">
              <h3>{{ communeName }}</h3>
              <div v-if="communePostalCode" class="muted">{{ communePostalCode }}</div>
            </template>
            <h3 v-else>{{ showStreetSummary ? dashboard.selectedStreet?.value : sidePanelTitle }}</h3>
            <div v-if="showStreetSummary" class="muted">{{ dashboard.selectedCity?.city || dashboard.selectedCity?.value }}</div>
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

        <ProspectionStreetSummary
          v-if="showStreetSummary"
          :count="streetProspectionProgress ?? null"
          :code-insee="dashboard.selectedCodeInsee"
          :street-key="dashboard.selectedCodeIdFantoir"
        />
        <ProspectionStreetSummary
          v-else-if="showCommuneSummary"
          :count="dashboard.prospectionProgress?.commune ?? null"
          :street-count="communeStreetCount"
          :code-insee="dashboard.selectedCodeInsee"
          commune
        />
        <div v-else-if="!selectedMapItem && !selectedMapItems.length" class="side-empty">
          {{ currentMode === 'maj'
            ? 'Cliquez sur une pastille pour consulter les biens mis à jour à cette adresse.'
            : 'Cliquez sur une pastille, une vente DVF, un DPE ou une parcelle pour afficher les détails ici.' }}
        </div>

        <div v-else class="side-content">
          <template v-if="showCompactAddress">
            <div v-if="showProspectionAddress" class="prospection-address-progress">
              <span>Prospection</span>
              <ProspectionProgressBadge :count="selectedProspectionProgress" show-counts />
            </div>
            <dl class="prospection-address-stats">
              <div>
                <dt>Dernière MAJ</dt>
                <dd>{{ formatDate(compactAddressStats.date_maj) }}</dd>
              </div>
              <div>
                <dt>Prix estimé</dt>
                <dd v-if="showProspectionAddress"><ProspectionEstimatedPrice :value="compactAddressStats.display_estimate" /></dd>
                <dd v-else>{{ showEstimationAddress && compactEstimatedPrice == null ? '—' : formatCurrency(compactEstimatedPrice) }}</dd>
              </div>
            </dl>

            <button
              v-if="!dashboard.hasDirectAddressList && isStreetGroupPoint(selectedMapItem)"
              class="primary-action"
              type="button"
              @click="openStreetFromMap(selectedMapItem)"
            >
              Afficher la rue
            </button>
            <section v-if="addressPropertyCards.length" class="prospection-properties">
              <h4>Biens à cette adresse</h4>
              <ul class="prospection-property-list">
                <li v-for="card in addressPropertyCards" :key="card.key">
                  <button
                    class="prospection-property"
                    type="button"
                    :aria-pressed="showEstimationAddress ? card.property.id === selectedMapItem.id : undefined"
                    @click="openCompactProperty(card.property)"
                  >
                    <span class="prospection-property-icon" :class="`type-${card.category}`">
                      <component :is="propertyTypeIcons[card.category]" aria-hidden="true" />
                    </span>
                    <span class="prospection-property-text">
                      <span class="prospection-property-title">
                        {{ showEstimationAddress ? (card.property.label || card.typeLabel || card.property.type_bien || 'Estimation')
                          : showMajAddress && card.isPrincipal ? (card.typeLabel || formatAddressUnitLabel(card.property))
                          : formatAddressUnitLabel(card.property) }}
                      </span>
                      <span v-if="card.owner" class="prospection-property-type">{{ card.owner }}</span>
                      <span v-if="showProspectionAddress" class="prospection-property-type">
                        Prix estimé · <ProspectionEstimatedPrice :value="card.property.display_estimate" />
                      </span>
                      <template v-if="showProspectionAddress && !card.isPrincipal && card.property.date_derniere_vente">
                        <span class="prospection-property-type">Dernière vente · {{ formatDate(card.property.date_derniere_vente) }}</span>
                        <span v-if="card.property.dernier_prix_vente != null" class="prospection-property-type">
                          {{ formatCurrency(card.property.dernier_prix_vente) }} · {{ formatCurrency(card.property.dernier_prix_vente_m2) }}/m²
                        </span>
                        <span v-for="item in unitMarketDifferences(card.property)" :key="item.scope" class="prospection-property-type">
                          <DvfMarketTooltip :details="item.tooltip">
                            {{ item.scope === 'street' ? 'Écart rue' : 'Écart commune' }} · {{ unitMarketPercent.format(item.difference) }}
                            <small v-if="item.lowReliability"> · Faible fiabilité</small>
                          </DvfMarketTooltip>
                        </span>
                      </template>
                      <span v-if="showProspectionAddress && card.property.date_mutation_dvf_ambigue" class="prospection-property-type">
                        Mutation DVF du {{ formatDate(card.property.date_mutation_dvf_ambigue) }} · périmètre indéterminé
                      </span>
                      <span v-if="!card.isPrincipal && card.typeLabel" class="prospection-property-type">
                        {{ card.typeLabel }}
                      </span>
                      <span v-if="showEstimationAddress && card.property.created_at" class="prospection-property-type">
                        {{ formatDate(card.property.created_at) }}
                      </span>
                      <span v-if="showFavoriteAddress" class="prospection-property-type">
                        {{ card.favorite ? 'Favori personnel' : 'Non favori' }}
                      </span>
                      <span v-else-if="card.prospected !== undefined" class="prospection-property-type">
                        {{ card.prospected ? 'Prospecté' : 'À prospecter' }}
                      </span>
                      <span v-else-if="card.isPrincipal && selectedProspectionProgress" class="prospection-property-type">
                        Hors total de prospection
                      </span>
                    </span>
                    <span class="prospection-property-badge" :class="{ principal: card.isPrincipal }">
                      {{ showEstimationAddress ? 'Estimation' : card.isPrincipal ? 'Bien principal' : 'Unité' }}
                    </span>
                    <ArrowRight class="prospection-property-arrow" aria-hidden="true" />
                  </button>
                  <el-button v-if="showProspectionAddress && card.property.dvf_address_history_count != null"
                    link type="primary" size="small" @click="emit('open-dvf-history', card.property as Address)">
                    {{ card.property.dvf_address_history_count }} {{ card.property.dvf_address_history_count === 1 ? 'transaction DVF' : 'transactions DVF' }}
                  </el-button>
                </li>
              </ul>
            </section>
            <section v-if="showEstimationAddress" ref="estimationDetails" class="sub-section" tabindex="-1">
              <h4>Détail de l’estimation</h4>
              <div v-if="estimationFacts.length" class="detail-grid">
                <div v-for="fact in estimationFacts" :key="fact.label">
                  <span>{{ fact.label }}</span>
                  <strong>{{ fact.value }}</strong>
                </div>
              </div>
            </section>
            <section v-if="showReminderAddress" class="sub-section">
              <h4>Rappels du bien</h4>
              <p v-if="!selectedReminders.length" class="muted">Aucun rappel actif dans ce périmètre.</p>
              <div v-for="reminder in selectedReminders" :key="reminder.id" class="detail-card">
                <strong>{{ reminder.title }}</strong>
                <div class="muted">{{ formatReminderDate(reminder.date) }} · {{ reminderStatus(reminder) }}</div>
                <p v-if="reminder.description" class="reminder-comment">{{ reminder.description }}</p>
                <button
                  v-if="canEditMapReminder(reminder)"
                  type="button"
                  class="return-to-city"
                  @click="emit('edit-reminder', reminder)"
                >
                  Modifier le rappel
                </button>
              </div>
            </section>
          </template>
          <template v-else-if="selectedMapType === 'address'">
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
import {
  ArrowRight, Box, House, Key, MapLocation, OfficeBuilding, Shop, SuitcaseLine, Van,
} from '@element-plus/icons-vue';
import { useDashboardStore } from '@/stores/dashboard';
import { usePropertyStore } from '@/stores/propertyHome';
import { useUserStore } from '@/stores/user';
import { loadFavoriteAddressDetails } from '@/utils/favoriteAddressDetails';
import ProspectionProgressBadge from './ProspectionProgressBadge.vue';
import ProspectionEstimatedPrice from './ProspectionEstimatedPrice.vue';
import DvfMarketTooltip from './DvfMarketTooltip.vue';
import { getDvfStatistics, type DvfStatistics } from '@/api/dvf-statistics.service';
import { communeComparisonReference, relativeMarketDifference, streetComparisonReference, unitDvfCategory } from '@/utils/dvfResidentialComparison';
import ProspectionStreetSummary from './ProspectionStreetSummary.vue';
import { getPersonalPropertyTarget, personalPropertyKey } from '@/api/personal-property.service';
import { countProspectionStreets, prospectionAddressKey, prospectionAddressRepresentative, prospectionColor, prospectionRowKey,
  resolveProspectionMapSelection, rowProspectionCount } from '@/utils/prospectionProgress';
import type { ProspectionCount, ProspectionMapSelection } from '@/utils/prospectionProgress';
import { useRemindersStore, type Reminder } from '@/stores/reminders';
import { DvfService } from '@/api/dvf.service';
import { normalizeParcelBounds, PARCEL_MIN_ZOOM, useParcelViewport } from '@/composables/useParcelViewport';
import { formatReminderDate, isOverdue, isToday } from '@/utils/reminderHelpers';
import {
  COLORS,
  MAP_STYLE_STREETS,
  MAP_STYLE_SATELLITE,
  MAP_STYLE_HYBRID,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
} from '@/utils/mapConstants';
import type { MapDisplayMode } from '@/utils/mapConstants';
import { dvfSaleKey } from '@/utils/mapAddressFilters';

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
  selectedAddressKey?: string | null;
  streetProspectionProgress?: ProspectionCount | null;
  cityCenter?: CityCenter | null;
  dpePoints?: DpePoint[];
  dvfPoints?: DvfPoint[];
  dvfSearchError?: string;
}>();

const emit = defineEmits<{
  'edit-property': [property: Address];
  'open-dvf-history': [property: Address];
  'edit-reminder': [reminder: Reminder];
  'select-street': [street: { nom_voie: string; id_fantoir: string }];
  'select-address': [selection: ProspectionMapSelection];
  'return-to-street': [];
  'return-to-city': [];
}>();

const dashboard = useDashboardStore();
const propertyStore = usePropertyStore();
const userStore = useUserStore();
const remindersStore = useRemindersStore();

let map: maplibregl.Map | null = null;
let mapLoaded = false;
let cameraMode: MapDisplayMode | null = null;
let pendingAddressOpen = false;
let syncingAddressFilters = false;

const showParcelles = ref(false);
const { collection: parcelCollection, error: parcelViewportError, refresh: refreshParcelViewport,
  cancel: cancelParcelViewport } = useParcelViewport(readParcelBounds, DvfService.getParcellesByViewport);
const parcelLabelCache = new WeakMap<GeoJSON.FeatureCollection, GeoJSON.FeatureCollection>();
let highlightedParcelleIds: string[] = [];
watch(parcelCollection, updateParcelles);

type MapSidePanelType =
  | 'address'
  | 'estimation'
  | 'dvf'
  | 'dvfCluster'
  | 'dpe'
  | 'parcelle'
  | null;

const selectedMapType = ref<MapSidePanelType>(null);
const selectedMapItem = ref<any | null>(null);
const selectedMapItems = ref<any[]>([]);

const sidePanelEyebrow = computed(() => {
  if (
    selectedMapType.value === 'dvf' ||
    selectedMapType.value === 'dvfCluster'
  ) {
    return 'Historique des ventes';
  }

  if (selectedMapType.value === 'estimation') {
    return 'Estimation en ligne';
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

    case 'estimation':
      return formatAddressSideTitle(selectedMapItem.value);

    case 'dvf':
      return (
        selectedMapItem.value?.adresse ||
        selectedDvfSales.value[0]?.adresse ||
        'Adresse inconnue'
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
    const label = unit.unit_label?.trim();
    if (label) return label;

    const type = unit.type_bien?.trim() || 'Unité';
    const number = String(unit.apart_number ?? '').trim();
    return number ? `${type} ${number}` : type;
  }

  return unit.property_type || unit.type || 'Immeuble';
}

const currentMode = computed(() => dashboard.activeMainMode || 'prospection');
watch(currentMode, restoreMapViewport, { flush: 'sync' });
watch(() => dashboard.cityRecenter, applyCityRecenter, { flush: 'post' });
const showProspectionAddress = computed(
  () => currentMode.value === 'prospection' && selectedMapType.value === 'address' && !!selectedMapItem.value
);
const showFavoriteAddress = computed(
  () => currentMode.value === 'favorites' && selectedMapType.value === 'address' && !!selectedMapItem.value
);
const showEstimationAddress = computed(() =>
  currentMode.value === 'estimations' && selectedMapType.value === 'estimation' && !!selectedMapItem.value
);
const showReminderAddress = computed(() =>
  currentMode.value === 'rappels' && selectedMapType.value === 'address' && !!selectedMapItem.value
);
const showMajAddress = computed(() =>
  currentMode.value === 'maj' && selectedMapType.value === 'address' && !!selectedMapItem.value
);
const showCompactAddress = computed(() =>
  showProspectionAddress.value || showFavoriteAddress.value || showEstimationAddress.value ||
  showReminderAddress.value || showMajAddress.value
);
const compactEstimatedPrice = computed(() => showEstimationAddress.value
  ? selectedMapItem.value?.price
  : compactAddressStats.value?.dernier_prix_estime ??
    (showReminderAddress.value || showMajAddress.value ? selectedMapItem.value?.price : null));
const estimationDetails = ref<HTMLElement | null>(null);
const estimationFacts = computed(() => {
  const item = selectedMapItem.value;
  if (!showEstimationAddress.value || !item) return [];
  return [
    { label: 'Surface habitable', value: Number(item.surface) > 0 ? formatSurface(item.surface) : null },
    { label: 'Terrain', value: Number(item.area) > 0 ? formatSurface(item.area) : null },
    { label: 'Pièces', value: Number(item.rooms) > 0 ? item.rooms : null },
    { label: 'Chambres', value: item.bedrooms },
    { label: 'Année de construction', value: item.year_built || null },
    { label: 'État du bien', value: item.property_condition },
    { label: 'Date de l’estimation', value: item.created_at ? formatDate(item.created_at) : null },
    { label: 'Téléphone', value: item.phone },
    { label: 'E-mail', value: item.email },
  ].filter(fact => fact.value !== null && fact.value !== undefined && fact.value !== '');
});
const selectedReminders = computed(() => {
  const id = Number(selectedMapItem.value?.id);
  return showReminderAddress.value && id > 0
    ? dashboard.mapReminders.filter(reminder => Number(reminder.property_id) === id)
    : [];
});
function canEditMapReminder(reminder: Reminder) {
  return userStore.role === 'admin' || userStore.role === 'agency_manager' ||
    Number(reminder.created_by) === Number(userStore.id);
}
function reminderStatus(reminder: Reminder) {
  if (reminder.completed) return 'Terminé';
  if (isOverdue(reminder.date, reminder.completed)) return 'En retard';
  return isToday(reminder.date) ? 'Aujourd’hui' : 'À venir';
}
const favoriteAddressDetails = ref<IAddressDetail[]>([]);
watch([showFavoriteAddress, selectedMapItem], async ([visible, item], _previous, onCleanup) => {
  favoriteAddressDetails.value = [];
  if (!visible || !item) return;
  let cancelled = false;
  onCleanup(() => { cancelled = true; });
  try {
    const rows = await loadFavoriteAddressDetails(item);
    if (!cancelled) favoriteAddressDetails.value = rows;
  } catch (error) {
    if (!cancelled) console.error('Chargement des biens à cette adresse', error);
  }
});
watch(() => userStore.token, () => {
  if (showFavoriteAddress.value || showReminderAddress.value) closeSidePanel();
});
const compactAddressStats = computed(() => {
  const selected = selectedMapItem.value;
  if (!showFavoriteAddress.value) return selected;
  const target = getPersonalPropertyTarget(selected);
  if (!target) return selected;
  const key = personalPropertyKey(target);
  const detail = favoriteAddressDetails.value.find(row => {
    const identity = getPersonalPropertyTarget(row);
    return identity && personalPropertyKey(identity) === key;
  });
  return detail ? {
    date_maj: detail.date_maj ?? selected.date_maj,
    dernier_prix_estime: detail.dernier_prix_estime ?? selected.dernier_prix_estime,
  } : selected;
});
const selectedProspectionProgress = computed(() => selectedMapItem.value
  ? rowProspectionCount(dashboard.prospectionProgress, selectedMapItem.value)
  : null);
const unitMarketStatistics = ref<DvfStatistics | null>(null);
const unitMarketPercent = new Intl.NumberFormat('fr-FR', { style: 'percent', signDisplay: 'exceptZero', maximumFractionDigits: 1 });

watch(() => showProspectionAddress.value ? selectedMapItem.value?.code_insee : null, async (city, _, onCleanup) => {
  unitMarketStatistics.value = null;
  if (!city) return;
  const request = new AbortController();
  onCleanup(() => request.abort());
  try {
    const data = await getDvfStatistics(city, undefined, request.signal, true);
    if (!request.signal.aborted) unitMarketStatistics.value = data;
  } catch { /* The address remains readable if market statistics are unavailable. */ }
});

function unitMarketDifferences(row: Record<string, any>) {
  const category = unitDvfCategory(row.derniere_vente_code_type_local);
  if (!category || !row.dernier_prix_vente_m2) return [];
  const statistics = unitMarketStatistics.value;
  const street = row.prospection_street_key || row.id_fantoir;
  return [communeComparisonReference(statistics, category),
    streetComparisonReference(statistics?.streets?.[street]?.unit_categories?.[category], statistics, category)].flatMap(reference => {
    const difference = relativeMarketDifference(row.dernier_prix_vente_m2, reference?.median);
    return reference && difference !== null ? [{ ...reference, difference }] : [];
  });
}
const prospectionAddressTitle = computed(() => {
  const item = selectedMapItem.value;
  const number = item?.numero_full || [item?.numero, item?.rep].filter(Boolean).join(' ');
  return [number, item?.nom_voie || item?.adresse].filter(Boolean).join(' ') || 'Adresse';
});
const prospectionAddressLocality = computed(() => {
  const item = selectedMapItem.value;
  const selectedCity = dashboard.hasDirectAddressList ? undefined : dashboard.selectedCity;
  return [item?.code_postal, item?.nom_commune || item?.city || selectedCity?.city || selectedCity?.value]
    .filter(Boolean)
    .join(' ');
});
const hasProspectionStreet = computed(
  () => currentMode.value === 'prospection' && !!dashboard.selectedCity && !!dashboard.selectedStreet
);
const canReturnToStreet = computed(() => {
  if (showProspectionAddress.value) return hasProspectionStreet.value;
  const item = selectedMapItem.value;
  return showFavoriteAddress.value && !!dashboard.selectedCity && !!dashboard.selectedStreet &&
    !!dashboard.selectedCodeIdFantoir && item.code_insee === dashboard.selectedCodeInsee &&
    (item.prospection_street_key || item.id_fantoir_defaut || item.id_fantoir) === dashboard.selectedCodeIdFantoir;
});
const showStreetSummary = computed(
  () => hasProspectionStreet.value && !selectedMapItem.value && !selectedMapItems.value.length
);
const showCommuneSummary = computed(() =>
  currentMode.value === 'prospection' && !!dashboard.selectedCity && !!dashboard.selectedCodeInsee &&
  !dashboard.selectedStreet && !dashboard.selectedCodeIdFantoir && !dashboard.selectedNumero &&
  !dashboard.selectedOwnerName.trim() && !selectedMapItem.value && !selectedMapItems.value.length
);
const communeStreetRows = computed(() => {
  const search = dashboard.lastSearchParams;
  if (!showCommuneSummary.value || !search || search.codeInsee !== dashboard.selectedCodeInsee ||
      search.codeIdFantoir || search.numero || search.ownerName) return null;
  return props.addresses.filter((row): row is IAddressGrouped => 'total_adresses' in row);
});
const communeName = computed(() =>
  dashboard.selectedCity?.city || communeStreetRows.value?.[0]?.nom_commune || dashboard.selectedCity?.value
);
const communePostalCode = computed(() => {
  const selected = dashboard.selectedCity?.value ?? '';
  if (/^\d{5}$/.test(selected)) return selected;
  const codes = new Set(communeStreetRows.value?.map(row => row.code_postal).filter(Boolean));
  return [...codes].join(', ');
});
const communeStreetCount = computed(() => communeStreetRows.value
  ? countProspectionStreets(communeStreetRows.value, dashboard.prospectionProgress)
  : null);

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
function getPointColor(address: Address, mode: string): string {
  const addr = address as any;

  switch (mode) {
    case 'prospection':
      return prospectionColor(rowProspectionCount(dashboard.prospectionProgress, addr));

    case 'estimations':
  return Number(addr.price ?? 0) > 0
    ? COLORS.estimations
    : COLORS.none;

    case 'rappels':
  return COLORS.rappels;

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
    map?.resize(undefined, false);
    applyCityRecenter();
    applyDvfSaleFocus();
    syncParcelViewport();
  });

  map.setStyle(getBaseMapStyleUrl(), { diff: false });
}

onMounted(() => {
  void remindersStore.loadReminders();
  cameraMode = currentMode.value;
  const viewport = dashboard.mapViewports[cameraMode] ?? dashboard.lastMapViewport;

  map = new maplibregl.Map({
    container: 'map',
    style: MAP_STYLE_STREETS,
    center: viewport?.center ?? DEFAULT_CENTER,
    zoom: viewport?.zoom ?? DEFAULT_ZOOM,
  });
  map.on('moveend', saveMapViewport);
  map.on('moveend', syncParcelViewport);
  map.on('zoom', () => {
    if (map && map.getZoom() < PARCEL_MIN_ZOOM) refreshParcelViewport();
  });
  map.on('movestart', event => {
    if (event.originalEvent) dashboard.cancelCityRecenter();
  });
  saveMapViewport();

  map.addControl(new maplibregl.NavigationControl());

  map.on('load', () => {
    mapLoaded = true;

    rebuildMapLayers();
    setupAddressInteractions();
    setupDpeInteractions();
    setupDvfInteractions();
    openFilteredAddress();
    applyCityRecenter();
    applyDvfSaleFocus();
    syncParcelViewport();
  });
});

onUnmounted(() => {
  cancelParcelViewport();
  closeSidePanel();

  if (map) {
    map.stop();
    saveMapViewport();
    cameraMode = null;
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
    applyParcelleHighlight();
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

const selectedAddressUnits = computed<Record<string, any>[]>(() => {
  if (showEstimationAddress.value || showReminderAddress.value || showMajAddress.value) {
    const item = selectedMapItem.value;
    const key = prospectionAddressKey(item);
    const rows = key ? props.addresses.filter(
      (row): row is IAddressDetail => 'id' in row && prospectionAddressKey(row) === key
    ) : [];
    return rows.length ? [...new Map(rows.map(row => [row.id, row])).values()] : [item];
  }

  if (selectedMapType.value !== 'address' || !selectedMapItem.value) {
    return [];
  }

  if (currentMode.value === 'prospection') {
    const key = prospectionRowKey(selectedMapItem.value);
    return key.startsWith('address:') ? props.addresses.filter(row => prospectionRowKey(row) === key) : [];
  }

  if (showFavoriteAddress.value) {
    if (favoriteAddressDetails.value.length) return favoriteAddressDetails.value;
    const item = selectedMapItem.value;
    const key = prospectionAddressKey(item);
    const target = getPersonalPropertyTarget(item);
    if (!key || !target || target.bien_type === 'custom_property') return [item];
    const identity = personalPropertyKey(target);
    const siblings = props.addresses.filter(row => {
      const sibling = getPersonalPropertyTarget(row);
      return sibling && sibling.bien_type !== 'custom_property' &&
        personalPropertyKey(sibling) !== identity && prospectionAddressKey(row) === key;
    });
    return [item, ...siblings];
  }

  const key = selectedMapItem.value.id_fantoir_long || selectedMapItem.value.id_fantoir || '';

  if (!key) return [];

  return props.addresses.filter((a: any) => {
    return a.id_fantoir_long === key || a.id_fantoir === key;
  });
});

const propertyTypeIcons = {
  house: House,
  apartment: OfficeBuilding,
  commerce: Shop,
  parking: Van,
  office: SuitcaseLine,
  warehouse: Box,
  unknown: Key,
};

type PropertyCategory = keyof typeof propertyTypeIcons;

const propertyTypes: Partial<Record<string, { category: PropertyCategory; label: string }>> = {
  maison: { category: 'house', label: 'Maison' },
  appartement: { category: 'apartment', label: 'Appartement' },
  immeuble: { category: 'apartment', label: 'Immeuble' },
  commerce: { category: 'commerce', label: 'Commerce' },
  local_commercial: { category: 'commerce', label: 'Local commercial' },
  garage: { category: 'parking', label: 'Garage' },
  parking: { category: 'parking', label: 'Parking' },
  bureau: { category: 'office', label: 'Bureau' },
  entrepot: { category: 'warehouse', label: 'Entrepôt' },
  cave: { category: 'unknown', label: 'Cave' },
  dependance: { category: 'unknown', label: 'Dépendance' },
  terrain: { category: 'unknown', label: 'Terrain' },
};

const addressPropertyCards = computed(() => {
  if (!showCompactAddress.value) return [];

  const rows = selectedAddressUnits.value;
  if (showProspectionAddress.value && rows.length === 1 && (
    isStreetGroupPoint(selectedMapItem.value) || !canOpenProperty(selectedMapItem.value)
  )) return [];

  return rows
    .map((property, index) => {
      const isPrincipal = property.row_type !== 'unit';
      const target = getPersonalPropertyTarget(property);
      const type = [property.unit_type, property.type_code, property.type_bien, isPrincipal ? property.property_type : null]
        .map(type => String(type ?? '').trim().toLowerCase().normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_'))
        .map(code => propertyTypes[code])
        .find(Boolean);

      return {
        property,
        isPrincipal,
        category: type?.category ?? 'unknown',
        typeLabel: type?.label,
        owner: showProspectionAddress.value && typeof property.owner === 'string' ? property.owner.trim() : '',
        prospected: showProspectionAddress.value && target
          ? dashboard.prospectionProgress?.bien_status[personalPropertyKey(target)] : undefined,
        favorite: showFavoriteAddress.value && propertyStore.isFavorite(property),
        key: `${property.row_type}-${property.row_id ?? index}-${property.id ?? ''}`,
      };
    })
    .sort((first, second) => Number(second.isPrincipal) - Number(first.isPrincipal));
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
      minzoom: PARCEL_MIN_ZOOM,
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
      minzoom: PARCEL_MIN_ZOOM,
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
      minzoom: PARCEL_MIN_ZOOM,
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

  if (styleSupportsTextLayers() && !map.getLayer('parcelles-labels')) {
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

function updateDvfPoints() {
  if (!mapLoaded || !map) return;

  const grouped = new Map<string, any[]>();

  (props.dvfPoints || [])
    .filter((p: any) => p.lat && p.lon)
    .forEach((p: any) => {
      const key = dvfSaleKey(p);

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }

      grouped.get(key)!.push(p);
    });

  const features = Array.from(grouped.values()).map((group: any[]) => {
    const first = group[0];
    const salesMap = new Map<string, any>();

    group.forEach((p: any) => {
      const saleKey = dvfSaleKey(p);

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
      sale.parcelles_ids.push(...parseJsonArray(p.parcelles_ids));

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

  console.log(
  'MAP PREMIÈRE ADRESSE JSON =',
  JSON.stringify(props.addresses[0], null, 2)
);

console.log(
  'MAP CHAMPS PREMIÈRE ADRESSE =',
  Object.keys(props.addresses[0] || {})
);

  const features = props.addresses
    .map((address: any) => {
      const lat = Number(
        address.lat ??
        address.latitude ??
        address.lat_address ??
        address.latitude_ban
      );

      const lon = Number(
        address.lon ??
        address.lng ??
        address.longitude ??
        address.lon_address ??
        address.longitude_ban
      );

      if (
        Number.isNaN(lat) ||
        Number.isNaN(lon) ||
        lat === 0 ||
        lon === 0
      ) {
        console.warn('Adresse ignorée, coordonnées absentes :', address);
        return null;
      }

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lon, lat],
        },
        properties: {
          ...address,
          prospection_display_key: prospectionRowKey(address),
          lat,
          lon,
        },
      };
    })
    .filter(Boolean);

  console.log('MAP FEATURES CRÉÉES =', features.length, features);

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
    map.setPaintProperty(
      'address-dots',
      'circle-color',
      COLORS.none
    );
    return;
  }

  const mode = currentMode.value;

  /*
   * Ces modes sont déjà filtrés par leur API dédiée.
   * Toutes les propriétés reçues doivent donc avoir la couleur du mode.
   */
  if (mode === 'favorites') {
    map.setPaintProperty(
      'address-dots',
      'circle-color',
      COLORS.favorites
    );
    return;
  }

  if (mode === 'estimations') {
    map.setPaintProperty(
      'address-dots',
      'circle-color',
      COLORS.estimations
    );
    return;
  }

  if (mode === 'rappels') {
    map.setPaintProperty(
      'address-dots',
      'circle-color',
      COLORS.rappels
    );
    return;
  }

  if (mode === 'maj') {
    map.setPaintProperty(
      'address-dots',
      'circle-color',
      COLORS.maj
    );
    return;
  }

  const colorsByAddressId = new Map<string, string>();

  for (const address of props.addresses) {
    const addr = address as any;

    const id = mode === 'prospection' ? prospectionRowKey(addr) : String(
      addr.id_fantoir_long ||
      addr.id_fantoir ||
      ''
    );

    if (!id) continue;

    colorsByAddressId.set(
      id,
      getPointColor(address, mode)
    );
  }

  if (!colorsByAddressId.size) {
    map.setPaintProperty('address-dots', 'circle-color', COLORS.none);
    return;
  }

  const colorExpression: any[] = [
    'match',
    mode === 'prospection' ? ['get', 'prospection_display_key'] : [
      'to-string',
      [
        'coalesce',
        ['get', 'id_fantoir_long'],
        ['get', 'id_fantoir'],
        '',
      ],
    ],
  ];

  for (const [id, color] of colorsByAddressId.entries()) {
    colorExpression.push(id, color);
  }

  colorExpression.push(COLORS.none);

  try {
    map.setPaintProperty(
      'address-dots',
      'circle-color',
      colorExpression
    );
  } catch (error) {
    console.error(
      'Error updating map colors:',
      error,
      colorExpression
    );

    map.setPaintProperty(
      'address-dots',
      'circle-color',
      mode === 'prospection' ? COLORS.none : COLORS.prospection
    );
  }
}

/* -------------------------------------
   VISIBILITE DES COUCHES
------------------------------------- */
function toggleParcelles() {
  showParcelles.value = !showParcelles.value;
  syncParcelViewport();
}

function canShowParcelles() {
  return !!map && showParcelles.value && dashboard.viewType === 'map' && map.getZoom() >= PARCEL_MIN_ZOOM;
}

function readParcelBounds() {
  if (!map || !canShowParcelles()) return null;
  const bounds = map.getBounds();
  return normalizeParcelBounds({
    west: bounds.getWest(), south: bounds.getSouth(), east: bounds.getEast(), north: bounds.getNorth(),
  });
}

function syncParcelViewport() {
  refreshParcelViewport();
  updateParcelVisibility();
}

function updateParcelles() {
  if (!mapLoaded || !map) return;

  const parcellesData = parcelCollection.value ?? emptyGeoJSON();

  const src = map.getSource('parcelles_cadastre') as maplibregl.GeoJSONSource | undefined;
  if (src) {
    src.setData(parcellesData);
  }

  const labelSrc = map.getSource('parcelles_labels') as maplibregl.GeoJSONSource | undefined;
  if (labelSrc && map.getLayer('parcelles-labels')) {
    let labels = parcelLabelCache.get(parcellesData);
    if (!labels) {
      labels = buildParcellesLabelsGeojson(parcellesData);
      parcelLabelCache.set(parcellesData, labels);
    }
    labelSrc.setData(labels);
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

  updateParcelVisibility();
}

function updateParcelVisibility() {
  if (!mapLoaded) return;
  const visibility = canShowParcelles() ? 'visible' : 'none';
  for (const layer of ['parcelles-fill', 'parcelles-line', 'parcelle-highlight', 'parcelles-labels']) {
    setLayerVisibility(layer, visibility);
  }
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
  highlightedParcelleIds = (idsParcelles ?? []).map(id => String(id).trim()).filter(Boolean);
  applyParcelleHighlight();
}

function applyParcelleHighlight() {
  if (!map || !map.getLayer('parcelle-highlight')) return;
  const ids = highlightedParcelleIds;

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

    const item = feature.properties || {};

    if (currentMode.value === 'prospection' && item.total_adresses !== undefined) {
      void openStreetFromMap(item);
      return;
    }

    if (currentMode.value === 'estimations') {
      openEstimation(item);
      return;
    }
    if (item.row_type === 'estimation') return;

    if (currentMode.value === 'prospection') {
      const key = prospectionAddressKey(item);
      if (key && e.features?.some(candidate => {
        const candidateKey = prospectionAddressKey(candidate.properties || {});
        return candidateKey && candidateKey !== key;
      })) return;

      const address = key ? prospectionAddressRepresentative(props.addresses, key) : undefined;
      openSidePanel('address', address ?? item);
      const selection = address && resolveProspectionMapSelection(props.addresses, address);
      if (selection) {
        syncingAddressFilters = true;
        emit('select-address', selection);
        void nextTick(() => { syncingAddressFilters = false; });
      }
      return;
    }

    openSidePanel('address', item);
  });

  map.on('mouseenter', 'address-dots', () => {
    if (map) {
      map.getCanvas().style.cursor = 'pointer';
    }
  });

  map.on('mouseleave', 'address-dots', () => {
    if (map) {
      map.getCanvas().style.cursor = '';
    }
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
  pendingAddressOpen = false;
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

function openEstimation(item: any) {
  if (currentMode.value === 'estimations' && item?.row_type === 'estimation') openSidePanel('estimation', item);
}

let lastDvfSaleFocus: typeof dashboard.dvfSaleFocus = null;

function applyDvfSaleFocus() {
  const focus = dashboard.dvfSaleFocus;
  if (!focus) {
    if (lastDvfSaleFocus && currentMode.value === 'dvf') closeSidePanel();
    lastDvfSaleFocus = null;
    return;
  }
  if (!mapLoaded || !map || currentMode.value !== 'dvf' || focus === lastDvfSaleFocus) return;

  lastDvfSaleFocus = focus;
  if (focus.sale) openSidePanel('dvf', focus.sale);
  else closeSidePanel();
  if (focus.center) {
    map.resize(undefined, false);
    flyTo(focus.center[0], focus.center[1], 17);
  }
}

watch(() => dashboard.dvfSaleFocus, applyDvfSaleFocus);

defineExpose({ openEstimation });

function openCompactProperty(property: Record<string, any>) {
  if (showEstimationAddress.value) {
    openEstimation(property);
    void nextTick(() => estimationDetails.value?.focus());
  } else if (showProspectionAddress.value && selectedAddressUnits.value.length === 1) {
    emitEditSelectedAddress();
  } else {
    openAddressUnit(property);
  }
}

function closeSidePanel() {
  pendingAddressOpen = false;
  selectedMapType.value = null;
  selectedMapItem.value = null;
  selectedMapItems.value = [];

  highlightParcelles(null);
}

function returnToStreet() {
  closeSidePanel();
  emit('return-to-street');
}

function openFilteredAddress() {
  if (!pendingAddressOpen || dashboard.viewType !== 'map' || currentMode.value !== 'prospection') return;
  const key = props.selectedAddressKey;
  if (!key) return;

  const address = prospectionAddressRepresentative(props.addresses, key);
  if (address) openSidePanel('address', address);
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
  const idFantoir = item.prospection_street_key || item.id_fantoir || item.codeIdFantoir || item.id_fantoir_long || '';

  if (!streetName || !idFantoir) {
    openSidePanel('address', item);
    return;
  }

  closeSidePanel();

  if (currentMode.value === 'prospection') {
    emit('select-street', { nom_voie: streetName, id_fantoir: idFantoir });
    return;
  }

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
function saveMapViewport() {
  if (!map || !cameraMode) return;
  const { lng, lat } = map.getCenter();
  dashboard.saveMapViewport(cameraMode, { center: [lng, lat], zoom: map.getZoom() });
}

function restoreMapViewport(mode: MapDisplayMode) {
  if (!map || cameraMode === mode) return;

  // Stop the outgoing animation before reading its last visible position.
  map.stop();
  saveMapViewport();
  const viewport = dashboard.mapViewports[mode];
  cameraMode = mode;
  if (viewport) {
    const { lng, lat } = map.getCenter();
    if (lng !== viewport.center[0] || lat !== viewport.center[1] || map.getZoom() !== viewport.zoom) {
      map.jumpTo(viewport);
    }
  }
  saveMapViewport();
}

function applyCityRecenter() {
  const pending = dashboard.cityRecenter;
  if (!map || !mapLoaded || dashboard.viewType !== 'map' || !pending ||
      pending.mode !== cameraMode || pending.codeInsee !== dashboard.selectedCodeInsee) return;

  dashboard.cancelCityRecenter();
  flyTo(pending.center[0], pending.center[1], 11.5);
}

function handleRecenter() {
  if (!map || !mapLoaded) return;
  dashboard.cancelCityRecenter();
  map.resize(undefined, false);

  if (dashboard.hasDirectAddressList) {
    fitAddressPoints();
  } else if (currentMode.value !== 'favorites' && dashboard.selectedCity && props.cityCenter) {
    flyTo(props.cityCenter.lon, props.cityCenter.lat, 11.5);
  }
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


function fitAddressPoints() {
  if (!map || !mapLoaded) return;

  const validAddresses = props.addresses.filter((address) => {
    const lat = Number(address.lat);
    const lon = Number(address.lon);

    return (
      !Number.isNaN(lat) &&
      !Number.isNaN(lon) &&
      lat !== 0 &&
      lon !== 0
    );
  });

  if (validAddresses.length === 0) return;

  if (validAddresses.length === 1) {
    flyTo(
      Number(validAddresses[0].lon),
      Number(validAddresses[0].lat),
      16
    );
    return;
  }

  const bounds = new maplibregl.LngLatBounds();

  validAddresses.forEach((address) => {
    bounds.extend([
      Number(address.lon),
      Number(address.lat),
    ]);
  });

  map.fitBounds(bounds, {
    padding: 70,
    maxZoom: 15,
    duration: 800,
  });
}

/* -------------------------------------
   WATCHERS
------------------------------------- */
function setupWatchers() {
  watch(() => dashboard.prospectionProgress, () => {
    if (currentMode.value === 'prospection') updateAddressPointsWithColors();
  });
watch(
  () => props.addresses,
  () => {
    if (showMajAddress.value && !props.addresses.some(row =>
      'id' in row && String(row.id) === String(selectedMapItem.value?.id)
    )) closeSidePanel();
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

watch(() => dashboard.selectedCodeInsee, () => {
  if (!syncingAddressFilters && !dashboard.hasDirectAddressList) closeSidePanel();
});

watch(
  () => dashboard.activeMainMode,
  (newMode, previousMode) => {
    if (previousMode !== undefined) pendingAddressOpen = false;
    if (previousMode && [newMode, previousMode].some(mode =>
      mode === 'estimations' || mode === 'rappels' || mode === 'maj'
    )) {
      closeSidePanel();
    }
    updateAddressPointsWithColors();
    updateDpePoints();
    updateDvfPoints();
    updateLayerVisibility();
  },
  { immediate: true }
);

watch(() => dashboard.reminderAddressScope, () => {
  if (currentMode.value !== 'rappels') return;
  closeSidePanel();
});

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
  () => {
    if (!syncingAddressFilters && !dashboard.hasDirectAddressList) closeSidePanel();
  }
);

watch(
  () => dashboard.selectedNumeroFull,
  () => {
    if (!syncingAddressFilters && !dashboard.hasDirectAddressList) closeSidePanel();
  }
);

watch(
  () => dashboard.selectedCity,
  newCity => {
    if (dashboard.hasDirectAddressList) return;
    if (!syncingAddressFilters) closeSidePanel();

    if (!newCity) {
      updateLayerVisibility();
    }
  }
);

  watch(
    () => dashboard.viewType,
    (newType) => {
      pendingAddressOpen = newType === 'map' && currentMode.value === 'prospection' &&
        !!dashboard.selectedCodeIdFantoir && !!dashboard.selectedNumero;
      if (newType !== 'map') {
        map?.stop();
        syncParcelViewport();
        return;
      }
      if (mapLoaded) map?.resize(undefined, false);
      openFilteredAddress();
      applyCityRecenter();
      syncParcelViewport();
    },
    { immediate: true, flush: 'post' }
  );
  watch(() => props.selectedAddressKey, openFilteredAddress, { flush: 'post' });
}

setupWatchers();
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

.return-to-city {
  background: transparent;
  border: 0;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  font: inherit;
  font-size: 0.875rem;
  margin-bottom: 8px;
  padding: 0;
}

.return-to-city:hover,
.return-to-city:focus-visible {
  color: var(--el-color-primary);
  text-decoration: underline;
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

.prospection-address-panel {
  display: flex;
  flex-direction: column;
}

.prospection-address-panel .side-panel-header {
  flex-shrink: 0;
}

.prospection-address-panel .side-close {
  flex-shrink: 0;
}

.side-panel-header .prospection-address-title {
  font-size: 20px;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.prospection-address-panel .side-content,
.prospection-properties {
  min-height: 0;
}

.prospection-address-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}

.prospection-address-progress {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}

.reminder-comment {
  margin: 4px 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.prospection-address-stats > div {
  padding: 8px 10px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.prospection-address-stats dt {
  color: #64748b;
  font-size: 12px;
}

.prospection-address-stats dd {
  margin: 2px 0 0;
  color: #0f172a;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.prospection-properties {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prospection-properties h4 {
  margin: 0;
  font-size: 14px;
}

.prospection-property-list {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 2px;
  list-style: none;
  overflow-y: auto;
  overscroll-behavior-y: contain;
}

.prospection-property {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  color: #0f172a;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.prospection-property:hover,
.prospection-property:focus-visible {
  border-color: var(--el-color-primary);
  background: #f8fafc;
}

.prospection-property-text {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.prospection-property-type {
  color: #64748b;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.prospection-property-title {
  font-size: 13px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.prospection-property-icon {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: #475569;
  background: #f1f5f9;
}

.prospection-property-icon svg,
.prospection-property-arrow {
  width: 15px;
  height: 15px;
}

.prospection-property-arrow {
  color: #64748b;
}

.prospection-property-icon.type-house { color: #166534; background: #dcfce7; }
.prospection-property-icon.type-apartment { color: #1e40af; background: #dbeafe; }
.prospection-property-icon.type-commerce { color: #9a3412; background: #ffedd5; }
.prospection-property-icon.type-parking { color: #5b21b6; background: #ede9fe; }
.prospection-property-icon.type-office { color: #155e75; background: #cffafe; }
.prospection-property-icon.type-warehouse { color: #854d0e; background: #fef3c7; }

.prospection-property-badge {
  padding: 2px 6px;
  border-radius: 999px;
  color: #475569;
  background: #f1f5f9;
  font-size: 11px;
  white-space: nowrap;
}

.prospection-property-badge.principal {
  color: #334155;
  background: #e2e8f0;
  font-weight: 600;
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

.parcelles-status,
.dvf-search-status {
  position: absolute;
  z-index: 2;
  left: 12px;
  bottom: 24px;
  max-width: calc(100% - 24px);
  margin: 0;
  padding: 6px 10px;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  font-size: 12px;
}

.dvf-search-status {
  top: 12px;
  bottom: auto;
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

.dvf-sale-section .sale-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  justify-items: start;
  gap: 4px;
  margin-bottom: 4px;
}

.dvf-sale-section .sale-header .price {
  max-width: 100%;
  overflow-wrap: anywhere;
  margin-bottom: 0;
}

.dvf-sale-section .sale-header .sale-badge {
  max-width: 100%;
  box-sizing: border-box;
  white-space: normal;
  overflow-wrap: anywhere;
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
