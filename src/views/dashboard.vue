<template>
  <section>
    <EMCard class="dashboardHeader" :border-hover="false">
      <div class="headerTopRow">
        <div class="modeBar" aria-label="Modes de travail" role="group">
          <button
            class="modePill"
            :class="{ active: dashboardStore.activeMainMode === 'prospection' }"
            @click="dashboardStore.setMainMode('prospection')"
          >
            <span class="modeDot prospection"></span>
            Prospection
          </button>

          <button
            class="modePill"
            :class="{ active: dashboardStore.activeMainMode === 'favorites' }"
            @click="dashboardStore.setMainMode('favorites')"
          >
            <span class="modeDot favoris"></span>
            Favoris
          </button>

          <button
            class="modePill"
            :class="{ active: dashboardStore.activeMainMode === 'estimations' }"
            @click="dashboardStore.setMainMode('estimations')"
          >
            <span class="modeDot estimations"></span>
            Estimations
          </button>

          <button
            class="modePill"
            :class="{ active: dashboardStore.activeMainMode === 'rappels' }"
            @click="dashboardStore.setMainMode('rappels')"
          >
            <span class="modeDot rappels"></span>
            Rappels
          </button>

          <button
            class="modePill"
            :class="{ active: dashboardStore.activeMainMode === 'maj' }"
            @click="dashboardStore.setMainMode('maj')"
            >
            <span class="modeDot maj"></span>
            MAJ
          </button>

          <button
            class="modePill"
            :class="{ active: dashboardStore.activeMainMode === 'dpe' }"
            @click="dashboardStore.setMainMode('dpe')"
            >
            <span class="modeDot dpe"></span>
            DPE
          </button>

          <button
            class="modePill"
            :class="{ active: dashboardStore.activeMainMode === 'dvf' }"
            @click="dashboardStore.setMainMode('dvf')"
            >
            <span class="modeDot dvf"></span>
            DVF
          </button>
        </div>
        <div class="headerRightContainer">
          <ViewToggle v-model="viewType" :options="viewOptions" />
        </div>
      </div>

      <div class="modeFilters">
        <div v-if="hasGeographicFilters" :key="dashboardStore.activeMainMode" class="autoCompleteContainer">
          <div class="input-cell">
            <CityAutocomplete
              v-model="selectedCity"
              @select="handleCitySelect"
              @clear="handleCityClear"
            />
          </div>

          <div class="input-cell streetFilter">
            <StreetAutocomplete
              v-model="selectedStreet"
              :code-insee="selectedCodeInsee"
              :prospection="dashboardStore.activeMainMode === 'prospection'"
              @select="handleStreetSelect"
              @clear="handleStreetClear"
            />
          </div>

          <div v-if="dashboardStore.activeMainMode !== 'dpe'" class="input-cell numberFilter">
            <NumeroAutocomplete
              v-model="selectedNumeroFull"
              :id-fantoir="selectedCodeIdFantoir"
              :prospection-code-insee="dashboardStore.activeMainMode === 'prospection' ? selectedCodeInsee : ''"
              @select="handleNumeroSelect"
              @clear="handleNumeroClear"
            />
          </div>

          <div v-if="dashboardStore.activeMainMode === 'prospection'" class="input-cell ownerFilter">
            <el-input
              v-model="selectedOwnerName"
              clearable
              size="large"
              placeholder="Nom du propriétaire"
              @keyup.enter="dashboardStore.querySearchAddress()"
            />
          </div>
        </div>

        <ProspectionScopeSelector v-if="dashboardStore.activeMainMode === 'prospection'" />
        <DashboardAgencyScopeSelect
          v-if="dashboardStore.activeMainMode === 'rappels'"
          v-model="dashboardStore.reminderAddressScope"
          label="Périmètre des rappels"
        />
        <template v-if="dashboardStore.activeMainMode === 'maj'">
          <DashboardAgencyScopeSelect
            v-model="majScope"
            label="Périmètre des mises à jour"
            :personal-only="!dashboardStore.canUseMajAgencyScope"
            class="modeSelect"
          />
          <el-select
            v-model="dashboardStore.majFilterRange"
            aria-label="Période des mises à jour"
            size="small"
            class="modeSelect"
          >
            <el-option label="< 7 jours" value="7d" />
            <el-option label="< 30 jours" value="30d" />
            <el-option label="< 3 mois" value="3m" />
            <el-option label="< 6 mois" value="6m" />
          </el-select>
        </template>
        <el-select
          v-if="dashboardStore.activeMainMode === 'dpe'"
          v-model="dashboardStore.dpeFilterRange"
          aria-label="Période DPE"
          size="small"
          class="modeSelect"
        >
          <el-option label="Dernier mois" value="1m" />
          <el-option label="3 derniers mois" value="3m" />
          <el-option label="6 derniers mois" value="6m" />
        </el-select>
        <el-select
          v-if="dashboardStore.activeMainMode === 'dvf'"
          v-model="dashboardStore.dvfFilterRange"
          aria-label="Période DVF"
          size="small"
          class="modeSelect"
        >
          <el-option label="< 1 an" value="1y" />
          <el-option label="< 2 ans" value="2y" />
          <el-option label="< 3 ans" value="3y" />
          <el-option label="< 5 ans" value="5y" />
          <el-option label="Depuis 2020" value="since2020" />
          <el-option label="Tout (depuis 2014)" value="all" />
        </el-select>
      </div>
    </EMCard>

    <div class="prospection-overview">
      <template v-if="dashboardStore.activeMainMode === 'prospection' && selectedCity">
        <span>
          <span class="prospection-overview-count">
            Commune <ProspectionProgressBadge :count="dashboardStore.prospectionProgress?.commune ?? null" show-counts />
          </span>
          <span v-if="viewType === 'table'" class="prospection-overview-price">
            <span aria-hidden="true">·</span> <DvfMarketTooltip :details="communeOverviewTooltip">Prix m² : {{ formatReferencePrice(communeOverviewMedian) }}</DvfMarketTooltip>
          </span>
        </span>
        <span v-if="selectedCodeIdFantoir">
          <span class="prospection-overview-count">
            Rue <ProspectionProgressBadge :count="streetProspectionProgress" show-counts />
          </span>
          <span v-if="viewType === 'table'" class="prospection-overview-price">
            <span aria-hidden="true">·</span> <DvfMarketTooltip :details="streetOverviewPrice.tooltip">Prix m² : {{ formatReferencePrice(streetOverviewPrice.median) }}</DvfMarketTooltip>
          </span>
          <span v-if="viewType === 'table' && streetOverviewNote" class="prospection-overview-note">{{ streetOverviewNote }}</span>
        </span>
        <span v-if="selectedProspectionAddressKey">
          Adresse <ProspectionProgressBadge :count="addressProspectionProgress" show-counts />
        </span>
      </template>
    </div>

    <!-- TABLE DES ADRESSES -->
    <div
      v-if="
        viewType === 'table' &&
        dashboardStore.activeMainMode !== 'dpe' &&
        dashboardStore.activeMainMode !== 'dvf'
      "
      v-loading="isLoading"
      element-loading-text="Chargement des adresses..."
      element-loading-background="rgba(255, 255, 255, 0.8)"
      :style="{ minHeight: isLoading ? '200px' : 'auto' }"
    >
      <ProspectionCommuneTable
        v-if="isCityOnly && !dashboardStore.selectedOwnerName.trim() && communeTableStreets.length"
        v-model:sort="communeTableSort"
        :streets="communeTableStreets"
        :progress="dashboardStore.prospectionProgress"
        :statistics="prospectionTableStatistics"
        :loading="prospectionStatisticsLoading"
        :failed="prospectionStatisticsFailed"
        @select-street="handleGroupedStreetClick"
      />
      <PropertyTable
        v-else-if="addresses.length > 0"
        :addresses="propertyTableAddresses"
        :city-only="isCityOnly"
        :show-market-comparison="showStreetMarketComparison || isFavoritesTable || isOtherMarketTable"
        :market-reference="streetMarketReference"
        :commune-market-reference="communeMarketReference"
        :market-city="statisticsCity"
        :market-statistics="prospectionTableStatistics"
        :market-street="dashboardStore.selectedCodeIdFantoir"
        @edit-property="handleEditProperty"
        @open-dvf-sale="dashboardStore.openPropertyDvfSale"
        @open-dvf-history="openPropertyDvfHistory"
        @edit-reminder="openMapReminder"
        @select-street="handleGroupedStreetClick"
        @select-numero="handleTableNumeroClick"
      />
      <div v-else-if="!isLoading && dashboardStore.isDataLoaded" class="empty-state">
        <el-icon class="empty-state-icon"><Search /></el-icon>
        <p class="empty-state-title">Aucun résultat correspondant</p>
        <p class="empty-state-subtitle">{{ emptyStateMessage }}</p>
      </div>
    </div>

    <!-- MODE CARD -->
    <div
      v-else-if="
        viewType === 'card' &&
        dashboardStore.activeMainMode !== 'dpe' &&
        dashboardStore.activeMainMode !== 'dvf'
      "
    >
      <PropertyTableCard
        v-if="addresses.length > 0"
        :addresses="addresses as IAddressDetail[]"
        @edit-property="openPropertyDialog"
      />
      <div v-else-if="!isLoading && dashboardStore.isDataLoaded" class="empty-state">
        <el-icon class="empty-state-icon"><Search /></el-icon>
        <p class="empty-state-title">Aucun résultat correspondant</p>
        <p class="empty-state-subtitle">{{ emptyStateMessage }}</p>
      </div>
    </div>

    <MapView
      ref="mapView"
      v-show="viewType === 'map'"
      :selected-address-key="selectedProspectionAddressKey"
      :street-prospection-progress="streetProspectionProgress"
      :addresses="
        dashboardStore.activeMainMode === 'dpe' || dashboardStore.activeMainMode === 'dvf'
          ? []
          : addresses
      "
      :city-center="dashboardStore.cityCenter"
      :dpe-points="dashboardStore.dpePoints"
      :dvf-points="dashboardStore.dvfPoints"
      :dvf-search-error="dashboardStore.dvfSearchError"
      @edit-property="openPropertyDialog"
      @open-dvf-history="openPropertyDvfHistory"
      @edit-reminder="openMapReminder"
      @select-street="handleGroupedStreetClick"
      @select-address="dashboardStore.selectProspectionMapAddress"
      @return-to-street="handleNumeroClear"
      @return-to-city="handleStreetClear"
    />

    <ReminderFormDialog
      v-model:visible="showMapReminderEditor"
      :editing-reminder="editingMapReminder"
      :saving="savingMapReminder"
      @save="saveMapReminder"
    />
    <PropertyForm />
    <CreateCustomPropertyDialog />
  </section>
