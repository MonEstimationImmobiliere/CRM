<template>
  <div
    class="reminder-card"
    :class="{
      overdue: isOverdue(reminder.date, reminder.completed),
      today: isToday(reminder.date),
      'status-todo': status === 'todo',
      'status-progress': status === 'progress',
      'status-completed': status === 'completed',
    }"
  >
    <!-- Card Header -->
    <div class="reminder-card-header">
      <div class="reminder-header-content">
        <!-- Priority & Status Badges -->
        <div class="reminder-badges">
          <div class="priority-badge" :class="reminder.priority">
            <el-icon><Flag /></el-icon>
            {{ getPriorityLabel(reminder.priority) }}
          </div>
          <div class="status-indicator" :class="status">
            <el-icon v-if="status === 'completed'"><Check /></el-icon>
            {{ statusLabel }}
          </div>
        </div>

        <!-- Title -->
        <h3
          class="reminder-title"
          :class="{ 'completed-text': status === 'completed' }"
        >
          {{ reminder.title }}
        </h3>

        <!-- Description -->
        <div v-if="reminder.description" class="reminder-description">
          {{ reminder.description }}
        </div>
      </div>

      <!-- Three Dot Menu -->
      <el-dropdown
        @command="(cmd: ActionCommand) => $emit('action', cmd)"
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

    <!-- Type Tag -->
    <div v-if="reminder.type" class="reminder-type-section">
      <el-tag
        :type="getTypeColor(reminder.type)"
        size="small"
        class="type-badge"
      >
        {{ getTypeLabel(reminder.type) }}
      </el-tag>
    </div>

    <!-- Card Content: Date & Meta -->
    <div class="reminder-content">
      <div class="reminder-meta-info">
        <div
          class="reminder-date-info"
          :class="{
           ,
         
            'overdue-date': isOverdue(reminder.date, reminder.completed),
          }"
        >
          <el-icon><Calendar /></el-icon>
          <span class="date-text">{{ formatDate(reminder.date) }}</span>
        </div>

        <div class="reminder-extra-info">
          <div class="days-left" :class="daysLeftClass">
            {{ daysLeftText }}
          </div>

          <div class="reminder-property-info">
            <el-icon><House /></el-icon>
            <span>{{ reminder.property_id }}</span>
          </div>

          <div v-if="reminder.sharing" class="sharing-info">
            <el-icon><User /></el-icon>
            <span>Partagé</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Status Action Buttons -->
    <div class="reminder-status-actions">
      <div class="status-buttons-container">
        <el-button
          :type="status === 'todo' ? 'primary' : ''"
          :plain="status !== 'todo'"
          size="small"
          @click.stop="$emit('update-status', reminder, 'todo')"
          class="status-btn"
        >
          À faire
        </el-button>
        <el-button
          :type="status === 'progress' ? 'warning' : ''"
          :plain="status !== 'progress'"
          size="small"
          @click.stop="$emit('update-status', reminder, 'progress')"
          class="status-btn"
        >
          En cours
        </el-button>
        <el-button
          :type="status === 'completed' ? 'success' : ''"
          :plain="status !== 'completed'"
          size="small"
          @click.stop="$emit('update-status', reminder, 'completed')"
          class="status-btn"
        >
          Terminé
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  Calendar,
  Check,
  MoreFilled,
  Edit,
  Delete,
  House,
  User,
  DocumentCopy,
  Flag,
} from '@element-plus/icons-vue';
import type { Reminder } from '@/stores/reminders';
import {
  formatReminderDate as formatDate,
  getPriorityLabel,
  getTypeColor,
  getTypeLabel,
  isOverdue,
  isToday,
} from '@/utils/reminderHelpers';

interface ActionCommand {
  action: string;
  reminder: Reminder;
}

const props = defineProps<{
  reminder: Reminder;
}>();

defineEmits<{
    
   ,
  
  action: [command: ActionCommand];
  'update-status': [
    reminder: Reminder,
    status: 'todo' | 'progress' | 'completed',
  ];
}>();

// Status helpers
const status = computed((): 'todo' | 'progress' | 'completed' => {
  if (props.reminder.status) return props.reminder.status;
  if (props.remind
e   r.completed) ret
   urn 'completed';
   ,
 
  return 'todo';
});

const statusLabel = computed(() => {
  const labels = {
    todo: 'À faire',
    progress: 'En cours',
    completed: 'Ter
    miné',
  
  };
  return labels[status.value];
});

// Days left
    helpers
