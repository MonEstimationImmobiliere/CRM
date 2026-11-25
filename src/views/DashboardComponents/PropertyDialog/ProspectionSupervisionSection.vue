<template>
  <section class="prospection-history" aria-label="Historique des prospections">
    <h3>Historique des prospections</h3>
    <ul v-if="entries.length">
      <li v-for="entry in entries" :key="entry.id">
        <div class="history-heading">
          <strong>{{ entry.agent.name || `Agent ${entry.agent.id}` }}</strong>
          <span>{{ statusLabels[entry.status] }}</span>
        </div>
        <div>Validation le {{ formatDate(entry.prospection_validated_at) }}</div>
        <div>Durée {{ entry.prospection_years }} a · {{ entry.prospection_months }} mois</div>
        <div>Échéance le {{ formatDate(entry.prospection_expires_at) }}</div>
      </li>
    </ul>
    <p v-if="loading" role="status">Chargement de l’historique…</p>
    <p v-else-if="error" role="status">Impossible d’actualiser l’historique.</p>
    <p v-else-if="!entries.length">Aucune validation dans ce périmètre.</p>
    <ElButton v-if="error && !loading" native-type="button" @click="load(retryPage)">Réessayer</ElButton>
    <ElButton v-else-if="loadedPages < lastPage" native-type="button" :loading="loading" @click="load(loadedPages + 1)">
      Afficher plus de validations
    </ElButton>
  </section>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, shallowRef, watch } from 'vue';
import { isAxiosError } from 'axios';
import { ElButton } from 'element-plus';
import { personalPropertyKey } from '@/api/personal-property.service';
import type { PersonalPropertyTarget } from '@/api/personal-property.service';
import { getProspectionHistory } from '@/api/prospection-progress.service';
import type { ProspectionHistoryEntry } from '@/api/prospection-progress.service';
import { useProspectionScopeStore } from '@/stores/prospectionScope';
import { useUserStore } from '@/stores/user';

const props = defineProps<{ target: PersonalPropertyTarget }>();
const user = useUserStore();
const scope = useProspectionScopeStore();
const context = computed(() => JSON.stringify([user.token, personalPropertyKey(props.target), scope.filters]));
const entries = shallowRef<ProspectionHistoryEntry[]>([]);
const loading = ref(false);
const error = ref(false);
const loadedPages = ref(0);
const lastPage = ref(0);
const retryPage = ref(0);
let revision = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

const statusLabels: Record<ProspectionHistoryEntry['status'], string> = {
  valid: 'Valide',
  expired: 'Expirée',
  pending: 'À venir',
};
const formatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Paris',
});

function formatDate(value: string) {
  const instant = Date.parse(value);
  return Number.isFinite(instant) ? formatter.format(instant) : '—';
}

async function load(page = 0) {
  const filters = scope.filters;
  if (!user.token || !filters || filters.scope === 'me') return;
  const target = props.target;
  const key = context.value;
  const version = ++revision;
  const isCurrent = () => version === revision && key === context.value;
  clearTimeout(timer);
  loading.value = true;
  error.value = false;
  retryPage.value = page;
  try {
    // Reload the visible range because a new validation can shift offset-based pages.
    const pages = Array.from({ length: Math.max(1, page, loadedPages.value) }, (_, index) => index + 1);
    const started = performance.now();
    const results = await Promise.all(pages.map(number => getProspectionHistory(target, filters, number)));
    if (!isCurrent()) return;
    const latest = results[results.length - 1];
    const merged = new Map<number, ProspectionHistoryEntry>();
    for (const result of results) {
      for (const entry of result.history.data) merged.set(entry.id, entry);
    }
    entries.value = [...merged.values()];
    lastPage.value = latest.history.last_page;
    loadedPages.value = Math.min(latest.history.current_page, lastPage.value);

    const now = Date.parse(latest.server_now);
    let delay = Infinity;
    for (const entry of entries.value) {
      const timestamp = entry.status === 'valid' ? entry.prospection_expires_at
        : entry.status === 'pending' ? entry.prospection_validated_at : null;
      if (timestamp) {
        const remaining = Date.parse(timestamp) - now;
        if (Number.isFinite(remaining)) delay = Math.min(delay, remaining);
      }
    }
    if (Number.isFinite(delay)) {
      timer = setTimeout(() => {
        if (isCurrent()) void load();
      }, Math.max(100, Math.min(delay - (performance.now() - started), 2_147_000_000)));
    }
  } catch (cause) {
    if (!isCurrent()) return;
    if (isAxiosError(cause) && cause.response?.status === 403) {
      entries.value = [];
      scope.rejectScope();
      return;
    }
    error.value = true;
    if (!(isAxiosError(cause) && cause.response?.status === 404) && entries.value.length) {
      timer = setTimeout(() => {
        if (isCurrent()) void load();
      }, 15_000);
    }
  } finally {
    if (isCurrent()) loading.value = false;
  }
}

watch(context, () => {
  revision++;
  clearTimeout(timer);
  entries.value = [];
  loading.value = false;
  error.value = false;
  loadedPages.value = 0;
  lastPage.value = 0;
  void load();
}, { immediate: true });
watch(() => scope.historyRevision, () => { void load(); });
onUnmounted(() => {
  revision++;
  clearTimeout(timer);
});
</script>

<style scoped>
.prospection-history {
  margin-top: 1rem;
  padding: .75rem;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
}

.prospection-history h3 {
  margin: 0 0 .5rem;
}

.prospection-history ul {
  display: grid;
  gap: .4rem;
  max-height: 20rem;
  overflow-y: auto;
  margin: 0 0 .5rem;
  padding: 0;
  list-style: none;
}

.prospection-history li {
  padding: .4rem .55rem;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  font-size: .85rem;
}

.history-heading {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: .35rem;
}
</style>
