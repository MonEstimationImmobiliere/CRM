<template>
  <section v-loading="loading" class="automatic-estimate">
    <p v-if="!propertyId">Enregistrez d’abord la fiche pour lancer une estimation automatique.</p>
    <p v-else-if="dirty">Enregistrez les modifications de la fiche avant de lancer le calcul.</p>
    <el-button v-if="!propertyId || dirty" native-type="button" :loading="saving" :disabled="calculating"
      @click="emit('save-property')">Enregistrer la fiche</el-button>
    <p v-if="message" role="status">{{ message }}</p>

    <el-card v-if="profile || estimate" shadow="never" class="estimate-panel">
      <div class="estimate-heading">
        <div>
          <h3>Estimation du bien</h3>
          <template v-if="estimate && !estimate.range">
            <strong class="estimate-price">{{ formatPrice(estimate.price) }}</strong>
            <div>{{ formatPrice(estimate.price_per_square_meter) }} / m²</div>
          </template>
        </div>
        <el-button v-if="profile" type="primary" native-type="button" :loading="calculating"
          :disabled="loading || saving || dirty || !!profile.blocking.length" @click="calculate">
          {{ estimate ? 'Recalculer l’estimation' : 'Estimation automatique' }}
        </el-button>
      </div>
      <div v-if="estimate?.range" class="estimate-range">
        <div><small>Estimation basse</small><br /><strong>{{ formatPrice(estimate.range.lower, '0 €') }}</strong></div>
        <div><small>Estimation centrale</small><br /><strong class="estimate-price">{{ formatPrice(estimate.range.central) }}</strong></div>
        <div><small>Estimation haute</small><br /><strong>{{ formatPrice(estimate.range.upper) }}</strong></div>
        <div class="estimate-range-line" aria-hidden="true"><span /></div>
        <div class="estimate-range-caption">
          {{ formatPrice(estimate.price_per_square_meter) }} / m²
          <el-tooltip placement="top">
            <template #content>
              Marge indicative de ±{{ estimate.range.margin_percent.toLocaleString('fr-FR') }} % liée au niveau de confiance.
              <br />Les bornes sont arrondies au millier d’euros.
              <br />Cette marge ne représente ni un intervalle de confiance statistique ni le plafond des ajustements.
            </template>
            <span tabindex="0">· Fourchette indicative</span>
          </el-tooltip>
        </div>
      </div>
      <div v-if="estimate" class="estimate-meta">
        <span>Calculée le {{ formatDateShort(estimate.calculated_at) }}</span>
        <el-tag v-if="estimate.confidence" effect="plain">Confiance {{ estimate.confidence }}</el-tag>
      </div>
      <p v-if="estimate && !estimate.range" class="estimate-note">Fourchette et nouveaux indicateurs indisponibles pour cette estimation enregistrée.</p>
      <ul v-if="profile?.blocking.length">
        <li v-for="reason in profile.blocking" :key="reason">{{ reason }}</li>
      </ul>
    </el-card>
    <el-button v-if="!profile && propertyId && !loading" native-type="button" @click="load">Réessayer</el-button>

    <template v-if="estimate">
      <el-card shadow="never" class="estimate-panel">
        <h3>Référence du marché DVF</h3>
        <dl>
          <dt>Périmètre</dt><dd>{{ estimate.scope_label }}</dd>
          <dt>Ventes comparables</dt><dd>{{ estimate.comparables }}</dd>
          <template v-if="estimate.market_reference?.comparable_communes?.length">
            <dt>Communes des ventes (INSEE)</dt><dd>{{ estimate.market_reference.comparable_communes.join(', ') }}</dd>
          </template>
          <template v-if="estimate.market_reference?.expansion_reason">
            <dt>Motif de l’élargissement</dt><dd>{{ estimate.market_reference.expansion_reason }}</dd>
          </template>
          <template v-if="estimate.market_reference?.period">
            <dt>Période</dt>
            <dd>{{ formatDateShort(estimate.market_reference.period.from) }} – {{ formatDateShort(estimate.market_reference.period.to) }}</dd>
          </template>
          <template v-if="estimate.market_reference?.median_price_per_square_meter != null">
            <dt>Médiane DVF brute du périmètre</dt><dd>{{ euros(estimate.market_reference.median_price_per_square_meter) }} / m²</dd>
          </template>
          <template v-if="estimate.market_reference?.temporal_median_price_per_m2 != null">
            <dt>Médiane du périmètre pondérée par l’ancienneté</dt><dd>{{ euros(estimate.market_reference.temporal_median_price_per_m2) }} / m²</dd>
          </template>
          <template v-if="estimate.market_reference?.commune_median_price_per_m2 != null">
            <dt>{{ estimate.market_reference.temporal_median_price_per_m2 != null ? 'Médiane communale pondérée par l’ancienneté' : 'Médiane communale comparable' }}</dt><dd>{{ euros(estimate.market_reference.commune_median_price_per_m2) }} / m²</dd>
          </template>
          <template v-if="estimate.market_reference?.commune_weight != null">
            <dt>Poids communal appliqué</dt><dd>{{ estimate.market_reference.commune_weight }} ventes équivalentes</dd>
          </template>
          <template v-if="estimate.market_reference?.reference_price_per_m2 != null">
            <dt>Référence utilisée pour le calcul</dt><dd>{{ euros(estimate.market_reference.reference_price_per_m2) }} / m²</dd>
          </template>
        </dl>
        <dl v-if="estimate.market_reference?.temporal_weights?.length">
          <template v-for="(weight, years) in estimate.market_reference.temporal_weights" :key="years">
            <dt>{{ years === 0 ? 'Moins de 1 an' : years === estimate.market_reference.temporal_weights.length - 1 ? `${years} ans et plus` : `De ${years} à moins de ${years + 1} ans` }}</dt>
            <dd>{{ weight.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</dd>
          </template>
        </dl>
        <template v-if="estimate.explanation?.freshness">
          <h4>Fraîcheur des comparables</h4>
          <dl>
            <dt>Vente la plus récente</dt><dd>{{ formatDateShort(estimate.explanation.freshness.newest_date) }}</dd>
            <dt>Vente la plus ancienne</dt><dd>{{ formatDateShort(estimate.explanation.freshness.oldest_date) }}</dd>
            <dt>Ancienneté médiane</dt><dd>{{ formatNumber(estimate.explanation.freshness.median_age_days) }} jours</dd>
            <dt>Moins de deux ans</dt><dd>{{ formatRecentSales(estimate.explanation.freshness.under_two_years) }}</dd>
            <dt>Moins de trois ans</dt><dd>{{ formatRecentSales(estimate.explanation.freshness.under_three_years) }}</dd>
          </dl>
          <p v-if="estimate.explanation.freshness.mostly_old" class="estimate-note">
            La majorité des comparables datent d’au moins trois ans.
          </p>
        </template>
      </el-card>

      <el-collapse class="estimate-panel">
        <el-collapse-item v-if="estimate.explanation?.land" title="Comparaison du terrain" name="land">
          <p>Terrain du bien estimé · {{ formatArea(estimate.explanation.land.property_area) }}</p>
          <template v-for="[key, label] in landSamples" :key="key">
            <template v-if="estimate.explanation.land[key]">
              <h3>{{ label }}</h3>
              <dl v-for="sample in [estimate.explanation.land[key]]" :key="key">
                <template v-if="sample">
                  <dt>Surfaces fiables</dt><dd>{{ sample.count }} / {{ sample.total }} · {{ percentage.format(sample.coverage) }}</dd>
                  <dt>Surface médiane</dt><dd>{{ formatArea(sample.median) }}</dd>
                  <dt>Minimum – maximum</dt><dd>{{ formatArea(sample.min) }} – {{ formatArea(sample.max) }}</dd>
                  <template v-if="sample.q1 != null && sample.q3 != null">
                    <dt>Premier et troisième quartiles</dt><dd>{{ formatArea(sample.q1) }} – {{ formatArea(sample.q3) }}</dd>
                  </template>
                  <dt>Écart à la médiane</dt><dd>{{ sample.difference == null ? 'Non disponible' : `${sample.difference > 0 ? '+' : ''}${formatArea(sample.difference)}` }}</dd>
                  <dt>Terrain du bien / médiane</dt><dd>{{ sample.ratio == null ? 'Non disponible' : `× ${formatNumber(sample.ratio)}` }}</dd>
                </template>
              </dl>
            </template>
          </template>
          <template v-if="estimate.explanation.land.method_comparison">
            <h3>Comparaison des barèmes</h3>
            <dl>
              <dt>Ancien barème absolu</dt><dd>{{ formatPrice(estimate.explanation.land.method_comparison.absolute_price) }}</dd>
              <dt>Barème relatif</dt><dd>{{ formatPrice(estimate.explanation.land.method_comparison.relative_price, 'Non disponible') }}</dd>
              <template v-if="estimate.explanation.land.method_comparison.difference != null">
                <dt>Écart du relatif par rapport à l’absolu</dt>
                <dd>{{ signedEuros(estimate.explanation.land.method_comparison.difference) }}
                  <template v-if="estimate.explanation.land.method_comparison.difference_percent != null">
                    · {{ percent(estimate.explanation.land.method_comparison.difference_percent) }}
                  </template>
                </dd>
              </template>
            </dl>
            <p v-if="estimate.calculation?.land_adjustment?.method === 'absolute' && estimate.explanation.land.method_comparison.relative_price != null" class="estimate-note">
              Simulation indicative du barème relatif sur un échantillon insuffisant. Le prix enregistré utilise le barème absolu.
            </p>
          </template>
        </el-collapse-item>
        <el-collapse-item title="Ventes comparables retenues" name="comparables">
          <template v-if="estimate.explanation">
            <h3>{{ estimate.scope_label }}</h3>
            <EstimateComparableTable :sales="estimate.explanation.sales" />
            <template v-if="estimate.explanation.commune_sales.length">
              <h3>Échantillon de la référence communale</h3>
              <EstimateComparableTable :sales="estimate.explanation.commune_sales" />
            </template>
          </template>
          <p v-else>Détail des comparables non disponible.</p>
        </el-collapse-item>
        <el-collapse-item v-if="estimate.explanation" title="Comparaison des méthodes de calcul" name="methods">
          <p>Analyse sur les mêmes ventes et avec les mêmes ajustements que l’estimation enregistrée.</p>
          <el-table :data="methodRows" size="small">
            <el-table-column prop="label" label="Méthode" min-width="150" />
            <el-table-column label="Coefficients du plus récent au plus ancien" min-width="230">
              <template #default="{ row }">{{ row.weights?.map(formatWeight).join(' · ') }}</template>
            </el-table-column>
            <el-table-column v-for="[key, label] in methodColumns" :key="key" :label="label" min-width="130">
              <template #default="{ row }">{{ row[key] == null ? '—' : euros(row[key]) }}</template>
            </el-table-column>
            <el-table-column label="Écart (€)" min-width="100">
              <template #default="{ row }">{{ signedEuros(row.difference) }}</template>
            </el-table-column>
            <el-table-column label="Écart (%)" min-width="100">
              <template #default="{ row }">{{ row.difference_percent == null ? '—' : percent(row.difference_percent) }}</template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
        <el-collapse-item v-if="estimate.explanation?.search_attempts.length" title="Périmètres étudiés" name="search">
          <p>Effectifs après les filtres de type, de surface et de qualification, puis après les filtres de prix.</p>
          <dl v-for="attempt in estimate.explanation.search_attempts" :key="attempt.label">
            <dt>{{ attempt.label }}</dt>
            <dd>
              <template v-if="attempt.count != null">
                {{ attempt.qualified_count }} qualifiées · {{ attempt.count }} retenues · {{ attempt.property_type }} · surface ±{{ attempt.surface_tolerance_percent }} %
                <br />
              </template>
              <span v-if="attempt.dispersion_percent != null">
                Dispersion {{ percent(attempt.dispersion_percent, false) }} (maximum {{ estimate.explanation.max_dispersion_percent }} %)
              </span>
              <br v-if="attempt.dispersion_percent != null" />{{ attempt.selected ? 'Périmètre retenu' : attempt.reason }}
            </dd>
          </dl>
        </el-collapse-item>
      </el-collapse>

      <el-card shadow="never" class="estimate-panel">
        <h3>Détail du calcul</h3>
        <dl>
          <template v-if="estimate.surface != null">
            <dt>Surface habitable utilisée</dt><dd>{{ estimate.surface }} m²</dd>
          </template>
          <template v-if="estimate.criteria?.area != null">
            <dt>Surface du terrain</dt><dd>{{ estimate.criteria.area }} m²</dd>
          </template>
          <template v-if="estimate.calculation?.property_condition">
            <dt>État général utilisé</dt><dd>{{ conditionLabels[estimate.calculation.property_condition] }}</dd>
          </template>
          <template v-if="estimate.calculation?.base_price != null">
            <dt>Prix avant ajustements</dt><dd>{{ euros(estimate.calculation.base_price) }}</dd>
          </template>
        </dl>
        <template v-if="estimate.calculation?.land_adjustment">
          <h4>
            Valorisation du terrain
            <el-tooltip placement="top">
              <template #content>
                <div v-for="([minimum, coefficient], index) in estimate.calculation.land_adjustment.bands" :key="minimum">
                  {{ index === 0 ? `Moins de ${formatNumber(estimate.calculation.land_adjustment.bands[1][0])}`
                    : index + 1 < estimate.calculation.land_adjustment.bands.length
                      ? `De ${formatNumber(minimum)} à moins de ${formatNumber(estimate.calculation.land_adjustment.bands[index + 1][0])}`
                      : `À partir de ${formatNumber(minimum)}` }} · {{ percent(coefficient) }}
                </div>
              </template>
              <small tabindex="0">· Barème relatif</small>
            </el-tooltip>
          </h4>
          <dl v-for="land in [estimate.calculation.land_adjustment]" :key="land.method">
            <dt>Méthode</dt><dd>{{ landMethodLabels[land.method] }}</dd>
            <dt>Terrain du bien</dt><dd>{{ formatArea(land.land_area) }}</dd>
            <dt>Médiane des terrains comparables</dt><dd>{{ formatArea(land.sample?.median) }}</dd>
            <dt>Surfaces fiables</dt>
            <dd>{{ land.sample ? `${land.sample.count} / ${land.sample.total} · ${percentage.format(land.sample.coverage)}` : 'Non disponible' }}</dd>
            <dt>Ratio du terrain</dt><dd>{{ land.sample?.ratio == null ? 'Non disponible' : `× ${formatNumber(land.sample.ratio)}` }}</dd>
            <dt>Coefficient retenu</dt><dd>{{ percent(land.percent) }}</dd>
            <dt>Ajustement terrain avant plafond global</dt><dd>{{ signedEuros(land.amount) }}</dd>
            <template v-if="land.reason"><dt>Motif</dt><dd>{{ land.reason }}</dd></template>
          </dl>
        </template>
        <p v-if="!estimate.calculation" class="estimate-note">Le détail des ajustements n’est pas disponible pour ce calcul.</p>
        <p v-else-if="estimate.calculation.adjustments?.length === 0" class="estimate-note">Aucun ajustement appliqué.</p>
        <p v-if="estimate.calculation?.cap_applied" class="estimate-note">
          Le plafond de ±15 % est appliqué au total. Les montants par critère ci-dessous sont calculés avant plafonnement.
        </p>
        <ul v-if="estimate.calculation?.adjustments?.length" class="estimate-adjustments">
          <li v-for="(item, index) in estimate.calculation.adjustments" :key="index">
            <span>{{ item.label }}<span v-if="item.value != null" class="estimate-note"> · {{ item.value }}</span></span>
            <el-tag :type="item.percent < 0 ? 'danger' : 'success'" effect="plain">{{ percent(item.percent) }}</el-tag>
            <span v-if="item.amount != null">{{ signedEuros(item.amount) }}</span>
          </li>
        </ul>
        <dl>
          <template v-if="estimate.calculation?.raw_adjustment_percent != null">
            <dt>Total avant plafonnement</dt><dd>{{ percent(estimate.calculation.raw_adjustment_percent) }}</dd>
          </template>
          <template v-if="estimate.calculation?.adjustment_percent != null">
            <dt>Total des bonus et malus appliqué</dt><dd>{{ percent(estimate.calculation.adjustment_percent) }}</dd>
          </template>
          <template v-if="estimate.calculation?.adjustment_amount != null">
            <dt>Montant de l’ajustement retenu</dt><dd>{{ signedEuros(estimate.calculation.adjustment_amount) }}</dd>
          </template>
          <template v-if="estimate.calculation?.price_before_rounding != null">
            <dt>Prix avant arrondi</dt><dd>{{ euros(estimate.calculation.price_before_rounding) }}</dd>
          </template>
          <dt>Prix final</dt><dd><strong>{{ formatPrice(estimate.price) }}</strong></dd>
          <template v-if="estimate.algorithm_version">
            <dt>Version de l’algorithme</dt><dd>{{ estimate.algorithm_version }}</dd>
          </template>
        </dl>
      </el-card>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import apiService from '@/api/apiRequests';
import { formatCurrency, formatDateShort, formatPrice } from '@/helpers/intl';
import { isAxiosError } from 'axios';
import EstimateComparableTable, { type ComparableSale } from './EstimateComparableTable.vue';

const conditionLabels = {
  travaux: 'Travaux à réaliser',
  rafraichissement: 'Rafraîchissement',
  'pas de travaux': 'Pas de travaux',
};
const landMethodLabels = { relative: 'Valorisation relative', absolute: 'Ancien barème absolu', neutral: 'Neutre' };

type Result = {
  price: number;
  range?: { lower: number; central: number; upper: number; margin_percent: number } | null;
  price_per_square_meter: number;
  calculated_at: string;
  scope_label: string;
  comparables: number;
  confidence: string;
  algorithm_version?: string;
  surface?: number;
  explanation?: {
    sales: ComparableSale[];
    commune_sales: ComparableSale[];
    methods: Record<Method, {
      local_median: number; commune_median: number | null; reference: number;
      base_price: number; price: number; difference: number; difference_percent: number | null;
      weights?: number[];
    }>;
    search_attempts: {
      label: string; qualified_count: number | null; count: number | null; selected: boolean; reason: string;
      dispersion_percent: number | null; surface_tolerance_percent: number | null; property_type: string;
    }[];
    max_dispersion_percent: number;
    freshness?: {
      newest_date: string; oldest_date: string; median_age_days: number; mostly_old: boolean;
      under_two_years: RecentSales; under_three_years: RecentSales;
    } | null;
    land?: {
      property_area: number | null; local: LandSample | null; commune: LandSample | null;
      method_comparison?: { absolute_price: number; relative_price: number | null; difference: number | null; difference_percent: number | null };
    } | null;
  } | null;
  criteria?: Record<string, number | string | boolean | null>;
  market_reference?: {
    median_price_per_square_meter?: number | null;
    temporal_median_price_per_m2?: number | null;
    temporal_weights?: number[] | null;
    commune_median_price_per_m2?: number | null;
    reference_price_per_m2?: number | null;
    commune_weight?: number;
    comparable_communes?: string[];
    expansion_reason?: string | null;
    period?: { from: string; to: string };
  };
  calculation?: {
    land_adjustment?: {
      method: keyof typeof landMethodLabels; reason: string | null; land_area: number | null; sample: LandSample | null;
      percent: number; amount: number; bands: [number, number][];
    };
    property_condition?: keyof typeof conditionLabels;
    base_price?: number;
    raw_adjustment_percent?: number;
    adjustment_percent?: number;
    adjustment_amount?: number;
    cap_applied?: boolean;
    price_before_rounding?: number;
    adjustments?: { label: string; value?: string | null; percent: number; amount?: number }[];
  };
};
type RecentSales = { count: number; ratio: number };
type LandSample = {
  count: number; total: number; coverage: number; median: number | null; min: number | null; max: number | null;
  q1: number | null; q3: number | null; difference: number | null; ratio: number | null;
};
type Profile = {
  blocking: string[];
  criteria: Record<string, { type: 'number' | 'boolean'; value: number | string | boolean | null }>;
  estimate: Result | null;
};

const props = defineProps<{ propertyId: number; dirty: boolean; saving: boolean }>();
const emit = defineEmits<{ 'save-property': []; 'estimate-updated': [] }>();
const profile = ref<Profile>();
const estimate = ref<Result | null>(null);
const landSamples = [['local', 'Périmètre retenu'], ['commune', 'Échantillon communal']] as const;
const percentage = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 });
const numberFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
const formatNumber = (value: number) => numberFormatter.format(value);
const formatArea = (value?: number | null) => value == null ? 'Non disponible' : `${formatNumber(value)} m²`;
const formatRecentSales = (sample: RecentSales) =>
  `${sample.count} ${sample.count === 1 ? 'vente' : 'ventes'} · ${percentage.format(sample.ratio)}`;