</template>

<script setup lang="ts">
/* ------------------------------------
      IMPORTS
------------------------------------ */
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { DataBoard, Location, Search } from '@element-plus/icons-vue';
import ViewToggle from '@/components/ViewToggle.vue';
import ProspectionProgressBadge from './DashboardComponents/ProspectionProgressBadge.vue';
import ProspectionScopeSelector from './DashboardComponents/ProspectionScopeSelector.vue';
import DashboardAgencyScopeSelect from './DashboardComponents/DashboardAgencyScopeSelect.vue';
import {
  prospectionAddressKey,
  resolveProspectionMapSelection,
  rowProspectionCount,
  uniqueProspectionAddressKey,
} from '@/utils/prospectionProgress';

// Stores
import { usePropertyStore } from '@/stores/propertyHome';
import { useDashboardStore } from '@/stores/dashboard';
import { useUserStore } from '@/stores/user';
import type { IAddressDetail, IAddressGrouped } from '@/types/address';
import type { Reminder } from '@/stores/reminders';
import { ReminderService } from '@/api/reminder.service';
import { getDvfStatistics, type DvfStatistics } from '@/api/dvf-statistics.service';
import { PersonalPropertyService, type FavoriteAddress } from '@/api/personal-property.service';
import { communeComparisonReference, communeStreetPrice, residentialReference, savedSimulationPricePerM2, streetComparisonReference } from '@/utils/dvfResidentialComparison';
import { formatPrice } from '@/helpers/intl';

