<template>
  <el-dialog
    v-model="visible"
    title="Créer un rappel"
    width="600px"
    :close-on-click-modal="false"
    @close="resetForm"
  >
    <el-form :model="form" label-width="120px">
      <el-form-item label="Titre" required>
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

      <el-form-item label="Date" required>
        <el-date-picker
          v-model="form.date"
          type="date"
          placeholder="Sélectionnez une date"
          style="width: 100%"
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
          :disabled-date="disabledDate"
        />
      </el-form-item>

      <el-form-item label="Type">
        <el-select v-model="form.type" style="width: 100%">
          <el-option label="Rappel" value="rappel" />
          <el-option label="Estimation" value="estimation" />
          <el-option label="Visite" value="visite" />
          <el-option label="Autre" value="autre" />
        </el-select>
      </el-form-item>

      <el-form-item label="Priorité">
        <el-select v-model="form.priority" style="width: 100%">
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
      <el-button type="primary" @click="handleSave(false)">
        Créer le rappel
      </el-button>
    </template>

    <div class="reminder-actions-section">
      <p class="reminder-actions-hint">
        Vous souhaitez ajouter un autre rappel sur ce bien ?
      </p>
      <el-button type="primary" @click="handleSave(true)">
        Créer et ajouter un autre
      </el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
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
  form.value = getDefaultForm();
}

function validate(): boolean {
  if (!form.value.title || !form.value.date) {
    ElMessage({
      message: 'Veuillez remplir au moins le titre et la date.',
      type: 'warning',
      duration: 3000,
    });
    return false;
  }
  return true;
}

async function handleSave(keepOpen: boolean) {
  if (!validate()) return;

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

  ElMessage({
    message: 'Rappel créé avec succès !',
    type: 'success',
    duration: 3000,
  });

  if (keepOpen) {
    // Réinitialiser mais garder ouvert
    form.value = getDefaultForm();
  } else {
    visible.value = false;
    resetForm();
  }
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
</style>
