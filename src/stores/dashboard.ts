// src/stores/dashboard.ts
import { defineStore } from 'pinia';
import { isAxiosError } from 'axios';
import { ref, computed, shallowReactive, shallowRef, watch } from 'vue';
import { PropertyService } from '@/api/property.service';
import { getPersonalPropertyTarget, personalPropertyKey } from '@/api/personal-property.service';
import { useRemindersStore, type Reminder } from '@/stores/reminders';
import { ReminderService } from '@/api/reminder.service';
import { usePropertyStore } from '@/stores/propertyHome';
import type { IAddressGrouped, IAddressDetail } from '@/types/address';
import type { IDpeResult } from '@/types/dpe';
import type { DvfSaleFocus, DvfSaleIdentity, IDvfPoint } from '@/types/dvf';
import { DvfService } from '@/api/dvf.service';
import { useUserStore } from '@/stores/user';
import { UserService } from '@/api/user.service';
import { useProspectionScopeStore } from '@/stores/prospectionScope';
import { getProspectionProgress } from '@/api/prospection-progress.service';
import type { ProgressFilters } from '@/api/prospection-progress.service';
import { prospectionAddressKey, tableRowProgressLookupKey } from '@/utils/prospectionProgress';
import { dvfRangeForSale, matchesDpeStreet, matchesHistoricalStreet, matchesSaleNumber } from '@/utils/mapAddressFilters';
import type { MapDisplayMode } from '@/utils/mapConstants';
import type { ProspectionMapSelection, ProspectionProgress } from '@/utils/prospectionProgress';

/**
 * Interface pour une ville sélectionnée
 */
interface SelectedCity {
  value: string;
  city?: string;
  codeInsee?: string;
  code_insee?: string;
}

/**
 * Interface pour une rue sélectionnée
 */
interface SelectedStreet {
  value: string;
  idFantoir?: string;
}

/**
 * Interface pour le numéro complet sélectionné
 */
interface SelectedNumeroFull {
  numero: string;
  rep: string;
  value: string;
}

/**
 * Interface pour les paramètres de recherche
 */
interface SearchParams {
  city: SelectedCity | null;
  street: SelectedStreet | null;
  codeInsee: string;
  codeIdFantoir: string | null;
  numero: string | null;
  rep: string | null;
  ownerName: string | null;
  ownerAddressKey: string | null;
}

/**
 * Interface pour un point DPE sur la carte
 */
interface DpePoint {
  lat: number;
  lon: number;
  adresse: string;
  etiquette: string;
  type: string;
  date: string;
}

type PropertyTableSort = { prop: string; order: 'ascending' | 'descending' };
type GeographicMode = 'prospection' | 'dpe' | 'dvf';
interface MapViewport {
  center: [number, number];
  zoom: number;
}

function isGeographicMode(mode: string): mode is GeographicMode {
  return mode === 'prospection' || mode === 'dpe' || mode === 'dvf';
}

