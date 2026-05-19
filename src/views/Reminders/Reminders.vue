<template>
  <div class="reminders-page">
    <!-- Header bar: title + add button + view toggle -->
    <EMCard class="headerFilterInfoContainer" :border-hover="false">
      <div class="headerTopRow">
        <h2>Mes Rappels</h2>

        <div class="headerRightContainer">
          <ViewToggle v-model="currentRemindersView" :options="viewOptions" />
        </div>
      </div>

      <div class="headerBottomRow">
        <!-- Filters -->
        <!-- <ReminderFilters
          v-model:active-filter="activeFilter"
          v-model:type-filter="typeFilter"
          v-model:priority-filter="priorityFilter"
        /> -->
        <el-button
          type="primary"
          @click="showCreateDialog = true"
          class="add-reminder-btn"
        >
          <el-icon><Plus /></el-icon>
          Nouveau rappel
        </el-button>
      </div>
    </EMCard>

    <!-- Statistics Cards -->

    <!-- <ReminderStatsBar
      :overdue-count="overdueReminders.length"
      :today-count="todayReminders.length"
      :upcoming-count="upcomingReminders.length"
      :completed-count="completedReminders.length"
    /> -->

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

      <!-- Table View -->
      <RemindersTable
        v-else-if="currentRemindersView === 'table'"
        :reminders="filteredReminders"
        @action="handleAction"
        @update-status="updateStatus"
      />

      <!-- Card View -->
      <div v-else-if="currentRemindersView === 'card'" class="reminders-grid">
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
      :saving="saving"
      @save="saveReminder"
      @open-property="openPropertyById"
    />

    <!-- Property Dialog -->
    <PropertyForm />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRemindersStore, type Reminder } from '@/stores/reminders';
import { usePropertyStore } from '@/stores/propertyHome';
import { Plus, Document } from '@element-plus/icons-vue';
import { DataBoard, Grid } from '@element-plus/icons-vue';
import ViewToggle from '@/components/ViewToggle.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { sortReminders } from '@/utils/reminderHelpers';

import ReminderFilters from './components/ReminderFilters.vue';
import ReminderCard from './components/ReminderCard.vue';
import RemindersTable from './components/RemindersTable.vue';
import ReminderFormDialog from './components/ReminderFormDialog.vue';
import PropertyForm from '@/views/DashboardComponents/PropertyDialog/index.vue';
import type { ReminderFormData } from './components/ReminderFormDialog.vue';

const remindersStore = useRemindersStore();
const propertyStore = usePropertyStore();

// Reactive state
const activeFilter = ref('all');
const typeFilter = ref('');
const priorityFilter = ref('');
const showCreateDialog = ref(false);
const editingReminder = ref<Reminder | null>(null);
const saving = ref(false);

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
    messages[activeFilter.value] ?? 'Commencez par créer votre premier rappel.'
  );
});

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
};

const deleteReminder = async (reminder: Reminder) => {
  try {
    await ElMessageBox.confirm(
      'Êtes-vous sûr de vouloir supprimer ce rappel ?',
      'Confirmation',
      {
        confirmButtonText: 'Supprimer',
        cancelButtonText: 'Annuler',
        type: 'warning',
      }
    );
    remindersStore.deleteReminder(reminder.id);
    ElMessage.success('Rappel supprimé avec succès');
  } catch {
    // User cancelled
  }
};

// Save handler from ReminderFormDialog (validation is done in the dialog)
const saveReminder = async (
  form: ReminderFormData,
  editing: Reminder | null
) => {
  saving.value = true;
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
  } finally {
    saving.value = false;
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

const viewOptions = [
  { value: 'table', label: 'Vue tableau', icon: DataBoard },
  { value: 'card', label: 'Vue cartes', icon: Grid },
];

const currentRemindersView = computed({
  get: () => remindersStore.remindersViewType,
  set: (v: string) =>
    remindersStore.setRemindersViewType(v as 'table' | 'card'),
});

const openPropertyById = async (propertyId: number) => {
  try {
    // Find the property in the store by numeric id
    const property = propertyStore.properties.find(
      (p: any) => p.id === propertyId
    );
    console.log('Property found for ID', propertyId, property);

    if (property?.id_fantoir_long) {
      await propertyStore.selectProperty(property);
    } else {
      // Fallback: create a minimal property object so the dialog can fetch it
      await propertyStore.selectProperty({
        ...propertyStore.defaultPropertyData,
        id: propertyId,
      });
    }

    showCreateDialog.value = false;
    propertyStore.setDialogVisible(true);
  } catch {
    ElMessage.error("Impossible d'ouvrir la fiche de la propriété");
  }
};
</script>

<style scoped>
.reminders-page {
  /* padding: 0 20px; */
}

/* ── Header ──────────────────────────────── */
.headerFilterInfoContainer {
  margin-bottom: 20px;
  border-radius: var(--apple-radius);
}

.headerTopRow {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  gap: 20px;
  flex-wrap: wrap;
}

.headerTopRow h1 {
  margin: 0;
  color: var(--page-title-color);
  font-size: var(--page-title-size);
  font-weight: var(--page-title-weight);
}

.headerRightContainer {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.headerBottomRow {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
}

.add-reminder-btn {
  border-radius: var(--btn-radius);
  font-weight: 600;
}

/* ── List area ───────────────────────────── */
.reminders-list {
  min-height: var(--empty-state-min-height);
}

/* ── Empty state ─────────────────────────── */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px dashed #cbd5e1;
  border-radius: var(--card-radius);
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

/* ── Card grid ───────────────────────────── */
.reminders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--grid-min-col), 1fr));
  gap: var(--grid-gap);
}

/* ── Responsive ──────────────────────────── */
@media (max-width: 768px) {
  .reminders-page {
    padding: 16px;
  }

  .reminders-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .header-right {
    justify-content: space-between;
  }

  .reminders-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .add-reminder-btn {
    flex: 1;
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
