<template>
  <div class="reminders-filters">
    <el-radio-group v-model="localSharingFilter" @change="onSharingChange">
      <el-radio-button label="all">Tous</el-radio-button>
      <el-radio-button label="personal">Personnel</el-radio-button>
      <el-radio-button label="agency">Agence</el-radio-button>
      <el-radio-button label="user">Collègue</el-radio-button>
    </el-radio-group>

    <el-select
      v-if="localSharingFilter === 'user'"
      v-model="localSelectedUser"
      placeholder="Choisir un collègue"
      class="user-select"
      :loading="loadingUsers"
      no-data-text="Pas de donnée disponible"
      @visible-change="onSelectOpen"
    >
      <el-option
        v-for="user in agencyUsers"
        :key="user.id"
        :label="user.email"
        :value="user.id"
      >
        <span class="user-option__name">{{ user.name }}</span>
        <span class="user-option__email">{{ user.email }}</span>
      </el-option>
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRemindersStore } from '@/stores/reminders';

const props = defineProps<{
  sharingFilter: string;
  selectedUser: number | null;
}>();

const emit = defineEmits<{
  'update:sharingFilter': [value: string];
  'update:selectedUser': [value: number | null];
}>();

const remindersStore = useRemindersStore();
const { agencyUsers } = storeToRefs(remindersStore);

const loadingUsers = ref(false);

const localSharingFilter = computed({
  get: () => props.sharingFilter,
  set: val => emit('update:sharingFilter', val),
});

const localSelectedUser = computed({
  get: () => props.selectedUser,
  set: val => emit('update:selectedUser', val),
});

const fetchUsers = async () => {
  if (agencyUsers.value.length > 0) return;
  loadingUsers.value = true;
  try {
    await remindersStore.loadAgencyUsers();
  } finally {
    loadingUsers.value = false;
  }
};

const onSelectOpen = (visible: boolean) => {
  if (visible) fetchUsers();
};

const onSharingChange = (val: string | number | boolean | undefined) => {
  const scope = String(val ?? '');
  if (scope !== 'user') {
    emit('update:selectedUser', null);
  }
  if (scope === 'agency') {
    remindersStore.loadRemindersByScope('agency');
  } else if (scope === 'me' || scope === 'all' || scope === 'personal') {
    remindersStore.loadRemindersByScope('me');
  }
};

watch(localSelectedUser, userId => {
  if (localSharingFilter.value === 'user' && userId !== null) {
    remindersStore.loadRemindersByScope('user', userId);
  }
});
</script>

<style scoped>
.reminders-filters {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-select {
  width: 240px;
}

.user-option__name {
  display: block;
  font-weight: 600;
  font-size: 0.85rem;
  color: #1e293b;
}

.user-option__email {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
}
</style>