export const useDashboardStore = defineStore('dashboard', () => {
  const propertyStore = usePropertyStore();
  // State
  const selectedCity = ref<SelectedCity | null>(null);
  const selectedStreet = ref<SelectedStreet | null>(null);
  const selectedCodeInsee = ref('');
  const selectedCodeIdFantoir = ref('');
  const addresses = ref<(IAddressGrouped | IAddressDetail)[]>([]);
  const cityCenter = ref<{ lat: number; lon: number } | null>(null);
  const preferredViewType = ref<'map' | 'table'>('table');
  const viewType = ref('table');
  const lastSearchParams = ref<SearchParams | null>(null);
  const isDataLoaded = ref(false);
  const isLoading = ref(false);
  const showCustomPropertyDialog = ref(false);
  const noResultsFound = ref(false);
  const selectedNumero = ref('');
  const selectedRep = ref('');
  const selectedNumeroFull = ref<SelectedNumeroFull | null>(null);
  const dpePoints = ref<DpePoint[]>([]);
  const dvfPoints = ref<IDvfPoint[]>([]);
  const dvfSaleFocus = ref<DvfSaleFocus | null>(null);
  const dvfSaleTarget = ref<{
    identity: DvfSaleIdentity;
    filters: string;
    center: [number, number] | null;
    openDirectly: boolean;
  } | null>(null);
  const dvfSearchError = ref('');

  const markers = ref<Record<string, any>>({});
  const filterMode = ref<string | null>(null);
  const selectedOwnerName = ref('');
  const ownerAddressSelection = shallowRef<(ProspectionMapSelection & {
    ownerName: string;
    matches: IAddressDetail[];
  }) | null>(null);
  const selectedOwnerAddressKey = computed(() => {
    const selection = ownerAddressSelection.value;
    if (!selection || selection.ownerName !== selectedOwnerName.value.trim() ||
        selection.codeInsee !== selectedCodeInsee.value || selection.streetKey !== selectedCodeIdFantoir.value ||
        selection.numero !== selectedNumero.value || selection.rep !== selectedRep.value) return null;
    return selection.addressKey;
  });
  watch(selectedOwnerAddressKey, (key) => {
    if (!key && activeMainMode.value === 'prospection') ownerAddressSelection.value = null;
  });
  const activeMainMode = ref<
    | 'prospection'
    | 'favorites'
    | 'estimations'
    | 'rappels'
    | 'maj'
    | 'dpe'
    | 'dvf'
  >('prospection');
  const isMapOnlyMode = computed(() => activeMainMode.value === 'dpe' || activeMainMode.value === 'dvf');

  function selectDashboardView(view: string) {
    if (isMapOnlyMode.value || (view !== 'table' && view !== 'map')) return;
    preferredViewType.value = view;
    viewType.value = view;
  }

  const geographicFilters = shallowReactive(new Map<GeographicMode, SearchParams>());
  const mapViewports = shallowReactive<Partial<Record<MapDisplayMode, MapViewport>>>({});
  const lastMapViewport = shallowRef<MapViewport | null>(null);
  const cityRecenter = shallowRef<{ mode: GeographicMode; codeInsee: string; center: MapViewport['center'] } | null>(null);
  let cityRecenterVersion = 0;

  function saveMapViewport(mode: MapDisplayMode, viewport: MapViewport) {
    mapViewports[mode] = viewport;
    lastMapViewport.value = viewport;
  }

  function cancelCityRecenter() {
    cityRecenterVersion++;
    cityRecenter.value = null;
  }

  watch([activeMainMode, selectedCodeInsee], cancelCityRecenter, { flush: 'sync' });

  const groupedCityRequests = new Map<string, Promise<IAddressGrouped[]>>();
  function getGroupedCityAddresses(codeInsee: string, prospection: boolean) {
    const key = `${codeInsee}:${prospection}`;
    const pending = groupedCityRequests.get(key);
    if (pending) return pending;

    const request = PropertyService.getAddressesGroupedByCodeInsee(codeInsee, prospection)
      .finally(() => { groupedCityRequests.delete(key); });
    groupedCityRequests.set(key, request);
    return request;
  }

  async function requestCityRecenter(codeInsee: string) {
    const mode = activeMainMode.value;
    if (!isGeographicMode(mode) || !codeInsee || selectedCodeInsee.value !== codeInsee) return;
    cancelCityRecenter();
    const version = cityRecenterVersion;
    try {
      const rows = await getGroupedCityAddresses(codeInsee, mode === 'prospection');
      if (version !== cityRecenterVersion || activeMainMode.value !== mode ||
          selectedCodeInsee.value !== codeInsee) return;
      const center = computeCenter(rows);
      if (center) cityRecenter.value = { mode, codeInsee, center: [center.lon, center.lat] };
    } catch (error) {
      if (version === cityRecenterVersion) console.error('Chargement du centre de la commune', error);
    }
  }
  const propertyTableSorts = ref<Partial<Record<typeof activeMainMode.value, PropertyTableSort | null>>>({});
  const propertyTableSort = computed<PropertyTableSort | null>(() => {
    const saved = propertyTableSorts.value[activeMainMode.value];
    return saved === undefined ? { prop: 'numero', order: 'ascending' } : saved;
  });

  function setPropertyTableSort(sort: PropertyTableSort | null) {
    propertyTableSorts.value[activeMainMode.value] = sort;
  }

  const dpeFilterRange = ref<'1m' | '3m' | '6m' | '1y'>('3m');
  const dvfFilterRange = ref<NonNullable<ReturnType<typeof dvfRangeForSale>>>('all');
  const majFilterRange = ref<'7d' | '30d' | '3m' | '6m'>('30d');
  const majAddressScope = ref<'agency' | 'personal'>('personal');
  const favoritesOnly = ref(false);
  const reminderAddressScope = ref<'agency' | 'personal'>('personal');
  const mapReminders = shallowRef<Reminder[]>([]);
  const hasDirectAddressList = computed(() =>
    activeMainMode.value === 'estimations' || activeMainMode.value === 'rappels' || activeMainMode.value === 'maj'
  );
  const userStore = useUserStore();
  const majPermissions = shallowRef<{ token: string; agency: boolean } | null>(null);
  let majRoleRequest: AbortController | null = null;
  const canUseMajAgencyScope = computed(() =>
    majPermissions.value?.token === userStore.token && majPermissions.value.agency
  );
  watch(() => userStore.token, () => { ownerAddressSelection.value = null; });
  const prospectionScope = useProspectionScopeStore();
  const progressFilters = computed<ProgressFilters[]>(() => {
    const mode = activeMainMode.value;
    const isProspection = mode === 'prospection';
    if (mode === 'dpe' || mode === 'dvf' || (!isProspection && viewType.value !== 'table')) return [];
    const scope = isProspection ? prospectionScope.filters : { scope: 'me' as const };
    if (!scope) return [];
    const requests: ProgressFilters[] = [];
    if (isProspection && selectedCodeInsee.value) {
      requests.push({
        ...scope,
        code_insee: selectedCodeInsee.value,
        id_fantoir: selectedCodeIdFantoir.value || undefined,
      });
    }
    const owner = selectedOwnerName.value.trim();
    if (!isProspection || (owner && lastSearchParams.value?.ownerName === owner)) {
      const keys = [...new Set(filteredAddresses.value.map(
        isProspection ? prospectionAddressKey : tableRowProgressLookupKey
      ).filter(
        (key): key is string => !!key
      ))];
      for (let offset = 0; offset < keys.length; offset += 250) {
        requests.push({ ...scope, address_keys: keys.slice(offset, offset + 250) });
      }
    }
    return requests;
  });
  const progressScope = computed(() => JSON.stringify(progressFilters.value));
  const progressSnapshot = shallowRef<{
    token: string;
    scope: string;
    data: ProspectionProgress;
  } | null>(null);
  const prospectionProgress = computed(() => {
    const snapshot = progressSnapshot.value;
    return snapshot?.scope === progressScope.value && snapshot.token === userStore.token
      ? snapshot.data
      : null;
  });
  let progressVersion = 0;
  let progressTimer: ReturnType<typeof setTimeout> | undefined;

  async function refreshProspectionProgress() {
    const version = ++progressVersion;
    clearTimeout(progressTimer);
    const token = userStore.token;
    const scope = progressScope.value;
    const filters = progressFilters.value;
    if (!token || !filters.length) {
      progressSnapshot.value = null;
      return;
    }

    const isCurrent = () => version === progressVersion &&
      token === userStore.token && scope === progressScope.value;
    try {
      const started = performance.now();
      const results = await Promise.all(filters.map(getProspectionProgress));
      if (!isCurrent()) return;

      const data = {
        ...results[0],
        addresses: Object.assign({}, ...results.map(result => result.addresses)),
        bien_status: Object.assign({}, ...results.map(result => result.bien_status)),
      };
      progressSnapshot.value = { token, scope, data };
      const remaining = results.reduce((delay, result) => result.next_expiry
        ? Math.min(delay, Date.parse(result.next_expiry) - Date.parse(result.server_now))
        : delay, Infinity);
      if (Number.isFinite(remaining)) {
        const elapsed = performance.now() - started;
        progressTimer = setTimeout(() => {
          progressSnapshot.value = null;
          void refreshProspectionProgress();
        }, Math.max(100, Math.min(remaining - elapsed, 2_147_000_000)));
      }
    } catch (error) {
      if (!isCurrent()) return;
      progressSnapshot.value = null;
      if (isAxiosError(error) && error.response?.status === 403) {
        if (activeMainMode.value === 'prospection') prospectionScope.rejectScope();
        return;
      }
      console.error('Chargement de la progression de prospection', error);
      progressTimer = setTimeout(() => void refreshProspectionProgress(), 15_000);
    }
  }

  // Compteur pour protection contre les race conditions
  let searchVersion = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // --- Helpers ---

  function buildSearchParams(ownerName: string | null = null): SearchParams {
    return {
      city: selectedCity.value,
      street: selectedStreet.value,
      codeInsee: selectedCodeInsee.value,
      codeIdFantoir: selectedCodeIdFantoir.value || null,
      numero: selectedNumero.value || null,
      rep: selectedRep.value || null,
      ownerName,
      ownerAddressKey: activeMainMode.value === 'prospection' ? selectedOwnerAddressKey.value : null,
    };
  }

  function isSameSearch(ownerName: string | null = null): boolean {
    if (!lastSearchParams.value) return false;
    const current = buildSearchParams(ownerName);
    return JSON.stringify(current) === JSON.stringify(lastSearchParams.value);
  }

  function finalizeSearch(
    results: (IAddressGrouped | IAddressDetail)[],
    ownerName: string | null = null
  ) {
    addresses.value = results;
    cityCenter.value = computeCenter(results);
    lastSearchParams.value = buildSearchParams(ownerName);
    isDataLoaded.value = true;
    noResultsFound.value = results.length === 0;
  }

  function formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

async function setMainMode(
  mode:
    | 'prospection'
    | 'favorites'
    | 'estimations'
    | 'rappels'
    | 'maj'
    | 'dpe'
    | 'dvf'
) {
  if (activeMainMode.value === mode) return;

  const previousMode = activeMainMode.value;
  if (isGeographicMode(previousMode)) {
    geographicFilters.set(previousMode, buildSearchParams(selectedOwnerName.value));
  }
  const wasMapOnly = isMapOnlyMode.value;
  activeMainMode.value = mode;
  if (isMapOnlyMode.value) viewType.value = 'map';
  else if (wasMapOnly) viewType.value = preferredViewType.value;
  if (isGeographicMode(mode)) {
    const saved = geographicFilters.get(mode);
    selectedCity.value = saved?.city ?? null;
    selectedStreet.value = saved?.street ?? null;
    selectedCodeInsee.value = saved?.codeInsee ?? '';
    selectedCodeIdFantoir.value = saved?.codeIdFantoir ?? '';
    selectedNumero.value = mode === 'dpe' ? '' : saved?.numero ?? '';
    selectedRep.value = mode === 'dpe' ? '' : saved?.rep ?? '';
    selectedNumeroFull.value = selectedNumero.value ? {
        numero: selectedNumero.value,
        rep: selectedRep.value,
        value: [selectedNumero.value, selectedRep.value].filter(Boolean).join(' '),
    } : null;
    selectedOwnerName.value = mode === 'prospection' ? saved?.ownerName ?? '' : '';
  }
  if (hasDirectAddressList.value) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = null;
    addresses.value = [];
    cityCenter.value = null;
    isDataLoaded.value = false;
    mapReminders.value = [];
  }

  // On invalide la recherche précédente
  lastSearchParams.value = null;
  noResultsFound.value = false;

  if (mode === 'favorites') {
    await querySearchAddress();
    return;
  }

  if (mode === 'estimations') {
    await querySearchEstimation();
    return;
  }

  if (mode === 'rappels') {
    await querySearchRappel();
    return;
  }

  if (mode === 'maj') {
    await loadMajMode();
    return;
  }

  if (mode === 'dpe' || mode === 'dvf') {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = null;
    searchVersion++;
    isLoading.value = false;
    cityCenter.value = null;
    return;
  }

  if (mode === 'prospection') {
    await querySearchAddress();
  }
}

  /**
   * Version debouncée pour les watchers — regroupe les mutations rapides
   * (ex: changement ville + reset rue + reset numéro = 1 seul appel)
   */
  function debouncedSearch(delay = 50) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      querySearchAddress();
    }, delay);
  }

  /**
 * Une sélection de ville doit toujours charger la liste des rues,
 * quelle que soit la vue active : carte ou tableau.
 */
