<template>
  <div class="reminders-filters">
    <el-radio-group v-model="localSharingFilter">
      <el-radio-button label="all">Tous</el-radio-button>
      <el-radio-button label="personal">Personnel</el-radio-button>
      <!-- <el-radio-button label="user">Collègue</el-radio-button> -->
      <el-radio-button v-if="userRole === 'admin'" label="agency"
        >Agence</el-radio-button
      >
    </el-radio-group>

    <!-- Colleague selector -->
    <!-- <el-select
      v-if="localSharingFilter === 'user'"
      v-model="localSelectedUser"
      placeholder="Choisir un collègue"
      class="user-select"
      :loading="loadingUsers"
      no-data-text="Pas de donnée disponible"
      @visible-change="onUserSelectOpen"
    >
      <el-option
        v-for="user in agencyUsers"
        :key="user.id"
        :label="user.name"
        :value="user.id"
      >
        <span class="user-option__name">{{ user.name }}</span>
        <span class="user-option__email">{{ user.email }}</span>
      </el-option>
    </el-select> -->

    <!-- Agency selector (admin only) -->
    <el-select
      v-if="localSharingFilter === 'agency' && userRole === 'admin'"
      v-model="localSelectedAgency"
      placeholder="Choisir une agence"
      class="user-select"
      :loading="loadingAgencies"
      no-data-text="Pas de donnée disponible"
      @visible-change="onAgencySelectOpen"
    >
      <el-option
        v-for="agency in agencies"
        :key="agency.id"
        :label="agency.name"
        :value="agency.id"
      />
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRemindersStore } from '@/stores/reminders';

const props = defineProps<{
  sharingFilter: string;
  selectedUser: number | null;
  selectedAgency: number | null;
  userRole: string;
}>();

const emit = defineEmits<{
  'update:sharingFilter': [value: string];
  'update:selectedUser': [value: number | null];
  'update:selectedAgency': [value: number | null];
}>();

const remindersStore = useRemindersStore();
const { agencyUsers, agencies } = storeToRefs(remindersStore);

// const loadingUsers = ref(false);
const loadingAgencies = ref(false);

const localSharingFilter = computed({
  get: () => props.sharingFilter,
  set: val => {
    emit('update:sharingFilter', val);
    // Reset subordinate selections when scope changes
    if (val !== 'user') emit('update:selectedUser', null);
    if (val !== 'agency') emit('update:selectedAgency', null);
  },
});

// const localSelectedUser = computed({
//   get: () => props.selectedUser,
//   set: val => emit('update:selectedUser', val),
// });

const localSelectedAgency = computed({
  get: () => props.selectedAgency,
  set: val => emit('update:selectedAgency', val),
});

// const fetchUsers = async () => {
//   if (agencyUsers.value.length > 0) return;
//   loadingUsers.value = true;
//   try {
//     await remindersStore.loadAgencyUsers();
//   } finally {
//     loadingUsers.value = false;
//   }
// };

const fetchAgencies = async () => {
  if (agencies.value.length > 0) return;
  loadingAgencies.value = true;
  try {
    await remindersStore.loadAgencies();
  } finally {
    loadingAgencies.value = false;
  }
};

// const onUserSelectOpen = (visible: boolean) => {
//   if (visible) fetchUsers();
// };

const onAgencySelectOpen = (visible: boolean) => {
  if (visible) fetchAgencies();
};
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
