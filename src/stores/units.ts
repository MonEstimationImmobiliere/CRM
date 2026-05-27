import { defineStore } from 'pinia';
import { ref } from 'vue';
import { UnitService } from '@/api';
import type { IUnit } from '@/types/unit';

export const useUnitStore = defineStore('unit', () => {
  const unit = ref<IUnit>({
    id: null,

    id_fantoir_long: '',
    id_fantoir: '',

    code_insee: '',
    code_postal: '',

    nom_voie: '',

    numero: null,
    rep: null,

    city: null,

    unit_type: null,
    unit_label: null,

    apart_number: null,
    floor_number: null,

    staircase: null,
    building: null,

    lot_number: null,
  });

  const loading = ref(false);
  const error = ref<string | null>(null);

  const resetUnit = () => {
    unit.value = {
      id: null,

      id_fantoir_long: '',
      id_fantoir: '',

      code_insee: '',
      code_postal: '',

      nom_voie: '',

      numero: null,
      rep: null,

      city: null,

      unit_type: null,
      unit_label: null,

      apart_number: null,
      floor_number: null,

      staircase: null,
      building: null,

      lot_number: null,
    };
  };

  const setUnit = (data: Partial<IUnit>) => {
    unit.value = {
      ...unit.value,
      ...data,
    };
  };

  const saveUnit = async () => {
    loading.value = true;
    error.value = null;

    try {
      console.log('SAVE UNIT PAYLOAD', unit.value);

      const savedUnit = await UnitService.save(unit.value);

      unit.value = {
        ...unit.value,
        ...savedUnit,
      };

      return savedUnit;
    } catch (err: any) {
      error.value =
        err?.response?.data?.message ||
        err?.message ||
        'Erreur lors de la sauvegarde de l’unité';

      console.error('UNIT SAVE ERROR', err);

      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    unit,
    loading,
    error,

    resetUnit,
    setUnit,
    saveUnit,
  };
});