watch(
  selectedCodeInsee,
  (newCodeInsee, oldCodeInsee) => {
    if (newCodeInsee === oldCodeInsee || hasDirectAddressList.value ||
        activeMainMode.value === 'dpe' || activeMainMode.value === 'dvf') return;

    // Ville supprimée
    if (!newCodeInsee) {
      addresses.value = [];
      cityCenter.value = null;
      lastSearchParams.value = null;
      noResultsFound.value = false;
      return;
    }

    // Chaque mode recharge uniquement ses propres données
    switch (activeMainMode.value) {
      case 'favorites':
        // Les favoris ne dépendent pas de la ville
        return;

      case 'prospection':
      default:
        debouncedSearch();
        return;
    }
  }
);

  /** Calcule le centre géographique d'une liste d'adresses */
  function computeCenter(addressList: { lat: string | number; lon: string | number }[]) {
    const valid = addressList.filter(a => {
      const lat = Number(a.lat);
      const lon = Number(a.lon);
      return (
        !Number.isNaN(lat) && !Number.isNaN(lon) && (lat !== 0 || lon !== 0)
      );
    });
    if (valid.length === 0) return null;
    const lats = valid.map(a => Number(a.lat));
    const lons = valid.map(a => Number(a.lon));
    return {
      lat: lats.reduce((a, b) => a + b, 0) / lats.length,
      lon: lons.reduce((a, b) => a + b, 0) / lons.length,
    };
  }

const energyAndSalesFilters = computed(() => {
  const codeInsee = selectedCodeInsee.value || selectedCity.value?.codeInsee || selectedCity.value?.code_insee || '';
  const streetId = selectedCodeIdFantoir.value;
  if (activeMainMode.value === 'dpe') return JSON.stringify(['dpe', codeInsee, streetId, dpeFilterRange.value]);
  if (activeMainMode.value === 'dvf') {
    return JSON.stringify(['dvf', codeInsee, streetId, dvfFilterRange.value, selectedNumero.value, selectedRep.value]);
  }
  return '';
});
let mapSearchVersion = 0;
function startMapSearch() {
  const filters = energyAndSalesFilters.value;
  const version = ++mapSearchVersion;
  return () => version === mapSearchVersion && filters === energyAndSalesFilters.value;
}

