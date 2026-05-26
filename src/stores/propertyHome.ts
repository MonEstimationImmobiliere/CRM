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
  row_type: 'address',
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

  const normalizedProperty = {
    ...property,
    unit_id:
      Number((property as any).unit_id ?? 0) > 0
        ? Number((property as any).unit_id)
        : null,

    row_type:
      (property as any).row_type ||
      (Number((property as any).unit_id ?? 0) > 0 ? 'unit' : 'address'),
  };

  const propertyId = Number(normalizedProperty.id ?? 0);
  const unitId = Number(normalizedProperty.unit_id ?? 0);

  console.log('STORE saveProperty full property =', property);
  console.log('STORE saveProperty normalizedProperty =', normalizedProperty);
  console.log('STORE saveProperty propertyId =', propertyId);
  console.log('STORE saveProperty unitId =', unitId);

  if (propertyId > 0) {
    response = await PropertyService.updateProperty(
      propertyId,
      normalizedProperty
    );
  } else {
    if (unitId > 0) {
      throw new Error(
        `Impossible de créer une nouvelle property pour unit_id=${unitId} sans property.id. La fiche a perdu son ID.`
      );
    }

    console.log('CREATE PROPERTY FROM SAVE PROPERTY', normalizedProperty);

    response = await PropertyService.createProperty(normalizedProperty);
  }

  const resp: any = response;

  saved =
    resp?.property ??
    resp?.data?.property ??
    resp?.data ??
    resp;

  console.log('STORE saveProperty normalized saved =', saved);

  if (!saved || Number(saved.id ?? 0) <= 0) {
    throw new Error("La propriété sauvegardée ne contient pas d'id valide");
  }

  const savedNormalized = {
    ...normalizedProperty,
    ...saved,

    id: Number(saved.id),
    row_type:
      saved.row_type ||
      normalizedProperty.row_type ||
      (Number(saved.unit_id ?? normalizedProperty.unit_id ?? 0) > 0
        ? 'unit'
        : 'address'),

    unit_id:
      Number(saved.unit_id ?? normalizedProperty.unit_id ?? 0) > 0
        ? Number(saved.unit_id ?? normalizedProperty.unit_id)
        : null,

    favorite:
      saved.favorite === true ||
      saved.favorite === 1 ||
      saved.favorite === '1',
  };

  if (propertyId > 0) {
    updatePropertyInStore(savedNormalized);
  } else {
    addProperty(savedNormalized);
  }

  selectedProperty.value = {
    ...selectedProperty.value,
    ...savedNormalized,
  };

  console.log('STORE selectedProperty AFTER SAVE =', selectedProperty.value);

  return savedNormalized;
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

      const unitId =
        (data as any).unit_id ??
        (property as any).unit_id ??
        null;

      selectedProperty.value = {
        ...defaultPropertyData,
        ...property,
        ...data,

        city: (data as any).city || (data as any).nom_commune || '',
        nom_commune: (data as any).nom_commune || (data as any).city || '',

        favorite:
          Number((data as any).favorite ?? (property as any).favorite ?? 0) === 1,

        unit_id: unitId,
        unit: (data as any).unit ?? (property as any).unit ?? null,

        row_type:
          (property as any).row_type ??
          (data as any).row_type ??
          (unitId ? 'unit' : 'address'),

        property_type:
          (data as any).property_type ??
          (property as any).property_type ??
          'inconnu',
      };

      return;
    }

    // Cas 2 : pas encore de property en base
    const rawUnitId = Number((property as any).unit_id ?? 0);
const unitId = rawUnitId > 0 ? rawUnitId : null;

    selectedProperty.value = {
      ...defaultPropertyData,
      ...property,

      city: (property as any).city || (property as any).nom_commune || '',
      nom_commune: (property as any).nom_commune || (property as any).city || '',

      favorite: Number((property as any).favorite ?? 0) === 1,

      unit_id: unitId,
      unit: (property as any).unit ?? null,

      row_type:
        (property as any).row_type ||
        (unitId ? 'unit' : 'address'),

      property_type: (property as any).property_type ?? 'inconnu',
    };
  } catch (error: any) {
    console.error('Erreur selectProperty:', error);

    const rawUnitId = Number((property as any).unit_id ?? 0);
const unitId = rawUnitId > 0 ? rawUnitId : null;

    selectedProperty.value = {
      ...defaultPropertyData,
      ...property,

      id: 0,

      city: (property as any).city || (property as any).nom_commune || '',
      nom_commune: (property as any).nom_commune || (property as any).city || '',

      favorite: Number((property as any).favorite ?? 0) === 1,

      unit_id: unitId,
      unit: (property as any).unit ?? null,

      row_type:
        (property as any).row_type ||
        (unitId ? 'unit' : 'address'),

      property_type: (property as any).property_type ?? 'inconnu',
    };
  }
};

