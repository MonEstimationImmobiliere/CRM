<template>
  <div class="prospection-scope">
    <DashboardAgencyScopeSelect
      v-model="scope"
      label="Périmètre de prospection"
      :personal-only="!store.canSelectAgencyScope"
      :disabled="store.loading"
    />
    <el-select
      v-if="store.showAgencyPicker"
      :model-value="store.agencyId"
      aria-label="Agence de prospection"
      size="small"
      class="prospection-agency-select"
      :disabled="store.loading"
      @change="store.selectAgency"
    >
      <el-option v-for="agency in store.agencies" :key="agency.id" :label="agency.name" :value="agency.id" />
    </el-select>
    <span v-if="store.loading" role="status">Chargement des périmètres…</span>
    <span v-if="store.notice" role="status">{{ store.notice }}</span>
    <template v-if="store.loadError">
      <span role="status">Périmètres indisponibles.</span>
      <button type="button" @click="store.loadScopes">Réessayer</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useProspectionScopeStore } from '@/stores/prospectionScope';
import { useUserStore } from '@/stores/user';
import DashboardAgencyScopeSelect from './DashboardAgencyScopeSelect.vue';

const store = useProspectionScopeStore();
const user = useUserStore();
const scope = computed({ get: () => store.scope, set: store.selectScope });

watch(() => user.token, () => { void store.loadScopes(); }, { immediate: true });
</script>

<style scoped>
.prospection-scope {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  font-size: .875rem;
}

.prospection-agency-select {
  width: 180px;
  max-width: 100%;
}
</style>
