<script setup lang="ts">
import { ref } from 'vue';
import { usePropertyStore } from '../stores/propertyHome';
import { PropertyService } from '@/api';

// Component imports
import CityAutocomplete from './DashboardComponents/CityAutocomplete.vue';
import StreetAutocomplete from './DashboardComponents/StreetAutocomplete.vue';
import PropertyTable from './DashboardComponents/PropertyTable.vue';
import PropertyForm from './DashboardComponents/PropertyDialog.vue';

// Store
const store = usePropertyStore();

// Reactive state
const selectedCity = ref(null);
const selectedStreet = ref(null);
const selectedCodeInsee = ref('');
const selectedCodeIdFantoir = ref('');
const addresses = ref([]);

// Methods
const handleCitySelect = (city: any) => {
  selectedCity.value = city;
  selectedCodeInsee.value = city.codeInsee || '';
};

const handleStreetSelect = (street: any) => {
  selectedStreet.value = street;
  selectedCodeIdFantoir.value = street.idFantoir;
};

const querySearchAddress = async () => {
  try {
    addresses.value = await PropertyService.getAddressesByFantoir(selectedCodeIdFantoir.value, 'address');
  } catch (error) {
    console.error('Error fetching addresses:', error);
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
    id_fantoir_long: property.id_fantoir_long
  });
  store.setDialogVisible(true);
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
      <CityAutocomplete 
        v-model="selectedCity" 
        @select="handleCitySelect"
      />
      <StreetAutocomplete 
        v-model="selectedStreet" 
        :code-insee="selectedCodeInsee"
        @select="handleStreetSelect"
      />

      <div class="validationButtonContainer">
    
      <el-button 
        type="primary" 
        @click="querySearchAddress" 
        :disabled="!selectedStreet || !selectedCodeInsee"
      >
        Afficher
      </el-button>

      <el-button 
        type="primary" 
        @click="querySearchEstimation"         
      >
        Estimations reçues
      </el-button>

      <el-button 
        type="primary" 
        @click="querySearchRappel"         
      >
      Mes rappels
      </el-button>

      <el-button 
        type="primary" 
        @click="querySearchMaj"         
      >
      Mes mise à jours
      </el-button>



      </div>  
    </div>

    <PropertyTable 
      :addresses="addresses" 
      @edit-property="openPropertyDialog"
    />

    <PropertyForm @save="handlePropertySave" />
  </div>
</section>
</template>

<style scoped>

.headerFilterInfoContainer{
  display: flex;
  align-items: start;
  flex-direction: row;
  gap: 20px;
}

.validationButtonContainer{
  gap: 10px;
  display: flex;
  margin-left: 40px;
}

</style>