watch([energyAndSalesFilters, dvfSaleTarget], ([filters, target]) => {
  dvfSaleFocus.value = null;
  if (activeMainMode.value === 'dvf' && target && filters !== target.filters) {
    dvfSaleTarget.value = null;
    return;
  }
  if (activeMainMode.value === 'dpe') void fetchDPE();
  if (activeMainMode.value === 'dvf') void fetchDVF();
});

function openPropertyDvfSale(row: IAddressDetail) {
  const identity = row.derniere_vente_dvf;
  if (['dvf', 'dpe'].includes(activeMainMode.value) || !identity || !row.code_insee) return;

  // The normal mode transition saves the current Prospection filters and view preference.
  void setMainMode('dvf');
  cancelCityRecenter();
  const city = { city: row.nom_commune, value: row.code_postal || row.nom_commune, codeInsee: row.code_insee };
  const street = { value: row.nom_voie, idFantoir: row.id_fantoir };
  setSearchParams(city, street, row.code_insee, row.id_fantoir);
  selectedNumero.value = String(row.numero ?? '');
  selectedRep.value = row.rep ?? '';
  dvfFilterRange.value = dvfRangeForSale(identity.date_mutation) ?? dvfFilterRange.value;
  selectedNumeroFull.value = selectedNumero.value ? {
    numero: selectedNumero.value,
    rep: selectedRep.value,
    value: [selectedNumero.value, selectedRep.value].filter(Boolean).join(' '),
  } : null;
  const lon = Number(row.lon);
  const lat = Number(row.lat);
  dvfSaleTarget.value = {
    identity,
    filters: energyAndSalesFilters.value,
    center: Number.isFinite(lon) && Number.isFinite(lat) && lon !== 0 && lat !== 0 ? [lon, lat] : null,
    openDirectly: true,
  };
}

