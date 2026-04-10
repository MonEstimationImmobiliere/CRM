// src/stores/dashboard.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { PropertyService } from '@/api/property.service';
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
  activeMainMode:
    | 'prospection'
    | 'favorites'
    | 'estimations'
    | 'rappels'
    | 'dpe'
    | 'dvf';
  majFilterRange?: '7d' | '30d' | '3m' | '6m';
  dpeFilterRange?: '1m' | '3m' | '6m' | '1y';
  dvfFilterRange?: '1y' | '2y' | '3y' | '5y';
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
    'prospection' | 'favorites' | 'estimations' | 'rappels' | 'maj' | 'dpe' | 'dvf'
  >('prospection');
  const dpeFilterRange = ref<'1m' | '3m' | '6m' | '1y'>('3m');
  const dvfFilterRange = ref<'1y' | '2y' | '3y' | '5y'>('1y');
  const majFilterRange = ref<'7d' | '30d' | '3m' | '6m'>('30d');




  // --- Helpers ---

  function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function setMainMode(
  mode: 'prospection' | 'favorites' | 'estimations' | 'rappels' | 'maj' | 'dpe' | 'dvf'
) {

  if (activeMainMode.value === mode) return;

  activeMainMode.value = mode;

    if (mode === 'dpe') {
    viewType.value = 'map';
  }

  querySearchAddress();
}

  /** Calcule le centre géographique d'une liste d'adresses */
  function computeCenter(addressList: (IAddressGrouped | IAddressDetail)[]) {
    if (addressList.length === 0) return null;
    const lats = addressList.map(a => Number(a.lat));
    const lons = addressList.map(a => Number(a.lon));
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
  `&sort=-date_etablissement_dpe` +
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

async function querySearchAddress() {
  if (activeMainMode.value !== 'dpe') {
  dpePoints.value = [];
}

  try {
    isLoading.value = true;

    const ownerName = selectedOwnerName.value.trim();

    // ===========================
    // PRIORITE 1 : PROPRIETAIRE
    // ===========================
    if (ownerName) {
      addresses.value = await PropertyService.getAddressesByOwner(ownerName);

      cityCenter.value = computeCenter(addresses.value);

      lastSearchParams.value = {
        city: selectedCity.value,
        street: selectedStreet.value,
        codeInsee: selectedCodeInsee.value,
        codeIdFantoir: selectedCodeIdFantoir.value || null,
        numero: selectedNumero.value || null,
        rep: selectedRep.value || null,
        ownerName,
        activeMainMode: activeMainMode.value,
        dpeFilterRange: dpeFilterRange.value,
        dvfFilterRange: dvfFilterRange.value,
      };

      isDataLoaded.value = true;
      noResultsFound.value = addresses.value.length === 0;
      return;
    }

    // ===========================
    // PRIORITE 2 : MODES GLOBAUX
    // ===========================
    if (activeMainMode.value === 'favorites') {
      addresses.value = await PropertyService.getFavoriteAddresses();

      cityCenter.value = computeCenter(addresses.value);

      lastSearchParams.value = {
        city: selectedCity.value,
        street: selectedStreet.value,
        codeInsee: selectedCodeInsee.value,
        codeIdFantoir: selectedCodeIdFantoir.value || null,
        numero: selectedNumero.value || null,
        rep: selectedRep.value || null,
        ownerName: null,
        activeMainMode: activeMainMode.value,
        dpeFilterRange: dpeFilterRange.value,
        dvfFilterRange: dvfFilterRange.value,
      };

      isDataLoaded.value = true;
      noResultsFound.value = addresses.value.length === 0;
      return;
    }

    if (activeMainMode.value === 'estimations') {
      addresses.value = await PropertyService.getEstimationAddresses();

      cityCenter.value = computeCenter(addresses.value);

      lastSearchParams.value = {
        city: selectedCity.value,
        street: selectedStreet.value,
        codeInsee: selectedCodeInsee.value,
        codeIdFantoir: selectedCodeIdFantoir.value || null,
        numero: selectedNumero.value || null,
        rep: selectedRep.value || null,
        ownerName: null,
        activeMainMode: activeMainMode.value,
        dpeFilterRange: dpeFilterRange.value,
        dvfFilterRange: dvfFilterRange.value,
      };

      isDataLoaded.value = true;
      noResultsFound.value = addresses.value.length === 0;
      return;
    }

    if (activeMainMode.value === 'rappels') {
      addresses.value = await PropertyService.getReminderAddresses();

      cityCenter.value = computeCenter(addresses.value);

      lastSearchParams.value = {
        city: selectedCity.value,
        street: selectedStreet.value,
        codeInsee: selectedCodeInsee.value,
        codeIdFantoir: selectedCodeIdFantoir.value || null,
        numero: selectedNumero.value || null,
        rep: selectedRep.value || null,
        ownerName: null,
        activeMainMode: activeMainMode.value,
        dpeFilterRange: dpeFilterRange.value,
        dvfFilterRange: dvfFilterRange.value,
      };

      isDataLoaded.value = true;
      noResultsFound.value = addresses.value.length === 0;
      return;
    }

    if (activeMainMode.value === 'maj') {
  addresses.value = await PropertyService.getMajAddresses(majFilterRange.value);

  cityCenter.value = computeCenter(addresses.value);

  lastSearchParams.value = {
    city: selectedCity.value,
    street: selectedStreet.value,
    codeInsee: selectedCodeInsee.value,
    codeIdFantoir: selectedCodeIdFantoir.value || null,
    numero: selectedNumero.value || null,
    rep: selectedRep.value || null,
    ownerName: null,
    activeMainMode: activeMainMode.value,
    majFilterRange: majFilterRange.value,
    dpeFilterRange: dpeFilterRange.value,
    dvfFilterRange: dvfFilterRange.value,
  };

  isDataLoaded.value = true;
  noResultsFound.value = addresses.value.length === 0;
  return;
}

    // ===========================
    // MODE DPE : garde recherche normale + points DPE filtrés
    // ===========================
    if (activeMainMode.value === 'dpe') {
      if (
        selectedCity.value &&
        !selectedStreet.value &&
        !selectedNumero.value &&
        !selectedRep.value
      ) {
        addresses.value = await PropertyService.getAddressesGroupedByCodeInsee(
          selectedCodeInsee.value
        );
      } else if (selectedCodeIdFantoir.value) {
        addresses.value = await PropertyService.getAddressesByFantoir(
          selectedCodeIdFantoir.value,
          'address',
          selectedNumero.value || undefined,
          selectedRep.value || undefined
        );
      } else {
        addresses.value = [];
      }

      cityCenter.value = computeCenter(addresses.value);

      lastSearchParams.value = {
        city: selectedCity.value,
        street: selectedStreet.value,
        codeInsee: selectedCodeInsee.value,
        codeIdFantoir: selectedCodeIdFantoir.value || null,
        numero: selectedNumero.value || null,
        rep: selectedRep.value || null,
        ownerName: null,
        activeMainMode: activeMainMode.value,
        dpeFilterRange: dpeFilterRange.value,
        dvfFilterRange: dvfFilterRange.value,
      };

      isDataLoaded.value = true;
      noResultsFound.value = addresses.value.length === 0;

      await fetchDPE();
      return;
    }

    // ===========================
    // MODE DVF : à brancher ensuite
    // ===========================
    if (activeMainMode.value === 'dvf') {
      addresses.value = await PropertyService.getDvfAddresses(dvfFilterRange.value);

      cityCenter.value = computeCenter(addresses.value);

      lastSearchParams.value = {
        city: selectedCity.value,
        street: selectedStreet.value,
        codeInsee: selectedCodeInsee.value,
        codeIdFantoir: selectedCodeIdFantoir.value || null,
        numero: selectedNumero.value || null,
        rep: selectedRep.value || null,
        ownerName: null,
        activeMainMode: activeMainMode.value,
        dpeFilterRange: dpeFilterRange.value,
        dvfFilterRange: dvfFilterRange.value,
      };

      isDataLoaded.value = true;
      noResultsFound.value = addresses.value.length === 0;
      return;
    }

    // ===========================
    // PROSPECTION / RECHERCHE CLASSIQUE
    // ===========================
    if (
      selectedCity.value &&
      !selectedStreet.value &&
      !selectedNumero.value &&
      !selectedRep.value
    ) {
      addresses.value = await PropertyService.getAddressesGroupedByCodeInsee(
        selectedCodeInsee.value
      );

      cityCenter.value = computeCenter(addresses.value);

      lastSearchParams.value = {
        city: selectedCity.value,
        street: null,
        codeInsee: selectedCodeInsee.value,
        codeIdFantoir: null,
        numero: null,
        rep: null,
        ownerName: null,
        activeMainMode: activeMainMode.value,
        dpeFilterRange: dpeFilterRange.value,
        dvfFilterRange: dvfFilterRange.value,
      };

      isDataLoaded.value = true;
      noResultsFound.value = addresses.value.length === 0;

      await fetchDPE();
      return;
    }

    if (!selectedCodeIdFantoir.value) {
      addresses.value = [];
      noResultsFound.value = false;
      return;
    }

    addresses.value = await PropertyService.getAddressesByFantoir(
      selectedCodeIdFantoir.value,
      'address',
      selectedNumero.value || undefined,
      selectedRep.value || undefined
    );

    cityCenter.value = computeCenter(addresses.value);

    lastSearchParams.value = {
      city: selectedCity.value,
      street: selectedStreet.value,
      codeInsee: selectedCodeInsee.value,
      codeIdFantoir: selectedCodeIdFantoir.value,
      numero: selectedNumero.value,
      rep: selectedRep.value,
      ownerName: null,
      activeMainMode: activeMainMode.value,
      dpeFilterRange: dpeFilterRange.value,
      dvfFilterRange: dvfFilterRange.value,
    };

    isDataLoaded.value = true;
    noResultsFound.value = addresses.value.length === 0;

    await fetchDPE();
  } catch {
    noResultsFound.value = true;
    addresses.value = [];
  } finally {
    isLoading.value = false;
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
    const index = addresses.value.findIndex(
      a =>
        'id_fantoir_long' in a && a.id_fantoir_long === property.id_fantoir_long
    );

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


    // Actions
    fetchDPE,
    querySearchAddress,
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
