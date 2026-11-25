import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { PropertyService } from '@/api';
import type { IProperty } from '@/types/property';
import { getPersonalPropertyTarget, personalPropertyKey, PersonalPropertyService } from '@/api/personal-property.service';
import type { FavoriteAddress } from '@/api/personal-property.service';
import { useUserStore } from '@/stores/user';

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
  const initialDialogTab = ref<string | null>(null);
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

    let normalizedProperty: any = {
      ...property,
      id:
        Number((property as any).id ?? 0) > 0
          ? Number((property as any).id)
          : Number((property as any).property_id ?? 0) > 0
            ? Number((property as any).property_id)
            : 0,

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

    if (propertyId <= 0 && Number((property as any).property_id ?? 0) > 0) {
      normalizedProperty.id = Number((property as any).property_id);
    }

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
        console.error(
          'PROPERTY UNIT SANS ID AU MOMENT SAVE =',
          normalizedProperty
        );

        throw new Error(
          `Sécurité : impossible de créer une nouvelle property unit sans id. unit_id=${unitId}. La fiche ouverte depuis reminder a perdu son property.id.`
        );
      }

      console.log('CREATE PROPERTY FROM SAVE PROPERTY', normalizedProperty);

      response = await PropertyService.createProperty(normalizedProperty);
    }

    const resp: any = response;

    saved = resp?.property ?? resp?.data?.property ?? resp?.data ?? resp;

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
    if (savedNormalized.unit_id) savedNormalized.lot_number = undefined;

    if (propertyId > 0) {
      updatePropertyInStore(savedNormalized);
    } else {
      addProperty(savedNormalized);
    }

    selectedProperty.value = {
      ...selectedProperty.value,
      ...savedNormalized,
    };

    const favorite = findFavorite(savedNormalized);
    if (favorite) {
      revision++;
      Object.assign(favorite, saved, { favorite: true });
    }

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
          (data as any).unit_id ?? (property as any).unit_id ?? null;

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
        nom_commune:
          (property as any).nom_commune || (property as any).city || '',

        favorite: Number((property as any).favorite ?? 0) === 1,

        unit_id: unitId,
        unit: (property as any).unit ?? null,

        row_type: (property as any).row_type || (unitId ? 'unit' : 'address'),

        property_type: (property as any).property_type ?? 'inconnu',
      };
    } catch (error: any) {
      console.error('Erreur selectProperty:', error);

      const rawUnitId = Number((property as any).unit_id ?? 0);
      const unitId = rawUnitId > 0 ? rawUnitId : null;

      selectedProperty.value = {
        ...defaultPropertyData,
        ...property,

        // A failed detail request does not make an existing CRM record a new one.
        id: Number(property.id) > 0 ? Number(property.id) : 0,

        city: (property as any).city || (property as any).nom_commune || '',
        nom_commune:
          (property as any).nom_commune || (property as any).city || '',

        favorite: Number((property as any).favorite ?? 0) === 1,

        unit_id: unitId,
        unit: (property as any).unit ?? null,

        row_type: (property as any).row_type || (unitId ? 'unit' : 'address'),

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

      row_type: property.row_type || (unitId ? 'unit' : 'address'),

      favorite: Boolean(property.favorite),
    };
  }
  function setDialogVisible(visible: boolean, tab: string | null = null) {
    if (visible) initialDialogTab.value = tab;
    isDialogVisible.value = visible;
  }

  const favoriteAddresses = ref<FavoriteAddress[]>([]);
  const favoritesByKey = computed(() => new Map(
    favoriteAddresses.value.map(favorite => [favorite.row_id, favorite])
  ));
  const userStore = useUserStore();
  let loaded = false;
  let revision = 0;
  let loading: Promise<void> | undefined;
  const pendingFavorites = new Set<string>();

  watch(() => userStore.token, () => {
    revision++;
    loaded = false;
    loading = undefined;
    favoriteAddresses.value = [];
    pendingFavorites.clear();
  }, { flush: 'sync' });

  watch(isDialogVisible, visible => {
    if (visible && !loaded) {
      void loadFavoriteAddresses().catch(error => console.error('Chargement des favoris', error));
    }
  });

  function findFavorite(row: any) {
    const target = getPersonalPropertyTarget(row);
    if (!target) return undefined;
    const key = personalPropertyKey(target);

    return favoritesByKey.value.get(key) ??
      (Number(row.id) > 0 ? favoritesByKey.value.get(`custom_property:${row.id}`) : undefined);
  }

  function loadFavoriteAddresses() {
    if (loading) return loading;
    const version = revision;
    const request = PersonalPropertyService.getFavorites()
      .then(rows => {
        if (version !== revision) return;
        favoriteAddresses.value = rows;
        loaded = true;
      })
      .finally(() => {
        if (loading === request) loading = undefined;
      });
    loading = request;
    return request;
  }

  async function setFavorite(row: any, enabled?: boolean): Promise<boolean> {
    const target = getPersonalPropertyTarget(row);
    if (!target) throw new Error('Bien sans identifiant de favori.');
    const sessionToken = userStore.token;
    const pendingKey = personalPropertyKey(target);
    if (pendingFavorites.has(pendingKey)) return !!findFavorite(row);
    pendingFavorites.add(pendingKey);

    try {
      if (!loaded && enabled === undefined) await loadFavoriteAddresses();
      if (sessionToken !== userStore.token) throw new Error('Session modifiée.');
      const existing = findFavorite(row);
      const favorite = enabled ?? !existing;
      const resolved = existing ? getPersonalPropertyTarget(existing)! : target;
      const added = favorite
        ? await PersonalPropertyService.addFavorite(resolved)
        : await PersonalPropertyService.removeFavorite(resolved);

      if (sessionToken === userStore.token) {
        revision++;
        const key = added?.row_id ?? personalPropertyKey(resolved);
        const remaining = favoriteAddresses.value.filter(item => item.row_id !== key);
        favoriteAddresses.value = added ? [added, ...remaining] : remaining;
      }
      return favorite;
    } finally {
      if (sessionToken === userStore.token) pendingFavorites.delete(pendingKey);
    }
  }

  const setFavoritesViewType = (viewType: 'table' | 'card') => {
    favoritesViewType.value = viewType;
  };

  return {
    properties,
    selectedProperty,
    isDialogVisible,
    initialDialogTab,
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
    favoriteAddresses,
    setFavorite,
    isFavorite: (row: any) => !!findFavorite(row),
    loadFavoriteAddresses,
  };
});