// Components
import CityAutocomplete from './DashboardComponents/Input/CityAutocomplete.vue';
import StreetAutocomplete from './DashboardComponents/Input/StreetAutocomplete.vue';
import NumeroAutocomplete from './DashboardComponents/Input/NumeroAutocomplete.vue';
import PropertyTable from './DashboardComponents/PropertyTable.vue';
import DvfMarketTooltip from './DashboardComponents/DvfMarketTooltip.vue';
import ProspectionCommuneTable from './DashboardComponents/ProspectionCommuneTable.vue';
import PropertyTableCard from './DashboardComponents/PropertyTableCard.vue';
import PropertyForm from './DashboardComponents/PropertyDialog/index.vue';
import CreateCustomPropertyDialog from './DashboardComponents/CreateCustomPropertyDialog.vue';
import MapView from './DashboardComponents/MapView.vue';
import ReminderFormDialog from './Reminders/components/ReminderFormDialog.vue';
import type { ReminderFormData } from './Reminders/components/ReminderFormDialog.vue';

/* ------------------------------------
      STORES
------------------------------------ */
const store = usePropertyStore();
const dashboardStore = useDashboardStore();
const userStore = useUserStore();
const mapView = ref<InstanceType<typeof MapView> | null>(null);
const showMapReminderEditor = ref(false);
const editingMapReminder = ref<Reminder | null>(null);
const savingMapReminder = ref(false);
watch(() => dashboardStore.mapReminders, reminders => {
  if (editingMapReminder.value && !reminders.some(reminder => reminder.id === editingMapReminder.value?.id)) {
    showMapReminderEditor.value = false;
    editingMapReminder.value = null;
  }
});
const streetProspectionProgress = computed(() => {
  const progress = dashboardStore.prospectionProgress;
  if (!progress) return null;
  return progress.streets[dashboardStore.selectedCodeIdFantoir] ?? { prospected: 0, total: 0 };
});

/* ------------------------------------
      WATCHERS AUTOMATIQUES
------------------------------------ */

// 🟦 Ville change → reset ou recherche
watch(
  () => dashboardStore.selectedCity,
  (newVal, oldVal) => {
    if (newVal === oldVal || dashboardStore.hasDirectAddressList || isTransactionOrEnergyMode.value) return;

    if (!newVal) {
      // Ville supprimée → vider automatiquement
      dashboardStore.addresses = [];
      dashboardStore.cityCenter = null;
      dashboardStore.noResultsFound = false;
      dashboardStore.isDataLoaded = false;
      return;
    }

    dashboardStore.debouncedSearch();
  }
);

// 🟧 Rue change → recherche
watch(
  () => dashboardStore.selectedStreet,
  (newVal, oldVal) => {
    if (newVal === oldVal || dashboardStore.hasDirectAddressList || isTransactionOrEnergyMode.value) return;

    dashboardStore.debouncedSearch();

    if (!newVal && dashboardStore.viewType === 'card') {
      dashboardStore.viewType = 'table';
    }
  }
);