async function fetchDVF() {
  if (activeMainMode.value !== 'dvf') return;
  const isCurrent = startMapSearch();
  dvfPoints.value = [];
  dvfSearchError.value = '';
  const target = dvfSaleTarget.value;
  const openDirectly = target?.openDirectly === true;
  if (target) target.openDirectly = false;
  try {
    const codeInsee =
      selectedCodeInsee.value ||
      selectedCity.value?.codeInsee ||
      selectedCity.value?.code_insee;

    const idFantoir = selectedCodeIdFantoir.value || null;
    const street = selectedStreet.value?.value;
    const numero = idFantoir ? selectedNumero.value : '';
    const rep = selectedRep.value;
    const range = dvfFilterRange.value;

    if (!codeInsee) {
      cityCenter.value = null;
      return;
    }

    const json = target && openDirectly ? await DvfService.getSale(codeInsee, target.identity) : await DvfService.getDVF(
      codeInsee,
      range,
      idFantoir,
      numero,
      rep
    );

    let historical: any[] = [];

    if (!isCurrent()) return;
    if (!openDirectly && range === 'all') {
      try {
        historical = await DvfService.getHistorical(codeInsee, numero, rep);
      } catch (error) {
        if (!isCurrent()) return;
        dvfSearchError.value = isAxiosError(error) && error.response?.data?.code === 'dvf_too_many_sales'
          ? 'Historique DVF trop volumineux. Affinez la recherche. Les ventes récentes restent affichées.'
          : 'Historique DVF indisponible. Les ventes récentes restent affichées.';
      }
    }
    if (!isCurrent()) return;

    const mergedJson = [
      ...(json || []),
      ...historical.filter(sale =>
        (!idFantoir || matchesHistoricalStreet(sale, idFantoir, street)) &&
        (!numero || matchesSaleNumber(sale, numero, rep)),
      ),
    ];

    console.log('DVF codeInsee =', codeInsee);
    console.log('DVF range =', dvfFilterRange.value);
    console.log('DVF selectedCodeIdFantoir =', selectedCodeIdFantoir.value);
    console.log('DVF RAW JSON =', json?.length || 0);
    console.log('DVF HISTORICAL =', historical.length);
    console.log('DVF MERGED =', mergedJson.length);
    console.log('DVF HISTORICAL SAMPLE =', historical[0]);

    dvfPoints.value = mergedJson
      .map((p: any) => ({
        ...p,

        lat: Number(p.lat ?? p.latitude),
        lon: Number(p.lon ?? p.longitude),

        id_mutation: p.id_mutation || '',
        numero_disposition: p.numero_disposition ?? null,

        adresse: p.adresse || '',
        date_mutation: p.date_mutation,

        valeur_fonciere: p.valeur_fonciere
          ? Number(p.valeur_fonciere)
          : null,

        main_type: p.main_type || p.type_local?.toLowerCase() || 'autre',
        line_count: Number(p.line_count ?? 1),

    built_items: p.built_items?.length
  ? p.built_items
  : p.type_local
    ? [
        {
          type_local: p.type_local,
          surface_reelle_bati: p.surface_reelle_bati
            ? Number(p.surface_reelle_bati)
            : null,
          nombre_pieces_principales: p.nombre_pieces_principales,
        },
      ]
    : [],

land_items: p.land_items?.length
  ? p.land_items
  : p.surface_terrain
    ? [
        {
          nature_culture: p.nature_culture,
          surface_terrain: Number(p.surface_terrain),
          id_parcelle: p.id_parcelle,
        },
      ]
    : [],

total_surface_terrain: p.total_surface_terrain
  ? Number(p.total_surface_terrain)
  : p.surface_terrain
    ? Number(p.surface_terrain)
    : null,
      }))
      .filter(
        (p: IDvfPoint) =>
          !Number.isNaN(p.lat) &&
          !Number.isNaN(p.lon) &&
          p.lat !== 0 &&
          p.lon !== 0
      );

    console.log('DVF POINTS', dvfPoints.value.length);
    console.log('DVF POINTS SAMPLE =', dvfPoints.value[0]);
    cityCenter.value = computeCenter(dvfPoints.value);
    if (target) {
      const matches = dvfPoints.value.filter(point => point.id_mutation === target.identity.id_mutation &&
        point.numero_disposition != null &&
        Number(point.numero_disposition) === target.identity.numero_disposition &&
        point.date_mutation === target.identity.date_mutation);
      const sale = matches.length === 1 ? matches[0] : null;
      if (!openDirectly) {
        if (sale) dvfSaleFocus.value = { sale, center: null };
        return;
      }
      dvfPoints.value = sale ? [sale] : [];
      dvfSaleFocus.value = { sale, center: sale ? [sale.lon, sale.lat] : target.center };
      const center = dvfSaleFocus.value.center;
      cityCenter.value = center ? { lon: center[0], lat: center[1] } : null;
      if (!sale) dvfSearchError.value = target.center
        ? 'Vente DVF introuvable. La carte est centrée sur l’adresse.'
        : 'Vente DVF introuvable. Les filtres indiquent l’adresse recherchée.';
    }
  } catch (e) {
    if (!isCurrent()) return;
    console.error('fetchDVF error', e);
    dvfPoints.value = [];
    if (target && openDirectly) {
      dvfSaleFocus.value = { sale: null, center: target.center };
      cityCenter.value = target.center ? { lon: target.center[0], lat: target.center[1] } : null;
      dvfSearchError.value = target.center
        ? 'Vente DVF indisponible. La carte est centrée sur l’adresse.'
        : 'Vente DVF indisponible. Les filtres indiquent l’adresse recherchée.';
      return;
    }
    dvfSearchError.value = isAxiosError(e) && e.response?.data?.code === 'dvf_too_many_sales'
      ? 'Trop de transactions. Affinez la recherche DVF.'
      : 'Les transactions DVF sont temporairement indisponibles.';
  }
}


  async function fetchDPE() {
    if (activeMainMode.value !== 'dpe') return;
    const isCurrent = startMapSearch();
    dpePoints.value = [];
    try {
      const codeInsee =
        selectedCodeInsee.value ||
        selectedCity.value?.codeInsee ||
        selectedCity.value?.code_insee;

      if (!codeInsee) {
        cityCenter.value = null;
        return;
      }
      const streetId = selectedCodeIdFantoir.value;
      const street = selectedStreet.value?.value;

      const fromDate = new Date();

      switch (dpeFilterRange.value) {
        case '1m':
          fromDate.setMonth(fromDate.getMonth() - 1);
          break;
        case '3m':
          fromDate.setMonth(fromDate.getMonth() - 3);
          break;
        case '6m':
          fromDate.setMonth(fromDate.getMonth() - 6);
          break;
        case '1y':
          fromDate.setFullYear(fromDate.getFullYear() - 1);
          break;
      }

      const from = formatDateLocal(fromDate);

      const url =
        `https://data.ademe.fr/data-fair/api/v1/datasets/meg-83tjwtg8dyz4vv7h1dqe/lines` +
        `?code_insee_ban_eq=${encodeURIComponent(codeInsee)}` +
        `&date_etablissement_dpe_gte=${from}` +
        // `&sort=-date_etablissement_dpe` +
        `&select=_geopoint,adresse_ban,identifiant_ban,nom_rue_ban,type_batiment,etiquette_dpe,date_etablissement_dpe` +
        `&size=5000`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`DPE HTTP ${response.status}`);
      const json = await response.json();
      if (!isCurrent()) return;

      console.log('DPE FROM =', from);
      console.log('DPE COUNT =', json.results?.length ?? 0);

      if (!json.results) {
        dpePoints.value = [];
        return;
      }

      dpePoints.value = json.results
        .filter((r: IDpeResult) => r._geopoint && (!streetId || matchesDpeStreet(r, streetId, street)))
        .map((r: IDpeResult) => {
          const [lat, lon] = r._geopoint
            .split(',')
            .map((v: string) => Number(v.trim()));

          return {
            lat,
            lon,
            adresse: r.adresse_ban,
            etiquette: r.etiquette_dpe,
            type: r.type_batiment,
            date: r.date_etablissement_dpe,
          };
        })
        .filter((p: DpePoint) => !Number.isNaN(p.lat) && !Number.isNaN(p.lon));

      console.log('DPE commune', codeInsee, 'points =', dpePoints.value.length);
      cityCenter.value = computeCenter(dpePoints.value);
    } catch (e) {
      if (!isCurrent()) return;
      console.error('fetchDPE error', e);
      dpePoints.value = [];
    }
  }

  // ===========================
  // FILTRE CLIENT-SIDE : computed réactif
  // ===========================
