<template>
  <div class="headerBottomRow">
    <div class="modeBar">
      <button
        class="modePill"
        :class="{ active: activeFilter === 'all' }"
        @click="$emit('update:activeFilter', 'all')"
      >
        Tous
      </button>
      <button
        class="modePill"
        :class="{ active: activeFilter === 'overdue' }"
        @click="$emit('update:activeFilter', 'overdue')"
      >
        <span class="modeDot overdue"></span>
        En retard
      </button>
      <button
        class="modePill"
        :class="{ active: activeFilter === 'today' }"
        @click="$emit('update:activeFilter', 'today')"
      >
        <span class="modeDot today"></span>
        Aujourd'hui
      </button>
      <button
        class="modePill"
        :class="{ active: activeFilter === 'upcoming' }"
        @click="$emit('update:activeFilter', 'upcoming')"
      >
        <span class="modeDot upcoming"></span>
        À venir
      </button>
      <button
        class="modePill"
        :class="{ active: activeFilter === 'completed' }"
        @click="$emit('update:activeFilter', 'completed')"
      >
        <span class="modeDot completed"></span>
        Terminés
      </button>
    </div>

    <div class="filter-actions">
      <el-select
        :model-value="typeFilter"
        @update:model-value="$emit('update:typeFilter', $event)"
        placeholder="Type"
        clearable
        class="filter-select"
      >
        <el-option label="Rappel" value="rappel" />
        <el-option label="Estimation" value="estimation" />
        <el-option label="Visite" value="visite" />
        <el-option label="Autre" value="autre" />
      </el-select>

      <el-select
        :model-value="priorityFilter"
        @update:model-value="$emit('update:priorityFilter', $event)"
        placeholder="Priorité"
        clearable
        class="filter-select"
      >
        <el-option label="Haute" value="high" />
        <el-option label="Moyenne" value="medium" />
        <el-option label="Basse" value="low" />
      </el-select>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  activeFilter: string;
  typeFilter: string;
  priorityFilter: string;
}>();

defineEmits<{
  'update:activeFilter': [value: string];
  'update:typeFilter': [value: string];
  'update:priorityFilter': [value: string];
}>();
</script>

<style scoped>
.headerBottomRow {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  width: 100%;
}

.modeBar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.modePill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: #f3f4f6;
  color: #374151;
  padding: 10px 16px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modePill:hover {
  background: #e5e7eb;
}

.modePill.active {
  background: #2563eb;
  color: white;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
}

.modeDot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}

.modePill.active .modeDot {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.35);
}

.modeDot.overdue {
  background: #ef4444;
}

.modeDot.today {
  background: #f97316;
}

.modeDot.upcoming {
  background: #3b82f6;
}

.modeDot.completed {
  background: #10b981;
}

.filter-actions {
  display: flex;
  gap: 12px;
}

.filter-select {
  width: 150px;
}

@media (max-width: 768px) {
  .headerBottomRow {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .filter-actions {
    justify-content: space-between;
  }
}
</style>