watch(
  () => dashboardStore.activeMainMode,
  (newMode) => {
    if (ownerSearchTimeout) {
      clearTimeout(ownerSearchTimeout);
      ownerSearchTimeout = null;
    }
    if (newMode !== 'rappels') showMapReminderEditor.value = false;
  }
);
// 🟥 Numéro change → recherche
watch(
  () => dashboardStore.selectedNumeroFull,
  (newVal, oldVal) => {
    if (newVal === oldVal || dashboardStore.hasDirectAddressList || isTransactionOrEnergyMode.value) return;
    dashboardStore.debouncedSearch();
  }
);

let ownerSearchTimeout: ReturnType<typeof setTimeout> | null = null;

watch(
  () => dashboardStore.selectedOwnerName,
  (newVal, oldVal) => {
    if (newVal !== oldVal && !dashboardStore.hasDirectAddressList && !isTransactionOrEnergyMode.value) {
      if (ownerSearchTimeout) {
        clearTimeout(ownerSearchTimeout);
      }

      ownerSearchTimeout = setTimeout(() => {
        dashboardStore.querySearchAddress();
      }, 400);
    }
  }
);
/* ------------------------------------
      COMPUTED BINDINGS
------------------------------------ */
// const mapAddresses = computed(() => {
//   return dashboardStore.activeMainMode === 'dpe'
//     ? []
//     : dashboardStore.addresses;
// });

const selectedOwnerName = computed({
  get: () => dashboardStore.selectedOwnerName,
  set: (v) => (dashboardStore.selectedOwnerName = v),
});

const majScope = computed({
  get: () => dashboardStore.canUseMajAgencyScope ? dashboardStore.majAddressScope : 'personal',
  set: (scope: 'personal' | 'agency') => {
    if (scope === 'personal' || dashboardStore.canUseMajAgencyScope) dashboardStore.majAddressScope = scope;
  },
});

// --- Ville ---
const selectedCity = computed({
  get: () => dashboardStore.selectedCity,
  set: (v) => (dashboardStore.selectedCity = v),
});

// --- Rue ---
const selectedStreet = computed({
  get: () => dashboardStore.selectedStreet,
  set: (v) => (dashboardStore.selectedStreet = v),
});

// --- Code INSEE ---
const selectedCodeInsee = computed({
  get: () => dashboardStore.selectedCodeInsee,
  set: (v) => (dashboardStore.selectedCodeInsee = v),
});

// --- ID FANTOIR de la rue (nécessaire pour NuméroAutocomplete) ---
const selectedCodeIdFantoir = computed({
  get: () => dashboardStore.selectedCodeIdFantoir,
  set: (v) => (dashboardStore.selectedCodeIdFantoir = v),
});

// --- Numéro + rep (ex: "40 bis") ---
const selectedNumeroFull = computed({
  get: () => dashboardStore.selectedNumeroFull || undefined,

  set: (v) => {
    dashboardStore.selectedNumeroFull = v || null;

    if (!v) {
      dashboardStore.selectedNumero = '';
      dashboardStore.selectedRep = '';
      return;
    }

    // Sélection via autocomplete → objet
    if (typeof v === 'object' && v !== null) {
      dashboardStore.selectedNumero = v.numero || '';
      dashboardStore.selectedRep = v.rep || '';
      return;
    }

    // Saisie manuelle -> string
    if (typeof v === 'string') {
      const parts = (v as string).trim().split(' ');
      dashboardStore.selectedNumero = parts[0] || '';
      dashboardStore.selectedRep = parts[1] || '';
    }
  },
});

// --- Vue table / card ---
const viewType = computed({
  get: () => dashboardStore.viewType,
  set: dashboardStore.selectDashboardView,
});

// --- Résultats des adresses (filtrées par mode actif) ---
const addresses = computed(() => dashboardStore.filteredAddresses);
const isFavoritesTable = computed(() => dashboardStore.activeMainMode === 'favorites' && viewType.value === 'table');
const favoriteAddressKeys = computed(() => isFavoritesTable.value
  ? store.favoriteAddresses.filter(row => row.bien_type === 'address').map(row => row.row_id).sort().join(',')
  : '');
const favoriteSales = ref<{ token: typeof userStore.token; rows: Map<string, FavoriteAddress> } | null>(null);

watch([favoriteAddressKeys, () => userStore.token], async ([keys, token], _, onCleanup) => {
  const loaded = favoriteSales.value?.token === token ? favoriteSales.value?.rows : undefined;
  if (!keys || keys.split(',').every(key => loaded?.has(key))) return;
  const request = new AbortController();
  onCleanup(() => request.abort());
  try {
    const rows = await PersonalPropertyService.getFavorites(true, request.signal);
    if (!request.signal.aborted && token === userStore.token) {
      favoriteSales.value = { token, rows: new Map(rows.map(row => [row.row_id, row])) };
    }
  } catch (error) {
    if (!request.signal.aborted) console.error('Chargement des ventes DVF des favoris', error);
  }
}, { immediate: true });

