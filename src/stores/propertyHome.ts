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
  price: null,
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
    let response;
    let saved: any;

    const propertyId = Number(property.id ?? 0);

    console.log('STORE saveProperty property.id =', property.id);
    console.log('STORE saveProperty propertyId =', propertyId);

    if (propertyId > 0) {
      response = await PropertyService.updateProperty(propertyId, property);
    } else {
      console.log('CREATE PROPERTY FROM FAVORITE', property);
      response = await PropertyService.createProperty(property);
    }

    // Normalisation de la réponse API
    const resp: any = response;

    saved = resp?.property ?? resp?.data?.property ?? resp?.data ?? resp;

    console.log('STORE saveProperty normalized saved =', saved);

    if (!saved || Number(saved.id ?? 0) <= 0) {
      throw new Error("La propriété sauvegardée ne contient pas d'id valide");
    }

    if (propertyId > 0) {
      updatePropertyInStore(saved);
    } else {
      addProperty(saved);
    }

    return saved;
  };

  function updatePropertyInStore(updatedProperty: Partial<IProperty>) {
    const index = properties.value.findIndex(
      p =>
        p.id === updatedProperty.id ||
        (p.unit_id &&
          updatedProperty.unit_id &&
          p.unit_id === updatedProperty.unit_id) ||
        (!p.unit_id &&
          !updatedProperty.unit_id &&
          p.id_fantoir_long === updatedProperty.id_fantoir_long)
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
        (p.unit_id && property.unit_id && p.unit_id === property.unit_id) ||
        (!p.unit_id &&
          !property.unit_id &&
          p.id_fantoir_long === property.id_fantoir_long)
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
            Number(
              (data as any).favorite ?? (property as any).favorite ?? 0
            ) === 1,
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
    propertyId: number | string,
    sourceRow: any = null
  ): Promise<any> => {
    const numericId = Number(propertyId);
    const rowType = String(sourceRow?.row_type ?? '')
      .trim()
      .toLowerCase();

    console.log('TOGGLE FAVORITE CALLED', {
      propertyId,
      numericId,
      rowType,
      sourceRow,
    });

    // =========================
    // CAS 1 : property existe déjà
    // =========================
    if (numericId > 0) {
      const existingResponse: any =
        await PropertyService.getProperty(numericId);

      const existing =
        existingResponse?.property ??
        existingResponse?.data?.property ??
        existingResponse?.data ??
        existingResponse;

      console.log('EXISTING PROPERTY FOR FAVORITE =', existing);

      if (!existing || !existing.id) {
        throw new Error('Propriété introuvable');
      }

      const updatedProperty: any = {
        ...existing,
        favorite: existing.favorite ? 0 : 1,
      };

      await PropertyService.updateProperty(
        Number(updatedProperty.id),
        updatedProperty
      );

      updatePropertyInStore(updatedProperty);

      if (
        selectedProperty.value &&
        Number(selectedProperty.value.id) === Number(updatedProperty.id)
      ) {
        selectedProperty.value = {
          ...selectedProperty.value,
          ...updatedProperty,
        } as any;
      }

      return updatedProperty;
    }

    // =========================
    // CAS 2 : adresse racine sans property encore créée
    // =========================
    if (rowType === 'address') {
      const propertyToCreate: any = {
        ...defaultPropertyData,
        ...sourceRow,
        id: 0,
        unit_id: 0,
        row_type: 'address',
        id_fantoir_long: String(sourceRow?.id_fantoir_long || ''),
        id_fantoir: sourceRow?.id_fantoir || '',
        code_insee: sourceRow?.code_insee || '',
        code_postal: sourceRow?.code_postal || '',
        nom_voie: sourceRow?.nom_voie || '',
        numero: sourceRow?.numero || '',
        rep: sourceRow?.rep || '',
        city: sourceRow?.city || sourceRow?.nom_commune || '',
        nom_commune: sourceRow?.nom_commune || sourceRow?.city || '',
        favorite: 1,
      };

      console.log('CREATE ROOT PROPERTY FROM FAVORITE', propertyToCreate);

      const createdResponse: any =
        await PropertyService.createProperty(propertyToCreate);

      const created =
        createdResponse?.property ??
        createdResponse?.data?.property ??
        createdResponse?.data ??
        createdResponse;

      console.log('CREATED ROOT PROPERTY =', created);

      if (!created || !created.id) {
        throw new Error("La property racine n'a pas été créée correctement");
      }

      addProperty(created);

      if (sourceRow) {
        sourceRow.id = created.id;
        sourceRow.favorite = created.favorite;
      }

      if (
        selectedProperty.value &&
        selectedProperty.value.row_type === 'address' &&
        selectedProperty.value.id_fantoir_long === created.id_fantoir_long
      ) {
        selectedProperty.value = {
          ...selectedProperty.value,
          ...created,
        } as any;
      }

      return created;
    }

    throw new Error("La fiche du logement n'est pas encore créée.");
  };

  /*const isFavorite = (propertyId: number): boolean => {
    const property = properties.value.find(
      p => Number(p.id) === Number(propertyId)
    );

    return Boolean(property?.favorite);
  };*/

   const isFavorite = (propertyIdentifier: number | string): boolean => {
  const property = properties.value.find(
    p =>
      Number(p.id) === Number(propertyIdentifier) ||
      String(p.id_fantoir_long) === String(propertyIdentifier)
  );

  return Boolean(property?.favorite);
};

const favoriteAddresses = ref<any[]>([]);

const loadFavoriteAddresses = async () => {
  const rows = await PropertyService.getFavoriteAddresses();

  favoriteAddresses.value = rows.map((row: any) => ({
    ...defaultPropertyData,
    ...row,
    numero: String(row.numero ?? ''),
    city: row.city || row.nom_commune || '',
    nom_commune: row.nom_commune || row.city || '',
    favorite:
      row.favorite === true ||
      row.favorite === 1 ||
      row.favorite === '1',
  }));
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
