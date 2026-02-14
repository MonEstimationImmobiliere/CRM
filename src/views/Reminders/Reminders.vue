<template>
  <div class="reminders-page">
    <div class="reminders-header">
      <h1>Mes Rappels</h1>
    </div>

    <!-- Statistics Cards -->
    <ReminderStatsBar
      :overdue-count="overdueReminders.length"
      :today-count="todayReminders.length"
      :upcoming-count="upcomingReminders.length"
      :completed-count="completedReminders.length"
    />

    <!-- Filters -->
    <ReminderFilters
      v-model:active-filter="activeFilter"
      v-model:type-filter="typeFilter"
      v-model:priority-filter="priorityFilter"
    />

    <!-- Add Button -->
    <div class="add-reminder-section">
      <el-button
        type="primary"
        size="large"
        @click="showCreateDialog = true"
        class="add-reminder-btn"
      >
        <el-icon><Plus /></el-icon>
        Nouveau rappel
      </el-button>
    </div>

    <!-- Reminders List -->
    <div class="reminders-list">
      <el-card v-if="filteredReminders.length === 0" class="empty-state">
        <div class="empty-content">
          <el-icon class="empty-icon"><Document /></el-icon>
          <h3>Aucun rappel trouvé</h3>
          <p>{{ emptyMessage }}</p>
          <el-button
            type="primary"
            @click="showCreateDialog = true"
            style="margin-top: 16px"
          >
            <el-icon><Plus /></el-icon>
            Créer mon premier rappel
          </el-button>
        </div>
      </el-card>

      <div v-else class="reminders-grid">
        <ReminderCard
          v-for="reminder in filteredReminders"
          :key="reminder.id"
          :reminder="reminder"
          @action="handleAction"
          @update-status="updateStatus"
        />
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <ReminderFormDialog
      v-model:visible="showCreateDialog"
      :editing-reminder="editingReminder"
      @save="saveReminder"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRemindersStore, type Reminder } from '@/stores/reminders';
import { Plus, Document } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { sortReminders } from '@/utils/reminderHelpers';

import ReminderStatsBar from './components/ReminderStatsBar.vue';
import ReminderFilters from './components/ReminderFilters.vue';
import ReminderCard from './components/ReminderCard.vue';
import ReminderFormDialog from './components/ReminderFormDialog.vue';
import type { ReminderFormData } from './components/ReminderFormDialog.vue';

const remindersStore = useRemindersStore();

// Reactive state
const activeFilter = ref('all');
const typeFilter = ref('');
const priorityFilter = ref('');
const showCreateDialog = ref(false);
const editingReminder = ref<Reminder | null>(null);

// Store destructuring
const {
  todayReminders,
  upcomingReminders,
  overdueReminders,
  completedReminders,
} = remindersStore;

// Filtered & sorted reminders
const filteredReminders = computed(() => {
  let filtered = remindersStore.reminders;

  switch (activeFilter.value) {
    case 'overdue':
      filtered = overdueReminders;
      break;
    case 'today':
      filtered = todayReminders;
      break;
    case 'upcoming':
      filtered = upcomingReminders;
      break;
    case 'completed':
      filtered = completedReminders;
      break;
  }

  if (typeFilter.value) {
    filtered = filtered.filter(r => r.type === typeFilter.value);
  }
  if (priorityFilter.value) {
    filtered = filtered.filter(r => r.priority === priorityFilter.value);
  }

  return sortReminders(filtered);
});

// Empty state message
const emptyMessage = computed(() => {
  const messages: Record<string, string> = {
    overdue: 'Aucun rappel en retard. Excellent !',
    today: "Aucun rappel pour aujourd'hui.",
    upcoming: 'Aucun rappel à venir cette semaine.',
    completed: 'Aucun rappel terminé.',
  };
  return (
    (
  )
    messages[activeFilter.value] ?? 'Commencez par créer votre premier rappel.'
  );
});

 
 ,

 
 ;

