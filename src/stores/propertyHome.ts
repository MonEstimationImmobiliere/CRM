import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { PropertyService } from '@/api';


export interface PropertyData {
  id_fantoir_long: string;
  id_fantoir?: string;
  numero?: string;
  rep?: string;
  nom_voie?: string;
  numero_appartement?: string;
  code_postal?: string;
  nom_commune?: string;
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
  date_rappel: string | null;
  comment_rappel?: string;
  id?: number;
  price?: number;
  is_custom?: boolean; // Nouveau champ pour identifier les propriétés personnalisées
  user_id?: number; // Pour lier à l'utilisateur
  agency_id?: number; 
  favorite?:boolean;
}

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
    console.log('=== UPDATE PROPERTY IN STORE ===');
    console.log('Updated property:', updatedProperty);
    
    // Chercher par id_fantoir_long d'abord (pour les favoris), puis par id
    const index = properties.value.findIndex(p => 
      p.id_fantoir_long === updatedProperty.id_fantoir_long || 
      p.id === updatedProperty.id
    );
    
    console.log('Property index found:', index);
    
    if (index !== -1) {
      // Préserver la structure existante et mettre à jour avec les nouvelles données
      properties.value[index] = {
        ...properties.value[index],
        ...updatedProperty,
        favorite: Boolean(updatedProperty.favorite) // Normaliser le booléen
      };
      console.log('Property updated in store at index:', index);
      console.log('Updated property in store:', properties.value[index]);
    } else {
      console.log('Property not found in store, adding it...');
      // Si la propriété n'est pas trouvée, l'ajouter au store
      const normalizedProperty = {
        ...updatedProperty,
        favorite: Boolean(updatedProperty.favorite)
      };
      properties.value.push(normalizedProperty);
      console.log('Property added to store');
    }
  }

  const loadProperties = async () => {
    try {
      // Ici on pourrait charger toutes les propriétés ou les propriétés utilisateur
      // Pour l'instant, on garde la logique existante
      // const allProperties = await PropertyService.getAllProperties();
      // properties.value = allProperties;
    } catch (error) {
      console.error("Erreur lors du chargement des propriétés :", error);
    }
  };

  const loadFavoritesProperties = async () => {
    try {
      const favoriteProperties = await PropertyService.getFavorites();
      // Mettre à jour les propriétés existantes ou ajouter les nouvelles
      favoriteProperties.forEach(favoriteProperty => {
        const existingIndex = properties.value.findIndex(p => p.id_fantoir_long === favoriteProperty.id_fantoir_long);
        // Normaliser la propriété favorite en booléen
        const normalizedProperty = { 
          ...favoriteProperty, 
          favorite: Boolean(favoriteProperty.favorite) || true // S'assurer que c'est true pour les favoris
        };
        
        if (existingIndex !== -1) {
          // Mettre à jour la propriété existante
          properties.value[existingIndex] = { ...properties.value[existingIndex], ...normalizedProperty };
        } else {
          // Ajouter la nouvelle propriété favorite
          properties.value.push(normalizedProperty);
        }
      });
    } catch (error) {
      console.error("Erreur lors du chargement des propriétés favorites :", error);
    }
  };

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
      
      if (!property) {
        console.log('Property not found in store, fetching from API...');
        // Si la propriété n'existe pas dans le store, la récupérer depuis l'API
        try {
          const propertyData = await PropertyService.getPropertyById(propertyId);
          // Créer la propriété avec les données de l'API et l'ajouter au store
          property = { 
            ...defaultPropertyData, 
            ...propertyData, 
            favorite: Boolean(propertyData.favorite) || false // Normaliser en booléen
          };
          properties.value.push(property);
        } catch (error) {
          throw new Error('Impossible de récupérer les données de la propriété');
        }
      } else {
        // S'assurer que la propriété existante a un booléen pour favorite
        property.favorite = Boolean(property.favorite);
      }
      // Maintenant on peut modifier l'état favorite
      property.favorite = !property.favorite;
      
      // Sauvegarder la propriété mise à jour
    delete property.comment_rappel; 

      await saveProperty(property);
      
      // Retourner le nouvel état pour le message
      return property.favorite;
    } catch (error) {
      throw error;
    }
  };

  const isFavorite = (propertyId: string): boolean => {
    const property = properties.value.find(p => p.id_fantoir_long === propertyId);
    // Si la propriété n'est pas dans le store, elle n'est pas favorite par défaut
    // Convertir également les valeurs numériques en booléens pour la compatibilité
    return Boolean(property?.favorite) || false;
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
    loadProperties,
    loadFavoritesProperties
  };
});