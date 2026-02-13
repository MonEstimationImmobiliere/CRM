import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { PropertyService } from '@/api';
import type { IProperty } from '@/types/property';

const defaultPropertyData: Partial<IProperty> = {
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
  property_type: null,
  year_built: new Date().getFullYear(),
  year_buy: new Date().getFullYear(),
  surface: 0,
  area: 0,
  orientation: null,
  property_condition: null,
  bedrooms: 0,
  bathrooms: 0,
  fitted_kitchen: false,
  equipped_kitchen: false,
  american_kitchen: false,
  scullery: false,
  heating_type: null,
  window: '',
  window_type: null,
  shutter: '',
  cheminee: false,
  district_heating: false,
  patio: false,
  garage: 0,
  pool: false,
  veranda: false,
  garden: false,
  parking: false,
  carport: 0,
  kitchen_ext: false,
  elevator: false,
  balcony: false,
  cellar: false,
  bike_room: false,
  guardian: false,
  roof: null,
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
  const properties = ref<Partial<IProperty>[]>([]);
  const selectedProperty = ref<Partial<IProperty> | null>(null);
  const isDialogVisible = ref<boolean>(false);
  const favoritesViewType = ref<'table' | 'card'>('card');

  function addProperty(property: Partial<IProperty>) {
    const newProperty = {
      ...property,
      id: Date.now(),
    };
    properties.value.push(newProperty);
  }

  const saveProperty = async (property: Partial<IProperty>) => {
    let saved;

    if (property.id) {
      saved = await PropertyService.updateProperty(property.id, property);
      updatePropertyInStore(saved);
    } else {
      const created = await PropertyService.createProperty(property);
      saved = { ...property, id: created.id };
      addProperty(saved);
    }

    return saved;
  };

  // Fonction pour mettre à jour une propriété dans le store après sauvegarde
  function updatePropertyInStore(updatedProperty: Partial<IProperty>) {
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

  function updateProperty(property: Partial<IProperty>) {
    const index = properties.value.findIndex(
      p =>
        p.id_fantoir_long === property.id_fantoir_long || p.id === property.id
    );

    if (index !== -1) {
      properties.value[index] = {
        ...properties.value[index],
        ...property,
        favorite: Boolean(property.favorite),
      };
    }
  }

  const selectProperty = async (
    property: Partial<IProperty> | null | undefined
  ) => {
    if (property?.id_fantoir_long) {
      try {
        const data = await PropertyService.getPropertyById(
          property.id_fantoir_long
        );
        const normalizedData = {
          ...defaultPropertyData,
          ...data,
          favorite: Boolean(data.favorite),
        };
        selectedProperty.value = normalizedData;
      } catch {
        selectedProperty.value = {
          ...defaultPropertyData,
          ...(property || {}),
        };
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
    let existing = null;

    try {
      existing = await PropertyService.getPropertyById(id_fantoir_long);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        throw err;
      }
    }

    let property: any;

    if (!existing) {
      property = {
        ...defaultPropertyData,
        ...sourceRow,
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
      property = {
        ...existing,
        favorite: !existing.favorite,
      };

      await PropertyService.updateProperty(property.id, property);
    }

    updatePropertyInStore(property);
    return property.favorite;
  };

  const isFavorite = (propertyId: string): boolean => {
    const property = properties.value.find(
      p => p.id_fantoir_long === propertyId
    );
    return Boolean(property?.favorite) || false;
  };

  const loadFavoritesProperties = async () => {
    const favoriteProperties = await PropertyService.getFavorites();

    // Reset existing favorites
    properties.value.forEach(property => {
      if (property.favorite) {
        property.favorite = false;
      }
    });

    // Process favorites from API
    favoriteProperties.forEach(property => {
      const normalizedProperty = {
        ...defaultPropertyData,
        ...property,
        numero: String(property.numero ?? ''),
        favorite: true,
      };

      const existingIndex = properties.value.findIndex(
        p => p.id_fantoir_long === property.id_fantoir_long
      );

      if (existingIndex !== -1) {
        properties.value[existingIndex] = {
          ...properties.value[existingIndex],
          ...normalizedProperty,
        } as (typeof properties.value)[number];
      } else {
        properties.value.push(
          normalizedProperty as (typeof properties.value)[number]
        );
      }
    });
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
