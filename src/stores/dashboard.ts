// src/stores/dashboard.ts
import { defineStore } from 'pinia';
import { ref, computed, watch  } from 'vue';
import { PropertyService } from '@/api/property.service';
import { useRemindersStore } from '@/stores/reminders';
import type { IAddressGrouped, IAddressDetail } from '@/types/address';
import type { IDpeResult } from '@/types/dpe';
import type { IDvfPoint } from '@/types/dvf';
import { DvfService } from '@/api/dvf.service';

/**
 * Interface pour une ville sélectionnée
 */
interface SelectedCity {
  value: string;
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

export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const selectedCity = ref<SelectedCity | null>(null);
  const selectedStreet = ref<SelectedStreet | null>(null);
  const selectedCodeInsee = ref('');
  const selectedCodeIdFantoir = ref('');
  const addresses = ref<(IAddressGrouped | IAddressDetail)[]>([]);
  const cityCenter = ref<{ lat: number; lon: number } | null>(null);
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

  const parcellesGeojson = ref<GeoJSON.FeatureCollection>({
  type: 'FeatureCollection',
  features: [],
});
  const markers = ref<Record<string, any>>({});
  const filterMode = ref<string | null>(null);
  const selectedOwnerName = ref('');
  const activeMainMode = ref<
    | 'prospection'
    | 'favorites'
    | 'estimations'
    | 'rappels'
    | 'maj'
    | 'dpe'
    | 'dvf'
  >('prospection');
  const dpeFilterRange = ref<'1m' | '3m' | '6m' | '1y'>('3m');
  const dvfFilterRange = ref<'1y' | '2y' | '3y' | '5y' | 'all'>('1y');
  const majFilterRange = ref<'7d' | '30d' | '3m' | '6m'>('30d');
  const favoritesOnly = ref(false);
  const favoritesScope = ref<'agency' | 'personal'>('agency');

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