const filteredAddresses = computed(() => {
  const mode = activeMainMode.value;
  const all = addresses.value;

  console.log(
    `[filteredAddresses] mode=${mode} total=${all.length} all=`,
    all
  );

  switch (mode) {
    case 'favorites':
      return propertyStore.favoriteAddresses;
    case 'estimations':
    case 'rappels':
      // Les données sont déjà filtrées par l’API.
      return all;

    case 'maj': {
      const now = Date.now();
      const range = majFilterRange.value;
      const cutoff = new Date(now);
      if (range === '7d' || range === '30d') {
        cutoff.setUTCDate(cutoff.getUTCDate() - (range === '7d' ? 7 : 30));
      } else {
        const day = cutoff.getUTCDate();
        cutoff.setUTCDate(1);
        cutoff.setUTCMonth(cutoff.getUTCMonth() - (range === '3m' ? 3 : 6));
        const lastDay = new Date(Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1, 0)).getUTCDate();
        cutoff.setUTCDate(Math.min(day, lastDay));
      }

      return all.filter(row => {
        if (!('date_maj' in row) || !row.date_maj) return false;
        const value = String(row.date_maj);
        const timestamp = Date.parse(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(value)
          ? value.replace(' ', 'T') + 'Z'
          : value);
        return timestamp > cutoff.getTime() && timestamp <= now;
      });
    }

    case 'dvf':
      return all.filter(a => {
        const dateVente = (a as any).date_derniere_vente;
        if (!dateVente) return false;

        const d = new Date(dateVente);
        if (Number.isNaN(d.getTime())) return false;

        const diffDays = (Date.now() - d.getTime()) / 86400000;

        switch (dvfFilterRange.value) {
          case '1y':
            return diffDays <= 365;
          case '2y':
            return diffDays <= 730;
          case '3y':
            return diffDays <= 1095;
          case '5y':
            return diffDays <= 1825;
          case 'since2020':
            return d.getTime() >= Date.UTC(2020, 0, 1) && diffDays >= 0;
          default:
            return true;
        }
      });

    default:
      return all;
  }
});
watch([progressScope, () => userStore.token], () => {
  progressSnapshot.value = null;
  void refreshProspectionProgress();
});
  // ===========================
  // RECHERCHE GEOGRAPHIQUE (toujours la même, quel que soit le mode)
  // ===========================
  async function querySearchAddress() {
    if (hasDirectAddressList.value || activeMainMode.value === 'dpe' || activeMainMode.value === 'dvf') return;
    dpePoints.value = [];

    const ownerName = selectedOwnerName.value.trim();
    const ownerAddressKey = activeMainMode.value === 'prospection' ? selectedOwnerAddressKey.value : null;

// Le mode favoris ne dépend pas de la ville ni de la rue.
if (
  activeMainMode.value !== 'favorites' &&
  isSameSearch(ownerName || null)
) {
  return;
}

    const currentVersion = ++searchVersion;

    try {
      isLoading.value = true;

      let results: (IAddressGrouped | IAddressDetail)[] = [];

      // ===========================
// FAVORIS SANS VILLE NI RUE
// ===========================
if (activeMainMode.value === 'favorites') {
  await propertyStore.loadFavoriteAddresses();
  results = propertyStore.favoriteAddresses;

  if (currentVersion !== searchVersion) return;

  finalizeSearch(results);
  return;
}



      // ===========================
      // PRIORITE 1 : PROPRIETAIRE
      // ===========================
      if (ownerName && !ownerAddressKey) {
        results = await PropertyService.getAddressesByOwner(ownerName, activeMainMode.value === 'prospection');
        if (currentVersion !== searchVersion) return;
        finalizeSearch(results, ownerName);
        return;
      }

      // ===========================
      // RECHERCHE GEOGRAPHIQUE
      // ===========================
    const isCityOnly =
  !!selectedCity.value &&
  !!selectedCodeInsee.value &&
  !selectedStreet.value &&
  !selectedNumero.value &&
  !selectedRep.value;

      if (isCityOnly) {
        results = await getGroupedCityAddresses(
          selectedCodeInsee.value,
          activeMainMode.value === 'prospection'
        );
      } else if (selectedCodeIdFantoir.value) {
        results = await PropertyService.getAddressesByFantoir(
          selectedCodeIdFantoir.value,
          'address',
          selectedNumero.value || undefined,
          selectedNumero.value ? selectedRep.value : undefined,
          activeMainMode.value === 'prospection',
          selectedCodeInsee.value
        );
      } else {
        // Pas assez de critères
        addresses.value = [];
        noResultsFound.value = false;
        return;
      }

      if (currentVersion !== searchVersion) return;
      if (ownerAddressKey && ownerAddressKey !== selectedOwnerAddressKey.value) return;
      if (ownerAddressKey && ownerAddressSelection.value) {
        const matchesByTarget = new Map<string, Map<number | null, IAddressDetail>>();
        for (const match of ownerAddressSelection.value.matches) {
          const target = getPersonalPropertyTarget(match);
          if (!target) continue;
          const key = personalPropertyKey(target);
          const matches = matchesByTarget.get(key) ?? new Map<number | null, IAddressDetail>();
          matches.set(match.id, match);
          matchesByTarget.set(key, matches);
        }
        results = results.filter(row => prospectionAddressKey(row) === ownerAddressKey).flatMap(row => {
          const target = getPersonalPropertyTarget(row);
          const key = target && personalPropertyKey(target);
          const matches = key ? matchesByTarget.get(key) : undefined;
          if (!matches || !key) return [row];
          matchesByTarget.delete(key);
          // The address endpoint may pick another shared fiche for the same bien.
          return [...matches.values()].map(match => 'id' in row && row.id === match.id ? row : match);
        });
        results.push(...[...matchesByTarget.values()].flatMap(matches => [...matches.values()]));
      }
      finalizeSearch(
        results,
        ownerAddressKey ? ownerName : null
      );

    } catch (error) {
      console.error('[querySearch] error:', error);
      if (currentVersion !== searchVersion) return;
      noResultsFound.value = true;
      addresses.value = [];
    } finally {
      if (currentVersion === searchVersion) {
        isLoading.value = false;
      }
    }
  }

async function querySearchEstimation() {
  const currentVersion = ++searchVersion;

  try {
    isLoading.value = true;

    const results = await PropertyService.getEstimationAddresses(viewType.value === 'table');

    if (currentVersion !== searchVersion || activeMainMode.value !== 'estimations') return;

    console.log('ESTIMATIONS API =', results);

    addresses.value = results;
    cityCenter.value = computeCenter(results);
    isDataLoaded.value = true;
    noResultsFound.value = results.length === 0;
  } catch (error) {
    if (currentVersion !== searchVersion || activeMainMode.value !== 'estimations') return;

    console.error('[querySearchEstimation] error:', error);

    addresses.value = [];
    cityCenter.value = null;
    noResultsFound.value = true;
  } finally {
    if (currentVersion === searchVersion) {
      isLoading.value = false;
    }
  }
}
async function querySearchRappel() {
  const currentVersion = ++searchVersion;
  const token = userStore.token;
  const scope = reminderAddressScope.value;
  const isCurrent = () => currentVersion === searchVersion && activeMainMode.value === 'rappels' &&
    token === userStore.token && scope === reminderAddressScope.value;

  try {
    isLoading.value = true;
    const [properties, reminders] = await Promise.all([
      PropertyService.getReminderAddresses(scope, viewType.value === 'table'),
      ReminderService.getRemindersByScope(scope === 'personal' ? 'me' : 'agency'),
    ]);
    if (!isCurrent()) return;

    const firstByProperty = new Map<number, string>();
    mapReminders.value = reminders.filter(reminder => !reminder.completed);
    for (const reminder of mapReminders.value) {
      const id = Number(reminder.property_id);
      const first = firstByProperty.get(id);
      if (!first || reminder.date < first) firstByProperty.set(id, reminder.date);
    }
    const results = properties.flatMap(property => {
      const date = firstByProperty.get(Number(property.id));
      return date ? [{ ...property, date_rappel: date }] : [];
    });

    addresses.value = results;
    cityCenter.value = computeCenter(results);
    isDataLoaded.value = true;
    noResultsFound.value = results.length === 0;
  } catch (error) {
    if (!isCurrent()) return;

    console.error('[querySearchRappel] error:', error);

    addresses.value = [];
    mapReminders.value = [];
    cityCenter.value = null;
    noResultsFound.value = true;
  } finally {
    if (currentVersion === searchVersion) {
      isLoading.value = false;
    }
  }
}

