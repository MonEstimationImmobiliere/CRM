<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import API_URL from '@/utils/API_URL';
import { usePropertyStore } from '../stores/propertyHome';

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
  store.selectProperty({
    ...store.defaultPropertyData,
    ...property,
    id_fantoir_long: property.id_fantoir_long
  });
  store.setDialogVisible(true);
};

const handlePropertySave = async () => {
  if (!store.selectedProperty) return;

  try {
    if (store.selectedProperty.id) {
      await axios.post(
        `${API_URL}/property/${encodeURIComponent(store.selectedProperty.id_fantoir_long)}`,
        store.selectedProperty
      );
      store.updateProperty(store.selectedProperty);
    } else {
      const response = await axios.post(`${API_URL}/property`, store.selectedProperty);
      store.addProperty({ ...store.selectedProperty, id: response.data.id });
    }
    store.setDialogVisible(false);
    querySearchAddress(); // Refresh the address list
  } catch (error) {
    console.error('Error saving property:', error);
  }
};
</script>

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

    <PropertyForm @save="handlePropertySave" />
  </div>
</template>

<style scoped>
.property-dashboard {
  @apply bg-white rounded-lg shadow-md p-6;
}
</style>