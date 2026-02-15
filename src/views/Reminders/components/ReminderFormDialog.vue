<template>
  <el-dialog
    :model-value="visible"
    :title="editingReminder ? 'Modifier le rappel' : 'Nouveau rappel'"
    width="600px"
    @update:model-value="$emit('update:visible', $event)"
    @close="resetForm"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <el-form-item label="Titre" prop="title">
        <el-input v-model="form.title" placeholder="Titre du rappel" />
      </el-form-item>

      <el-form-item label="Description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="Description du rappel"
        />
      </el-form-item>

      <el-form-item label="Date" prop="date">
        <el-date-picker
          v-model="form.date"
          type="date"
          placeholder="Sélectionnez une date"
          class="full-width"
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
          :disabled-date="disabledDate"
        />
      </el-form-item>

      <el-form-item label="Type">
        <el-select v-model="form.type" class="full-width">
          <el-option label="Rappel" value="rappel" />
          <el-option label="Estimation" value="estimation" />
          <el-option label="Visite" value="visite" />
          <el-option label="Autre" value="autre" />
        </el-select>
      </el-form-item>

      <el-form-item label="Priorité">
        <el-select v-model="form.priority" class="full-width">
          <el-option label="Haute" value="high" />
          <el-option label="Moyenne" value="medium" />
          <el-option label="Basse" value="low" />
        </el-select>
      </el-form-item>

      <el-form-item label="Statut">
        <el-select v-model="form.status" class="full-width">
          <el-option label="À faire" value="todo" />
          <el-option label="En cours" value="progress" />
          <el-option label="Terminé" value="completed" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">Annuler</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">
        {{ editingReminder ? 'Sauvegarder' : 'Créer' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import type { Reminder } from '@/stores/reminders';

export interface ReminderFormData {
  title: string;
  description: string;
  date: string;
  type: 'rappel' | 'estimation' | 'visite' | 'autre';
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'progress' | 'completed';
  sharing: boolean;
  property_id: number;
}

const props = defineProps<{
  visible: boolean;
  editingReminder: Reminder | null;
  saving?: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  save: [form: ReminderFormData, editingReminder: Reminder | null];
}>();

const formRef = ref<FormInstance>();

const rules: FormRules<ReminderFormData> = {
  title: [
    { required: true, message: 'Le titre est requis', trigger: 'blur' },
    {
      min: 2,
      message: 'Le titre doit contenir au moins 2 caractères',
      trigger: 'blur',
    },
  ],
  date: [{ required: true, message: 'La date est requise', trigger: 'change' }],
};

const getEmptyForm = (): ReminderFormData => ({
  title: '',
  description: '',
  date: '',
  type: 'rappel',
  priority: 'medium',
  status: 'todo',
  sharing: false,
  property_id: 0,
});

const form = ref<ReminderFormData>(getEmptyForm());

/** Interdit les dates passées (sauf en édition si la date est déjà passée) */
function disabledDate(time: Date): boolean {
  if (props.editingReminder) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return time.getTime() < today.getTime();
}

// Populate form when editing a reminder
watch(
  () => props.editingReminder,
  reminder => {
    if (reminder) {
      form.value = {
        title: reminder.title,
        description: reminder.description || '',
        date: reminder.date,
        type: reminder.type,
        priority: reminder.priority,
        status: reminder.status || (reminder.completed ? 'completed' : 'todo'),
        sharing: reminder.sharing || false,
        property_id: reminder.property_id,
      };
    } else {
      form.value = getEmptyForm();
    }
  }
);

const resetForm = () => {
  formRef.value?.resetFields();
  form.value = getEmptyForm();
};

const handleSave = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(valid => {
    if (valid) {
      emit('save', { ...form.value }, props.editingReminder);
    }
  });
};
</script>

<style scoped>
.full-width {
  width: 100%;
}
</style>