const favoriteTableAddresses = computed(() => {
  const sales = favoriteSales.value?.token === userStore.token ? favoriteSales.value?.rows : undefined;
  return store.favoriteAddresses.map(row => {
    const sale = sales?.get(row.row_id);
    if (!sale || row.bien_type !== 'address') return row;
    const enriched = {
      ...row,
      code_insee: sale.code_insee,
      id_fantoir: sale.id_fantoir,
      prospection_street_key: sale.prospection_street_key,
      date_derniere_vente: sale.date_derniere_vente,
      dernier_prix_vente: sale.dernier_prix_vente,
      dernier_prix_vente_m2: sale.dernier_prix_vente_m2,
      derniere_vente_surface_batie: sale.derniere_vente_surface_batie,
      derniere_vente_residentielle: sale.derniere_vente_residentielle,
      derniere_vente_code_type_local: sale.derniere_vente_code_type_local,
      derniere_vente_dvf: sale.derniere_vente_dvf,
    };
    return { ...enriched, tableMarketReference: marketReferenceForAddress(enriched) };
  });
});
const isEstimationsTable = computed(() => dashboardStore.activeMainMode === 'estimations' && viewType.value === 'table');
const isOtherMarketTable = computed(() => viewType.value === 'table' &&
  ['estimations', 'rappels', 'maj'].includes(dashboardStore.activeMainMode));
const remindersByProperty = computed(() => {
  const grouped = new Map<number, Reminder[]>();
  for (const reminder of dashboardStore.mapReminders) {
    const id = Number(reminder.property_id);
    const reminders = grouped.get(id) ?? [];
    reminders.push(reminder);
    grouped.set(id, reminders);
  }
  return grouped;
});
const propertyTableAddresses = computed(() => {
  if (isFavoritesTable.value) return favoriteTableAddresses.value;
  if (isOtherMarketTable.value) {
    return addresses.value.map(row => 'price' in row
      ? {
        ...row,
        tableMarketReference: marketReferenceForAddress(row),
        tableReminders: dashboardStore.activeMainMode === 'rappels' ? remindersByProperty.value.get(Number(row.id)) : undefined,
      }
      : row);
  }
  return addresses.value;
});
const communeTableStreets = computed(() => addresses.value.filter(
  (row): row is IAddressGrouped => 'total_adresses' in row,
));
const communeTableSort = ref<{ prop: string; order: 'ascending' | 'descending' } | null>(null);
const showStreetMarketComparison = computed(() =>
  dashboardStore.activeMainMode === 'prospection' && !!dashboardStore.selectedCodeIdFantoir,
);
const statisticsCity = computed(() =>
  dashboardStore.activeMainMode === 'prospection' ? dashboardStore.selectedCodeInsee : '',
);
const statisticsInFlightCity = ref('');
const statisticsRequestCity = computed(() =>
  viewType.value === 'table' || statisticsInFlightCity.value === statisticsCity.value
    ? statisticsCity.value : '',
);
const statisticsSnapshot = ref<{ city: string; data: DvfStatistics } | null>(null);
const marketStatisticsByCity = ref(new Map<string, DvfStatistics>());
const marketStatisticsCities = computed(() => {
  const cities = isFavoritesTable.value
    ? favoriteTableAddresses.value.filter(row => row.dernier_prix_vente_m2 != null).map(row => row.code_insee)
    : isOtherMarketTable.value
      ? addresses.value.flatMap(row => 'price' in row &&
        (row.dernier_prix_vente_m2 != null || (isEstimationsTable.value && savedSimulationPricePerM2(row) !== null))
        ? [row.code_insee] : [])
      : [];
  return [...new Set(cities.filter(Boolean))].sort().join(',');
});

watch(marketStatisticsCities, async (cities, _, onCleanup) => {
  if (!cities) return;
  const request = new AbortController();
  onCleanup(() => request.abort());
  const missing = cities.split(',').filter(city => !marketStatisticsByCity.value.has(city));
  for (let offset = 0; offset < missing.length && !request.signal.aborted; offset += 3) {
    await Promise.allSettled(missing.slice(offset, offset + 3).map(async city => {
      const data = statisticsSnapshot.value?.city === city ? statisticsSnapshot.value.data
        : await getDvfStatistics(city, undefined, request.signal, true);
      if (!request.signal.aborted) marketStatisticsByCity.value.set(city, data);
    }));
  }
}, { immediate: true });

function marketReferenceForAddress(row: Partial<IAddressDetail>) {
  return residentialReference(
    marketStatisticsByCity.value.get(row.code_insee ?? '') ?? null,
    row.prospection_street_key || row.id_fantoir || '',
  );
}
const prospectionTableStatistics = computed(() =>
  statisticsSnapshot.value?.city === statisticsCity.value ? statisticsSnapshot.value.data : null,
);
const communeOverviewMedian = computed(() =>
  prospectionTableStatistics.value?.commune?.residential?.median_price_per_m2 ?? null,
);
const communeOverviewTooltip = computed(() =>
  communeMarketReference.value?.tooltip,
);
const streetOverviewPrice = computed(() =>
  communeStreetPrice(prospectionTableStatistics.value, dashboardStore.selectedCodeIdFantoir),
);
const streetOverviewNote = computed(() => {
  const price = streetOverviewPrice.value;
  if (price.median === null) return '';
  const count = `${price.salesCount} ${price.salesCount === 1 ? 'vente' : 'ventes'}`;
  if (price.indicative) return `Faible échantillon · ${count}`;
  if (price.referenceCommune) return 'Réf. commune';
  return price.limitedSample ? `Échantillon limité · ${count}` : count;
});

