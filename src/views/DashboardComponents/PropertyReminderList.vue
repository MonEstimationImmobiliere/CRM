<template>
  <!-- Message quand aucun rappel -->
  <el-card shadow="hover" v-if="reminders.length === 0">
    <div class="no-reminders-content">
      <el-icon class="no-reminders-icon"><Calendar /></el-icon>
      <h3>Aucun rappel pour cette propriété</h3>
      <p>
        Créez votre premier rappel pour cette propriété en utilisant le bouton
        bouton un rappel" ci-dessous.
      </p>
    </div>
  </el-card>

  <!-- Historique des rappels -->
  <el-card shadow="hover" v-if="reminders.length > 0">
    <h3 class="card-title">
      Historique des rappels
      <el-tag
        :type="
          overdueCounts > 0
            ? 'danger'
            : pendingCounts > 0
              ? 'warning'
              : 'success'
        "
        size="small"
      >
        {{ reminders.length }} rappel{{ reminders.length > 1 ? 's' : '' }}
      </el-tag>
    </h3>
    <div class="card-content">
      <!-- Stats résumé -->
      <div class="reminders-summary">
        <div class="summary-stats">
          <div class="stat-item" v-if="overdueCounts > 0">
            <el-icon class="stat-icon overdue"><Warning /></el-icon>
            <span>{{ overdueCounts }} en retard</span>
          </div>
          <div class="stat-item" v-if="todayCounts > 0">
            <el-icon class="stat-icon today"><Calendar /></el-icon>
            <span>{{ todayCounts }} aujourd'hui</span>
          </div>
          <div class="stat-item" v-if="pendingCounts > 0">
            <el-icon class="stat-icon pending"><Clock /></el-icon>
            <span>{{ pendingCounts }} à venir</span>
          </div>
          <div class="stat-item" v-if="completedCounts > 0">
            <el-icon class="stat-icon completed"><Check /></el-icon>
            <span
              >{{ completedCounts }} terminé{{
                completedCounts > 1 ? 's' : ''
              }}</span
            >
          </div>
        </div>
      </div>

      <!-- Liste des rappels -->
      <div class="reminders-list-history">
        <div
          v-for="reminder in sortedReminders"
          :key="reminder.id"
          class="reminder-item"
          :class="{
            overdue:
              remindersStore.isReminderOverdue(reminder) && !reminder.completed,
            today:
              remindersStore.isReminderToday(reminder) && !reminder.completed,
            completed: reminder.completed,
          }"
        >
          <div class="reminder-header">
            <div class="reminder-info">
              <el-checkbox
                v-model="reminder.completed"
                @change="handleToggleComplete(reminder)"
                size="large"
              />
              <div class="reminder-details">
                <h4 class="reminder-title">{{ reminder.title }}</h4>
                <p class="reminder-description" v-if="reminder.description">
                  {{ reminder.description }}
                </p>
              </div>
            </div>
            <div class="reminder-meta">
              <el-tag :type="getPriorityType(reminder.priority)" size="small">
                {{ getPriorityLabel(reminder.priority) }}
              </el-tag>
            </div>
          </div>

          <div class="remin der-footer">
            <div class="reminder-date-info">
              <el-icon><Calendar /></el-icon>
              <span>{{ formatReminderDate(reminder.date) }}</span>
              <el-tag
                v-if="
                  remindersStore.isReminderOverdue(reminder) &&
                  !reminder.completed
                "
                type="danger"
                size="small"
              >
                En retard
              </el-tag>
              <el-tag
                v-else-if="
                  remindersStore.isReminderToday(reminder) &&
                  !reminder.completed
                "
                type="warning"
                size="small"
              >
                Aujourd'hui
              </el-tag>
            </div>

            <div class="reminder-actions">
              <el-tag :type="getTypeColor(reminder.type)" size="small">
                {{ getTypeLabel(reminder.type) }}
              </el-tag>
              <el-tag v-if="reminder.sharing" type="success" size="small">
                Partagé
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Warning, Calendar, Clock, Check } from '@element-plus/icons-vue';
import { useRemindersStore, type Reminder } from '@/stores/reminders';
import {
  getPriorityType,
  getPriorityLabel,
  getTypeColor,
  getTypeLabel,
  formatReminderDate,
} from '@/utils/reminderHelpers';

