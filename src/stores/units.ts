import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
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
    floor_number: null,
  });
  const loading = ref(false);
  const error = ref<string | null>(null);

  const saveUnit = async () => {
    loading.value = true;
    error.value = null;
    try {
      const savedUnit = await UnitService.save(unit.value);
      unit.value = savedUnit; // Met à jour le store avec les données retournées par l'API
    } catch (err) {
      error.value = 'Erreur lors de la sauvegarde de l’unité';
      console.error(err);
    } finally {
      loading.value = false;
    }
  };

  return { unit, loading, error, saveUnit };
});