function formatReferencePrice(median: number | null) {
  return median === null ? '—' : `${formatPrice(median)}/m²`;
}

const streetMarketReference = computed(() =>
  streetComparisonReference(prospectionTableStatistics.value?.streets?.[dashboardStore.selectedCodeIdFantoir]?.residential,
    prospectionTableStatistics.value),
);
const communeMarketReference = computed(() => communeComparisonReference(prospectionTableStatistics.value));
const prospectionStatisticsLoading = ref(false);
const prospectionStatisticsFailed = ref(false);

watch(statisticsRequestCity, async (city, _, onCleanup) => {
  statisticsInFlightCity.value = '';
  prospectionStatisticsFailed.value = false;
  prospectionStatisticsLoading.value = false;
  if (!city || statisticsSnapshot.value?.city === city) return;
  const cached = marketStatisticsByCity.value.get(city);
  if (cached) {
    statisticsSnapshot.value = { city, data: cached };
    return;
  }
  const request = new AbortController();
  onCleanup(() => request.abort());
  statisticsInFlightCity.value = city;
  prospectionStatisticsLoading.value = true;
  try {
    const data = await getDvfStatistics(city, undefined, request.signal, true);
    if (!request.signal.aborted) statisticsSnapshot.value = { city, data };
  } catch {
    if (!request.signal.aborted) prospectionStatisticsFailed.value = true;
  } finally {
    if (!request.signal.aborted) {
      prospectionStatisticsLoading.value = false;
      statisticsInFlightCity.value = '';
    }
  }
}, { immediate: true });

const selectedProspectionAddressKey = computed(() => {
  const { activeMainMode, lastSearchParams, selectedCodeInsee, selectedCodeIdFantoir,
    selectedNumero, selectedRep, selectedOwnerName, selectedOwnerAddressKey } = dashboardStore;

  if (activeMainMode !== 'prospection' || !selectedCodeInsee || !selectedCodeIdFantoir ||
      !selectedNumero || !lastSearchParams ||
      (lastSearchParams.ownerName ?? '') !== selectedOwnerName.trim() ||
      lastSearchParams.codeInsee !== selectedCodeInsee ||
      lastSearchParams.codeIdFantoir !== selectedCodeIdFantoir ||
      lastSearchParams.numero !== selectedNumero ||
      (lastSearchParams.rep ?? '') !== selectedRep) return null;

  if (selectedOwnerName.trim()) {
    return selectedOwnerAddressKey && addresses.value.some(row => prospectionAddressKey(row) === selectedOwnerAddressKey)
      ? selectedOwnerAddressKey
      : null;
  }

  return uniqueProspectionAddressKey(addresses.value, selectedNumero, selectedRep);
});
const addressProspectionProgress = computed(() => {
  const key = selectedProspectionAddressKey.value;
  return key ? rowProspectionCount(dashboardStore.prospectionProgress, { prospection_address_key: key }) : null;
});

// --- Loading ---
const isLoading = computed(() => dashboardStore.isLoading);

// --- Message d'état vide contextuel ---
const MODE_LABELS: Record<string, string> = {
  favorites: 'favoris',
  estimations: 'estimations',
  rappels: 'rappels',
  maj: 'mises à jour',
  dvf: 'ventes DVF',
};

const emptyStateMessage = computed(() => {
  const mode = dashboardStore.activeMainMode;
  if (mode === 'maj') return 'Aucune fiche dans la période sélectionnée.';
  if (mode !== 'prospection' && MODE_LABELS[mode]) {
    return `Aucune adresse ne correspond au filtre « ${MODE_LABELS[mode]} » pour cette recherche.`;
  }
  return 'Essayez de modifier vos critères de recherche.';
});

// --- Vérifier si seulement la ville est sélectionnée (pas de rue ni numéro) ---
const isCityOnly = computed(() => {
  return (
    dashboardStore.activeMainMode === 'prospection' &&
    dashboardStore.selectedCity !== null &&
    !dashboardStore.selectedStreet &&
    !dashboardStore.selectedNumeroFull
  );
});

/* ------------------------------------
      LIFECYCLE
------------------------------------ */
onMounted(() => {
  void store.loadFavoriteAddresses().catch(error => console.error('Chargement des favoris', error));
  // Les données sont restaurées automatiquement depuis le store si déjà chargées
});

/* ------------------------------------
      HANDLERS
------------------------------------ */
const handleCitySelect = (city: { value: string; codeInsee?: string }) => {
  const codeInsee = city.codeInsee || '';
  const changedCity = dashboardStore.selectedCodeInsee !== codeInsee;
  if (hasGeographicFilters.value && changedCity) {
    handleStreetClear();
  }
  dashboardStore.selectedCity = city;
  dashboardStore.selectedCodeInsee = codeInsee;
  if (changedCity) void dashboardStore.requestCityRecenter(codeInsee);
};

