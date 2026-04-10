<template>
  <section class="block dashboardContainer">


<div class="headerFilterInfoContainer">
  <!-- LIGNE 1 -->
  <div class="headerTopRow">
    <div class="autoCompleteContainer">
      <CityAutocomplete
        v-model="selectedCity"
        @select="handleCitySelect"
        @clear="handleCityClear"
      />

      <StreetAutocomplete
        v-model="selectedStreet"
        :code-insee="selectedCodeInsee"
        @select="handleStreetSelect"
        @clear="handleStreetClear"
      />

      <NumeroAutocomplete
        v-model="selectedNumeroFull"
        :id-fantoir="selectedCodeIdFantoir"
        @select="handleNumeroSelect"
        @clear="handleNumeroClear"
      />
    </div>

    <div class="headerRightContainer">
      <div class="ownerSearchContainer">
        <el-input
          v-model="selectedOwnerName"
          clearable
          placeholder="Nom du propriétaire"
          @keyup.enter="dashboardStore.querySearchAddress()"
        />
      </div>

      <ViewToggle v-model="viewType" :options="viewOptions" />
    </div>
  </div>

  <!-- LIGNE 2 -->
<div class="headerBottomRow">
<div class="modeBar">

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

  <div class="modeWithFilter">
  <button
    class="modePill"
    :class="{ active: dashboardStore.activeMainMode === 'maj' }"
    @click="dashboardStore.setMainMode('maj')"
  >
    <span class="modeDot maj"></span>
    MAJ
  </button>

  <el-select
    v-if="dashboardStore.activeMainMode === 'maj'"
    v-model="dashboardStore.majFilterRange"
    size="small"
    class="modeSelect"
    @change="dashboardStore.querySearchAddress()"
  >
    <el-option label="< 7 jours" value="7d" />
    <el-option label="< 30 jours" value="30d" />
    <el-option label="< 3 mois" value="3m" />
    <el-option label="< 6 mois" value="6m" />
  </el-select>
</div>


  <!-- DPE -->
  <div class="modeWithFilter">
    <button
      class="modePill"
      :class="{ active: dashboardStore.activeMainMode === 'dpe' }"
      @click="dashboardStore.setMainMode('dpe')"
    >
      <span class="modeDot dpe"></span>
      DPE
    </button>

    <el-select
      v-if="dashboardStore.activeMainMode === 'dpe'"
      v-model="dashboardStore.dpeFilterRange"
      size="small"
      class="modeSelect"
      @change="dashboardStore.querySearchAddress()"
    >
      <el-option label="< 1 mois" value="1m" />
      <el-option label="< 3 mois" value="3m" />
      <el-option label="< 6 mois" value="6m" />
      <el-option label="< 1 an" value="1y" />
    </el-select>
  </div>


  <!-- DVF -->
  <div class="modeWithFilter">
    <button
      class="modePill"
      :class="{ active: dashboardStore.activeMainMode === 'dvf' }"
      @click="dashboardStore.setMainMode('dvf')"
    >
      <span class="modeDot dvf"></span>
      DVF
    </button>

    <el-select
      v-if="dashboardStore.activeMainMode === 'dvf'"
      v-model="dashboardStore.dvfFilterRange"
      size="small"
      class="modeSelect"
      @change="dashboardStore.querySearchAddress()"
    >
      <el-option label="< 1 an" value="1y" />
      <el-option label="< 2 ans" value="2y" />
      <el-option label="< 3 ans" value="3y" />
      <el-option label="< 5 ans" value="5y" />
    </el-select>
  </div>

</div>
</div>

  </div>


    <!-- TABLE DES ADRESSES -->
    <div
      v-if="viewType === 'table'"
      v-loading="isLoading"
      element-loading-text="Chargement des adresses..."
      element-loading-background="rgba(255, 255, 255, 0.8)"
      :style="{ minHeight: isLoading ? '200px' : 'auto' }"
    >
      <PropertyTable
        v-if="addresses.length > 0"
        :addresses="addresses"
        :city-only="isCityOnly"
        @edit-property="handleEditProperty"
        @select-street="handleGroupedStreetClick"
        @select-numero="handleTableNumeroClick"
      />
    </div>

    <!-- MODE CARD -->
    <PropertyTableCard
      v-else-if="viewType === 'card' && addresses.length > 0"
      :addresses="addresses as IAddressDetail[]"
      @edit-property="openPropertyDialog"
    />

    <MapView
      v-show="viewType === 'map'"
      :addresses="addresses"
      :city-center="dashboardStore.cityCenter"
      :dpe-points="dashboardStore.dpePoints"
      @edit-property="openPropertyDialog"
    />

    <PropertyForm />
    <CreateCustomPropertyDialog />
  </section>
</template>

<script setup lang="ts">


