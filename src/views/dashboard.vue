<template>
  <section class="block dashboardContainer">
    <div class="p-4">
      <div class="headerFilterInfoContainer">
        <div class="autoCompleteContainer">
          <CityAutocomplete class="autoCompleteBtton" v-model="selectedCity" @select="handleCitySelect" @clear="handleCityClear" />
          <StreetAutocomplete v-model="selectedStreet" :code-insee="selectedCodeInsee" @select="handleStreetSelect" />
        </div>

        <div class="validationButtonContainer">
          <el-button type="primary" size="large" @click="querySearchAddress" :disabled="!selectedStreet || !selectedCodeInsee"> Afficher </el-button>

          <el-button type="primary" size="large" @click="querySearchEstimation"> Estimations reçues </el-button>

          
               <el-button type="primary" size="large" @click="openCreateCustomPropertyDialog">
            Créer une propriété personnalisée
          </el-button>
        </div>

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

      <PropertyTable v-if="viewType === 'table' && addresses.length > 0" :addresses="addresses" @edit-property="openPropertyDialog" />

      <PropertyTableCard v-else-if="viewType === 'card' && addresses.length > 0" :addresses="addresses" @edit-property="openPropertyDialog" />

      <PropertyForm />

      <!-- Widget des rappels -->
      <RemindersWidget />

      <CustomPropertyDialog />

      
      <!-- Dialog de création de propriété personnalisée -->
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { usePropertyStore } from "../stores/propertyHome";
import { useDashboardStore } from '@/stores/dashboard'
import { PropertyService } from "@/api";
import { DataBoard, Grid } from "@element-plus/icons-vue";

// Component imports
import CityAutocomplete from "./DashboardComponents/CityAutocomplete.vue";
import StreetAutocomplete from "./DashboardComponents/StreetAutocomplete.vue";
import PropertyTable from "./DashboardComponents/PropertyTable.vue";
import PropertyTableCard from "./DashboardComponents/PropertyTableCard.vue";
import PropertyForm from "./DashboardComponents/PropertyDialog.vue";
import CustomPropertyDialog from "./DashboardComponents/CustomPropertyDialog.vue";
import RemindersWidget from "@/components/RemindersWidget.vue";

// Store
const store = usePropertyStore();
const dashboardStore = useDashboardStore();

// Reactive state
// const selectedCodeIdFantoir = computed({
//   get: () => dashboardStore.selectedCodeIdFantoir,
//   set: (value) => dashboardStore.selectedCodeIdFantoir = value
// })

const viewType = computed({
  get: () => dashboardStore.viewType,
  set: (value) => dashboardStore.viewType = value
})

const selectedCity = computed({
  get: () => dashboardStore.selectedCity,
  set: (value) => dashboardStore.selectedCity = value
})

console.log('selectedCity', selectedCity.value)

const selectedStreet = computed({
  get: () => dashboardStore.selectedStreet,
  set: (value) => dashboardStore.selectedStreet = value
})

const selectedCodeInsee = computed({
  get: () => dashboardStore.selectedCodeInsee,
  set: (value) => dashboardStore.selectedCodeInsee = value
})

const addresses = computed(() => dashboardStore.addresses)
console.log('addresses in dashboard.vue', addresses.value)

// Restaurer l'état au montage du composant
onMounted(() => {
  // Si des données existent déjà, ne pas les recharger
  if (dashboardStore.isDataLoaded && dashboardStore.addresses.length > 0) {
    console.log('Données restaurées depuis le store')
  }
})

// Methods
const handleCitySelect = (city: any) => {
  dashboardStore.selectedCity = city
  dashboardStore.selectedCodeInsee = city.codeInsee || ""
}

const handleCityClear = () => {
  dashboardStore.selectedCity = null
  dashboardStore.selectedCodeInsee = ""
  dashboardStore.selectedStreet = null // Vider aussi la rue
}

const handleStreetSelect = (street: any) => {
  dashboardStore.selectedStreet = street
  dashboardStore.selectedCodeIdFantoir = street.idFantoir
}

const querySearchAddress = async () => {
  await dashboardStore.querySearchAddress()
}

const querySearchEstimation = async () => {
  console.log('querySearchEstimation called')
  await dashboardStore.querySearchEstimation()
}


const openCreateCustomPropertyDialog = () => {
  dashboardStore.openCustomPropertyDialog()
}

//Fonction appelé quanf on clique sur ouvrir
const openPropertyDialog = (property: any) => {
  console.log('openPropertyDialog called with property:', property);
  store.selectProperty({
    ...store.defaultPropertyData,
    ...property,
    id_fantoir_long: property.id_fantoir_long,
  });
  store.setDialogVisible(true);
};



const setTableView = () => {
  dashboardStore.viewType = "table"
}

const setCardView = () => {
  dashboardStore.viewType = "card"
}
</script>

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
