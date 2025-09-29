<template>
  <div class="reminders-page">
    <div class="reminders-header">
      <h1>Mes Rappels</h1>
    </div>

    <!-- Statistics Cards -->
    <div class="reminders-stats">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card overdue">
            <div class="stat-content">
              <el-icon class="stat-icon"><Warning /></el-icon>
              <div class="stat-info">
                <div class="stat-number">{{ overdueReminders.length }}</div>
                <div class="stat-label">En retard</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card today">
            <div class="stat-content">
              <el-icon class="stat-icon"><Calendar /></el-icon>
              <div class="stat-info">
                <div class="stat-number">{{ todayReminders.length }}</div>
                <div class="stat-label">Aujourd'hui</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card upcoming">
            <div class="stat-content">
              <el-icon class="stat-icon"><Clock /></el-icon>
              <div class="stat-info">
                <div class="stat-number">{{ upcomingReminders.length }}</div>
                <div class="stat-label">À venir</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card completed">
            <div class="stat-content">
              <el-icon class="stat-icon"><Check /></el-icon>
              <div class="stat-info">
                <div class="stat-number">{{ completedReminders.length }}</div>
                <div class="stat-label">Terminés</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Filters -->
    <div class="reminders-filters">
      <el-radio-group v-model="activeFilter" size="large">
        <el-radio-button label="all">Tous</el-radio-button>
        <el-radio-button label="overdue">En retard</el-radio-button>
        <el-radio-button label="today">Aujourd'hui</el-radio-button>
        <el-radio-button label="upcoming">À venir</el-radio-button>
        <el-radio-button label="completed">Terminés</el-radio-button>
      </el-radio-group>
      
      <div class="filter-actions">
        <el-select v-model="typeFilter" placeholder="Type" clearable style="width: 150px;">
          <el-option label="Rappel" value="rappel" />
          <el-option label="Estimation" value="estimation" />
          <el-option label="Visite" value="visite" />
          <el-option label="Autre" value="autre" />
        </el-select>
        
        <el-select v-model="priorityFilter" placeholder="Priorité" clearable style="width: 150px;">
          <el-option label="Haute" value="high" />
          <el-option label="Moyenne" value="medium" />
          <el-option label="Basse" value="low" />
        </el-select>
      </div>
    </div>

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
          <p>{{ getEmptyMessage() }}</p>
          <el-button 
            type="primary" 
            @click="showCreateDialog = true"
            style="margin-top: 16px;"
          >
            <el-icon><Plus /></el-icon>
            Créer mon premier rappel
          </el-button>
        </div>
      </el-card>

      <div v-else class="reminders-grid">
        <div 
          v-for="reminder in filteredReminders" 
          :key="reminder.id" 
          class="reminder-card"
          :class="{
            'overdue': isReminderOverdue(reminder),
            'today': isReminderToday(reminder),
            'status-todo': getStatus(reminder) === 'todo',
            'status-progress': getStatus(reminder) === 'progress',
            'status-completed': getStatus(reminder) === 'completed'
          }"
        >
          <!-- Status Tag -->
          <div class="reminder-status-tag">
            <el-tag 
              :type="getStatusTagType(reminder)" 
              size="small"
              class="status-indicator"
            >
              {{ getStatusLabel(reminder) }}
            </el-tag>
          </div>

          <!-- Card Header -->
          <div class="reminder-card-header">
            <h3 class="reminder-title" :class="{ 'completed-text': getStatus(reminder) === 'completed' }">
              {{ reminder.title }}
            </h3>
            
            <!-- Three Dot Menu -->
            <el-dropdown 
              @command="handleAction"
              trigger="click"
              placement="bottom-end"
            >
              <el-button 
                :icon="MoreFilled" 
                circle 
                size="small" 
                class="more-actions-btn"
                @click.stop
              />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item 
                    :command="{ action: 'edit', reminder }"
                    :icon="Edit"
                  >
                    Modifier
                  </el-dropdown-item>
                  <el-dropdown-item 
                    :command="{ action: 'duplicate', reminder }"
                    :icon="DocumentCopy"
                  >
                    Dupliquer
                  </el-dropdown-item>
                  <el-dropdown-item 
                    :command="{ action: 'delete', reminder }"
                    :icon="Delete"
                    divided
                  >
                    Supprimer
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <!-- Description -->
          <div v-if="reminder.description" class="reminder-description">
            {{ reminder.description }}
          </div>

          <!-- Priority and Type Badges -->
          <div class="reminder-badges">
            <el-tag 
              :type="getPriorityType(reminder.priority)" 
              size="small"
              class="priority-badge"
            >
              {{ getPriorityLabel(reminder.priority) }}
            </el-tag>
            <el-tag 
              :type="getTypeColor(reminder.type)" 
              size="small"
              class="type-badge"
            >
              {{ getTypeLabel(reminder.type) }}
            </el-tag>
          </div>

          <!-- Date and Days Left -->
          <div class="reminder-date-section">
            <div class="reminder-date-info">
              <el-icon><Calendar /></el-icon>
              <span class="date-text">{{ formatDate(reminder.date) }}</span>
            </div>
            <div class="days-left" :class="getDaysLeftClass(reminder)">
              {{ getDaysLeftText(reminder) }}
            </div>
          </div>

          <!-- Property Info -->
          <div class="reminder-property-info">
            <el-icon><House /></el-icon>
            <span>Propriété ID: {{ reminder.property_id }}</span>
            <el-tag v-if="reminder.sharing" type="success" size="small" class="sharing-tag">
              Partagé
            </el-tag>
          </div>

          <!-- Status Action Buttons -->
          <div class="reminder-status-actions">
            <el-button-group>
              <el-button 
                :type="getStatus(reminder) === 'todo' ? 'primary' : ''"
                :plain="getStatus(reminder) !== 'todo'"
                size="small"
                @click.stop="updateStatus(reminder, 'todo')"
                class="status-btn"
              >
                À faire
              </el-button>
              <el-button 
                :type="getStatus(reminder) === 'progress' ? 'warning' : ''"
                :plain="getStatus(reminder) !== 'progress'"
                size="small"
                @click.stop="updateStatus(reminder, 'progress')"
                class="status-btn"
              >
                En cours
              </el-button>
              <el-button 
                :type="getStatus(reminder) === 'completed' ? 'success' : ''"
                :plain="getStatus(reminder) !== 'completed'"
                size="small"
                @click.stop="updateStatus(reminder, 'completed')"
                class="status-btn"
              >
                Terminé
              </el-button>
            </el-button-group>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <el-dialog 
      v-model="showCreateDialog" 
      :title="editingReminder ? 'Modifier le rappel' : 'Nouveau rappel'"
      width="600px"
      @close="resetForm"
    >
      <el-form :model="reminderForm" label-width="120px">
        <el-form-item label="Titre" required>
          <el-input v-model="reminderForm.title" placeholder="Titre du rappel" />
        </el-form-item>
        
        <el-form-item label="Description">
          <el-input 
            v-model="reminderForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="Description du rappel"
          />
        </el-form-item>
        
        <el-form-item label="Date" required>
          <el-date-picker 
            v-model="reminderForm.date"
            type="date"
            placeholder="Sélectionnez une date"
            style="width: 100%;"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="Type">
          <el-select v-model="reminderForm.type" style="width: 100%;">
            <el-option label="Rappel" value="rappel" />
            <el-option label="Estimation" value="estimation" />
            <el-option label="Visite" value="visite" />
            <el-option label="Autre" value="autre" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Priorité">
          <el-select v-model="reminderForm.priority" style="width: 100%;">
            <el-option label="Haute" value="high" />
            <el-option label="Moyenne" value="medium" />
            <el-option label="Basse" value="low" />
          </el-select>
        </el-form-item>

        <el-form-item label="Statut">
          <el-select v-model="reminderForm.status" style="width: 100%;">
            <el-option label="À faire" value="todo" />
            <el-option label="En cours" value="progress" />
            <el-option label="Terminé" value="completed" />
          </el-select>
        </el-form-item>

        <el-form-item label="Partage">
          <el-checkbox v-model="reminderForm.sharing" label="Partager avec l'agence" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">Annuler</el-button>
        <el-button type="primary" @click="saveReminder">
          {{ editingReminder ? 'Sauvegarder' : 'Créer' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRemindersStore, type Reminder } from '@/stores/reminders';
import { 
  Plus, Warning, Calendar, Clock, Check, Document, 
  MoreFilled, Edit, Delete, House, User, DocumentCopy
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const remindersStore = useRemindersStore();

// Reactive state
const activeFilter = ref('all');
const typeFilter = ref('');
const priorityFilter = ref('');
const showCreateDialog = ref(false);
const editingReminder = ref<Reminder | null>(null);

// Form data
const reminderForm = ref<{
  title: string;
  description: string;
  date: string;
  type: 'rappel' | 'estimation' | 'visite' | 'autre';
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'progress' | 'completed';
  sharing: boolean;
  property_id: string;
}>({
  title: '',
  description: '',
  date: '',
  type: 'rappel',
  priority: 'medium',
  status: 'todo',
  sharing: false,
  property_id: '',
});

// Computed properties
const { 
  todayReminders, 
  upcomingReminders, 
  overdueReminders, 
  completedReminders,
  isReminderOverdue,
  isReminderToday,
  selectReminder 
} = remindersStore;

const filteredReminders = computed(() => {
  let filtered = remindersStore.reminders;

  // Filter by status
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

  // Filter by type
  if (typeFilter.value) {
    filtered = filtered.filter(r => r.type === typeFilter.value);
  }

  // Filter by priority
  if (priorityFilter.value) {
    filtered = filtered.filter(r => r.priority === priorityFilter.value);
  }

  return filtered.sort((a, b) => {
    // Sort by date, then by priority
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
});

// Methods
const toggleComplete = (reminder: Reminder) => {
  if (reminder.completed) {
    remindersStore.completeReminder(reminder.id);
    ElMessage.success('Rappel marqué comme terminé');
  } else {
    remindersStore.uncompleteReminder(reminder.id);
    ElMessage.info('Rappel marqué comme non terminé');
  }
};

const handleAction = ({ action, reminder }: { action: string; reminder: Reminder }) => {
  if (action === 'edit') {
    editReminder(reminder);
  } else if (action === 'delete') {
    deleteReminder(reminder);
  } else if (action === 'duplicate') {
    duplicateReminder(reminder);
  }
};

const editReminder = (reminder: Reminder) => {
  editingReminder.value = reminder;
  reminderForm.value = {
    title: reminder.title,
    description: reminder.description || '',
    date: reminder.date,
    type: reminder.type,
    priority: reminder.priority,
    status: reminder.status || (reminder.completed ? 'completed' : 'todo'),
    sharing: reminder.sharing || false,
    property_id: reminder.property_id,
  };
  showCreateDialog.value = true;
};

const duplicateReminder = (reminder: Reminder) => {
  const duplicatedReminder = {
    title: `${reminder.title} (Copie)`,
    description: reminder.description || '',
    date: reminder.date,
    type: reminder.type,
    priority: reminder.priority,
    status: 'todo' as const,
    sharing: reminder.sharing || false,
    property_id: reminder.property_id,
    completed: false,
  };

  remindersStore.addReminder(duplicatedReminder);
  ElMessage.success('Rappel dupliqué avec succès');
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

const saveReminder = () => {
  if (!reminderForm.value.title || !reminderForm.value.date) {
    ElMessage.error('Veuillez remplir tous les champs requis');
    return;
  }

  if (editingReminder.value) {
    remindersStore.updateReminder(editingReminder.value.id, {
      ...reminderForm.value,
      completed: reminderForm.value.status === 'completed',
    });
    ElMessage.success('Rappel modifié avec succès');
  } else {
    remindersStore.addReminder({
      ...reminderForm.value,
      completed: reminderForm.value.status === 'completed',
    });
    ElMessage.success('Rappel créé avec succès');
  }

  showCreateDialog.value = false;
  resetForm();
};

const resetForm = () => {
  editingReminder.value = null;
  reminderForm.value = {
    title: '',
    description: '',
    date: '',
    type: 'rappel',
    priority: 'medium',
    status: 'todo',
    sharing: false,
    property_id: '',
  };
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getPriorityType = (priority: string): 'success' | 'warning' | 'danger' | 'info' => {
  const types = { high: 'danger', medium: 'warning', low: 'info' } as const;
  return types[priority as keyof typeof types] || 'info';
};

const getPriorityLabel = (priority: string) => {
  const labels = { high: 'Haute', medium: 'Moyenne', low: 'Basse' };
  return labels[priority as keyof typeof labels] || priority;
};

const getTypeColor = (type: string): 'success' | 'warning' | 'danger' | 'info' => {
  const colors = { 
    rappel: 'info', 
    estimation: 'success', 
    visite: 'warning', 
    autre: 'info' 
  } as const;
  return colors[type as keyof typeof colors] || 'info';
};

const getTypeLabel = (type: string) => {
  const labels = { 
    rappel: 'Rappel', 
    estimation: 'Estimation', 
    visite: 'Visite', 
    autre: 'Autre' 
  };
  return labels[type as keyof typeof labels] || type;
};

const getEmptyMessage = () => {
  switch (activeFilter.value) {
    case 'overdue':
      return 'Aucun rappel en retard. Excellent !';
    case 'today':
      return 'Aucun rappel pour aujourd\'hui.';
    case 'upcoming':
      return 'Aucun rappel à venir cette semaine.';
    case 'completed':
      return 'Aucun rappel terminé.';
    default:
      return 'Commencez par créer votre premier rappel.';
  }
};

// New methods for status management
const getStatus = (reminder: Reminder): 'todo' | 'progress' | 'completed' => {
  // Use the new status field if available, otherwise fallback to completed boolean
  if (reminder.status) {
    return reminder.status;
  }
  // Fallback to old system
  if (reminder.completed) return 'completed';
  return 'todo';
};

const getStatusLabel = (reminder: Reminder): string => {
  const status = getStatus(reminder);
  const labels = {
    todo: 'À faire',
    progress: 'En cours',
    completed: 'Terminé'
  };
  return labels[status];
};

const getStatusTagType = (reminder: Reminder): 'info' | 'warning' | 'success' => {
  const status = getStatus(reminder);
  const types: Record<string, 'info' | 'warning' | 'success'> = {
    todo: 'info',
    progress: 'warning',
    completed: 'success'
  };
  return types[status] || 'info';
};

const updateStatus = async (reminder: Reminder, status: 'todo' | 'progress' | 'completed') => {
  try {
    await remindersStore.updateReminderStatus(reminder.id, status);
    
    if (status === 'completed') {
      ElMessage.success('Rappel marqué comme terminé');
    } else if (status === 'progress') {
      ElMessage.info('Rappel marqué comme en cours');
    } else {
      ElMessage.info('Rappel marqué comme à faire');
    }
  } catch (error) {
    ElMessage.error('Erreur lors de la mise à jour du statut');
  }
};

const getDaysLeftText = (reminder: Reminder): string => {
  const today = new Date();
  const reminderDate = new Date(reminder.date);
  const diffTime = reminderDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''} de retard`;
  } else if (diffDays === 0) {
    return 'Aujourd\'hui';
  } else if (diffDays === 1) {
    return 'Demain';
  } else {
    return `Dans ${diffDays} jours`;
  }
};

const getDaysLeftClass = (reminder: Reminder): string => {
  const today = new Date();
  const reminderDate = new Date(reminder.date);
  const diffTime = reminderDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'days-overdue';
  if (diffDays === 0) return 'days-today';
  if (diffDays <= 3) return 'days-soon';
  return 'days-normal';
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

.reminders-stats {
  margin-bottom: 24px;
}

.stat-card {
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 2rem;
}

.stat-card.overdue .stat-icon {
  color: #f56565;
}

.stat-card.today .stat-icon {
  color: #ed8936;
}

.stat-card.upcoming .stat-icon {
  color: #4299e1;
}

.stat-card.completed .stat-icon {
  color: #48bb78;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.stat-label {
  color: #6b7280;
  font-size: 0.875rem;
}

.reminders-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 20px;
}

.filter-actions {
  display: flex;
  gap: 12px;
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

.reminder-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reminder-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transform: translateY(-4px);
}

.reminder-card.status-todo {
  border-left: 4px solid #3b82f6;
}

.reminder-card.status-progress {
  border-left: 4px solid #f59e0b;
}

.reminder-card.status-completed {
  border-left: 4px solid #10b981;
  opacity: 0.8;
}

.reminder-card.overdue:not(.status-completed) {
  border-left: 4px solid #ef4444;
  background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
}

.reminder-status-tag {
  position: absolute;
  top: 16px;
  right: 16px;
}

.status-indicator {
  font-weight: 600;
  border-radius: 8px;
}

.reminder-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-top: 8px;
}

.reminder-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.4;
  flex: 1;
}

.reminder-title.completed-text {
  text-decoration: line-through;
  color: #6b7280;
}

.more-actions-btn {
  background: transparent;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  transition: all 0.2s ease;
}

.more-actions-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #374151;
}

.reminder-description {
  color: #6b7280;
  line-height: 1.6;
  font-size: 0.95rem;
  margin: 0;
}

.reminder-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.priority-badge, .type-badge {
  font-weight: 600;
  border-radius: 6px;
}

.reminder-date-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(249, 250, 251, 0.8);
  border-radius: 8px;
  margin: 4px 0;
}

.reminder-date-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #6b7280;
}

.reminder-date-info .el-icon {
  font-size: 1.1rem;
  color: #9ca3af;
}

.date-text {
  font-weight: 500;
}

.days-left {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
}

.days-overdue {
  background: #fef2f2;
  color: #dc2626;
}

.days-today {
  background: #fffbeb;
  color: #d97706;
}

.days-soon {
  background: #eff6ff;
  color: #2563eb;
}

.days-normal {
  background: #f0fdf4;
  color: #059669;
}

.reminder-property-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #6b7280;
  padding: 8px 12px;
  background: rgba(243, 244, 246, 0.5);
  border-radius: 6px;
}

.reminder-property-info .el-icon {
  font-size: 1.1rem;
  color: #9ca3af;
}

.sharing-tag {
  margin-left: 8px;
}

.reminder-status-actions {
  margin-top: 8px;
}

.reminder-status-actions .el-button-group {
  width: 100%;
}

.status-btn {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.status-btn:first-child {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.status-btn:last-child {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.status-btn:not(:first-child):not(:last-child) {
  border-radius: 0;
}

@media (max-width: 768px) {
  .reminders-page {
    padding: 16px;
  }

  .reminders-filters {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .filter-actions {
    justify-content: space-between;
  }
  
  .stat-content {
    flex-direction: column;
    text-align: center;
    gap: 8px;
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

  .reminder-card {
    padding: 16px;
    gap: 12px;
  }

  .reminder-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .reminder-title {
    font-size: 1.1rem;
  }

  .reminder-status-tag {
    position: static;
    align-self: flex-end;
  }

  .reminder-date-section {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .days-left {
    text-align: center;
  }

  .add-reminder-btn {
    width: 100%;
    min-width: auto;
  }

  .status-btn {
    font-size: 0.8rem;
    padding: 8px 4px;
  }
}

@media (max-width: 480px) {
  .reminders-page {
    padding: 12px;
  }

  .reminders-header h1 {
    font-size: 1.5rem;
  }

  .reminder-title {
    font-size: 1rem;
  }

  .empty-state {
    padding: 60px 16px;
  }

  .stat-card {
    margin-bottom: 12px;
  }

  .reminder-card {
    padding: 12px;
    gap: 10px;
  }

  .reminders-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .reminder-date-section {
    padding: 8px 12px;
  }

  .status-btn {
    font-size: 0.75rem;
    padding: 6px 2px;
  }
}
</style>