/* ------------------------------------
      IMPORTS
------------------------------------ */
import { computed, onMounted, watch } from 'vue';
import { DataBoard, Grid, Location } from '@element-plus/icons-vue';
import ViewToggle from '@/components/ViewToggle.vue';

// Stores
import { usePropertyStore } from '@/stores/propertyHome';
import { useDashboardStore } from '@/stores/dashboard';
import type { IAddressDetail } from '@/types/address';

// Components
import CityAutocomplete from './DashboardComponents/Input/CityAutocomplete.vue';
import StreetAutocomplete from './DashboardComponents/Input/StreetAutocomplete.vue';
import NumeroAutocomplete from './DashboardComponents/Input/NumeroAutocomplete.vue';
import PropertyTable from './DashboardComponents/PropertyTable.vue';
import PropertyTableCard from './DashboardComponents/PropertyTableCard.vue';
import PropertyForm from './DashboardComponents/PropertyDialog.vue';
import CreateCustomPropertyDialog from './DashboardComponents/CreateCustomPropertyDialog.vue';
import MapView from './DashboardComponents/MapView.vue';
import Button from '@/components/OwnReusableComponents/button/Button.vue';



/* ------------------------------------
      STORES
------------------------------------ */
const store = usePropertyStore();
const dashboardStore = useDashboardStore();

/* ------------------------------------
      WATCHERS AUTOMATIQUES
------------------------------------ */

// 🟦 Si la ville change → relancer la recherche (si ville non vide)
watch(
  () => dashboardStore.selectedCity,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      dashboardStore.querySearchAddress();
    }
  }
);

// 🟧 Si la rue change → relancer la recherche
watch(
  () => dashboardStore.selectedStreet,
  (newVal, oldVal) => {
    // Empêcher exécution si c'est juste une sélection identique
    if (newVal !== oldVal) {
      dashboardStore.querySearchAddress();
      // Si on vide la rue et qu'on est en mode card, revenir en mode table
      if (!newVal && dashboardStore.viewType === 'card') {
        dashboardStore.viewType = 'table';
      }
    }
  }
);

// 🟥 Si le numéro change → relancer la recherche
watch(
  () => dashboardStore.selectedNumeroFull,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      dashboardStore.querySearchAddress();
    }
  }
);

watch(
  () => dashboardStore.selectedCity,
  newCity => {
    if (!newCity) {
      // Ville supprimée → vider automatiquement
      dashboardStore.addresses = [];
      dashboardStore.cityCenter = null;
      dashboardStore.noResultsFound = false;
      dashboardStore.isDataLoaded = false;
      return;
    }

    // Sinon relancer la recherche automatique
    dashboardStore.querySearchAddress();
  }
);

let ownerSearchTimeout: ReturnType<typeof setTimeout> | null = null;

