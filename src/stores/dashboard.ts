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

  // --- Helpers ---

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

      const to = '2025-11-30';
      const from = '2025-11-01';

      const url =
        `https://data.ademe.fr/data-fair/api/v1/datasets/meg-83tjwtg8dyz4vv7h1dqe/lines` +
        `?code_departement_ban_eq=14` +
        `&date_etablissement_dpe_gte=${from}` +
        `&select=_geopoint,adresse_ban,type_batiment,etiquette_dpe,date_etablissement_dpe` +
        `&size=5000`;

      const response = await fetch(url);
      const json = await response.json();

      if (!json.results) {
        dpePoints.value = [];
        return;
      }

      dpePoints.value = json.results
        .filter((r: IDpeResult) => r._geopoint)
        .map((r: IDpeResult) => {
          const [lat, lon] = r._geopoint.split(',').map(Number);
          return {
            lat,
            lon,
            adresse: r.adresse_ban,
            etiquette: r.etiquette_dpe,
            type: r.type_batiment,
            date: r.date_etablissement_dpe,
          };
        });
    } catch {
      dpePoints.value = [];
    }
  }

  async function querySearchAddress() {
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
      };

      isDataLoaded.value = true;
      noResultsFound.value = addresses.value.length === 0;
      return;
    }

    // ===========================
    // PRIORITE 2 : RECHERCHE CLASSIQUE
    // ===========================
    // CAS : UNIQUEMENT LA VILLE → ROUTE GROUPÉE
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
      };

      isDataLoaded.value = true;
      noResultsFound.value = addresses.value.length === 0;

      await fetchDPE();
      return;
    }

    // CAS RUE / NUMÉRO — Impossible sans FANTOIR
    if (!selectedCodeIdFantoir.value) {
      addresses.value = [];
      noResultsFound.value = false;
      return;
    }

    if (selectedNumero.value) {
      addresses.value = await PropertyService.getAddressesByNumero(
        selectedCodeIdFantoir.value,
        selectedNumero.value,
        selectedRep.value || undefined
      );
    } else {
      addresses.value = await PropertyService.getAddressesByFantoir(
        selectedCodeIdFantoir.value,
        'adress'
      );
    }

    cityCenter.value = computeCenter(addresses.value);

    lastSearchParams.value = {
      city: selectedCity.value,
      street: selectedStreet.value,
      codeInsee: selectedCodeInsee.value,
      codeIdFantoir: selectedCodeIdFantoir.value,
      numero: selectedNumero.value,
      rep: selectedRep.value,
      ownerName: null,
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
      'estimation'
    );
    isDataLoaded.value = true;
  }

  async function querySearchRappel() {
    if (!selectedCodeIdFantoir.value) return;
    addresses.value = await PropertyService.getAddressesByFantoir(
      selectedCodeIdFantoir.value,
      'rappel'
    );
    isDataLoaded.value = true;
  }

  async function querySearchMaj() {
    if (!selectedCodeIdFantoir.value) return;
    addresses.value = await PropertyService.getAddressesByFantoir(
      selectedCodeIdFantoir.value,
      'maj'
    );
    isDataLoaded.value = true;
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
  addresses.value = [];
  isDataLoaded.value = false;
  lastSearchParams.value = null;
  noResultsFound.value = false;
  showCustomPropertyDialog.value = false;
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
  };
});