const methodLabels = { unweighted: 'Sans pondération temporelle', current: 'Pondération actuelle', stronger: 'Pondération renforcée' };
type Method = keyof typeof methodLabels;
const methodColumns = [
  ['local_median', 'Médiane du périmètre (€/m²)'], ['commune_median', 'Médiane communale (€/m²)'],
  ['reference', 'Référence finale (€/m²)'], ['base_price', 'Prix de base'], ['price', 'Estimation finale'],
] as const;
const methodRows = computed(() => Object.entries(estimate.value?.explanation?.methods ?? {}).map(([key, method]) => ({
  ...method, label: methodLabels[key as Method],
})));
const loading = ref(false);
const calculating = ref(false);
const message = ref('');
const endpoint = computed(() => `/property/${props.propertyId}/automatic-estimate`);
const lifetime = new AbortController();
onUnmounted(() => lifetime.abort());

const euros = (amount: number) => formatCurrency(amount);
const signedEuros = (amount: number) => `${amount > 0 ? '+' : ''}${euros(amount)}`;
const percent = (value: number, signed = true) => `${signed && value > 0 ? '+' : ''}${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`;
const formatWeight = (value: number) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function load() {
  if (!props.propertyId || calculating.value) return;
  loading.value = true;
  message.value = '';
  try {
    const { data } = await apiService.get<Profile>(endpoint.value, { signal: lifetime.signal });
    profile.value = data;
    estimate.value = data.estimate;
  } catch {
    profile.value = undefined;
    message.value = 'Impossible de charger l’estimation automatique.';
  } finally {
    loading.value = false;
  }
}

