<template>
  <div class="reminders-widget">
    <el-card class="reminder-summary-card" shadow="hover">
      <div class="reminder-summary">
        <div class="reminder-header">
          <el-icon class="reminder-icon"><Bell /></el-icon>
          <h3>Rappels</h3>
        </div>

        <div class="reminder-stats">
          <div class="stat-item overdue" v-if="overdueCount > 0">
            <span class="count">{{ overdueCount }}</span>
            <span class="label">En retard</span>
          </div>

          <div class="stat-item today" v-if="todayCount > 0">
            <span class="count">{{ todayCount }}</span>
            <span class="label">Aujourd'hui</span>
          </div>

          <div class="stat-item upcoming" v-if="upcomingCount > 0">
            <span class="count">{{ upcomingCount }}</span>
            <span class="label">À venir</span>
          </div>

          <div class="stat-item empty" v-if="totalPendingCount === 0">
            <span class="message">Aucun rappel en attente</span>
          </div>
        </div>

        <div class="reminder-actions">
          <el-button
            type="primary"
            size="small"
            @click="navigateToReminders"
            :disabled="totalPendingCount === 0"
          >
            <el-icon><Calendar /></el-icon>
            Voir tous les rappels
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useRemindersStore } from '@/stores/reminders';
import { Bell, Calendar } from '@element-plus/icons-vue';

const router = useRouter();
const remindersStore = useRemindersStore();

// Computed properties pour les statistiques
const overdueCount = computed(() => remindersStore.overdueReminders.length);
const todayCount = computed(() => remindersStore.todayReminders.length);
const upcomingCount = computed(() => remindersStore.upcomingReminders.length);
const totalPendingCount = computed(
  () => overdueCount.value + todayCount.value + upcomingCount.value
);

// Methods
const navigateToReminders = () => {
  router.push('/reminders');
};
</script>

<style scoped>
.reminders-widget {
  margin-bottom: 20px;
}

.reminder-summary-card {
  transition: all 0.3s ease;
  cursor: pointer;
}

.reminder-summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.reminder-summary {
  padding: 16px;
}

.reminder-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.reminder-icon {
  font-size: 1.5rem;
  color: #409eff;
}

.reminder-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
  font-weight: 600;
}

.reminder-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  min-width: 60px;
}

.stat-item.overdue {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
}

.stat-item.today {
  background-color: #fffbeb;
  border: 1px solid #fed7aa;
}

.stat-item.upcoming {
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
}

.stat-item.empty {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  padding: 12px;
  flex: 1;
}

.count {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.label {
  font-size: 0.75rem;
  color: #6b7280;
  text-align: center;
}

.message {
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
}

.stat-item.overdue .count {
  color: #dc2626;
}

.stat-item.today .count {
  color: #d97706;
}

.stat-item.upcoming .count {
  color: #2563eb;
}

.reminder-actions {
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .reminder-stats {
    flex-direction: column;
    gap: 8px;
  }

  .stat-item {
    flex-direction: row;
    justify-content: space-between;
    padding: 12px;
  }

  .count {
    font-size: 1rem;
  }
}
</style>