watch(
  () => dashboardStore.selectedOwnerName,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
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

const selectedOwnerName = computed({
  get: () => dashboardStore.selectedOwnerName,
  set: v => (dashboardStore.selectedOwnerName = v),
});

// --- Ville ---
const selectedCity = computed({
  get: () => dashboardStore.selectedCity,
  set: v => (dashboardStore.selectedCity = v),
});

// --- Rue ---
const selectedStreet = computed({
  get: () => dashboardStore.selectedStreet,
  set: v => (dashboardStore.selectedStreet = v),
});

// --- Code INSEE ---
const selectedCodeInsee = computed({
  get: () => dashboardStore.selectedCodeInsee,
  set: v => (dashboardStore.selectedCodeInsee = v),
});

// --- ID FANTOIR de la rue (nécessaire pour NuméroAutocomplete) ---
const selectedCodeIdFantoir = computed({
  get: () => dashboardStore.selectedCodeIdFantoir,
  set: v => (dashboardStore.selectedCodeIdFantoir = v),
});

// --- Numéro + rep (ex: "40 bis") ---
const selectedNumeroFull = computed({
  get: () => dashboardStore.selectedNumeroFull || undefined,

  set: v => {
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
  set: v => (dashboardStore.viewType = v),
});

// --- Résultats des adresses ---
const addresses = computed(() => dashboardStore.addresses);

// --- Loading ---
const isLoading = computed(() => dashboardStore.isLoading);

// --- Vérifier si seulement la ville est sélectionnée (pas de rue ni numéro) ---
const isCityOnly = computed(() => {
  return (
    dashboardStore.selectedCity !== null &&
    !dashboardStore.selectedStreet &&
    !dashboardStore.selectedNumeroFull
  );
});

/* ------------------------------------
      LIFECYCLE
------------------------------------ */
onMounted(() => {
  // Les données sont restaurées automatiquement depuis le store si déjà chargées
});

/* ------------------------------------
      HANDLERS
------------------------------------ */
const handleCitySelect = (city: { value: string; codeInsee?: string }) => {
  dashboardStore.selectedCity = city;
  dashboardStore.selectedCodeInsee = city.codeInsee || '';
};

const handleCityClear = () => {
  dashboardStore.selectedCity = null;
  dashboardStore.selectedStreet = null;
  dashboardStore.selectedCodeInsee = '';
  dashboardStore.selectedCodeIdFantoir = '';
  dashboardStore.selectedStreet = null;
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
  dashboardStore.selectedStreet = street;
  dashboardStore.selectedCodeIdFantoir = street.idFantoir || '';
  dashboardStore.selectedNumero = '';
  dashboardStore.selectedRep = '';
  dashboardStore.selectedNumeroFull = null;
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
  const street = {
    value: streetRow.nom_voie, // ⭐ CE QUE L'AUTOCOMPLETE AFFICHE
    idFantoir: streetRow.id_fantoir, // ⭐ CE DONT TU AS BESOIN POUR LA SUITE
  };

  // Mettre l’objet dans le v-model du StreetAutocomplete
  dashboardStore.selectedStreet = street;

  // Utilisation interne
  dashboardStore.selectedCodeIdFantoir = street.idFantoir;

  // Reset numéro
  dashboardStore.selectedNumero = '';
  dashboardStore.selectedRep = '';
  dashboardStore.selectedNumeroFull = null;

  // Lancer la recherche
  setTimeout(() => {
    dashboardStore.querySearchAddress();
  }, 10);
};

const handleTableNumeroClick = (row: {
  nom_voie: string;
  id_fantoir: string;
  numero: string;
  rep?: string;
}) => {
  // 1️⃣ REMPLIR LA RUE dans l'autocomplete
  dashboardStore.selectedStreet = {
    value: row.nom_voie,
    idFantoir: row.id_fantoir,
  };

  // 2️⃣ METTRE l’ID FANTOIR
  dashboardStore.selectedCodeIdFantoir = row.id_fantoir;

  // 3️⃣ CONSTRUIRE L’OBJET numeroFull
  const numeroFull = row.rep
    ? { numero: row.numero, rep: row.rep, value: `${row.numero} ${row.rep}` }
    : { numero: row.numero, rep: '', value: `${row.numero}` };

  dashboardStore.selectedNumeroFull = numeroFull;
  dashboardStore.selectedNumero = row.numero;
  dashboardStore.selectedRep = row.rep || '';

  // 4️⃣ RECHERCHE AUTO
  setTimeout(() => {
    dashboardStore.querySearchAddress();
  }, 10);
};
/* ------------------------------------
      RECHERCHE
------------------------------------ */

// const querySearchAddress = async () => {
//   await dashboardStore.querySearchAddress();
// };

const querySearchEstimation = async () => {
  await dashboardStore.querySearchEstimation();
};



/* ------------------------------------
      VIEW SWITCH
------------------------------------ */
const viewOptions = computed(() => [
  { value: 'table', label: 'Vue tableau', icon: DataBoard },
  // {
  //   value: 'card',
  //   label: 'Vue cartes',
  //   icon: Grid,
  //   disabled: isCityOnly.value,
  // },
  { value: 'map', label: 'Vue carte', icon: Location },
]);

/* ------------------------------------
      OUVERTURE FICHE
------------------------------------ */
const handleEditProperty = (property: any) => {
  // Ne pas ouvrir la fiche si seulement la ville est sélectionnée
  if (isCityOnly.value) {
    return;
  }
  openPropertyDialog(property);
};

const openPropertyDialog = (property: any) => {
  store.selectProperty({
    ...store.defaultPropertyData,
    ...property,
    id_fantoir_long: property.id_fantoir_long,
  });
  store.setDialogVisible(true);
};
</script>

<style scoped>
.headerFilterInfoContainer {
  display: flex;
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 20px;
  background: var(--apple-card-bg);
  padding: 20px;
  border-radius: var(--apple-radius);
  box-shadow: var(--apple-shadow);
  gap: 20px;
}

.autoCompleteContainer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
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

.ownerSearchContainer {
  flex: 1;
  min-width: 260px;
  max-width: 520px;
}

.headerFilterInfoContainer {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 20px;
  background: var(--apple-card-bg);
  padding: 20px;
  border-radius: var(--apple-radius);
  box-shadow: var(--apple-shadow);
}

.headerTopRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.headerBottomRow {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.autoCompleteContainer {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}

.headerRightContainer {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.ownerSearchContainer {
  min-width: 260px;
  max-width: 320px;
}

.modeBar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.modePill {
  border: none;
  background: #f3f4f6;
  color: #374151;
  padding: 10px 16px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
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

.modeBar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.modePill {
  display: inline-flex;
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

.modeWithFilter {
  display: flex;
  align-items: center;
  gap: 6px;
}

.modeSelect {
  width: 110px;
}

.modeDot.maj {
  background: #8b5cf6;
}
</style>
