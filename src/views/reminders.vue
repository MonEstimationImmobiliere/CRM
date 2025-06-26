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

    <!-- Reminders List -->
    <div class="reminders-list">
      <el-card v-if="filteredReminders.length === 0" class="empty-state">
        <div class="empty-content">
          <el-icon class="empty-icon"><Document /></el-icon>
          <h3>Aucun rappel trouvé</h3>
          <p>{{ getEmptyMessage() }}</p>
        </div>
      </el-card>

      <div v-else class="reminders-grid">
        <el-card 
          v-for="reminder in filteredReminders" 
          :key="reminder.id" 
          class="reminder-card"
          :class="{
            'overdue': isReminderOverdue(reminder),
            'today': isReminderToday(reminder),
            'completed': reminder.completed
          }"
          @click="selectReminder(reminder)"
        >
          <div class="reminder-header">
            <div class="reminder-title">
              <el-checkbox 
                v-model="reminder.completed" 
                @change="toggleComplete(reminder)"
                @click.stop
              />
              <h3>{{ reminder.title }}</h3>
            </div>
            <div class="reminder-actions">
              <el-tag 
                :type="getPriorityType(reminder.priority)" 
                size="small"
              >
                {{ getPriorityLabel(reminder.priority) }}
              </el-tag>
              <el-dropdown @command="handleAction">
                <el-button type="text" @click.stop>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{action: 'edit', reminder}">
                      <el-icon><Edit /></el-icon>
                      Modifier
                    </el-dropdown-item>
                    <el-dropdown-item :command="{action: 'delete', reminder}" divided>
                      <el-icon><Delete /></el-icon>
                      Supprimer
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <div class="reminder-content">
            <p v-if="reminder.description" class="reminder-description">
              {{ reminder.description }}
            </p>
            
            <div class="reminder-details">
              <div class="reminder-date">
                <el-icon><Calendar /></el-icon>
                <span>{{ formatDate(reminder.date) }}</span>
                <el-tag v-if="isReminderOverdue(reminder)" type="danger" size="small">
                  En retard
                </el-tag>
                <el-tag v-else-if="isReminderToday(reminder)" type="warning" size="small">
                  Aujourd'hui
                </el-tag>
              </div>
              
              <div class="reminder-property">
                <el-icon><House /></el-icon>
                <span>Propriété ID: {{ reminder.property_id }}</span>
                <el-tag v-if="reminder.sharing" type="success" size="small" style="margin-left: 8px;">
                  Partagé
                </el-tag>
              </div>
            </div>
          </div>

          <div class="reminder-type">
            <el-tag :type="getTypeColor(reminder.type)" size="small">
              {{ getTypeLabel(reminder.type) }}
            </el-tag>
          </div>
        </el-card>
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
  MoreFilled, Edit, Delete, House, User
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
  sharing: boolean;
  property_id: string;
}>({
  title: '',
  description: '',
  date: '',
  type: 'rappel',
  priority: 'medium',
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
    sharing: reminder.sharing || false,
    propertyId: reminder.propertyId,
  };
  showCreateDialog.value = true;
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
      completed: false,
    });
    ElMessage.success('Rappel modifié avec succès');
  } else {
    remindersStore.addReminder({
      ...reminderForm.value,
      completed: false,
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
    sharing: false,
    propertyId: '',
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

.reminders-list {
  min-height: 400px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-content {
  max-width: 300px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-content h3 {
  color: #374151;
  margin-bottom: 8px;
}

.empty-content p {
  color: #6b7280;
}

.reminders-grid {
  display: grid;
  gap: 16px;
}

.reminder-card {
  transition: all 0.3s ease;
  cursor: pointer;
  border-left: 4px solid #e5e7eb;
}

.reminder-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.reminder-card.overdue {
  border-left-color: #f56565;
  background-color: #fef2f2;
}

.reminder-card.today {
  border-left-color: #ed8936;
  background-color: #fffbeb;
}

.reminder-card.completed {
  opacity: 0.7;
  border-left-color: #48bb78;
}

.reminder-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.reminder-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.reminder-title h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.reminder-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reminder-content {
  margin-bottom: 16px;
}

.reminder-description {
  color: #6b7280;
  margin-bottom: 12px;
  line-height: 1.5;
}

.reminder-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reminder-date,
.reminder-property,
.reminder-owner {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #6b7280;
}

.reminder-date .el-icon,
.reminder-property .el-icon,
.reminder-owner .el-icon {
  font-size: 1rem;
}

.contact-info {
  color: #9ca3af;
  font-size: 0.8rem;
}

.reminder-type {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .reminders-filters {
    flex-direction: column;
    align-items: stretch;
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
}
</style>