function loadPropertyBaseData(property: any) {
  const rawUnitId = Number(property?.unit_id ?? 0);
  const unitId = rawUnitId > 0 ? rawUnitId : null;

  selectedProperty.value = {
    ...defaultPropertyData,
    ...property,

    id_fantoir_long: property.id_fantoir_long,
    city: property.city || property.nom_commune || '',
    nom_commune: property.nom_commune || property.city || '',

    unit_id: unitId,

    row_type:
      property.row_type ||
      (unitId ? 'unit' : 'address'),

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

  const unitId = Number(sourceRow?.unit_id ?? 0);

  console.log('TOGGLE FAVORITE CALLED', {
    propertyId,
    numericId,
    rowType,
    unitId,
    sourceRow,
  });

  // =========================
  // CAS 1 : property existe déjà
  // =========================
  if (numericId > 0) {
    const existingResponse: any = await PropertyService.getProperty(numericId);

    const existing =
      existingResponse?.property ??
      existingResponse?.data?.property ??
      existingResponse?.data ??
      existingResponse;

    if (!existing || !existing.id) {
      throw new Error('Propriété introuvable');
    }

    const updatedProperty: any = {
      ...existing,
      favorite: existing.favorite ? 0 : 1,
    };

    const updatedResponse: any = await PropertyService.updateProperty(
      Number(updatedProperty.id),
      updatedProperty
    );

    const updated =
      updatedResponse?.property ??
      updatedResponse?.data?.property ??
      updatedResponse?.data ??
      updatedProperty;

    updatePropertyInStore(updated);

    if (sourceRow) {
      sourceRow.id = updated.id;
      sourceRow.favorite = updated.favorite;
      sourceRow.unit_id = updated.unit_id ?? sourceRow.unit_id ?? 0;
      sourceRow.property_type =
        updated.property_type ?? sourceRow.property_type;
    }

    if (
      selectedProperty.value &&
      Number(selectedProperty.value.id) === Number(updated.id)
    ) {
      selectedProperty.value = {
        ...selectedProperty.value,
        ...updated,
      } as any;
    }

    return updated;
  }

  // =========================
  // CAS 2 : unit sans property encore créée
  // =========================
  if (rowType === 'unit') {
    if (!unitId || unitId <= 0) {
      throw new Error("Impossible de créer la property : unit_id manquant");
    }

    const propertyToCreate: any = {
      ...defaultPropertyData,

      id: 0,
      row_type: 'unit',
      unit_id: unitId,

      id_fantoir_long: String(sourceRow?.id_fantoir_long || ''),
      id_fantoir: sourceRow?.id_fantoir || '',
      code_insee: sourceRow?.code_insee || '',
      code_postal: sourceRow?.code_postal || '',
      nom_voie: sourceRow?.nom_voie || '',
      numero: sourceRow?.numero || '',
      rep: sourceRow?.rep || '',
      city: sourceRow?.city || sourceRow?.nom_commune || '',
      nom_commune: sourceRow?.nom_commune || sourceRow?.city || '',

      property_type:
        sourceRow?.property_type ||
        sourceRow?.type_code ||
        sourceRow?.unit_type ||
        'appartement',

      favorite: 1,
    };

    console.log('CREATE UNIT PROPERTY FROM FAVORITE', propertyToCreate);

    const createdResponse: any =
      await PropertyService.createProperty(propertyToCreate);

    const created =
      createdResponse?.property ??
      createdResponse?.data?.property ??
      createdResponse?.data ??
      createdResponse;

    if (!created || !created.id) {
      throw new Error("La property unit n'a pas été créée correctement");
    }

    addProperty(created);

    if (sourceRow) {
      sourceRow.id = created.id;
      sourceRow.favorite = created.favorite;
      sourceRow.unit_id = created.unit_id ?? unitId;
      sourceRow.property_type = created.property_type;
    }

    if (
      selectedProperty.value &&
      selectedProperty.value.row_type === 'unit' &&
      Number(selectedProperty.value.unit_id) === unitId
    ) {
      selectedProperty.value = {
        ...selectedProperty.value,
        ...created,
      } as any;
    }

    return created;
  }

  // =========================
  // CAS 3 : adresse racine sans property encore créée
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

      property_type:
        sourceRow?.property_type ||
        sourceRow?.type_code ||
        'immeuble',

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

    if (!created || !created.id) {
      throw new Error("La property racine n'a pas été créée correctement");
    }

    addProperty(created);

    if (sourceRow) {
      sourceRow.id = created.id;
      sourceRow.favorite = created.favorite;
      sourceRow.unit_id = 0;
      sourceRow.property_type = created.property_type;
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

  throw new Error("Impossible de déterminer le type de ligne pour le favori.");
};

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
        row.favorite === true || row.favorite === 1 || row.favorite === '1',
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
    favoriteAddresses,
    toggleFavorite,
    isFavorite,
    loadFavoriteAddresses,
    loadFavoritesProperties,
  };
});
