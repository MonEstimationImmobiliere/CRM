<template>
  <el-dropdown trigger="click" @command="emit('edit-reminder', $event)">
    <el-button circle size="small" :title="label" :aria-label="label" @click.stop>
      <el-icon><Bell /></el-icon>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item v-for="reminder in reminders" :key="reminder.id" :command="reminder">
          {{ formatDateShort(reminder.date) }} · {{ reminder.title }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Bell } from '@element-plus/icons-vue';
import { formatDateShort } from '@/helpers/intl';
import type { Reminder } from '@/stores/reminders';

const props = defineProps<{ reminders: Reminder[] }>();
const emit = defineEmits<{ 'edit-reminder': [reminder: Reminder] }>();
const label = computed(() => props.reminders.length === 1
  ? 'Ouvrir le rappel' : `Ouvrir les ${props.reminders.length} rappels`);
</script>
