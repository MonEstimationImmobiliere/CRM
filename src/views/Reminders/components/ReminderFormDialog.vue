<template>
  <el-dialog
    :model-value="visible"
    :title="editingReminder ? 'Modifier le rappel' : 'Nouveau rappel'"
    width="600px"
    @update:model-value="$emit('update:visible', $event)"
    @close="resetForm"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
   


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



<el-collapse>
  <el-collapse-item title="Options avancées" name="advanced">
    <el-form-item label="Statut">
      <el-select v-model="form.status" class="full-width">
        <el-option label="À faire" value="todo" />
        <el-option label="En cours" value="progress" />
        <el-option label="Terminé" value="completed" />
      </el-select>
    </el-form-item>

    <el-form-item label="Partager">
      <EMToggleSwitch
        v-model="form.sharing"
        label="Partager ce rappel avec l'agence"
      />
    </el-form-item>
  </el-collapse-item>
</el-collapse>


    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="$emit('update:visible', false)">Annuler</el-button>
        <div class="footer-right">
          <el-button
            v-if="editingReminder && editingReminder.property_id"
            type="info"
            plain
            @click="$emit('open-property', editingReminder!)"
          >
            <el-icon><House /></el-icon>
            Voir la propriété
          </el-button>
          <el-button type="primary" :loading="saving" @click="handleSave">
            {{ editingReminder ? 'Sauvegarder' : 'Créer' }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { House } from '@element-plus/icons-vue';
import EMToggleSwitch from '@/components/OwnReusableComponents/switch/EMToggleSwitch.vue';
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
  'open-property': [reminder: Reminder];
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
  date: new Date().toISOString().split('T')[0],
  type: 'rappel',
priority: 'low',
status: 'todo',
sharing: true,
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

// Populate form when dialog opens or editing target changes
watch(
  [() => props.visible, () => props.editingReminder],
  ([isVisible, reminder]) => {
    if (!isVisible) return;
    if (reminder) {
      form.value = {
        title: reminder.title,
        description: reminder.description || '',
        date: reminder.date,
        type: reminder.type,
        priority: reminder.priority,
        status: reminder.status || (reminder.completed ? 'completed' : 'todo'),
        sharing:
  reminder.sharing === undefined ||
  reminder.sharing === null
    ? true
    : reminder.sharing,
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
      emit(
  'save',
  {
    ...form.value,
    title:
      form.value.type === 'estimation'
        ? 'Estimation'
        : form.value.type === 'visite'
          ? 'Visite'
          : form.value.type === 'autre'
            ? 'Autre'
            : 'Rappel',
  },
  props.editingReminder
);
    }
  });
};
</script>

<style scoped>
.full-width {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.footer-right {
  display: flex;
  gap: 8px;
}
</style>
