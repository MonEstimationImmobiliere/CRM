import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { PropertyService } from '@/api';
import type { PropertyData } from '@/types/property';

const defaultPropertyData: PropertyData = {
  id_fantoir_long: '',
  id_fantoir: '',
  code_postal: '',
  city: '',
  nom_voie: '',
  numero: '',
  rep: '',
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
  const favoritesViewType = ref<'table' | 'card'>('card');

  function addProperty(property: PropertyData) {
    const newProperty = {
      ...property,
      id: Date.now(), // Simple way to generate unique IDs
    };
    properties.value.push(newProperty);
  }

  /*const saveProperty = async (property: PropertyData) => {
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
  };*/

  const saveProperty = async (property: PropertyData) => {
    try {
      let saved;

      if (property.id) {
        // UPDATE
        saved = await PropertyService.updateProperty(property.id, property);
        updatePropertyInStore(saved);
      } else {
        // CREATE
        const created = await PropertyService.createProperty(property);

        saved = { ...property, id: created.id };
        addProperty(saved);
      }

      return saved; // <-- important !
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la propriété :', error);
      throw error;
    }
  };

  // Fonction pour mettre à jour une propriété dans le store après sauvegarde
  function updatePropertyInStore(updatedProperty: PropertyData) {
    // Chercher par id_fantoir_long d'abord (pour les favoris), puis par id
    const index = properties.value.findIndex(
      p =>
        p.id_fantoir_long === updatedProperty.id_fantoir_long ||
        p.id === updatedProperty.id
    );

    if (index !== -1) {
      // Préserver la structure existante et mettre à jour avec les nouvelles données
      properties.value[index] = {
        ...properties.value[index],
        ...updatedProperty,
        favorite: Boolean(updatedProperty.favorite), // Normaliser le booléen
      };
    } else {
      // Si la propriété n'est pas trouvée, l'ajouter au store
      const normalizedProperty = {
        ...updatedProperty,
        favorite: Boolean(updatedProperty.favorite),
      };
      properties.value.push(normalizedProperty);
    }
  }

  function deleteProperty(id: number) {
    properties.value = properties.value.filter(p => p.id !== id);
  }

  function updateProperty(property: PropertyData) {
    // Chercher par id_fantoir_long d'abord (identifiant principal), puis par id
    const index = properties.value.findIndex(
      p =>
        p.id_fantoir_long === property.id_fantoir_long || p.id === property.id
    );

    if (index !== -1) {
      properties.value[index] = {
        ...properties.value[index],
        ...property,
        favorite: Boolean(property.favorite), // Normaliser le booléen
      };
    } else {
      console.log(
        'Property not found for update, id_fantoir_long:',
        property.id_fantoir_long,
        'id:',
        property.id
      );
    }
  }

  const selectProperty = async (property: PropertyData | null | undefined) => {
    if (property?.id_fantoir_long) {
      try {
        const data = await PropertyService.getPropertyById(
          property.id_fantoir_long
        );
        console.log(
          'Données récupérées pour la propriété sélectionnée :',
          data
        );
        // Convertir les valeurs numériques en booléens pour favorite
        const normalizedData = {
          ...defaultPropertyData,
          ...data,
          favorite: Boolean(data.favorite), // Convertir 0/1 en false/true
        };
        selectedProperty.value = normalizedData;
      } catch (error) {
        console.error('Erreur lors du chargement de la propriété :', error);
        selectedProperty.value = {
          ...defaultPropertyData,
          ...(property || {}),
        }; // fallback si erreur
      }
    } else {
      selectedProperty.value = { ...defaultPropertyData, ...(property || {}) };
    }
  };

  function loadPropertyBaseData(property: any) {
    selectedProperty.value = {
      ...defaultPropertyData,
      ...property,
      id_fantoir_long: property.id_fantoir_long,
      favorite: Boolean(property.favorite),
    };
  }

  function setDialogVisible(visible: boolean) {
    isDialogVisible.value = visible;
  }

  // Gestion des favoris
  const favorites = computed(() =>
    properties.value.filter(property => property.favorite === true)
  );

  const toggleFavorite = async (
    id_fantoir_long: string,
    sourceRow: any = null
  ) => {
    console.warn('=== toggleFavorite START ===', id_fantoir_long);

    try {
      let existing = null;

      // 1. Récupérer la propriété si elle existe
      try {
        existing = await PropertyService.getPropertyById(id_fantoir_long);
      } catch (err: any) {
        if (err.response?.status === 404) {
          existing = null;
        } else {
          throw err;
        }
      }

      let property: any;

      if (!existing) {
        // 2. Création avec enrichissement depuis row
        property = {
          ...defaultPropertyData,
          ...sourceRow, // <----- ENRICHISSEMENT ICI !
          id_fantoir_long,
          id_fantoir: sourceRow?.id_fantoir || '',
          code_postal: sourceRow?.code_postal || '',
          city: sourceRow?.city || '',
          nom_commune: sourceRow?.nom_commune || '',
          nom_voie: sourceRow?.nom_voie || '',
          numero: sourceRow?.numero || '',
          rep: sourceRow?.rep || '',
          numero_appartement: sourceRow?.numero_appartement || '',
          surface: sourceRow?.surface || 0,
          favorite: true,
        };

        const created = await PropertyService.createProperty(property);
        property.id = created.id;
      } else {
        // 3. Toggle normal si elle existe
        property = {
          ...existing,
          favorite: !existing.favorite,
        };

        await PropertyService.updateProperty(property.id, property);
      }

      // 4. Mise à jour store Pinia
      updatePropertyInStore(property);

      return property.favorite;
    } catch (error) {
      console.error('toggleFavorite ERROR:', error);
      throw error;
    }
  };

  const isFavorite = (propertyId: string): boolean => {
    const property = properties.value.find(
      p => p.id_fantoir_long === propertyId
    );
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
          numero: String(property.numero ?? ''), // Convertir numero en string
          favorite: true, // S'assurer que toutes les propriétés récupérées sont marquées comme favorites
        };

        // Vérifier si la propriété existe déjà dans le store
        const existingIndex = properties.value.findIndex(
          p => p.id_fantoir_long === property.id_fantoir_long
        );

        if (existingIndex !== -1) {
          // Mettre à jour la propriété existante en préservant certaines données locales
          properties.value[existingIndex] = {
            ...properties.value[existingIndex],
            ...normalizedProperty,
          } as (typeof properties.value)[number];
        } else {
          // Ajouter la nouvelle propriété au store
          properties.value.push(
            normalizedProperty as (typeof properties.value)[number]
          );
        }
      });
    } catch (error) {
      console.error(
        'Erreur lors du chargement des propriétés favorites :',
        error
      );
      throw error;
    }
  };

  const setFavoritesViewType = (viewType: 'table' | 'card') => {
    favoritesViewType.value = viewType;
  };

  return {
    properties,
    selectedProperty,
    isDialogVisible,
    favoritesViewType,
    saveProperty,
    addProperty,
    updateProperty,
    deleteProperty,
    selectProperty,
    loadPropertyBaseData,
    setDialogVisible,
    setFavoritesViewType,
    defaultPropertyData,
    favorites,
    toggleFavorite,
    isFavorite,
    loadFavoritesProperties,
  };
});