async function calculate() {
  if (!profile.value || loading.value || calculating.value || props.dirty
    || profile.value.blocking.length) return;
  calculating.value = true;
  message.value = '';
  try {
    const { data } = await apiService.post<{ status: string; estimate?: Result; message?: string }>(
      endpoint.value, {
        criteria: Object.fromEntries(Object.entries(profile.value.criteria)
          .filter(([key, field]) => field.type === 'number' && field.value == null && estimate.value?.criteria?.[key] != null)
          .map(([key]) => [key, estimate.value?.criteria?.[key]])),
      }, { signal: lifetime.signal, timeout: 60000 },
    );
    if (data.estimate) {
      estimate.value = data.estimate;
      emit('estimate-updated');
    }
    else message.value = data.message ?? 'Estimation indisponible.';
  } catch (error) {
    message.value = isAxiosError(error) && [409, 422].includes(error.response?.status ?? 0)
      ? error.response?.data?.message ?? 'Vérifiez les critères saisis.'
      : 'Impossible de calculer l’estimation.';
  } finally {
    calculating.value = false;
  }
}

watch(() => props.dirty, (dirty) => { if (!dirty) void load(); });
void load();
</script>

<style scoped>
.automatic-estimate { padding: 12px 0; }
.estimate-panel { margin-block: 12px; }
h3 { margin: 0 0 10px; font-size: 1rem; }
.estimate-heading, .estimate-meta, .estimate-adjustments li {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;
}
.estimate-heading { justify-content: space-between; }
.estimate-price { font-size: clamp(1.55rem, 5vw, 2.2rem); line-height: 1.25; }
.estimate-meta { margin-top: 12px; }
.estimate-range {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: end;
  gap: 8px 4px;
  text-align: center;
}
.estimate-range .estimate-price { font-size: clamp(1.1rem, 4vw, 2.2rem); }
.estimate-range-line, .estimate-range-caption { grid-column: 1 / -1; }
.estimate-range-line { background: var(--el-color-primary-light-7); border-radius: 5px; height: 5px; }
.estimate-range-line span { display: block; height: 100%; width: 9px; border-radius: 5px; margin: auto; background: var(--el-color-primary); }
.estimate-range-caption { color: var(--el-text-color-secondary); }
.estimate-panel dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 14px;
  margin: 8px 0 0;
  overflow-wrap: anywhere;
}
.estimate-panel dd { margin: 0; }
.estimate-adjustments { list-style: none; margin: 12px 0; padding: 0; }
.estimate-adjustments li { padding-block: 4px; }
.estimate-note { color: var(--el-text-color-secondary); }
</style>
