<template>
  <div class="reminders-stats">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card overdue">
          <div class="stat-content">
            <el-icon class="stat-icon"><Warning /></el-icon>
            <div class="stat-info">
              <div class="stat-number">{{ overdueCount }}</div>
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
              <div class="stat-number">{{ todayCount }}</div>
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
              <div class="stat-number">{{ upcomingCount }}</div>
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
              <div class="stat-number">{{ completedCount }}</div>
              <div class="stat-label">Terminés</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { Warning, Calendar, Clock, Check } from '@element-plus/icons-vue';

defineProps<{
  overdueCount: number;
  todayCount: number;
  upcomingCount: number;
  completedCount: number;
}>();
</script>

<style scoped>
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

@media (max-width: 768px) {
  .stat-content {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .stat-card {
    margin-bottom: 12px;
  }
}
</style>
