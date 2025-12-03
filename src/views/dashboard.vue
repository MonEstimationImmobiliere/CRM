<template>
  <section class="block dashboardContainer">
    <div class="p-4">
      <div class="headerFilterInfoContainer">

        <!-- AUTOCOMPLETES Ville → Rue → Numéro -->
        <div class="autoCompleteContainer">
          <CityAutocomplete
            class="autoCompleteButton"
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
            :id-fantoir="selectedStreetIdFantoir"
   
            @select="handleNumeroSelect"
            @clear="handleNumeroClear"
          />
        </div>

        <!-- BOUTONS -->
        <div class="validationButtonContainer">
          <el-button
            type="primary"
            size="large"
            @click="querySearchAddress"
            :disabled="!selectedStreet"
          >
            Afficher
          </el-button>

          <el-button type="primary" size="large" @click="querySearchEstimation">
            Estimations reçues
          </el-button>

          <el-button type="primary" size="large" @click="openCreateCustomPropertyDialog">
            Créer une propriété personnalisée
          </el-button>
        </div>

        <!-- SWITCH LISTE / CARDS -->
        <div class="view-controls">
          <div class="layoutContainer">
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="grid-container" @click="setTableView">
                  <el-icon class="databoard-icon" :class="{ active: viewType === 'table' }">
                    <DataBoard />
                  </el-icon>
                </div>
              </el-col>

              <el-col :span="12">
                <div class="grid-container" @click="setCardView">
                  <el-icon class="grid-icon" :class="{ active: viewType === 'card' }">
                    <Grid />
                  </el-icon>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>

      </div>

      <!-- TABLE DES ADRESSES -->
      <PropertyTable
        v-if="viewType === 'table' && addresses.length > 0"
        :addresses="addresses"
        @edit-property="openPropertyDialog"
      />

      <!-- MODE CARD -->
      <PropertyTableCard
        v-else-if="viewType === 'card' && addresses.length > 0"
        :addresses="addresses"
        @edit-property="openPropertyDialog"
      />

      <PropertyForm />
      <CustomPropertyDialog />

    </div>
  </section>
</template>

<script setup lang="ts">
/* ------------------------------------
      IMPORTS
------------------------------------ */
import { computed, onMounted } from "vue";
import { DataBoard, Grid } from "@element-plus/icons-vue";

// Stores
import { usePropertyStore } from "@/stores/propertyHome";
import { useDashboardStore } from "@/stores/dashboard";

// Components
import CityAutocomplete from "./DashboardComponents/CityAutocomplete.vue";
import StreetAutocomplete from "./DashboardComponents/StreetAutocomplete.vue";
import NumeroAutocomplete from "./DashboardComponents/NumeroAutocomplete.vue";
import PropertyTable from "./DashboardComponents/PropertyTable.vue";
import PropertyTableCard from "./DashboardComponents/PropertyTableCard.vue";
import PropertyForm from "./DashboardComponents/PropertyDialog.vue";
import CustomPropertyDialog from "./DashboardComponents/CustomPropertyDialog.vue";

/* ------------------------------------
      STORES
------------------------------------ */
const store = usePropertyStore();
const dashboardStore = useDashboardStore();

/* ------------------------------------
      COMPUTED BINDINGS
------------------------------------ */

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
const selectedStreetIdFantoir = computed(() => {
  return dashboardStore.selectedStreet?.idFantoir || "";
});

// --- Numéro + rep (ex: "40 bis") ---
const selectedNumeroFull = computed({
  get: () => dashboardStore.selectedNumeroFull,

  set: (v) => {
    dashboardStore.selectedNumeroFull = v;

    if (!v) {
      dashboardStore.selectedNumero = "";
      dashboardStore.selectedRep = "";
      return;
    }

    // Sélection via autocomplete → objet
    if (typeof v === "object" && v !== null) {
      dashboardStore.selectedNumero = v.numero || "";
      dashboardStore.selectedRep = v.rep || "";
      return;
    }

    // Saisie manuelle -> string
    if (typeof v === "string") {
      const parts = v.trim().split(" ");
      dashboardStore.selectedNumero = parts[0] || "";
      dashboardStore.selectedRep = parts[1] || "";
    }
  }
});

// --- Vue table / card ---
const viewType = computed({
  get: () => dashboardStore.viewType,
  set: (v) => (dashboardStore.viewType = v),
});

// --- Résultats des adresses ---
const addresses = computed(() => dashboardStore.addresses);

/* ------------------------------------
      LIFECYCLE
------------------------------------ */
onMounted(() => {
  if (dashboardStore.isDataLoaded && dashboardStore.addresses.length > 0) {
    console.log("Données restaurées depuis le store");
  }
});

/* ------------------------------------
      HANDLERS
------------------------------------ */
const handleCitySelect = (city) => {
  dashboardStore.selectedCity = city;
  dashboardStore.selectedCodeInsee = city.codeInsee;
};

const handleCityClear = () => {
  dashboardStore.selectedCity = null;
  dashboardStore.selectedStreet = null;
  dashboardStore.selectedCodeInsee = "";
  dashboardStore.selectedStreet = null;
  dashboardStore.selectedNumero = "";
  dashboardStore.selectedRep = "";
  dashboardStore.selectedNumeroFull = null;
};

const handleStreetSelect = (street) => {
  dashboardStore.selectedStreet = street;
  dashboardStore.selectedCodeIdFantoir = street.idFantoir;
  dashboardStore.selectedNumero = "";
  dashboardStore.selectedRep = "";
  dashboardStore.selectedNumeroFull = null;
};
const handleStreetClear = () => {
  dashboardStore.selectedStreet = null;
  dashboardStore.selectedCodeIdFantoir = "";
  dashboardStore.selectedNumero = "";
  dashboardStore.selectedRep = "";
  dashboardStore.selectedNumeroFull = null;
};

const handleNumeroSelect = (item: any) => {
  dashboardStore.selectedNumero = item.numero;
  dashboardStore.selectedRep = item.rep || "";
  dashboardStore.selectedNumeroFull = item;
};

const handleNumeroClear = () => {
  dashboardStore.selectedNumero = "";
  dashboardStore.selectedRep = "";
  dashboardStore.selectedNumeroFull = null;
};
/* ------------------------------------
      RECHERCHE
------------------------------------ */

const querySearchAddress = async () => {
  await dashboardStore.querySearchAddress();
};

const querySearchEstimation = async () => {
  await dashboardStore.querySearchEstimation();
};

/* ------------------------------------
      VIEW SWITCH
------------------------------------ */
const setTableView = () => (dashboardStore.viewType = "table");
const setCardView = () => (dashboardStore.viewType = "card");

/* ------------------------------------
      OUVERTURE FICHE
------------------------------------ */
const openPropertyDialog = (property) => {
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
  align-items: flex-start;
  flex-direction: row;
  justify-content: space-between;
}
.autoCompleteContainer {
  display: flex;
  gap: 20px;
}

.validationButtonContainer {
  gap: 10px;
  display: flex;
}

.view-controls {
  margin-bottom: 24px;
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
  transition: color 0.3s, transform 0.3s;
}

.databoard-icon.active,
.grid-icon.active {
  color: #337ecc;
  transform: scale(1.1);
}
</style>
