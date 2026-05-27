<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="560px"
    destroy-on-close
  >
    <el-form :model="form" label-width="140px">
      <el-form-item label="Type d'unité">
        <el-select
          v-model="form.unit_type"
          placeholder="Choisir un type"
          style="width: 100%"
        >
          <el-option label="Appartement" value="appartement" />
          <el-option label="Local commercial" value="local_commercial" />
          <el-option label="Parking" value="parking" />
          <el-option label="Cave" value="cave" />
        </el-select>
      </el-form-item>

      <el-form-item label="Libellé">
        <el-input
          v-model="form.unit_label"
          :placeholder="unitLabelPlaceholder"
          clearable
        />
      </el-form-item>

      <template v-if="form.unit_type === 'appartement'">
        <el-form-item label="N° appartement">
          <el-input-number
            v-model="form.apart_number"
            :min="1"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Étage">
          <el-input-number
            v-model="form.floor_number"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Bâtiment">
          <el-input
            v-model="form.building"
            placeholder="Ex : Bâtiment A"
            clearable
          />
        </el-form-item>

        <el-form-item label="Escalier">
          <el-input
            v-model="form.staircase"
            placeholder="Ex : Escalier B"
            clearable
          />
        </el-form-item>

        <el-form-item label="N° lot">
          <el-input
            v-model="form.lot_number"
            placeholder="Ex : Lot 44"
            clearable
          />
        </el-form-item>
      </template>

      <template v-else-if="form.unit_type === 'local_commercial'">
        <el-form-item label="Étage">
          <el-input-number
            v-model="form.floor_number"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="N° lot">
          <el-input
            v-model="form.lot_number"
            placeholder="Ex : Local 2, Lot 12"
            clearable
          />
        </el-form-item>
      </template>

      <template v-else-if="form.unit_type === 'parking'">
        <el-form-item label="N° parking / lot">
          <el-input
            v-model="form.lot_number"
            placeholder="Ex : P12, Parking 44"
            clearable
          />
        </el-form-item>

        <el-form-item label="Bâtiment">
          <el-input
            v-model="form.building"
            placeholder="Ex : Sous-sol bâtiment A"
            clearable
          />
        </el-form-item>
      </template>

      <template v-else-if="form.unit_type === 'cave'">
        <el-form-item label="N° cave / lot">
          <el-input
            v-model="form.lot_number"
            placeholder="Ex : Cave 8, Lot C12"
            clearable
          />
        </el-form-item>

        <el-form-item label="Bâtiment">
          <el-input
            v-model="form.building"
            placeholder="Ex : Bâtiment B"
            clearable
          />
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">Annuler</el-button>
        <el-button type="primary" @click="handleSave">
          {{ isEditing ? 'Modifier' : 'Créer' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { ElMessage } from 'element-plus';

interface UnitFormData {
  unit_type: string;
  unit_label: string;
  apart_number: number | null;
  floor_number: number | null;
  staircase: string;
  building: string;
  lot_number: string;
}

const props = defineProps<{
  modelValue: boolean;
  editingUnit?: Partial<UnitFormData> & { id?: number | null };
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', payload: UnitFormData): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const isEditing = computed(() => !!props.editingUnit?.id);

const dialogTitle = computed(() =>
  isEditing.value ? "Modifier l'unité" : 'Créer une unité'
);

const form = reactive<UnitFormData>({
  unit_type: 'appartement',
  unit_label: '',
  apart_number: null,
  floor_number: null,
  staircase: '',
  building: '',
  lot_number: '',
});

const unitLabelPlaceholder = computed(() => {
  if (form.unit_type === 'appartement') return 'Ex : RDC gauche, Appt 12';
  if (form.unit_type === 'local_commercial') return 'Ex : Local RDC, cellule 2';
  if (form.unit_type === 'parking') return 'Ex : Parking sous-sol, place P12';
  if (form.unit_type === 'cave') return 'Ex : Cave sous-sol, cave 8';
  return 'Libellé libre';
});

const resetForm = () => {
  form.unit_type = 'appartement';
  form.unit_label = '';
  form.apart_number = null;
  form.floor_number = null;
  form.staircase = '';
  form.building = '';
  form.lot_number = '';
};

const fillFormFromUnit = () => {
  const unit = props.editingUnit;

  form.unit_type = unit?.unit_type ?? 'appartement';
  form.unit_label = unit?.unit_label ?? '';
  form.apart_number = unit?.apart_number ?? null;
  form.floor_number = unit?.floor_number ?? null;
  form.staircase = unit?.staircase ?? '';
  form.building = unit?.building ?? '';
  form.lot_number = unit?.lot_number ?? '';
};

watch(
  () => props.modelValue,
  opened => {
    if (!opened) return;

    if (props.editingUnit) {
      fillFormFromUnit();
    } else {
      resetForm();
    }
  }
);

watch(
  () => props.editingUnit,
  () => {
    if (props.modelValue && props.editingUnit) {
      fillFormFromUnit();
    }
  },
  { deep: true }
);

watch(
  () => form.unit_type,
  (newType, oldType) => {
    if (!oldType || newType === oldType) return;

    form.unit_label = '';
    form.apart_number = null;
    form.floor_number = null;
    form.staircase = '';
    form.building = '';
    form.lot_number = '';
  }
);

const closeDialog = () => {
  visible.value = false;
};

const handleSave = () => {
  if (!form.unit_type) {
    ElMessage.error("Le type d'unité est obligatoire");
    return;
  }

  emit('save', {
    unit_type: form.unit_type,
    unit_label: form.unit_label?.trim() || '',
    apart_number: form.unit_type === 'appartement' ? form.apart_number : null,
    floor_number:
      form.unit_type === 'appartement' ||
      form.unit_type === 'local_commercial'
        ? form.floor_number
        : null,
    staircase:
      form.unit_type === 'appartement' ? form.staircase?.trim() || '' : '',
    building:
      form.unit_type === 'appartement' ||
      form.unit_type === 'parking' ||
      form.unit_type === 'cave'
        ? form.building?.trim() || ''
        : '',
    lot_number: form.lot_number?.trim() || '',
  });
};
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>