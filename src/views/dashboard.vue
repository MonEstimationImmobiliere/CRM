<template>
  <div class="property-dashboard container mx-auto p-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <CityAutocomplete 
        v-model="selectedCity" 
        @select="handleCitySelect"
      />
      <StreetAutocomplete 
        v-model="selectedStreet" 
        :code-insee="selectedCodeInsee"
        @select="handleStreetSelect"
      />
    </div>

    <div class="flex space-x-4 mb-4">
      <el-button 
        type="primary" 
        @click="querySearchAddress" 
        :disabled="!selectedStreet || !selectedCodeInsee"
      >
        Afficher
      </el-button>
      <el-button 
        type="primary" 
        @click="queryEstimations" 
        :disabled="!selectedStreet || !selectedCodeInsee"
      >
        Estimations
      </el-button>
    </div>

    <PropertyTable 
      :addresses="addresses" 
      @edit-property="openPropertyDialog"
    />

    <PropertyDialog 
      v-model="dialogPropertyVisible"
      :property-data="selectedProperty"
      @save="saveProperty"
      @create="createProperty"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import axios from 'axios';
import API_URL from '@/utils/API_URL';

// Component imports
import CityAutocomplete from './DashboardComponents/CityAutocomplete.vue';
import StreetAutocomplete from './DashboardComponents/StreetAutocomplete.vue';
import PropertyTable from './DashboardComponents/PropertyTable.vue';
import PropertyDialog from './DashboardComponents/PropertyDialog.vue';

// Reactive state
const selectedCity = ref(null);
const selectedStreet = ref(null);
const selectedCodeInsee = ref('');
const selectedCodeIdFantoir = ref('');
const addresses = ref([]);
const dialogPropertyVisible = ref(false);
const selectedProperty = ref<Record<string, any> | null>(null);

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
    const url = `${API_URL}/addresses/${selectedCodeIdFantoir.value}`;
    const response = await axios.get(url);
    addresses.value = response.data;
  } catch (error) {
    console.error('Error fetching addresses:', error);
  }
};

const queryEstimations = () => {
  // Implement estimation logic
  console.log('Fetching estimations');
};

const openPropertyDialog = (property: any) => {
  console.log('Opening PropertyDialog with data:', property); // Log the property data
  selectedProperty.value = property;
  dialogPropertyVisible.value = true;
};

const saveProperty = async (propertyData: any) => {
  try {
    const url = `${API_URL}/property/${encodeURIComponent(propertyData.id_fantoir_long)}`;
    await axios.post(url, propertyData);
    dialogPropertyVisible.value = false;
  } catch (error) {
    console.error('Error saving property:', error);
  }
};

const createProperty = async (propertyData: any) => {
  try {
    const url = `${API_URL}/property`;
    await axios.post(url, propertyData);
    dialogPropertyVisible.value = false;
  } catch (error) {
    console.error('Error creating property:', error);
  }
};
</script>

<style scoped>
.property-dashboard {
  @apply bg-white rounded-lg shadow-md p-6;
}
</style>