  activeMainMode.value = mode;

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
    await querySearchMaj();
    return;
  }

  if (mode === 'dpe') {
    viewType.value = 'map';
    await fetchDPE();
    return;
  }

  if (mode === 'dvf') {
    viewType.value = 'map';
    await fetchDVF();
    await fetchParcelles();
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
  async (newCodeInsee, oldCodeInsee) => {
    if (newCodeInsee === oldCodeInsee) return;

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

      case 'estimations':
        await querySearchEstimation();
        return;

      case 'rappels':
        await querySearchRappel();
        return;

      case 'maj':
        await querySearchMaj();
        return;

      case 'dpe':
        await fetchDPE();
        return;

      case 'dvf':
        await fetchDVF();
        await fetchParcelles();
        return;

      case 'prospection':
      default:
        debouncedSearch();
        return;
    }
  }
);

  /** Calcule le centre géographique d'une liste d'adresses */
  function computeCenter(addressList: (IAddressGrouped | IAddressDetail)[]) {
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

  // --- Actions ---10
async function fetchDVF() {
  try {
    const codeInsee =
      selectedCodeInsee.value ||
      selectedCity.value?.codeInsee ||
      selectedCity.value?.code_insee;

    const idFantoir = selectedCodeIdFantoir.value || null;

    if (!codeInsee) {
      dvfPoints.value = [];
      return;
    }

    const json = await DvfService.getDVF(
      codeInsee,
      dvfFilterRange.value,
      idFantoir
    );

    let historical: any[] = [];

    if (dvfFilterRange.value === 'all') {
      historical = await DvfService.getHistorical(codeInsee);
    }

    const mergedJson = [
      ...(json || []),
      ...(historical || []),
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

    await fetchParcelles();
  } catch (e) {
    console.error('fetchDVF error', e);
    dvfPoints.value = [];
  }
}


async function fetchParcelles() {

  try {
    const codeInsee =
      selectedCodeInsee.value ||
      selectedCity.value?.codeInsee ||
      selectedCity.value?.code_insee;

    if (!codeInsee) {
      parcellesGeojson.value = {
        type: 'FeatureCollection',
        features: [],
      };
      return;
    }


parcellesGeojson.value = await DvfService.getParcelles(codeInsee);



  } catch (e) {
    console.error('fetchParcelles error', e);
    parcellesGeojson.value = {
      type: 'FeatureCollection',
      features: [],
    };
  }
}

  async function fetchDPE() {
    try {
      const codeInsee =
        selectedCodeInsee.value ||
        selectedCity.value?.codeInsee ||
        selectedCity.value?.code_insee;

      if (!codeInsee) {
        dpePoints.value = [];
        return;
      }

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
        `&select=_geopoint,adresse_ban,type_batiment,etiquette_dpe,date_etablissement_dpe` +
        `&size=5000`;

      const response = await fetch(url);
      const json = await response.json();

      console.log('DPE FROM =', from);
      console.log('DPE COUNT =', json.results?.length ?? 0);

      if (!json.results) {
        dpePoints.value = [];
        return;
      }

      dpePoints.value = json.results
        .filter((r: IDpeResult) => r._geopoint)
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
    } catch (e) {
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
    case 'estimations':
    case 'rappels':
    case 'maj':
      // Les données sont déjà filtrées par l’API.
      return all;

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
          default:
            return true;
        }
      });

    default:
      return all;
  }
});
  // ===========================
  // RECHERCHE GEOGRAPHIQUE (toujours la même, quel que soit le mode)
  // ===========================
  async function querySearchAddress() {
    if (activeMainMode.value !== 'dpe') {
      dpePoints.value = [];
    }

if (activeMainMode.value === 'dvf') {
  await fetchDVF();
  await fetchParcelles();
}

    const ownerName = selectedOwnerName.value.trim();

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
  results = await PropertyService.getFavoriteAddresses(
    favoritesScope.value
  );

  console.log("FAVORITES API =", results);

  if (currentVersion !== searchVersion) return;

  finalizeSearch(results);
  return;
}



      // ===========================
      // PRIORITE 1 : PROPRIETAIRE
      // ===========================
      if (ownerName) {
        results = await PropertyService.getAddressesByOwner(ownerName);
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
        results = await PropertyService.getAddressesGroupedByCodeInsee(
          selectedCodeInsee.value
        );
      } else if (selectedCodeIdFantoir.value) {
        results = await PropertyService.getAddressesByFantoir(
          selectedCodeIdFantoir.value,
          'address',
          selectedNumero.value || undefined,
          selectedRep.value || undefined
        );
      } else {
        // Pas assez de critères
        addresses.value = [];
        noResultsFound.value = false;
        return;
      }

      if (currentVersion !== searchVersion) return;
      finalizeSearch(results);

      // Fetch DPE si on est en mode DPE
      if (activeMainMode.value === 'dpe') {
        await fetchDPE();
      }

      if (activeMainMode.value === 'dvf') {
  await fetchDVF();
}
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

    const results = await PropertyService.getEstimationAddresses();

    if (currentVersion !== searchVersion) return;

    console.log('ESTIMATIONS API =', results);

    addresses.value = results;
    cityCenter.value = computeCenter(results);
    isDataLoaded.value = true;
    noResultsFound.value = results.length === 0;
  } catch (error) {
    if (currentVersion !== searchVersion) return;

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

  try {
    isLoading.value = true;

    const results = await PropertyService.getReminderAddresses(
      favoritesScope.value
    );

    if (currentVersion !== searchVersion) return;

    console.log('RAPPELS API =', results);

    addresses.value = results;
    cityCenter.value = computeCenter(results);
    isDataLoaded.value = true;
    noResultsFound.value = results.length === 0;
  } catch (error) {
    if (currentVersion !== searchVersion) return;

    console.error('[querySearchRappel] error:', error);

    addresses.value = [];
    cityCenter.value = null;
    noResultsFound.value = true;
  } finally {
    if (currentVersion === searchVersion) {
      isLoading.value = false;
    }
  }
}


async function querySearchMaj() {
  try {
    isLoading.value = true;

    addresses.value = await PropertyService.getMajAddresses(
      favoritesScope.value
    );

    console.log("MAJ =", addresses.value.length);
console.log(addresses.value[0]);

    isDataLoaded.value = true;
    noResultsFound.value = addresses.value.length === 0;
  } catch (error) {
    console.error('[querySearchMaj] error:', error);

    addresses.value = [];
    noResultsFound.value = true;
  } finally {
    isLoading.value = false;
  }
}

  function toggleFavoritesFilter() {
    favoritesOnly.value = !favoritesOnly.value;
    querySearchAddress();
  }

  function updateAddress(property: IAddressDetail) {
    const index = addresses.value.findIndex(a => {
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
    selectedCity.value = null;
    selectedStreet.value = null;
    selectedCodeInsee.value = '';
    selectedCodeIdFantoir.value = '';
    selectedNumero.value = '';
    selectedRep.value = '';
    selectedNumeroFull.value = null;
    selectedOwnerName.value = '';
    activeMainMode.value = 'prospection';
    dpeFilterRange.value = '3m';
    dvfFilterRange.value = '1y';
    addresses.value = [];
    dpePoints.value = [];
    dvfPoints.value = [];
    parcellesGeojson.value = {
  type: 'FeatureCollection',
  features: [],
};
    isDataLoaded.value = false;
    lastSearchParams.value = null;
    noResultsFound.value = false;
    showCustomPropertyDialog.value = false;
    majFilterRange.value = '30d';
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
    markers,
    filterMode,
    selectedOwnerName,
    activeMainMode,
    dpeFilterRange,
    dvfFilterRange,
    majFilterRange,
    favoritesOnly,
    favoritesScope,

    // Computed
    filteredAddresses,
    parcellesGeojson,

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
    fetchParcelles,
  };
});