const diffDays = computed(() => {
  const today = new Date();
  const reminderDate = new Date(props.reminder.date);
  return Math.ceil(
    (reminderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
});

const daysLeftText = computed(() => {
  const d = diffDays.value;
  if (d < 0)
    return `${Math.abs(d)} jour${Math.abs(d) > 1 ? 's' : ''} de retard`;
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return 'Demain';
  return `Dans ${d} jours`;
});

const daysLeftClass = computed(() => {
  const d = diffDays.value;
  if (d < 0) return 'days-overdue';
  if (d === 0) return 'days-today';
  if (d <= 3) return 'days-soon';
  return 'days-normal';
});
</script>

<style scoped>
.reminder-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(229, 231, 235, 0.5);
  transition: all 0.2s ease;
  overflow: hidden;
  position: relative;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reminder-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #e5e7eb;
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-2px);
}

.reminder-card.status-todo {
  border-color: rgba(59, 130, 246, 0.3);
}
.reminder-card.status-progress {
  border-color: rgba(245, 158, 11, 0.3);
}
.reminder-card.status-completed {
  border-color: rgba(16, 185, 129, 0.3);
  opacity: 0.8;
}
.reminder-card.overdue:not(.status-completed) {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(254, 242, 242, 0.5);
}

.reminder-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: 12px;
}

.reminder-header-content {
  flex: 1;
  min-width: 0;
}

.reminder-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.priority-badge,
.type-badge,
.status-indicator {
  font-weight: 500;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid currentColor;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.priority-badge.high {
  color: #dc2626;
  border-color: rgba(220, 38, 38, 0.3);
}
.priority-badge.medium {
  color: #d97706;
  border-color: rgba(217, 119, 6, 0.3);
}
.priority-badge.low {
  color: #059669;
  border-color: rgba(5, 150, 105, 0.3);
}

.status-indicator.todo {
  color: #3b82f6;
  border-color: rgba(59, 130, 246, 0.3);
}
.status-indicator.progress {
  color: #d97706;
  border-color: rgba(217, 119, 6, 0.3);
}
.status-indicator.completed {
  color: #059669;
  border-color: rgba(5, 150, 105, 0.3);
}

.reminder-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.4;
  word-wrap: break-word;
  hyphens: auto;
}

.reminder-title.completed-text {
  text-decoration: line-through;
  color: #6b7280;
}

.more-actions-btn {
  background: transparent;
  border: none;
  color: #6b7280;
  transition: all 0.2s ease;
  opacity: 0;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 6px;
}

.reminder-card:hover .more-actions-btn {
  opacity: 1;
}

.more-actions-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.reminder-description {
  color: #6b7280;
  line-height: 1.6;
  font-size: 0.875rem;
  margin: 4px 0 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reminder-type-section {
  margin-top: 8px;
}

.type-badge {
  font-weight: 500;
  border-radius: 6px;
  font-size: 0.75rem;
  padding: 4px 8px;
}

.reminder-content {
  padding-top: 0;
}

.reminder-meta-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reminder-date-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: #6b7280;
}

.reminder-date-info.overdue-date {
  color: #dc2626;
}

.reminder-date-info .el-icon {
  font-size: 1rem;
  color: currentColor;
}

.date-text {
  font-weight: 400;
}

.reminder-extra-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.875rem;
  color: #6b7280;
}

.days-left {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
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

.reminder-property-info,
.sharing-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  color: #6b7280;
}

.reminder-property-info .el-icon,
.sharing-info .el-icon {
  font-size: 1rem;
  color: currentColor;
}

.reminder-status-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(229, 231, 235, 0.5);
}

.status-buttons-container {
  display: flex;
  gap: 8px;
}

.status-btn {
  flex: 1;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
  padding: 6px 8px;
  min-height: 32px;
}

@media (max-width: 768px) {
  .reminder-card {
    padding: 16px;
    gap: 12px;
  }

  .reminder-card-header {
    flex-direction: row;
    align-items: flex-start;
    gap: 8px;
  }

  .reminder-header-content {
    width: 100%;
  }

  .reminder-badges {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    margin-bottom: 6px;
  }

  .reminder-extra-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .more-actions-btn {
    opacity: 1;
  }

  .status-btn {
    font-size: 0.8rem;
    padding: 8px 4px;
  }
}

@media (max-width: 480px) {
  .reminder-card {
    padding: 12px;
    gap: 10px;
  }

  .reminder-title {
    font-size: 1rem;
  }

  .status-btn {
    font-size: 0.7rem;
    padding: 4px 6px;
    min-height: 28px;
  }

  .reminder-extra-info {
    gap: 6px;
  }
}
</style>