const handleCityClear = () => {
  dashboardStore.selectedCity = null;
  dashboardStore.selectedStreet = null;
  dashboardStore.selectedCodeInsee = '';
  dashboardStore.selectedCodeIdFantoir = '';
  dashboardStore.selectedNumero = '';
  dashboardStore.selectedRep = '';
  dashboardStore.selectedNumeroFull = null;

  // ⭐ VIDE TOTALEMENT LES RÉSULTATS
  dashboardStore.addresses = [];
  dashboardStore.cityCenter = null;
  dashboardStore.noResultsFound = false;
  dashboardStore.isDataLoaded = false;
};

const handleStreetSelect = (street: { value: string; idFantoir?: string }) => {
  const nextStreetKey = street.idFantoir || '';
  if (dashboardStore.selectedCodeIdFantoir !== nextStreetKey) handleNumeroClear();
  dashboardStore.selectedStreet = street;
  dashboardStore.selectedCodeIdFantoir = nextStreetKey;
};
const handleStreetClear = () => {
  dashboardStore.selectedStreet = null;
  dashboardStore.selectedCodeIdFantoir = '';
  dashboardStore.selectedNumero = '';
  dashboardStore.selectedRep = '';
  dashboardStore.selectedNumeroFull = null;
};

const handleNumeroSelect = (item: any) => {
  dashboardStore.selectedNumero = item.numero;
  dashboardStore.selectedRep = item.rep || '';
  dashboardStore.selectedNumeroFull = item;
};

const handleNumeroClear = () => {
  dashboardStore.selectedNumero = '';
  dashboardStore.selectedRep = '';
  dashboardStore.selectedNumeroFull = null;
};

const handleGroupedStreetClick = (streetRow: any) => {
  if (dashboardStore.hasDirectAddressList) {
    void handleEditProperty(streetRow);
    return;
  }
  handleStreetSelect({
    value: streetRow.nom_voie,
    idFantoir: streetRow.prospection_street_key || streetRow.id_fantoir,
  });
};

const handleTableNumeroClick = (row: IAddressDetail) => {
  if (dashboardStore.hasDirectAddressList) {
    void handleEditProperty(row);
    return;
  }
  if (dashboardStore.activeMainMode === 'prospection' && dashboardStore.selectedOwnerName.trim()) {
    const selection = resolveProspectionMapSelection(addresses.value, row);
    if (selection) {
      dashboardStore.selectProspectionMapAddress(selection);
      return;
    }
  }
  const streetKey = row.prospection_street_key || row.id_fantoir;
  // 1️⃣ REMPLIR LA RUE dans l'autocomplete
  dashboardStore.selectedStreet = {
    value: row.nom_voie,
    idFantoir: streetKey,
  };

  // 2️⃣ METTRE l’ID FANTOIR
  dashboardStore.selectedCodeIdFantoir = streetKey;

  // 3️⃣ CONSTRUIRE L’OBJET numeroFull
  const numeroFull = row.rep
    ? { numero: row.numero, rep: row.rep, value: `${row.numero} ${row.rep}` }
    : { numero: row.numero, rep: '', value: `${row.numero}` };

  dashboardStore.selectedNumeroFull = numeroFull;
  dashboardStore.selectedNumero = row.numero;
  dashboardStore.selectedRep = row.rep || '';
  // La recherche est déclenchée automatiquement par le watcher sur selectedNumeroFull
};
/* ------------------------------------
      RECHERCHE
------------------------------------ */

// const querySearchAddress = async () => {
//   await dashboardStore.querySearchAddress();
// };

// const querySearchEstimation = async () => {
//   await dashboardStore.querySearchEstimation();
// };

/* ------------------------------------
      VIEW SWITCH
------------------------------------ */
const isTransactionOrEnergyMode = computed(() =>
  dashboardStore.activeMainMode === 'dpe' || dashboardStore.activeMainMode === 'dvf'
);
const hasGeographicFilters = computed(() =>
  dashboardStore.activeMainMode === 'prospection' || isTransactionOrEnergyMode.value
);
const viewOptions = computed(() => [
  {
    value: 'table',
    label: 'Vue tableau',
    icon: DataBoard,
    disabled: dashboardStore.isMapOnlyMode,
  },
  { value: 'map', label: 'Vue carte', icon: Location },
]);

/* ------------------------------------
      OUVERTURE FICHE
------------------------------------ */
const handleEditProperty = async (property: any) => {
  // Ne pas ouvrir la fiche si seulement la ville est sélectionnée
  if (
    dashboardStore.activeMainMode === 'prospection' &&
    isCityOnly.value
  ) {
    return;
  }

  await openPropertyDialog(property);
};

const openPropertyDvfHistory = (property: any) => openPropertyDialog(property, 'dvf-history');

const openPropertyDialog = async (property: any, tab: string | null = null) => {
  if (dashboardStore.activeMainMode === 'estimations') {
    dashboardStore.viewType = 'map';
    await nextTick();
    mapView.value?.openEstimation(property);
    return;
  }
  if (property?.row_type === 'estimation') return;

  const unitId = Number(property.unit_id ?? 0);

  const normalizedProperty = {
    ...store.defaultPropertyData,
    ...property,

    id: Number(property.id ?? 0) > 0
      ? Number(property.id)
      : 0,

    id_fantoir_long: property.id_fantoir_long,

    unit_id: unitId > 0
      ? unitId
      : null,

    row_type:
      property.row_type ||
      (unitId > 0 ? 'unit' : 'address'),
  };

  await store.selectProperty(normalizedProperty);
  store.setDialogVisible(true, tab);
};

