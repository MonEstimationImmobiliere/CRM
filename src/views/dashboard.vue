<script setup lang="ts">
import { ref } from "vue";
import { usePropertyStore } from "../stores/propertyHome";
import { PropertyService } from "@/api";
import { DataBoard, Grid } from "@element-plus/icons-vue";

// Component imports
import CityAutocomplete from "./DashboardComponents/CityAutocomplete.vue";
import StreetAutocomplete from "./DashboardComponents/StreetAutocomplete.vue";
import PropertyTable from "./DashboardComponents/PropertyTable.vue";
import PropertyTableCard from "./DashboardComponents/PropertyTableCard.vue";
import PropertyForm from "./DashboardComponents/PropertyDialog.vue";

// Store
const store = usePropertyStore();

// Reactive state
const selectedCity = ref(null);
const selectedStreet = ref(null);
const selectedCodeInsee = ref("");
const selectedCodeIdFantoir = ref("");
const addresses = ref([]);
const viewType = ref("table"); // Add view type tracking

// Methods
const handleCitySelect = (city: any) => {
  selectedCity.value = city;
  selectedCodeInsee.value = city.codeInsee || "";
};

const handleStreetSelect = (street: any) => {
  selectedStreet.value = street;
  selectedCodeIdFantoir.value = street.idFantoir;
};

const querySearchAddress = async () => {
  try {
    addresses.value = await PropertyService.getAddressesByFantoir(selectedCodeIdFantoir.value);
  } catch (error) {
    console.error("Error fetching addresses:", error);
  }
};


const querySearchEstimation = async () => {
  try {
    addresses.value = await PropertyService.getAddressesByFantoir(selectedCodeIdFantoir.value, 'estimation');
  } catch (error) {
    console.error('Error fetching estimations:', error);
  }
};

const querySearchRappel = async () => {
  try {
    addresses.value = await PropertyService.getAddressesByFantoir(selectedCodeIdFantoir.value, 'rappel');
  } catch (error) {
    console.error('Error fetching rappel:', error);
  };
};

const querySearchMaj = async () => {
  try {
    addresses.value = await PropertyService.getAddressesByFantoir(selectedCodeIdFantoir.value, 'maj');
  } catch (error) {
    console.error('Error fetching maj:', error);
  }
};

const openPropertyDialog = (property: any) => {
  store.selectProperty({
    ...store.defaultPropertyData,
    ...property,
    id_fantoir_long: property.id_fantoir_long,
  });
  store.setDialogVisible(true);
};

const setTableView = () => {
  viewType.value = "table";
};

const setCardView = () => {
  viewType.value = "card";
};

/*const openPropertyDialog = async (property: any) => {
  await store.selectProperty(property); // ici, appel distant si ID présent
  store.setDialogVisible(true);
};*/

/*const handlePropertySave = async () => {
  await store.saveProperty(); // appelle juste le store
  store.setDialogVisible(false);
  querySearchAddress(); // refresh
};*/
</script>

<template>
  <section class="block dashboardContainer">
    <div class="p-4">
      <div class="headerFilterInfoContainer">
        <div class="autoCompleteContainer">
          <CityAutocomplete class="autoCompleteBtton" v-model="selectedCity" @select="handleCitySelect" />
          <StreetAutocomplete v-model="selectedStreet" :code-insee="selectedCodeInsee" @select="handleStreetSelect" />
        </div>

        <div class="validationButtonContainer">
          <el-button type="primary" size="large" @click="querySearchAddress" :disabled="!selectedStreet || !selectedCodeInsee"> Afficher </el-button>

          <el-button type="primary" size="large" @click="querySearchEstimation"> Estimations reçues </el-button>

          <el-button type="primary" size="large" @click="querySearchRappel"> Mes rappels </el-button>

          <el-button type="primary" size="large" @click="querySearchMaj"> Mes dernières mise à jour </el-button>
        </div>

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

      <PropertyTable v-if="viewType === 'table'" :addresses="addresses" @edit-property="openPropertyDialog" />

      <PropertyTableCard v-else :addresses="addresses" @edit-property="openPropertyDialog" />

      <PropertyForm />
    </div>
  </section>
</template>

<style scoped>
.headerFilterInfoContainer {
  display: flex;
  align-items: start;
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

.grid-container {
  cursor: pointer;
  padding: 5px;
  border: #337ecc 2px solid;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  &:hover {
    background-color: #f5f7fa;
  }
}

.databoard-icon,
.grid-icon {
  font-size: 24px;
  color: #909399;
  transition: color 0.3s, transform 0.3s;
}

.databoard-icon:hover,
.grid-icon:hover {
  transform: scale(1.1);
}

.databoard-icon.active,
.grid-icon.active {
  color: #337ecc;
  transform: scale(1.1);
}
</style>
