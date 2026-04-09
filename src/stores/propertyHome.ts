import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { PropertyService } from '@/api';
import type { IProperty } from '@/types/property';

const defaultPropertyData: Partial<IProperty> = {
  id_fantoir_long: '',
  id_fantoir: '',
  code_insee: '',
  code_postal: '',
  city: '',
  nom_commune: '',
  nom_voie: '',
  numero: '',
  rep: '',
  unit_id: null as any,
  unit_label: '',
  row_type: '',
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
  const favoritesViewType = ref<'table' | 'card'>('table');

function addProperty(property: Partial<IProperty>) {
  properties.value.push({
    ...property,
    favorite: Boolean(property.favorite),
  });
}

const saveProperty = async (property: Partial<IProperty>) => {
  let saved;
  const propertyId = Number(property.id ?? 0);

  console.log('STORE saveProperty property.id =', property.id);
  console.log('STORE saveProperty propertyId =', propertyId);

  if (propertyId > 0) {
    saved = await PropertyService.updateProperty(propertyId, property);
    updatePropertyInStore(saved);
  } else {
    saved = await PropertyService.createProperty(property);
    addProperty(saved);
  }

  return saved;
};

  function updatePropertyInStore(updatedProperty: Partial<IProperty>) {
    const index = properties.value.findIndex(
      p =>
        p.id === updatedProperty.id ||
        (
          p.unit_id &&
          updatedProperty.unit_id &&
          p.unit_id === updatedProperty.unit_id
        ) ||
        (
          !p.unit_id &&
          !updatedProperty.unit_id &&
          p.id_fantoir_long === updatedProperty.id_fantoir_long
        )
    );

    if (index !== -1) {
      properties.value[index] = {
        ...properties.value[index],
        ...updatedProperty,
        favorite: Boolean(updatedProperty.favorite),
      };
    } else {
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
        p.id === property.id ||
        (
          p.unit_id &&
          property.unit_id &&
          p.unit_id === property.unit_id
        ) ||
        (
          !p.unit_id &&
          !property.unit_id &&
          p.id_fantoir_long === property.id_fantoir_long
        )
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
  if (!property) {
    selectedProperty.value = { ...defaultPropertyData };
    return;
  }

  try {
    // Cas 1 : la property existe déjà en base
    if (property.id && Number(property.id) > 0) {
      const data = await PropertyService.getProperty(Number(property.id));

      selectedProperty.value = {
        ...defaultPropertyData,
        ...property,
        ...data,
        city: (data as any).city || (data as any).nom_commune || '',
        nom_commune: (data as any).nom_commune || (data as any).city || '',
        favorite:
          Number((data as any).favorite ?? (property as any).favorite ?? 0) ===
          1,
        unit_id: (data as any).unit_id ?? (property as any).unit_id ?? null,
        row_type:
          (property as any).row_type ?? (data as any).row_type ?? 'address',
        property_type:
          (data as any).property_type ??
          (property as any).property_type ??
          'inconnu',
      };
      return;
    }

    // Cas 2 : pas encore de property en base
    selectedProperty.value = {
      ...defaultPropertyData,
      ...property,
      city: (property as any).city || (property as any).nom_commune || '',
      nom_commune:
        (property as any).nom_commune || (property as any).city || '',
      favorite: Number((property as any).favorite ?? 0) === 1,
      unit_id: (property as any).unit_id ?? null,
      row_type: (property as any).row_type ?? 'address',
      property_type: (property as any).property_type ?? 'inconnu',
    };
  } catch (error: any) {
    console.error('Erreur selectProperty:', error);

    selectedProperty.value = {
      ...defaultPropertyData,
      ...property,
      id: 0,
      city: (property as any).city || (property as any).nom_commune || '',
      nom_commune:
        (property as any).nom_commune || (property as any).city || '',
      favorite: Number((property as any).favorite ?? 0) === 1,
      unit_id: (property as any).unit_id ?? null,
      row_type: (property as any).row_type ?? 'address',
      property_type: (property as any).property_type ?? 'inconnu',
    };
  }
};

  function loadPropertyBaseData(property: any) {
    selectedProperty.value = {
      ...defaultPropertyData,
      ...property,
      id_fantoir_long: property.id_fantoir_long,
      city: property.city || property.nom_commune || '',
      nom_commune: property.nom_commune || property.city || '',
      unit_id: property.unit_id ?? null,
      favorite: Boolean(property.favorite),
    };
  }

  function setDialogVisible(visible: boolean) {
    isDialogVisible.value = visible;
  }

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
        city: sourceRow?.city || sourceRow?.nom_commune || '',
        nom_commune: sourceRow?.nom_commune || sourceRow?.city || '',
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

    properties.value.forEach(property => {
      if (property.favorite) {
        property.favorite = false;
      }
    });

    favoriteProperties.forEach(property => {
      const normalizedProperty = {
        ...defaultPropertyData,
        ...property,
        numero: String((property as any).numero ?? ''),
        city: (property as any).city || (property as any).nom_commune || '',
        nom_commune:
          (property as any).nom_commune || (property as any).city || '',
        favorite: true,
      };

      const existingIndex = properties.value.findIndex(
        p =>
          p.id === (property as any).id ||
          p.id_fantoir_long === (property as any).id_fantoir_long
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