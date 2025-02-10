<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-7xl mx-auto space-y-6">
      <div class="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <CitySearch
          v-model="stateAutocompleteCity"
          :on-search="querySearchCity"
          :on-select="handleSelectCity"
          :on-clear="handleClearCity"
        />
        <StreetSearch
          v-model="stateAutocompleteStreet"
          :on-search="querySearchStreet"
          :on-select="handleSelectStreet"
          :on-clear="handleClearStreet"
        />
        <div class="flex gap-4">
          <el-button type="primary" @click="querySearchAddress">
            Afficher
          </el-button>
          <el-button type="primary" @click="querySearchAddress">
            Estimations
          </el-button>
        </div>
      </div>

      <PropertyTable
        :data="addresses"
        :on-property-select="toggleDialogVisibility"
      />

      <PropertyDialog
        v-model:modelValue="dialogPropertyVisible"
        :property="formAddress"
        :on-save="savePropertyButton"
        :on-close="() => dialogPropertyVisible.value = false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import CitySearch from './components/SearchBar/CitySearch.vue';
import StreetSearch from './components/SearchBar/StreetSearch.vue';
import PropertyTable from './components/PropertyTable/PropertyTable.vue';
import PropertyDialog from './components/PropertyDialog/PropertyDialog.vue';
import API_URL from '../../utils/API_URL';

const stateAutocompleteCity = ref('');
const stateAutocompleteStreet = ref('');
const addresses = ref([{}]);
const selectedCity = ref([]);
const selectedCodeInsee = ref('');
const selectedCodeIdFantoir = ref('');
const selectedStreet = ref([]);
const dialogPropertyVisible = ref(false);
const formAddress = ref({});
const property_idFantoirLong = ref('');
const formProperty = ref({});

const querySearchCity = async (queryString: string, cb: any) => {
  try {
    if (!queryString) {
      cb([]);
      return;
    }

    const response = await axios.get(`${API_URL}/communes/${queryString}`);
    const data = response.data;
    let results = [];
    let queryStringBeANumber = parseInt(queryString);
    
    if (isNaN(Number(queryStringBeANumber))) {
      results = data.map((item: any) => ({
        value: item.code_postal,
        city: item.nom_commune,
        codeInsee: item.code_insee,
      }));
    } else if (queryString.length == 5) {
      results = data.map((item: any) => ({
        value: item.nom_commune,
        city: item.code_postal,
        codeInsee: item.code_insee
      }));
    }
    cb(results);
  } catch (error) {
    console.error('Error fetching cities:', error);
    cb([]);
  }
};

const querySearchStreet = async (queryString: string, cb: any) => {
  try {
    if (!queryString || !selectedCodeInsee.value) {
      cb([]);
      return;
    }

    const response = await axios.get(`${API_URL}/addresses/${selectedCodeInsee.value}/nom_voie/${queryString}`);
    const data = response.data;
    let results = [];

    if (queryString.length >= 3) {
      results = data.map((item: any) => ({
        value: item.nom_voie,
        idFantoir: item.id_fantoir
      }));
    }

    cb(results);
  } catch (error) {
    console.error('Error fetching streets:', error);
    cb([]);
  }
};

const querySearchAddress = async () => {
  try {
    if (!selectedCodeIdFantoir.value) return;
    
    const response = await axios.get(`${API_URL}/addresses/${selectedCodeIdFantoir.value}`);
    addresses.value = response.data;
  } catch (error) {
    console.error('Error fetching addresses:', error);
  }
};

const handleSelectCity = (selectedItem: any) => {
  selectedCity.value = selectedItem;
  selectedCodeInsee.value = selectedItem.codeInsee;
  stateAutocompleteCity.value = selectedItem.value + ', ' + selectedItem.city;
};

const handleSelectStreet = (selectedItem: any) => {
  selectedStreet.value = selectedItem;
  selectedCodeIdFantoir.value = selectedItem.idFantoir;
};

const handleClearCity = () => {
  selectedCity.value = [];
  selectedCodeInsee.value = '';
  stateAutocompleteStreet.value = '';
  selectedStreet.value = [];
  selectedCodeIdFantoir.value = '';
};

const handleClearStreet = () => {
  selectedStreet.value = [];
  selectedCodeIdFantoir.value = '';
};

const toggleDialogVisibility = (selectedAddress: any) => {
  console.log("selectedAddressBOOOOB", selectedAddress);
  formAddress.value = { ...selectedAddress };
  dialogPropertyVisible.value = true;

  property_idFantoirLong.value = formAddress.value.id_fantoir +
    (formAddress.value.numero ? "_" + formAddress.value.numero : "") +
    (formAddress.value.rep ? "_" + formAddress.value.rep : "") +
    (formAddress.value.numero_appartement ? "_" + formAddress.value.numero_appartement : "");

  getPropertyData();
};

const getPropertyData = async () => {
  console.log("property_idFantoirLong", property_idFantoirLong.value);
  try {
    const response = await axios.get(`${API_URL}/property/${property_idFantoirLong.value}`);
    formProperty.value = response.data;
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
  }
};

const savePropertyButton = async () => {
  try {
    const url = `${API_URL}/property/${encodeURIComponent(formProperty.value.id_fantoir_long)}`;
    const response = await axios.post(url, formProperty.value);
    formProperty.value = response.data.property;
    dialogPropertyVisible.value = false;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des données de propriété:', error);
  }
};
</script>