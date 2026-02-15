<template>
  <el-dialog
    v-model="visible"
    title="Créer un rappel"
    width="600px"
    :close-on-click-modal="false"
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

      <el-form-item label="Partage">
        <el-checkbox v-model="form.sharing" label="Partager avec l'agence" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">Annuler</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave(false)">
        Créer le rappel
      </el-button>
    </template>

    <div class="reminder-actions-section">
      <p class="reminder-actions-hint">
        Vous souhaitez ajouter un autre rappel sur ce bien ?
      </p>
      <el-button type="primary" :loading="saving" @click="handleSave(true)">
        Créer et ajouter un autre
      </el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { useRemindersStore } from '@/stores/reminders';

interface ReminderFormData {
  title: string;
  description: string;
  date: string;
  type: 'rappel' | 'estimation' | 'visite' | 'autre';
  priority: 'low' | 'medium' | 'high';
  sharing: boolean;
}

const props = defineProps<{
  /** ID de la propriété liée */
  propertyId: number;
  /** Adresse pour pré-remplir le titre (ex: "12 Rue de la Paix") */
  propertyAddress?: string;
}>();

const visible = defineModel<boolean>({ default: false });

const remindersStore = useRemindersStore();

const formRef = ref<FormInstance>();
const saving = ref(false);

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

function getDefaultForm(): ReminderFormData {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    title: `Rappel - ${props.propertyAddress || 'Propriété'}`,
    description: '',
    date: tomorrow.toISOString().split('T')[0],
    type: 'rappel',
    priority: 'medium',
    sharing: false,
  };
}

const form = ref<ReminderFormData>(getDefaultForm());

// Quand la dialog s'ouvre, re-init le formulaire
watch(visible, isVisible => {
  if (isVisible) {
    form.value = getDefaultForm();
  }
});

function disabledDate(time: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return time.getTime() < today.getTime();
}

function resetForm() {
  formRef.value?.resetFields();
  form.value = getDefaultForm();
}

async function handleSave(keepOpen: boolean) {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (!valid) return;

    saving.value = true;
    try {
      await remindersStore.addReminder({
        title: form.value.title,
        description: form.value.description,
        date: form.value.date,
        type: form.value.type,
        priority: form.value.priority,
        sharing: form.value.sharing,
        property_id: props.propertyId,
        completed: false,
      });

      ElMessage.success('Rappel créé avec succès !');

      if (keepOpen) {
        form.value = getDefaultForm();
      } else {
        visible.value = false;
        resetForm();
      }
    } catch {
      ElMessage.error('Erreur lors de la création du rappel');
    } finally {
      saving.value = false;
    }
  });
}
</script>

<style scoped>
.reminder-actions-section {
  text-align: center;
  margin-top: 20px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
  border-radius: 0 0 8px 8px;
}

.reminder-actions-hint {
  color: #666;
  font-size: 14px;
  margin-bottom: 10px;
}

.full-width {
  width: 100%;
}
</style>
