import { defineStore } from 'pinia';
import { ref } from 'vue';

import API_URL from '@/utils/API_URL';
import axios from 'axios';  // Import d'axios

const defaultPropertyData: PropertyData = {
  id_fantoir_long: '',
  owner: '',
  email: '',
  phone: '',
  property_type: '',
  year_built: new Date().getFullYear(),
  year_buy: new Date().getFullYear(),
  surface: 0,
  area: 0,
  orientation: '',
  property_condition: '',
  bedrooms: 0,
  bathrooms: 0,
  fitted_kitchen: false,
  equipped_kitchen: false,
  american_kitchen: false,
  scullery: false,
  heating_type: '',
  window: '',
  window_type: '',
  shutter: '',
  cheminee: false,
  district_heating: false,
  patio: false,
  Garage: false,
  pool: false,
  veranda: false,
  garden: false,
  parking: false,
  Carport: false,
  kitchen_ext: false,
  elevator: false,
  balcony: false,
  cellar: false,
  bike_room: false,
  guardian: false,
  roof: '',
  adjoining: false,
  basement: false,
  dependency: false,
  ground: false,
  comment: ''
};

export interface PropertyData {
  id_fantoir_long: string;
  owner: string;
  email: string;
  phone: string;
  property_type: string;
  year_built: number;
  year_buy: number;
  surface: number;
  area: number;
  orientation: string;
  property_condition: string;
  bedrooms: number;
  bathrooms: number;
  fitted_kitchen: boolean;
  equipped_kitchen: boolean;
  american_kitchen: boolean;
  scullery: boolean;
  heating_type: string;
  window: string;
  window_type: string;
  shutter: string;
  cheminee: boolean;
  district_heating: boolean;
  patio: boolean;
  Garage: boolean;
  pool: boolean;
  veranda: boolean;
  garden: boolean;
  parking: boolean;
  Carport: boolean;
  kitchen_ext: boolean;
  elevator: boolean;
  balcony: boolean;
  cellar: boolean;
  bike_room: boolean;
  guardian: boolean;
  roof: string;
  adjoining: boolean;
  basement: boolean;
  dependency: boolean;
  ground: boolean;
  comment: string;
  id?: number;
}

export const usePropertyStore = defineStore('property', () => {
  const properties = ref<PropertyData[]>([]);
 ///const selectedProperty = ref<PropertyData | null>(null);
 const selectedProperty = ref<PropertyData>({ ...defaultPropertyData });
  const isDialogVisible = ref(false);

  function addProperty(property: PropertyData) {
    const newProperty = {
      ...property,
      id: Date.now() // Simple way to generate unique IDs
    };
    properties.value.push(newProperty);
  }


  const saveProperty = async (property: PropertyData) => {

    try {
      if (property.id) {
       const response = await axios.post(`${API_URL}/property/update/${encodeURIComponent(property.id)}`, property);
        updateProperty(response.data.property); // update locale avec retour API

      } else {
        const response = await axios.post(`${API_URL}/property/create`, property);
        addProperty({ ...selectedProperty.value, id: response.data.id });
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la propriété :", error);
    }
  };




  function deleteProperty(id: number) {
    properties.value = properties.value.filter(p => p.id !== id);
  }

 function updateProperty(property: PropertyData) {
    const index = properties.value.findIndex(p => p.id === property.id);
    if (index !== -1) {
      properties.value[index] = property;
    }
  }

  const selectProperty = async (property: PropertyData | null | undefined) => {
    if (property?.id_fantoir_long) {
        try {
          const { data } = await axios.get(`${API_URL}/property/show/${property.id_fantoir_long}`);
          selectedProperty.value = { ...defaultPropertyData, ...data };
        } catch (error) {
          console.error("Erreur lors du chargement de la propriété :", error);
          selectedProperty.value = { ...defaultPropertyData, ...(property || {}) }; // fallback si erreur
        }
      } else {
        selectedProperty.value = { ...defaultPropertyData, ...(property || {}) };
      }
    };

  /*function selectProperty(property: PropertyData | null) {
    selectedProperty.value = property;
  }*/

  
  function setDialogVisible(visible: boolean) {
    isDialogVisible.value = visible;
  }



  return {
    properties,
    selectedProperty,
    isDialogVisible,
    saveProperty,
    addProperty,
    updateProperty,
    deleteProperty,
    selectProperty,
    setDialogVisible,
    defaultPropertyData
  };
});