const props = defineProps<{
  /** ID de la propriété dont on affiche les rappels */
  propertyId: number;
}>();

const remindersStore = useRemindersStore();

// Rappels de cette propriété
const reminders = computed(() =>
  remindersStore.getRemindersByProperty(props.propertyId)
);

// Rappels triés : par date (plus récent en premier), puis par priorité
const sortedReminders = computed(() =>
  [...reminders.value].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  })
);

// Counts
const overdueCounts = computed(
  () => reminders.value.filter(r => remindersStore.isReminderOverdue(r)).length
);
const todayCounts = computed(
  () =>
    reminders.value.filter(
      r => remindersStore.isReminderToday(r) && !r.completed
    ).length
);
const pendingCounts = computed(
  () =>
    reminders.value.filter(
      r =>
        !r.completed &&
        !remindersStore.isReminderOverdue(r) &&
        !remindersStore.isReminderToday(r)
    ).length
);
const completedCounts = computed(
  () => reminders.value.filter(r => r.completed).length
);

function handleToggleComplete(reminder: Reminder) {
  if (reminder.completed) {
    remindersStore.completeReminder(reminder.id);
    ElMessage.success('Rappel marqué comme terminé');
  } else {
    remindersStore.uncompleteReminder(reminder.id);
    ElMessage.info('Rappel marqué comme non terminé');
  }
}
</script>

<style scoped>
.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #1f2937;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.card-content {
  margin-top: 1rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
}

/* No reminders state */
.no-reminders-content {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.no-reminders-icon {
  font-size: 48px;
  color: #d1d5db;
  margin-bottom: 16px;
}

.no-reminders-content h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #374151;
}

.no-reminders-content p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

/* Summary */
.reminders-summary {
  margin-bottom: 20px;
  padding: 1 6px;

  background-color: #f8fafc;

  border-radius: 8 px;

  border: 1px solid #e2e8f0;
}

.summary-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba (0, 0, 0, 0.1);

  font-size: 14px;
  font-weight: 500;
}

.stat-icon {
  font-size: 16px;
}
.stat-icon.overdue {
  color: #ef4444;
}
.stat-icon.today {
  color: #f59e0b;
}
.stat-icon.pending {
  color: #3b82f6;
}
.stat-icon.completed {
  color: #10b981;
}

/* Reminder items */
.reminders-list-history {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.reminder-item {
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition:
    all 0.3s ease,
    opacity 0.5s ease,
    filter 0.5s ease;
}

.reminder-item:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.reminder-item.overdue {
  border-left: 4px solid #ef4444;
  background-color: #fef2f2;
}

.reminder-item.today {
  border-left: 4px solid #f59e0b;
  background-color: #fffbeb;
}

.reminder-item.completed {
  opacity: 0.6;

  border-left: 4px solid #10b981;
  background-color: #f9fafb;
  filter: grayscale(0.3);
}

.reminder-item.completed .reminder-title {
  text-decoration: line-through;
  color: #9ca 3af;
}

.reminder-item.completed .reminder-description {
  color: #9ca3af;
  text-decoration: line-through;
}

.reminder-ite m.completed .remi nder-date-info {
  color: #9ca3af;
}

.reminder-item.completed .reminder-date-info span {
  text-decoration: line-through;
}

.reminder-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.reminder-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.reminder-details {
  flex: 1;
}

.reminder-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.4;
  transition:
    color 0.3s ease,
    text-decoration 0.3s ease;
}

.reminder-description {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  transition:
    color 0.3s ease,
    text-decoration 0.3s ease;
}

.reminder-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reminder-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.reminder-date-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
  transition: color 0.3s ease;
}

.reminder-date-info span {
  transition: text-decoration 0.3s ease;
}

.reminder-date-info .el-icon {
  font-size: 16px;
}

.reminder-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