// Action handler from ReminderCard dropdown
const handleAction = ({
  action,
  reminder,
}: {
  action: string;
  reminder: Reminder;
}) => {
  if (action === 'edit') editReminder(reminder);
  else if (action === 'delete') deleteReminder(reminder);
  else if (action === 'duplicate') duplicateReminder(reminder);
};

const editReminder = (reminder: Reminder) => {
  editingReminder.value = reminder;
  showCreateDialog.value = true;
};

const duplicateReminder = async (reminder: Reminder) => {
  try {
    await remindersStore.addReminder({
      title: `${reminder.title} (Copie)`,
      description: reminder.description || '',
      date: reminder.date,
      type: reminder.type,
      priority: reminder.priority,
      sharing: reminder.sharing || false,
      property_id: reminder.property_id,
      completed: false,
    });
    ElMessage.success('Rappel dupliqué avec succès');
  } catch {
    ElMessage.error('Erreur lors de la duplication du rappel');
  }
       
       
       ,
     
};

const deleteReminder = async (reminder: Reminder) => {
  try {
    await ElMessageBox.confirm(
      'Êtes-vous sûr de vouloir supprimer ce rappel ?',
      'Confirmation',
      {
        confirmButtonText: 'Supprimer',
        cancelButtonText: 'A
  nnuler',
 

        type: 'warning',
      }
    );
    remindersStore.deleteReminder(reminder.id);
    ElMessage.success('Rappel supprimé avec succès');
  } catch {
    // User cancelled
  }
};

// Save handler from ReminderFormDialog
const saveReminder = async (
  form: ReminderFormData,
  editing: Reminder | null
) => {
  if (!form.title || !form.date) {
    ElMessage.error('Veuillez remplir tous les champs requis');
    return;
  }

  try {
    const payload = { ...form, completed: form.status === 'completed' };

    if (editing) {
      await remindersStore.updateReminder(editing.id, payload);
      ElMessage.success('Rappel modifié avec succès');
    } else {
      await remindersStore.addReminder(payload);
      ElMessage.success('Rappel créé avec succès');
    }

    showCreateDialog.value = false;
     
      editingReminder.value = null;
    } catch {
      ElMessage.error('Erreur lors de la sauvegarde du rappel');
    }
};

// Status update from ReminderCard buttons
const updateStatus = async (
  reminder: Reminder,
  status: 'todo' | 'progress' | 'completed'
) => {
  try {
    await remindersStore.updateReminderStatus(reminder.id, status);

    const messages: Record<string, { msg: string; type: 'success' | 'info' }> =
      {
        completed: { msg: 'Rappel marqué comme terminé', type: 'success' },
        progress: { msg: 'Rappel marqué comme en cours', type: 'info' },
        todo: { msg: 'Rappel marqué comme à faire', type: 'info' },
      };
    const { msg, type } = messages[status];
    ElMessage[type](msg);
  } catch {
    ElMessage.error('Erreur lors de la mise à jour du statut');
  }
};
</script>

<style scoped>
.reminders-page {
  padding: 20px;
}

.reminders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.reminders-header h1 {
  margin: 0;
  color: #1f2937;
  font-size: 2rem;
  font-weight: 600;
}

.add-reminder-section {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}

.add-reminder-btn {
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  min-width: 180px;
}

.reminders-list {
  min-height: 400px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
}

.empty-content {
  max-width: 400px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 4rem;
  color: #94a3b8;
  margin-bottom: 20px;
}

.empty-content h3 {
  color: #374151;
  margin-bottom: 12px;
  font-size: 1.25rem;
}

.empty-content p {
  color: #6b7280;
  font-size: 1rem;
  margin-bottom: 0;
}

.reminders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .reminders-page {
    padding: 16px;
  }

  .reminders-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .reminders-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .add-reminder-btn {
    width: 100%;
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .reminders-page {
    padding: 12px;
  }

  .reminders-header h1 {
    font-size: 1.5rem;
  }

  .empty-state {
    padding: 60px 16px;
  }

  .reminders-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
