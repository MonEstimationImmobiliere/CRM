// src/stores/dashboard.ts
import { defineStore } from 'pinia'
import { PropertyService } from '@/api/property.service'
import apiService from '@/api/apiRequests'
import type { IAddressGrouped, IAddressDetail } from '@/types/address'
import type { IDpeResult } from '@/types/dpe'

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

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    selectedCity: null as SelectedCity | null,
    selectedStreet: null as SelectedStreet | null,
    selectedCodeInsee: '',
    selectedCodeIdFantoir: '',
    addresses: [] as (IAddressGrouped | IAddressDetail)[],
    cityCenter: null as null | { lat: number; lon: number },
    viewType: 'table',
    lastSearchParams: null as SearchParams | null,
    isDataLoaded: false,
    showCustomPropertyDialog: false,
    noResultsFound: false,

    selectedNumero: "",
    selectedRep: "",
    selectedNumeroFull: null as SelectedNumeroFull | null,

    dpePoints: [] as DpePoint[],
  }),

  actions: {

    /* ---------------------------------------------
         🔥 CHARGEMENT DES DPE PAR CODE INSEE
    ---------------------------------------------- */
    async fetchDPE() {
      try {
        // Vérification code INSEE
        const codeInsee =
          this.selectedCodeInsee ||
          this.selectedCity?.codeInsee ||
          this.selectedCity?.code_insee;

        if (!codeInsee) {
          console.warn("Aucun code INSEE → pas de DPE.");
          this.dpePoints = [];
          return;
        }


        const to   = "2025-11-30"; // date de fin (exclusif)
        
        const from = "2025-11-01"; // date de début


     const url =
  `https://data.ademe.fr/data-fair/api/v1/datasets/meg-83tjwtg8dyz4vv7h1dqe/lines` +
  //`?code_insee_ban_eq=${codeInsee}` +
  `?code_departement_ban_eq=14` +
  `&date_etablissement_dpe_gte=${from}` +
  `&select=_geopoint,adresse_ban,type_batiment,etiquette_dpe,date_etablissement_dpe` +
  `&size=5000`;

  //const url = "https://data.ademe.fr/data-fair/api/v1/datasets/meg-83tjwtg8dyz4vv7h1dqe/lines?code_insee_ban_eq=14456&date_etablissement_dpe_gte=2025-11-01&select=_geopoint,adresse_ban,type_batiment,etiquette_dpe,date_etablissement_dpe&size=5000";

        console.log("🌍 URL DPE :", url);

        const response = await fetch(url);
        const json = await response.json();

        if (!json.results) {
          console.warn("⚠️ Aucun résultat DPE");
          this.dpePoints = [];
          return;
        }

        // Extraction des points
        this.dpePoints = json.results
          .filter((r: IDpeResult) => r._geopoint)
          .map((r: IDpeResult) => {
            const [lat, lon] = r._geopoint.split(",").map(Number);
            return {
              lat,
              lon,
              adresse: r.adresse_ban,
              etiquette: r.etiquette_dpe,
              type: r.type_batiment,
              date: r.date_etablissement_dpe,
            };
          });

        console.log("✅ DPE chargés :", this.dpePoints.length);

      } catch (error) {
        console.error("❌ Erreur fetch DPE :", error);
        this.dpePoints = [];
      }
    },


    /* ---------------------------------------------
         🔥 RECHERCHE PRINCIPALE
    ---------------------------------------------- */
   async querySearchAddress() {
  try {
    /* ------------------------------------------------
        🟦 0️⃣ CAS : UNIQUEMENT LA VILLE → ROUTE GROUPÉE
    ------------------------------------------------ */
    if (
      this.selectedCity &&
      !this.selectedStreet &&
      !this.selectedNumero &&
      !this.selectedRep
    ) {
      this.addresses =
        await PropertyService.getAddressesGroupedByCodeInsee(
          this.selectedCodeInsee
        );

      // 📍 Centrage carte
      if (this.addresses.length > 0) {
        const lats = this.addresses.map(a => Number(a.lat));
        const lons = this.addresses.map(a => Number(a.lon));

        this.cityCenter = {
          lat: lats.reduce((a, b) => a + b, 0) / lats.length,
          lon: lons.reduce((a, b) => a + b, 0) / lons.length,
        };
      } else {
        this.cityCenter = null;
      }

      this.lastSearchParams = {
        city: this.selectedCity,
        street: null,
        codeInsee: this.selectedCodeInsee,
        codeIdFantoir: null,
        numero: null,
        rep: null,
      };

      this.isDataLoaded = true;
      this.noResultsFound = this.addresses.length === 0;

      await this.fetchDPE();
      return; // ⛔ ON STOPPE ICI
    }

    /* ------------------------------------------------
        🟧 1️⃣ CAS RUE / NUMÉRO
    ------------------------------------------------ */

    // Impossible sans FANTOIR
    if (!this.selectedCodeIdFantoir) return;

    // 1. S'il y a un numéro → route numéro
    if (this.selectedNumero) {
      this.addresses = await PropertyService.getAddressesByNumero(
        this.selectedCodeIdFantoir,
        this.selectedNumero,
        this.selectedRep || undefined
      );
    }

    // 2. Rue seule → route SANS type (mode normal)
    else {
      this.addresses = await PropertyService.getAddressesByFantoir(
        this.selectedCodeIdFantoir,'adress'
      );
    }

    /* ------------------------------------------------
        📍 2️⃣ CENTRAGE CARTE
    ------------------------------------------------ */
    if (this.addresses.length > 0) {
      const lats = this.addresses.map(a => Number(a.lat));
      const lons = this.addresses.map(a => Number(a.lon));

      this.cityCenter = {
        lat: lats.reduce((a, b) => a + b, 0) / lats.length,
        lon: lons.reduce((a, b) => a + b, 0) / lons.length,
      };
    } else {
      this.cityCenter = null;
    }

    /* ------------------------------------------------
        📝 3️⃣ SAVE PARAMS
    ------------------------------------------------ */
    this.lastSearchParams = {
      city: this.selectedCity,
      street: this.selectedStreet,
      codeInsee: this.selectedCodeInsee,
      codeIdFantoir: this.selectedCodeIdFantoir,
      numero: this.selectedNumero,
      rep: this.selectedRep,
    };

    this.isDataLoaded = true;
    this.noResultsFound = this.addresses.length === 0;

    /* ------------------------------------------------
        🔥 4️⃣ LOAD DPE
    ------------------------------------------------ */
    await this.fetchDPE();

  } catch (error) {
    console.error("❌ Error fetching addresses:", error);
    this.noResultsFound = true;
  }
}
,



    /* ---------------------------------------------
         MODES SPÉCIAUX
    ---------------------------------------------- */
    async querySearchEstimation() {
      if (!this.selectedCodeIdFantoir) return
      
      try {
        this.addresses = await PropertyService.getAddressesByFantoir(
          this.selectedCodeIdFantoir, 
          'estimation'
        )
        this.isDataLoaded = true
      } catch (error) {
        console.error('Error fetching estimations:', error)
      }
    },

    async querySearchRappel() {
      if (!this.selectedCodeIdFantoir) return
      
      try {
        this.addresses = await PropertyService.getAddressesByFantoir(
          this.selectedCodeIdFantoir, 
          'rappel'
        )
        this.isDataLoaded = true
      } catch (error) {
        console.error('Error fetching rappel:', error)
      }
    },

    async querySearchMaj() {
      if (!this.selectedCodeIdFantoir) return
      
      try {
        this.addresses = await PropertyService.getAddressesByFantoir(
          this.selectedCodeIdFantoir, 
          'maj'
        )
        this.isDataLoaded = true
      } catch (error) {
        console.error('Error fetching maj:', error)
      }
    },


    /* ---------------------------------------------
         UPDATE PROPERTY
    ---------------------------------------------- */
    updateAddress(property: IAddressDetail) {
      const index = this.addresses.findIndex(
        a => 'id_fantoir_long' in a && a.id_fantoir_long === property.id_fantoir_long
      );

      if (index !== -1) {
        this.addresses[index] = {
          ...this.addresses[index],
          ...property
        };
      } else {
        this.addresses.push(property);
      }
    },


    /* ---------------------------------------------
         PARAMÈTRES
    ---------------------------------------------- */
    setSearchParams(city: SelectedCity | null, street: SelectedStreet | null, codeInsee: string, codeIdFantoir: string) {
      this.selectedCity = city
      this.selectedStreet = street
      this.selectedCodeInsee = codeInsee
      this.selectedCodeIdFantoir = codeIdFantoir
    },

    clearSearchData() {
      this.selectedCity = null
      this.selectedStreet = null
      this.selectedCodeInsee = ''
      this.selectedCodeIdFantoir = ''
      this.addresses = []
      this.isDataLoaded = false
      this.lastSearchParams = null
      this.noResultsFound = false
      this.showCustomPropertyDialog = false
    },


    /* ---------------------------------------------
         CUSTOM PROPERTY
    ---------------------------------------------- */
    async createCustomProperty(propertyData: Partial<IAddressDetail> & { numero?: string; rep?: string; numero_appartement?: string }) {
      try {
        let id_fantoir_long = this.selectedCodeIdFantoir
        
        if (propertyData.numero) id_fantoir_long += `_${propertyData.numero}`
        if (propertyData.rep) id_fantoir_long += `_${propertyData.rep}`
        if (propertyData.numero_appartement)
          id_fantoir_long += `_${propertyData.numero_appartement}`
        
        const propertyWithFantoir = {
          ...propertyData,
          id_fantoir: this.selectedCodeIdFantoir,
          id_fantoir_long: id_fantoir_long
        }
        
        const createdProperty = await PropertyService.createCustomProperty(propertyWithFantoir as any)

        await this.querySearchAddress()

        return createdProperty
      } catch (error) {
        console.error('Error creating custom property:', error)
        throw error
      }
    }
  }
})