watch(reminderAddressScope, () => {
  if (activeMainMode.value !== 'rappels') return;
  addresses.value = [];
  mapReminders.value = [];
  void querySearchRappel();
});

watch(() => userStore.token, token => {
  if (activeMainMode.value !== 'rappels') return;
  searchVersion++;
  addresses.value = [];
  mapReminders.value = [];
  if (token) void querySearchRappel();
});


async function loadMajMode() {
  const version = ++searchVersion;
  const token = userStore.token;
  majRoleRequest?.abort();
  majPermissions.value = null;
  if (!token) return;

  const request = new AbortController();
  majRoleRequest = request;
  const isCurrent = () => version === searchVersion &&
    activeMainMode.value === 'maj' && token === userStore.token;
  isLoading.value = true;
  let role: string | undefined;
  try {
    role = await UserService.getAuthenticatedRole(request.signal);
  } catch (error) {
    if (isCurrent()) console.error('Vérification du périmètre MAJ', error);
  } finally {
    if (majRoleRequest === request) majRoleRequest = null;
  }
  if (!isCurrent()) return;

  majPermissions.value = { token, agency: role === 'agency_manager' || role === 'admin' };
  if (!canUseMajAgencyScope.value && majAddressScope.value === 'agency') {
    majAddressScope.value = 'personal';
    return;
  }
  await querySearchMaj();
}

async function querySearchMaj() {
  if (majAddressScope.value === 'agency' && !canUseMajAgencyScope.value) {
    majAddressScope.value = 'personal';
    return;
  }
  const version = ++searchVersion;
  const token = userStore.token;
  const scope = majAddressScope.value;
  const isCurrent = () => version === searchVersion && activeMainMode.value === 'maj' &&
    token === userStore.token && scope === majAddressScope.value;
  try {
    isLoading.value = true;

    const results = await PropertyService.getMajAddresses(scope, viewType.value === 'table');
    if (!isCurrent()) return;

    addresses.value = results;
    isDataLoaded.value = true;
  } catch (error) {
    if (!isCurrent()) return;
    if (scope === 'agency' && isAxiosError(error) && error.response?.status === 403) {
      majPermissions.value = { token, agency: false };
      majAddressScope.value = 'personal';
      return;
    }
    console.error('[querySearchMaj] error:', error);

    addresses.value = [];
  } finally {
    if (version === searchVersion) isLoading.value = false;
  }
}

watch([activeMainMode, viewType], ([mode, view], [previousMode, previousView]) => {
  if (mode !== previousMode || view !== 'table' || previousView === view) return;
  if (mode === 'estimations') void querySearchEstimation();
  if (mode === 'rappels') void querySearchRappel();
  if (mode === 'maj') void querySearchMaj();
});

watch(() => userStore.token, () => {
  majRoleRequest?.abort();
  majPermissions.value = null;
  majAddressScope.value = 'personal';
  reminderAddressScope.value = 'personal';
}, { flush: 'sync' });

watch(() => userStore.token, () => {
  if (activeMainMode.value !== 'maj') return;
  addresses.value = [];
  isLoading.value = false;
  isDataLoaded.value = false;
  void loadMajMode();
});

watch(majAddressScope, () => {
  if (activeMainMode.value !== 'maj') return;
  if (majPermissions.value?.token !== userStore.token) return;
  searchVersion++;
  addresses.value = [];
  isLoading.value = false;
  isDataLoaded.value = false;
  void querySearchMaj();
});

