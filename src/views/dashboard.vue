<template>
  <section class="block dashboardContainer">
    <div class="headerFilterInfoContainer">
      <!-- AUTOCOMPLETES Ville → Rue → Numéro -->
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

      <!-- BOUTONS -->
      <div class="validationButtonContainer">
        <Button type="primary" @click="querySearchEstimation">
          Estimations reçues
        </Button>

        <Button
          type="primary"
          @click="dashboardStore.openCustomPropertyDialog()"
        >
          Créer une propriété personnalisée
        </Button>
      </div>

      <!-- SWITCH LISTE / CARDS -->
      <div class="view-controls">
        <div class="layoutContainer">
          <div class="viewSelector">
            <div class="grid-container" @click="setTableView">
              <el-icon
                class="databoard-icon"
                :class="{ active: viewType === 'table' }"
              >
                <DataBoard />
              </el-icon>
            </div>

            <div
              class="grid-container"
              @click="setCardView"
              :class="{ disabled: isCityOnly }"
            >
              <el-icon
                class="grid-icon"
                :class="{ active: viewType === 'card' }"
              >
                <Grid />
              </el-icon>
            </div>

            <div class="grid-container" @click="setMapView">
              <el-icon
                class="grid-icon"
                :class="{ active: viewType === 'map' }"
              >
                <Location />
              </el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TABLE DES ADRESSES -->
    <PropertyTable
      v-if="viewType === 'table' && addresses.length > 0"
      :addresses="addresses"
      :city-only="isCityOnly"
      @edit-property="handleEditProperty"
      @select-street="handleGroupedStreetClick"
      @select-numero="handleTableNumeroClick"
    />

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

/* ------------------------------------
      COMPUTED BINDINGS
------------------------------------ */

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
const setTableView = () => (dashboardStore.viewType = 'table');
const setCardView = () => {
  if (!isCityOnly.value) {
    dashboardStore.viewType = 'card';
  }
};
const setMapView = () => {
  dashboardStore.viewType = 'map';
};

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

.view-controls {
  background-color: #eeeeee;
  padding: 20px;
  border-radius: 35px;
}

.viewSelector {
  display: flex;
  gap: 12px;
  align-items: center;
}
.layoutContainer {
  display: flex;
  justify-content: center;
  max-width: 200px;
  margin: 0 auto;
}

.grid-container {
  cursor: pointer;
  padding: 8px 12px;
  border: 2px solid #337ecc;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  background: white;
}

.grid-container:hover {
  background-color: #f5f7fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(51, 126, 204, 0.2);
}

.databoard-icon,
.grid-icon {
  font-size: 20px;
  color: #909399;
  transition:
    color 0.3s,
    transform 0.3s;
}

.databoard-icon.active,
.grid-icon.active {
  color: #337ecc;
  transform: scale(1.1);
}

.grid-container.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