function openMapReminder(reminder: Reminder) {
  if (dashboardStore.activeMainMode !== 'rappels' ||
      !dashboardStore.mapReminders.some(item => item.id === reminder.id)) return;
  editingMapReminder.value = reminder;
  showMapReminderEditor.value = true;
}

async function saveMapReminder(form: ReminderFormData, reminder: Reminder | null) {
  if (!reminder || savingMapReminder.value || dashboardStore.activeMainMode !== 'rappels') return;
  savingMapReminder.value = true;
  try {
    const { status, ...fields } = form;
    await ReminderService.updateReminder(reminder.id, { ...fields, completed: status === 'completed' });
    showMapReminderEditor.value = false;
    ElMessage.success('Rappel modifié');
    if (dashboardStore.activeMainMode === 'rappels') await dashboardStore.querySearchRappel();
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || 'Impossible de modifier le rappel.');
  } finally {
    savingMapReminder.value = false;
  }
}
</script>

<style scoped>
.prospection-overview {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 20px;
  min-height: 20px;
  margin: 8px 0 12px;
  font-size: 13px;
  line-height: 20px;
}

.prospection-overview > span,
.prospection-overview-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.prospection-overview > span {
  flex-wrap: wrap;
  column-gap: 6px;
  row-gap: 0;
}

.prospection-overview-price {
  white-space: nowrap;
}

.prospection-overview-note {
  color: #64748b;
}

.validationButtonContainer {
  gap: 20px;
  display: flex;
}

.filtersLeftContainer {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
  min-width: 0;
}

.headerTopRow {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}

.dashboardHeader :deep(.em-card-content) {
  gap: 12px;
}

.modeBar,
.modeFilters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}

.modeBar {
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-block: 4px;
}

.modeFilters {
  --dashboard-filter-height: 36px;
  --dashboard-filter-font-size: 14px;
  --dashboard-filter-radius: var(--el-border-radius-base);
  min-height: var(--dashboard-filter-height);
}

.autoCompleteContainer,
.modeFilters :deep(.prospection-scope) {
  display: contents;
}

.input-cell {
  width: 180px;
  min-width: 0;
  max-width: 100%;
}

.streetFilter {
  width: 220px;
}

.numberFilter {
  width: 120px;
}

.ownerFilter {
  width: 200px;
}

.modeFilters :deep(.el-input) {
  --el-input-height: var(--dashboard-filter-height);
  font-size: var(--dashboard-filter-font-size);
}

.modeFilters :deep(.el-input .el-input__wrapper),
.modeFilters :deep(.el-select .el-select__wrapper) {
  box-sizing: border-box;
  height: var(--dashboard-filter-height);
  min-height: var(--dashboard-filter-height);
  padding: 0 12px;
  border-radius: var(--dashboard-filter-radius);
  align-items: center;
  font-size: var(--dashboard-filter-font-size);
}

.modeFilters :deep(.el-select__wrapper) {
  line-height: 20px;
}

.modeFilters :deep(.dynamic-label-wrapper > label:not(.active)) {
  left: 8px;
  font-size: var(--dashboard-filter-font-size);
}

.modeFilters :deep(.dynamic-label-wrapper:not(.disabled) > label.active) {
  top: 0;
}

.modePill {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  border: none;
  background: #f3f4f6;
  color: #374151;
  padding: 10px 16px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.modePill:hover {
  background: #e5e7eb;
}

.modePill.active {
  background: #2563eb;
  color: white;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
}

.modeDot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}

.modePill.active .modeDot {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.35);
}

.modeDot.prospection {
  background: #3b82f6;
}

.modeDot.favoris {
  background: #f97316;
}

.modeDot.estimations {
  background: #9333ea;
}

.modeDot.rappels {
  background: #06b6d4;
}

.modeDot.dpe {
  background: #10b981;
}

.modeDot.dvf {
  background: #ef4444;
}

.modeSelect {
  width: 180px;
  max-width: 100%;
}

.modeDot.maj {
  background: #8b5cf6;
}
.dashboardContainer {
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
  box-sizing: border-box;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: var(--apple-card-bg, #fff);
  border-radius: var(--apple-radius, 12px);
  box-shadow: var(--apple-shadow, 0 1px 3px rgba(0, 0, 0, 0.08));
  border: 1px solid #e5e7eb;
}

.empty-state-icon {
  font-size: 48px;
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-state-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px;
}

.empty-state-subtitle {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
  max-width: 360px;
}

/* ── Mobile responsive ──────────────────────────────────────── */
@media (max-width: 768px) {
  .headerTopRow {
    gap: 8px;
  }

  .headerRightContainer :deep(.view-controls) {
    padding-inline: 8px;
  }

  .modePill {
    padding: 8px 12px;
    font-size: 13px;
  }

}
</style>