watch([activeMainMode, filteredAddresses], ([mode, rows]) => {
  if (mode === 'maj') noResultsFound.value = isDataLoaded.value && rows.length === 0;
});

  function toggleFavoritesFilter() {
    favoritesOnly.value = !favoritesOnly.value;
    querySearchAddress();
  }

  function updateAddress(property: IAddressDetail) {
    const ownerSelection = ownerAddressSelection.value;
    if (ownerSelection && property.id) {
      ownerAddressSelection.value = {
        ...ownerSelection,
        matches: ownerSelection.matches.map(row => row.id === property.id ? { ...row, ...property } : row),
      };
    }
    const exactIndex = ownerSelection && property.id ? addresses.value.findIndex(
      row => 'id' in row && Number(row.id) === Number(property.id)
    ) : -1;
    const index = exactIndex >= 0 ? exactIndex : addresses.value.findIndex(a => {
      const aId = Number((a as any).id || 0);
      const pId = Number((property as any).id || 0);

      // 1. Check strict via ID de BDD si le composant a été sauvegardé
      if (aId > 0 && pId > 0 && aId === pId) {
        return true;
      }

      if (
        !('id_fantoir_long' in a) ||
        a.id_fantoir_long !== property.id_fantoir_long
      ) {
        return false;
      }

      const propIsUnit =
        (property as any).row_type === 'unit' ||
        Number((property as any).unit_id || 0) > 0;
      const rowIsUnit =
        (a as any).row_type === 'unit' || Number((a as any).unit_id || 0) > 0;

      if (propIsUnit && rowIsUnit) {
        return (
          Number((a as any).unit_id || 0) ===
          Number((property as any).unit_id || 0)
        );
      } else if (!propIsUnit && !rowIsUnit) {
        return true;
      }

      return false;
    });
    console.log('updateAddress', {
      property,
      index,
      existing: addresses.value[index],
    });
    if (index !== -1) {
      addresses.value[index] = {
        ...addresses.value[index],
        ...property,
      };
    } else {
      addresses.value.push(property);
    }
    if (prospectionProgress.value) void refreshProspectionProgress();
  }

  function selectProspectionMapAddress(selection: ProspectionMapSelection) {
    if (activeMainMode.value !== 'prospection') return;
    const { addressKey, codeInsee, cityName, postalCode, streetKey, streetName, numero, rep } = selection;
    const ownerName = selectedOwnerName.value.trim();
    if (
      selectedCodeInsee.value === codeInsee && selectedCity.value &&
      selectedCodeIdFantoir.value === streetKey && selectedStreet.value &&
      selectedNumero.value === numero &&
      selectedRep.value === rep &&
      (!ownerName || selectedOwnerAddressKey.value === addressKey)
    ) return;

    const fromOwnerSearch = !!ownerName && lastSearchParams.value?.ownerName === ownerName &&
      !lastSearchParams.value.ownerAddressKey;
    searchVersion++;
    lastSearchParams.value = null;
    addresses.value = addresses.value.filter(row => prospectionAddressKey(row) === addressKey);
    const matches = fromOwnerSearch ? addresses.value.filter((row): row is IAddressDetail =>
      'owner' in row && typeof row.owner === 'string' && row.owner.trim() !== ''
    ) : [];
    if (selectedCodeInsee.value !== codeInsee || !selectedCity.value) {
      selectedCity.value = postalCode
        ? { city: cityName, value: postalCode, codeInsee }
        : { value: cityName, codeInsee };
      selectedCodeInsee.value = codeInsee;
    }
    if (selectedCodeIdFantoir.value !== streetKey || !selectedStreet.value) {
      selectedStreet.value = { value: streetName, idFantoir: streetKey };
      selectedCodeIdFantoir.value = streetKey;
    }
    selectedNumero.value = numero;
    selectedRep.value = rep;
    selectedNumeroFull.value = { numero, rep, value: [numero, rep].filter(Boolean).join(' ') };
    ownerAddressSelection.value = ownerName ? { ...selection, ownerName, matches } : null;
    debouncedSearch();
  }

function setSearchParams(
  city: SelectedCity | null,
  street: SelectedStreet | null,
  codeInsee: string,
  codeIdFantoir: string
) {
  selectedCity.value = city;
  selectedStreet.value = street;
  selectedCodeInsee.value = codeInsee;
  selectedCodeIdFantoir.value = codeIdFantoir;


}
  function clearSearchData() {
    geographicFilters.clear();
    cancelCityRecenter();
    ownerAddressSelection.value = null;
    selectedCity.value = null;
    selectedStreet.value = null;
    selectedCodeInsee.value = '';
    selectedCodeIdFantoir.value = '';
    selectedNumero.value = '';
    selectedRep.value = '';
    selectedNumeroFull.value = null;
    selectedOwnerName.value = '';
    if (isMapOnlyMode.value) viewType.value = preferredViewType.value;
    activeMainMode.value = 'prospection';
    dpeFilterRange.value = '3m';
    dvfFilterRange.value = 'all';
    addresses.value = [];
    dpePoints.value = [];
    dvfPoints.value = [];
    isDataLoaded.value = false;
    lastSearchParams.value = null;
    noResultsFound.value = false;
    showCustomPropertyDialog.value = false;
    majFilterRange.value = '30d';
    majAddressScope.value = 'personal';
    reminderAddressScope.value = 'personal';
    favoritesOnly.value = false;
  }

  async function createCustomProperty(
    propertyData: Partial<IAddressDetail> & {
      numero?: string;
      rep?: string;
      numero_appartement?: string;
    }
  ) {
    let id_fantoir_long = selectedCodeIdFantoir.value;

    if (propertyData.numero) id_fantoir_long += `_${propertyData.numero}`;
    if (propertyData.rep) id_fantoir_long += `_${propertyData.rep}`;
    if (propertyData.numero_appartement)
      id_fantoir_long += `_${propertyData.numero_appartement}`;

    const propertyWithFantoir = {
      ...propertyData,
      id_fantoir: selectedCodeIdFantoir.value,
      id_fantoir_long: id_fantoir_long,
    };

    const createdProperty = await PropertyService.createCustomProperty(
      propertyWithFantoir as any
    );

    await querySearchAddress();
    return createdProperty;
  }

  function openCustomPropertyDialog() {
    showCustomPropertyDialog.value = true;
  }

  function closeCustomPropertyDialog() {
    showCustomPropertyDialog.value = false;
  }

  return {
    // State
    selectedCity,
    selectedStreet,
    selectedCodeInsee,
    selectedCodeIdFantoir,
    addresses,
    cityCenter,
    viewType,
    isMapOnlyMode,
    selectDashboardView,
    propertyTableSorts,
    propertyTableSort,
    setPropertyTableSort,
    lastSearchParams,
    isDataLoaded,
    isLoading,
    showCustomPropertyDialog,
    noResultsFound,
    selectedNumero,
    selectedRep,
    selectedNumeroFull,
    dpePoints,
    dvfPoints,
    dvfSaleFocus,
    openPropertyDvfSale,
    dvfSearchError,
    markers,
    filterMode,
    selectedOwnerName,
    selectedOwnerAddressKey,
    activeMainMode,
    mapViewports,
    lastMapViewport,
    saveMapViewport,
    cityRecenter,
    requestCityRecenter,
    cancelCityRecenter,
    dpeFilterRange,
    dvfFilterRange,
    majFilterRange,
    majAddressScope,
    canUseMajAgencyScope,
    favoritesOnly,
    reminderAddressScope,
    mapReminders,
    hasDirectAddressList,

    // Computed
    filteredAddresses,
    prospectionProgress,
    selectProspectionMapAddress,
    refreshProspectionProgress,

    // Actions
    fetchDPE,
    fetchDVF,
    querySearchAddress,
    debouncedSearch,
    querySearchEstimation,
    querySearchRappel,
    querySearchMaj,
    updateAddress,
    setSearchParams,
    clearSearchData,
    createCustomProperty,
    openCustomPropertyDialog,
    closeCustomPropertyDialog,
    toggleFavoritesFilter,

    setMainMode,
  };
});
