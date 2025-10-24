import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { PropertyService } from '@/api';
import type { PropertyData } from '@/types/property';




const defaultPropertyData: PropertyData = {
  id_fantoir_long: '',
  id_fantoir: '',
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
  comment: '',
  date_rappel: null,
  comment_rappel: '',
  favorite: false,
};


export const usePropertyStore = defineStore('property', () => {
  const properties = ref<PropertyData[]>([]);
  const selectedProperty = ref<PropertyData | null>(null);
  const isDialogVisible = ref<boolean>(false);

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
        const updatedProperty = await PropertyService.updateProperty(property.id, property);
        updatePropertyInStore(updatedProperty);
      } else {
        const response = await PropertyService.createProperty(property);
        addProperty({ ...property, id: response.id });
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la propriété :", error);
    }
  };

  // Fonction pour mettre à jour une propriété dans le store après sauvegarde
  function updatePropertyInStore(updatedProperty: PropertyData) {
    
    // Chercher par id_fantoir_long d'abord (pour les favoris), puis par id
    const index = properties.value.findIndex(p => 
      p.id_fantoir_long === updatedProperty.id_fantoir_long || 
      p.id === updatedProperty.id
    );
    
    
    if (index !== -1) {
      // Préserver la structure existante et mettre à jour avec les nouvelles données
      properties.value[index] = {
        ...properties.value[index],
        ...updatedProperty,
        favorite: Boolean(updatedProperty.favorite) // Normaliser le booléen
      };
    } else {
      // Si la propriété n'est pas trouvée, l'ajouter au store
      const normalizedProperty = {
        ...updatedProperty,
        favorite: Boolean(updatedProperty.favorite)
      };
      properties.value.push(normalizedProperty);
      console.log('Property added to store');
    }
  }

  

  function deleteProperty(id: number) {
    properties.value = properties.value.filter(p => p.id !== id);
  }

  function updateProperty(property: PropertyData) {
    
    // Chercher par id_fantoir_long d'abord (identifiant principal), puis par id
    const index = properties.value.findIndex(p => 
      p.id_fantoir_long === property.id_fantoir_long || 
      p.id === property.id
    );
    
    
    if (index !== -1) {
      properties.value[index] = {
        ...properties.value[index],
        ...property,
        favorite: Boolean(property.favorite) // Normaliser le booléen
      };
    } else {
      console.log('Property not found for update, id_fantoir_long:', property.id_fantoir_long, 'id:', property.id);
    }
  }

  const selectProperty = async (property: PropertyData | null | undefined) => {
    if (property?.id_fantoir_long) {
      try {
        const data = await PropertyService.getPropertyById(property.id_fantoir_long);
        console.log('Données récupérées pour la propriété sélectionnée :', data);
        // Convertir les valeurs numériques en booléens pour favorite
        const normalizedData = { 
          ...defaultPropertyData, 
          ...data, 
          favorite: Boolean(data.favorite) // Convertir 0/1 en false/true
        };
        selectedProperty.value = normalizedData;
      } catch (error) {
        console.error("Erreur lors du chargement de la propriété :", error);
        selectedProperty.value = { ...defaultPropertyData, ...(property || {}) }; // fallback si erreur
      }
    } else {
      selectedProperty.value = { ...defaultPropertyData, ...(property || {}) };
    }
  };

  function setDialogVisible(visible: boolean) {
    isDialogVisible.value = visible;
  }

  // Gestion des favoris
  const favorites = computed(() => 
    properties.value.filter(property => property.favorite === true)
  );



   const toggleFavorite = async (propertyId: string) => {
    try {
      // D'abord chercher si la propriété existe déjà dans le store
      let property = properties.value.find(p => p.id_fantoir_long === propertyId);
      
      // Récupérer les données depuis l'API avec l'ID fourni
      if(property?.id_fantoir_long) {
      const propertyData = await PropertyService.getPropertyById(property?.id_fantoir_long);
      
      // Créer/mettre à jour la propriété avec les données de l'API
      property = { 
        ...defaultPropertyData, 
        ...propertyData, 
        favorite: !Boolean(propertyData.favorite) // Toggle l'état favorite
      };
      
      // Si la propriété n'existait pas dans le store, l'ajouter
      if (!properties.value.find(p => p.id_fantoir_long === propertyId)) {
        properties.value.push(property);
      }
      
      // Sauvegarder la propriété mise à jour
      delete property.comment_rappel;
      if (property.nom_commune) {
        delete property.nom_commune; 
      }
      await saveProperty(property);
      return property.favorite;
    }

      
      // Retourner le nouvel état pour le message
    } catch (error) {
      throw error;
    }
};

  const isFavorite = (propertyId: string): boolean => {
    const property = properties.value.find(p => p.id_fantoir_long === propertyId);
    return Boolean(property?.favorite) || false;
  };

  const loadFavoritesProperties = async () => {
    try {
      const favoriteProperties = await PropertyService.getFavorites();
      
      // D'abord, remettre à false tous les favoris existants dans le store
      properties.value.forEach(property => {
        if (property.favorite) {
          property.favorite = false;
        }
      });
      
      // Ensuite, traiter les favoris récupérés de l'API
      favoriteProperties.forEach(property => {
        const normalizedProperty = {
          ...defaultPropertyData,
          ...property,
          favorite: true // S'assurer que toutes les propriétés récupérées sont marquées comme favorites
        };
        
        // Vérifier si la propriété existe déjà dans le store
        const existingIndex = properties.value.findIndex(p => 
          p.id_fantoir_long === property.id_fantoir_long
        );
        
        if (existingIndex !== -1) {
          // Mettre à jour la propriété existante en préservant certaines données locales
          properties.value[existingIndex] = {
            ...properties.value[existingIndex],
            ...normalizedProperty
          };
        } else {
          // Ajouter la nouvelle propriété au store
          properties.value.push(normalizedProperty);
        }
      });
      
    } catch (error) {
      console.error('Erreur lors du chargement des propriétés favorites :', error);
      throw error;
    }
  };

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
    defaultPropertyData,
    favorites,
    toggleFavorite,
    isFavorite,
    loadFavoritesProperties
  };
});