<template>
  <el-dialog
    v-model="visible"
    title="Créer une unité"
    width="500px"
    destroy-on-close
  >
    <el-form :model="form" label-width="120px">
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
          placeholder="Ex : RDC gauche, 1er droite, Appt 12"
          clearable
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">Annuler</el-button>
        <el-button type="primary" @click="handleSave">Créer</el-button>
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
}

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', payload: UnitFormData): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const form = reactive<UnitFormData>({
  unit_type: 'appartement',
  unit_label: '',
});

watch(
  () => props.modelValue,
  opened => {
    if (opened) {
      form.unit_type = 'appartement';
      form.unit_label = '';
    }
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
  });

  visible.value = false;
};
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
