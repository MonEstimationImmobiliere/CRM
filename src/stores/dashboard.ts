// src/stores/dashboard.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { PropertyService } from '@/api/property.service';
import { useRemindersStore } from '@/stores/reminders';
import type { IAddressGrouped, IAddressDetail } from '@/types/address';
import type { IDpeResult } from '@/types/dpe';

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
  const dvfFilterRange = ref<'1y' | '2y' | '3y' | '5y'>('1y');
  const majFilterRange = ref<'7d' | '30d' | '3m' | '6m'>('30d');
  const favoritesOnly = ref(false);

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

  function setMainMode(
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

    if (mode === 'dpe') {
      viewType.value = 'map';
      fetchDPE();
    }

    // Les modes sont des filtres client-side sur les adresses déjà chargées
    // → pas d'appel API, filteredAddresses computed gère le filtrage
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

  // --- Actions ---

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
        return all.filter(a => {
          const fav = (a as any).favorite;
          return Number(fav) === 1 || fav === true;
        });

      case 'estimations':
        return all.filter(a => {
          const price = (a as any).price ?? (a as any).dernier_prix_estime;
          return price != null && Number(price) > 0;
        });

      case 'rappels': {
        const reminderStore = useRemindersStore();
        const allReminders = [
          ...reminderStore.reminders,
          ...reminderStore.agencyReminders,
        ];
        const reminderIds = new Set(
          allReminders.map(r => Number(r.property_id))
        );

        return all.filter(a => {
          const id = Number((a as any).id);
          return id > 0 && reminderIds.has(id);
        });
      }

      case 'maj':
        return all.filter(a => {
          const dateMaj = (a as any).date_maj;
          if (!dateMaj) return false;
          const d = new Date(dateMaj);
          if (Number.isNaN(d.getTime())) return false;
          const diffDays = (Date.now() - d.getTime()) / 86400000;
          switch (majFilterRange.value) {
            case '7d':
              return diffDays <= 7;
            case '30d':
              return diffDays <= 30;
            case '3m':
              return diffDays <= 90;
            case '6m':
              return diffDays <= 180;
            default:
              return true;
          }
        });

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

      // prospection, dpe : pas de filtrage
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

    const ownerName = selectedOwnerName.value.trim();

    // Skip si les paramètres géographiques n'ont pas changé
    if (isSameSearch(ownerName || null)) {
      return;
    }

    const currentVersion = ++searchVersion;

    try {
      isLoading.value = true;

      let results: (IAddressGrouped | IAddressDetail)[] = [];

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
        selectedCity.value &&
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
    if (!selectedCodeIdFantoir.value) return;
    addresses.value = await PropertyService.getAddressesByFantoir(
      selectedCodeIdFantoir.value,
      'estimation',
      selectedNumero.value || undefined,
      selectedRep.value || undefined
    );
    isDataLoaded.value = true;
  }

  async function querySearchRappel() {
    if (!selectedCodeIdFantoir.value) return;
    addresses.value = await PropertyService.getAddressesByFantoir(
      selectedCodeIdFantoir.value,
      'rappel',
      selectedNumero.value || undefined,
      selectedRep.value || undefined
    );
    isDataLoaded.value = true;
  }

  async function querySearchMaj() {
    if (!selectedCodeIdFantoir.value) return;
    addresses.value = await PropertyService.getAddressesByFantoir(
      selectedCodeIdFantoir.value,
      'maj',
      selectedNumero.value || undefined,
      selectedRep.value || undefined
    );
    isDataLoaded.value = true;
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
    markers,
    filterMode,
    selectedOwnerName,
    activeMainMode,
    dpeFilterRange,
    dvfFilterRange,
    majFilterRange,
    favoritesOnly,

    // Computed
    filteredAddresses,

    // Actions
    fetchDPE,
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
