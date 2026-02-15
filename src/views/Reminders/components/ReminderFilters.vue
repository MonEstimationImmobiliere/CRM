<template>
  <div class="reminders-filters">
    <el-radio-group
      :model-value="activeFilter"
      @update:model-value="$emit('update:activeFilter', String($event))"
      size="large"
    >
      <el-radio-button label="all">Tous</el-radio-button>
      <el-radio-button label="overdue">En retard</el-radio-button>
      <el-radio-button label="today">Aujourd'hui</el-radio-button>
      <el-radio-button label="upcoming">À venir</el-radio-button>
      <el-radio-button label="completed">Terminés</el-radio-button>
    </el-radio-group>

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

.filter-select {
  width: 150px;
}

@media (max-width: 768px) {
  .reminders-filters {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .filter-actions {
    justify-content: space-between;
  }
}
</style>
