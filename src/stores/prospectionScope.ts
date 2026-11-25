import { computed, ref, shallowRef, watch } from 'vue';
import { defineStore } from 'pinia';
import { getProspectionScopes } from '@/api/prospection-progress.service';
import type { ProspectionScopeFilters, ProspectionScopes } from '@/api/prospection-progress.service';
import { useUserStore } from '@/stores/user';

export const useProspectionScopeStore = defineStore('prospectionScope', () => {
  const user = useUserStore();
  const options = shallowRef<ProspectionScopes | null>(null);
  const scope = ref<'personal' | 'agency'>('personal');
  const agencyId = ref<number | null>(null);
  const loading = ref(false);
  const loadError = ref(false);
  const notice = ref('');
  const historyRevision = ref(0);
  let revision = 0;

  const agencies = computed(() => options.value?.agency_scope_agencies ?? []);
  const canSelectAgencyScope = computed(() => agencies.value.length > 0);
  const showAgencyPicker = computed(() => scope.value === 'agency' &&
    options.value?.scopes.includes('group') === true);

  function isAllowedAgency(id: number | null) {
    return agencies.value.some(agency => agency.id === id);
  }

  function defaultAgencyId() {
    const ownAgency = options.value?.agency_id ?? null;
    return isAllowedAgency(ownAgency) ? ownAgency : agencies.value[0]?.id ?? null;
  }

  const filters = computed<ProspectionScopeFilters | null>(() => {
    if (scope.value === 'personal') return { scope: 'me' };
    const allowed = options.value;
    if (!allowed || agencyId.value === null || !isAllowedAgency(agencyId.value)) return null;
    return { scope: 'agency', agency_id: agencyId.value, agency_group_id: allowed.agency_group_id };
  });

  function selectScope(value: 'personal' | 'agency') {
    if (value === 'agency') {
      if (!canSelectAgencyScope.value) return;
      if (!isAllowedAgency(agencyId.value)) agencyId.value = defaultAgencyId();
    }
    scope.value = value;
    notice.value = '';
  }

  function selectAgency(value: number) {
    if (scope.value === 'agency' && isAllowedAgency(value)) {
      agencyId.value = value;
    }
  }

  async function loadScopes() {
    const version = ++revision;
    const token = user.token;
    if (!token) return;
    loading.value = true;
    loadError.value = false;
    try {
      const data = await getProspectionScopes();
      if (version !== revision || token !== user.token) return;
      options.value = data;
      if (scope.value === 'agency' && !isAllowedAgency(agencyId.value)) {
        selectScope('personal');
        agencyId.value = null;
        notice.value = 'Agence non autorisée. Retour à Personnel.';
      }
    } catch {
      if (version !== revision || token !== user.token) return;
      options.value = null;
      selectScope('personal');
      agencyId.value = null;
      loadError.value = true;
    } finally {
      if (version === revision) loading.value = false;
    }
  }

  function rejectScope() {
    const wasCollective = scope.value === 'agency';
    selectScope('personal');
    agencyId.value = null;
    notice.value = wasCollective
      ? 'Périmètre non autorisé. Retour à Personnel.'
      : 'La progression personnelle est indisponible pour ce compte.';
    options.value = null;
    void loadScopes();
  }

  watch(() => user.token, () => {
    revision++;
    options.value = null;
    loading.value = false;
    loadError.value = false;
    selectScope('personal');
    agencyId.value = null;
  }, { flush: 'sync' });

  return {
    scope, agencyId, agencies, canSelectAgencyScope, showAgencyPicker, filters, loading, loadError, notice,
    historyRevision, selectScope, selectAgency, loadScopes, rejectScope,
    signalHistoryChanged: () => { historyRevision.value++; },
  };
});
