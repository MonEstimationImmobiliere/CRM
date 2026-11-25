<template>
  <section class="prospection-section" :aria-label="collective ? 'Ma prospection' : 'Prospection'">
    <h3>{{ collective ? 'Ma prospection' : 'Prospection' }}</h3>
    <p v-if="loading" role="status">Chargement de la prospection…</p>
    <p v-else-if="!loaded" role="status">Impossible de charger la prospection.</p>
    <ElButton v-if="!loading && !loaded" native-type="button" @click="load">Réessayer</ElButton>
    <template v-if="loaded">
      <p class="prospection-status">{{ isValid ? 'Prospection valide' : 'À prospecter' }}</p>

      <dl v-if="property.prospection_validated_at" class="prospection-dates">
        <div>
          <dt>Date de validation</dt>
          <dd>{{ formatDate(property.prospection_validated_at) }}</dd>
        </div>
        <div>
          <dt>Date d’expiration</dt>
          <dd>{{ formatDate(property.prospection_expires_at) }}</dd>
        </div>
      </dl>
      <p v-if="!editing && property.prospection_comment" class="prospection-comment">
        {{ property.prospection_comment }}
      </p>

      <ElCheckbox :model-value="editing" :disabled="saving" @change="setEditing($event === true)">
        {{ property.prospection_validated_at ? 'Renouveler la prospection' : 'Prospection effectuée' }}
      </ElCheckbox>

      <div v-if="editing" class="prospection-fields">
        <div class="prospection-duration">
          <label>
            Années
            <input v-model.number="years" type="number" min="0" step="1" :disabled="saving" @keydown.enter.prevent />
          </label>
          <label>
            Mois
            <input v-model.number="months" type="number" min="0" step="1" :disabled="saving" @keydown.enter.prevent />
          </label>
        </div>
        <p v-if="!validDuration" class="prospection-error">
          Saisissez des entiers positifs ou nuls, pour une durée totale supérieure à zéro.
        </p>
        <label>
          Commentaire (facultatif)
          <textarea v-model="comment" rows="3" maxlength="4000" :disabled="saving" />
        </label>
        <ElButton native-type="button" type="primary" :disabled="!validDuration" :loading="saving" @click="validate">
          {{ property.prospection_validated_at ? 'Confirmer le renouvellement' : 'Valider la prospection' }}
        </ElButton>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { ElButton, ElCheckbox, ElMessage } from 'element-plus';
import { PersonalPropertyService, personalPropertyKey } from '@/api/personal-property.service';
import type { PersonalPropertyTarget } from '@/api/personal-property.service';
import type { PersonalProspection } from '@/types/property';
import { useUserStore } from '@/stores/user';
import { useDashboardStore } from '@/stores/dashboard';
import { useProspectionScopeStore } from '@/stores/prospectionScope';

const props = defineProps<{ target: PersonalPropertyTarget; collective?: boolean }>();
const userStore = useUserStore();
const dashboard = useDashboardStore();
const prospectionScope = useProspectionScopeStore();
const property = ref<PersonalProspection>({});
const loaded = ref(false);
const loading = ref(false);
const saving = ref(false);
let revision = 0;
const editing = ref(false);
const years = ref<number | ''>(0);
const months = ref<number | ''>(0);
const comment = ref('');
const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | undefined;

const isValid = computed(() => {
  const expiry = property.value.prospection_expires_at;
  return !!property.value.prospection_validated_at && !!expiry && Date.parse(expiry) > now.value;
});
const validDuration = computed(() =>
  typeof years.value === 'number' && Number.isSafeInteger(years.value) && years.value >= 0 &&
  typeof months.value === 'number' && Number.isSafeInteger(months.value) && months.value >= 0 &&
  years.value * 12 + months.value > 0
);

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Paris',
});

function formatDate(value?: string | null) {
  const timestamp = value ? Date.parse(value) : NaN;
  return Number.isFinite(timestamp) ? dateFormatter.format(timestamp) : '—';
}

function setEditing(value: boolean) {
  editing.value = value;
  if (value) {
    years.value = property.value.prospection_years ?? 0;
    months.value = property.value.prospection_months ?? 0;
    comment.value = property.value.prospection_comment ?? '';
  }
}

async function load() {
  const version = ++revision;
  property.value = {};
  editing.value = false;
  loaded.value = false;
  loading.value = true;
  saving.value = false;
  try {
    const result = await PersonalPropertyService.getProspection(props.target);
    if (version === revision) {
      property.value = result ?? {};
      now.value = Date.now();
      loaded.value = true;
    }
  } catch {
    // The unavailable state offers an explicit retry.
  } finally {
    if (version === revision) loading.value = false;
  }
}

async function validate() {
  if (!validDuration.value || saving.value || !loaded.value) return;
  const version = revision;
  const token = userStore.token;
  saving.value = true;
  try {
    const result = await PersonalPropertyService.saveProspection(props.target, {
      years: Number(years.value),
      months: Number(months.value),
      comment: comment.value.trim() || null,
    });
    if (token === userStore.token) {
      prospectionScope.signalHistoryChanged();
      void dashboard.refreshProspectionProgress();
    }
    if (version === revision && token === userStore.token) {
      property.value = result;
      now.value = Date.now();
      editing.value = false;
      ElMessage.success('Prospection enregistrée');
    }
  } catch (error: any) {
    if (version === revision) {
      ElMessage.error(error.response?.data?.message || 'Impossible d’enregistrer la prospection.');
    }
  } finally {
    if (version === revision) saving.value = false;
  }
}

watch([() => personalPropertyKey(props.target), () => userStore.token], load, { immediate: true });
onMounted(() => {
  timer = setInterval(() => { now.value = Date.now(); }, 1000);
});
onUnmounted(() => {
  revision++;
  clearInterval(timer);
});
</script>

<style scoped>
.prospection-section {
  display: grid;
  gap: 8px;
  margin-top: 16px;
  padding: 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
}

.prospection-section h3,
.prospection-section p,
.prospection-dates,
.prospection-dates dd {
  margin: 0;
}

.prospection-status,
.prospection-dates dd {
  font-weight: 600;
}

.prospection-dates,
.prospection-duration {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.prospection-dates dt {
  color: var(--el-text-color-secondary);
}

.prospection-fields,
.prospection-fields label {
  display: grid;
  gap: 6px;
}

.prospection-fields input,
.prospection-fields textarea {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-primary);
  font: inherit;
}

.prospection-fields .el-button {
  justify-self: start;
}

.prospection-error {
  color: var(--el-color-danger);
}

.prospection-comment {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
