<template>
  <section class="dvf-address-history" v-loading="loading">
    <p>{{ unit ? 'Transactions rattachées à cette unité depuis 2014.' : 'Transactions publiées pour l’adresse depuis 2014.' }}</p>
    <template v-if="unit && propertyId">
      <h4>Ventes de l’immeuble disponibles pour cette unité</h4>
      <el-button size="small" :loading="managing" @click="findCandidates()">Actualiser les ventes disponibles</el-button>
      <p v-if="message" role="status">{{ message }}</p>
      <el-table v-if="candidates.length" :data="candidates" size="small">
        <el-table-column prop="date" label="Date" />
        <el-table-column label="Type de bien">
          <template #default="{ row }">{{ typeLabels[row.type as LinkedSale['type']] }}</template>
        </el-table-column>
        <el-table-column prop="surface" label="Surface (m²)" />
        <el-table-column prop="rooms" label="Pièces" />
        <el-table-column label="Lot principal">
          <template #default="{ row }">{{ row.identity.lots.join(', ') || '—' }}</template>
        </el-table-column>
        <el-table-column label="Lots annexes">
          <template #default="{ row }">{{ row.annex_lots?.join(', ') || '—' }}</template>
        </el-table-column>
        <el-table-column label="Prix">
          <template #default="{ row }">{{ formatPrice(row.price) }}</template>
        </el-table-column>
        <el-table-column min-width="105">
          <template #default="{ row }">
            <el-tag v-if="row.probable" size="small" type="warning">Correspondance probable</el-tag>
            <el-button link type="primary" :disabled="managing" @click="attach(row)">Associer cette vente</el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>
    <p v-if="marketPrice?.median != null && !marketPrice.referenceCommune">
      <DvfMarketTooltip :details="marketPrice.tooltip">
        Référence résidentielle de rue · {{ formatPrice(marketPrice.median) }} / m² · {{ marketPrice.salesCount }} ventes
        <small v-if="marketPrice.indicative">· Faible échantillon</small>
        <small v-else-if="marketPrice.limitedSample">· Échantillon limité</small>
        <small v-if="marketPrice.lowReliability">· Faible fiabilité</small>
      </DvfMarketTooltip>
    </p>
    <p v-if="communeReference">
      <DvfMarketTooltip :details="communeReference.tooltip">
        Référence communale · {{ formatPrice(communeReference.median) }} / m²
      </DvfMarketTooltip>
    </p>
    <p v-for="comparison in comparisons" :key="comparison.scope">
      <DvfMarketTooltip :details="comparison.tooltip">
        {{ comparison.scope === 'street' ? 'Écart rue' : 'Écart commune' }}
        de la dernière vente fiable · {{ percentage.format(comparison.difference) }}
        <small v-if="comparison.lowReliability">· Faible fiabilité</small>
      </DvfMarketTooltip>
    </p>
    <p v-if="!addressReady">Renseignez la voie et le numéro de l’adresse pour consulter son historique.</p>
    <p v-else-if="failed" role="status">Une partie de l’historique DVF est indisponible.</p>
    <p v-else-if="!loading && !sales.length">{{ unit ? 'Aucune transaction rattachée à cette unité.' : 'Aucune transaction trouvée pour cette adresse.' }}</p>
    <h4 v-if="unit">Ventes déjà associées à cette unité</h4>
    <el-table v-if="sales.length" :data="sales" size="small">
      <el-table-column label="Date" min-width="100">
        <template #default="{ row }">{{ formatDateShort(row.date_mutation) }}</template>
      </el-table-column>
      <el-table-column label="Adresse DVF" prop="adresse" min-width="135" />
      <el-table-column label="Montant de la mutation" min-width="115">
        <template #default="{ row }">{{ formatPrice(row.valeur_fonciere, '—') }}</template>
      </el-table-column>
      <el-table-column label="Type de bien" min-width="120">
        <template #default="{ row }">{{ saleDetails(row).type }}</template>
      </el-table-column>
      <el-table-column label="Surface habitable" min-width="105">
        <template #default="{ row }">{{ saleDetails(row).surface }}</template>
      </el-table-column>
      <el-table-column label="Pièces" min-width="70">
        <template #default="{ row }">{{ saleDetails(row).rooms }}</template>
      </el-table-column>
      <el-table-column label="Lot principal" min-width="90">
        <template #default="{ row }">{{ saleDetails(row).lots }}</template>
      </el-table-column>
      <el-table-column label="Lots annexes" min-width="95">
        <template #default="{ row }">{{ saleDetails(row).annexLots }}</template>
      </el-table-column>
      <el-table-column v-if="unit" label="Prix au m²" min-width="115">
        <template #default="{ row }">{{ formatPrice(row.price_per_m2) }} / m²</template>
      </el-table-column>
      <el-table-column v-if="unit" min-width="110">
        <template #default="{ row }">
          <el-button link type="danger" :disabled="managing" @click="remove(row.link_key)">Détacher</el-button>
        </template>
      </el-table-column>
      <el-table-column v-if="building" label="Rattachement à une unité" min-width="205">
        <template #default="{ row }">
          <template v-if="assignmentFor(row)">
            <div>
              <span class="linked-check" aria-label="Vente rattachée">✓</span>
              <el-button v-if="assignedUnit(row)?.property_id" link type="primary" @click="openAssignedUnit(row)">
                {{ unitLabel(assignmentFor(row)?.unit_id) }}
              </el-button>
              <span v-else>{{ unitLabel(assignmentFor(row)?.unit_id) }}</span>
            </div>
            <el-button v-if="compatibleUnits(row).length" link type="primary" :disabled="managing" @click="openAssignment(row)">Corriger</el-button>
            <el-button link type="danger" :disabled="managing" @click="detachBuildingSale(row)">Détacher</el-button>
          </template>
          <template v-else-if="compatibleSalesByIdentity.has(saleIdentity(row))">
            <el-button v-if="!existingLot(row)" size="small" type="primary" :disabled="managing" @click="createUnit(row)">
              Créer l’unité
            </el-button>
            <el-button v-if="compatibleUnits(row).length" link type="primary" :disabled="managing" @click="openAssignment(row)">
              Rattacher à une unité existante
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>
    <el-alert v-if="building && message && !assignmentOpen" :title="message" type="error" show-icon :closable="false" />
    <el-dialog v-if="building" v-model="assignmentOpen" title="Rattacher la vente à une unité" append-to-body width="min(540px, 94vw)">
      <template v-if="pendingSale">
        <p>
          {{ formatDateShort(pendingSale.date) }} · {{ formatPrice(pendingSale.price) }} · {{ typeLabels[pendingSale.type] }}
          · {{ pendingSale.surface }} m² · {{ pendingSale.rooms ?? '—' }} pièces · Lot cadastral {{ pendingSale.identity.lots.join(', ') || '—' }}
        </p>
        <el-select v-model="targetUnit" aria-label="Unité à rattacher" placeholder="Sélectionner une unité" style="width: 100%">
          <el-option v-for="option in units.filter(item => item.type_code === pendingSale?.type)" :key="option.id"
            :value="option.id" :label="describeUnit(option)" />
        </el-select>
        <el-checkbox v-if="buildingLotConflict" v-model="confirmBuildingLot">
          Remplacer le lot cadastral {{ buildingLotConflict }} par {{ pendingSale.principal_lot }}
        </el-checkbox>
        <p v-if="message" role="status">{{ message }}</p>
      </template>
      <template #footer>
        <el-button @click="assignmentOpen = false">Annuler</el-button>
        <el-button type="primary" :loading="managing"
          :disabled="targetUnit == null || (!!buildingLotConflict && !confirmBuildingLot)" @click="saveBuildingAssignment">
          Confirmer le rattachement
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { DvfService } from '@/api/dvf.service';
import apiService from '@/api/apiRequests';
import { ElMessageBox } from 'element-plus';
import { isAxiosError } from 'axios';
import { getDvfStatistics, type DvfStatistics } from '@/api/dvf-statistics.service';
import { formatDateShort, formatPrice } from '@/helpers/intl';
import type { IDvfPoint } from '@/types/dvf';
import type { DvfUnitDraft } from '@/types/unit';
import { dvfSaleKey, matchesHistoricalStreet, matchesSaleNumber } from '@/utils/mapAddressFilters';
import { communeComparisonReference, relativeMarketDifference, streetComparisonReference, streetMarketPrice } from '@/utils/dvfResidentialComparison';
import DvfMarketTooltip from '../DvfMarketTooltip.vue';

const props = defineProps<{
  commune?: string; street?: string; number?: number | string; suffix?: string | null;
  marketStreet?: string | null; soldPricePerM2?: number | null;
  unit?: boolean; propertyId?: number; unitType?: string | null; linksRevision?: number;
}>();
const emit = defineEmits<{
  'links-changed': [];
  'unit-lot-loaded': [lot: string | null];
  'create-unit': [draft: DvfUnitDraft];
  'open-unit': [property: { id: number; unit_id: number }];
}>();
const addressReady = computed(() => !!props.commune && !!props.street && /^\d{1,10}$/.test(String(props.number ?? '')));
type LinkedSale = {
  key: string; date: string; price: number; price_per_m2: number; surface: number; rooms?: number;
  type: '2' | '4'; source: 'recent' | 'historical';
  annex_lots?: string[];
  principal_lot?: string | null;
  probable?: boolean;
  identity: { lots: string[]; id_mutation: string; numero_disposition: number; date_mutation: string };
};
type HistorySale = Pick<IDvfPoint, 'date_mutation' | 'adresse' | 'valeur_fonciere' | 'id_mutation' | 'numero_disposition' | 'main_type' | 'built_items'> & {
  link_key?: string; price_per_m2?: number;
  type_local?: string; surface_reelle_bati?: number; nombre_pieces_principales?: number;
};
type BuildingUnit = {
  id: number; property_id: number; label?: string | null; number?: string | null; lot?: string | null;
  type_code: '2' | '4'; surface?: number | null; rooms?: number | null;
};
type BuildingAssignment = { key: string; unit_id: number; sale: LinkedSale };
const sales = ref<HistorySale[]>([]);
const linked = ref<LinkedSale[]>([]);
const choices = ref<LinkedSale[]>([]);
const candidates = computed(() => choices.value.filter(sale => !linked.value.some(item => item.key === sale.key)));
const managing = ref(false);
const message = ref('');
const endpoint = computed(() => `/property/${props.propertyId}/unit-dvf`);
const building = computed(() => !props.unit && props.unitType === 'immeuble' && !!props.propertyId);
const buildingEndpoint = computed(() => `/property/${props.propertyId}/building-dvf`);
const buildingRevision = ref(0);
const units = ref<BuildingUnit[]>([]);
const buildingSales = ref<LinkedSale[]>([]);
const assignments = ref<BuildingAssignment[]>([]);
const assignmentOpen = ref(false);
const pendingSale = ref<LinkedSale | null>(null);
const targetUnit = ref<number>();
const currentUnitLot = ref<string | null>(null);
const confirmBuildingLot = ref(false);
const buildingLotConflict = computed(() => differentLot(
  units.value.find(unit => unit.id === targetUnit.value)?.lot, pendingSale.value?.principal_lot,
));
watch(targetUnit, () => { confirmBuildingLot.value = false; }, { flush: 'sync' });
const previousUnit = ref<number | null>(null);
const typeLabels = { '2': 'Appartement', '4': 'Local commercial' };
const loading = ref(false);
const failed = ref(false);
const statistics = ref<DvfStatistics | null>(null);
const category = computed(() => props.unit
  ? props.unitType === 'appartement' ? 'apartment' : ['commerce', 'local_commercial'].includes(props.unitType ?? '') ? 'commercial' : null
  : 'residential');
const unitSalesPrice = computed(() => {
  if (!props.unit) return props.soldPricePerM2;
  const recent = linked.value.filter(sale => sale.date >= '2020-01-01');
  return recent.length && recent[0].date !== recent[1]?.date ? recent[0].price_per_m2 : null;
});
const marketPrice = computed(() => statistics.value && category.value && streetMarketPrice(
  statistics.value.street?.[category.value], statistics.value.commune?.[category.value]?.median_price_per_m2,
  statistics.value.commune_weight, statistics.value.period, statistics.value.max_dispersion_percent,
));
const communeReference = computed(() => category.value ? communeComparisonReference(statistics.value, category.value) : null);
const comparisons = computed(() => [communeReference.value, category.value
  ? streetComparisonReference(statistics.value?.street?.[category.value], statistics.value, category.value) : null]
  .flatMap(reference => {
    const difference = relativeMarketDifference(unitSalesPrice.value, reference?.median);
    return reference && difference !== null ? [{ ...reference, difference }] : [];
  }));
const percentage = new Intl.NumberFormat('fr-FR', { style: 'percent', signDisplay: 'exceptZero', maximumFractionDigits: 1 });

watch(() => [props.commune, props.marketStreet || props.street] as const, async ([commune, street], _, onCleanup) => {
  statistics.value = null;
  if (!commune || !street) return;
  const request = new AbortController();
  onCleanup(() => request.abort());
  try {
    const data = await getDvfStatistics(commune, street, request.signal);
    if (!request.signal.aborted) statistics.value = data;
  } catch {
    // The transaction history remains usable independently of the market statistics.
  }
}, { immediate: true });

function showLinked(items: LinkedSale[]) {
  linked.value = items;
  sales.value = items.map(item => ({
    date_mutation: item.date, adresse: [props.number, props.suffix].filter(Boolean).join(' '),
    valeur_fonciere: item.price, price_per_m2: item.price_per_m2, link_key: item.key,
  }));
}

function failure(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  const detail = isAxiosError(error) ? error.response?.data?.message : undefined;
  message.value = `Rattachement DVF indisponible${status ? ` (HTTP ${status})` : ''}.${detail ? ` ${detail}` : ''}`;
}

function saleIdentity(sale: Pick<HistorySale, 'id_mutation' | 'numero_disposition' | 'date_mutation'>) {
  return JSON.stringify([sale.id_mutation, Number(sale.numero_disposition), sale.date_mutation]);
}

const compatibleSalesByIdentity = computed(() => new Map(buildingSales.value.map(sale => [saleIdentity(sale.identity), sale])));
const assignmentsByIdentity = computed(() => new Map(assignments.value.map(item => [saleIdentity(item.sale.identity), item])));
const linkedByKey = computed(() => new Map(linked.value.map(sale => [sale.key, sale])));
const assignmentFor = (row: HistorySale) => assignmentsByIdentity.value.get(saleIdentity(row));
const compatibleUnits = (row: HistorySale) => units.value.filter(item => item.type_code === compatibleSalesByIdentity.value.get(saleIdentity(row))?.type);

function saleDetails(row: HistorySale) {
  const sale = row.link_key ? linkedByKey.value.get(row.link_key) :
    compatibleSalesByIdentity.value.get(saleIdentity(row)) ?? assignmentFor(row)?.sale;
  const locals = row.built_items?.filter(item => item.type_local &&
    !item.type_local.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').includes('dependance')) ?? [];
  const main = locals.length === 1 ? locals[0] : undefined;
  const surface = sale?.surface ?? main?.surface_reelle_bati ?? row.surface_reelle_bati;
  return {
    type: sale ? typeLabels[sale.type] : main?.type_local ?? row.type_local ?? row.main_type ?? '—',
    surface: surface && surface > 0 ? `${surface} m²` : '—',
    rooms: sale?.rooms ?? main?.nombre_pieces_principales ?? row.nombre_pieces_principales ?? '—',
    lots: sale?.identity.lots.join(', ') || '—',
    annexLots: sale?.annex_lots?.join(', ') || '—',
  };
}

const assignedUnit = (row: HistorySale) => units.value.find(item => item.id === assignmentFor(row)?.unit_id);

function openAssignedUnit(row: HistorySale) {
  const unit = assignedUnit(row);
  if (unit?.property_id) emit('open-unit', { id: unit.property_id, unit_id: unit.id });
}

function singleLot(sale?: LinkedSale) {
  const lots = sale?.identity.lots ?? [];
  return lots.length === 1 ? lots[0] : undefined;
}

function existingLot(row: HistorySale) {
  const lot = singleLot(compatibleSalesByIdentity.value.get(saleIdentity(row)));
  if (!lot) return false;
  return compatibleUnits(row).some(unit =>
    [unit.lot, ...assignments.value.filter(item => item.unit_id === unit.id).map(item => singleLot(item.sale))]
      .some(value => value && normalizeLot(value) === normalizeLot(lot))
  );
}

function normalizeLot(value: string) {
  return value.trim().replace(/^lot\s+(?:n[°º]\s*)?(?=[0-9]+$)/iu, '').replace(/^0+(?=[0-9]+$)/, '');
}

function differentLot(current?: string | null, proposed?: string | null) {
  return current?.trim() && proposed && normalizeLot(current) !== normalizeLot(proposed) ? current : null;
}

async function createUnit(row: HistorySale) {
  const sale = compatibleSalesByIdentity.value.get(saleIdentity(row));
  if (!sale || assignmentFor(row) || existingLot(row)) return;
  if (compatibleUnits(row).length) {
    try {
      await ElMessageBox.confirm(
        'Vérifiez que le logement n’existe pas déjà dans cet immeuble. S’il existe, utilisez le rattachement à une unité existante.',
        'Créer une nouvelle unité',
        { confirmButtonText: 'Continuer', cancelButtonText: 'Annuler' },
      );
    } catch { return; }
  }
  if (assignmentFor(row) || existingLot(row)) return;
  emit('create-unit', {
    key: sale.key,
    unit_type: sale.type === '2' ? 'appartement' : 'local_commercial',
    surface: Math.round(sale.surface) || undefined,
    rooms: sale.rooms ?? undefined,
    lot_number: singleLot(sale),
  });
}

function describeUnit(item: BuildingUnit) {
  return [item.label || (item.number ? `N° ${item.number}` : typeLabels[item.type_code]),
    typeLabels[item.type_code], item.surface ? `${item.surface} m²` : 'Surface —',
    item.rooms ? `${item.rooms} pièces` : 'Pièces —', `Lot cadastral ${item.lot || '—'}`].join(' · ');
}

function unitLabel(id?: number) {
  const unit = units.value.find(item => item.id === id);
  return unit?.label || (unit?.number ? `N° ${unit.number}` : unit ? typeLabels[unit.type_code] : 'Rattachée à une unité');
}

function openAssignment(row: HistorySale) {
  message.value = '';
  confirmBuildingLot.value = false;
  pendingSale.value = compatibleSalesByIdentity.value.get(saleIdentity(row)) ?? null;
  previousUnit.value = assignmentFor(row)?.unit_id ?? null;
  targetUnit.value = previousUnit.value ?? undefined;
  assignmentOpen.value = !!pendingSale.value;
}

async function saveBuildingAssignment() {
  const sale = pendingSale.value;
  if (!sale || targetUnit.value == null || (buildingLotConflict.value && !confirmBuildingLot.value)) return;
  managing.value = true;
  message.value = '';
  try {
    const { data } = await apiService.put<Omit<BuildingAssignment, 'sale'> & { lot_number?: string | null }>(buildingEndpoint.value, {
      key: sale.key, unit_id: targetUnit.value, previous_unit_id: previousUnit.value,
      confirmed_previous_lot: buildingLotConflict.value ?? undefined,
    });
    const unit = units.value.find(item => item.id === data.unit_id);
    if (unit && data.lot_number !== undefined) unit.lot = data.lot_number;
    assignments.value = [...assignments.value.filter(item => item.key !== sale.key), { ...data, sale }];
    buildingRevision.value++;
    assignmentOpen.value = false;
    emit('links-changed');
  } catch (error) { failure(error); }
  finally { managing.value = false; }
}

async function detachBuildingSale(row: HistorySale) {
  const assignment = assignmentFor(row);
  if (!assignment) return;
  try {
    await ElMessageBox.confirm('Détacher cette vente de l’unité ?', 'Confirmer le retrait');
  } catch { return; }
  managing.value = true;
  message.value = '';
  try {
    await apiService.delete(`${buildingEndpoint.value}/${assignment.key}`, { params: { unit_id: assignment.unit_id } });
    assignments.value = assignments.value.filter(item => item.key !== assignment.key);
    emit('links-changed');
  } catch (error) { failure(error); }
  finally { managing.value = false; }
}

watch([buildingEndpoint, () => props.linksRevision, buildingRevision], async (_, __, onCleanup) => {
  if (!building.value) return;
  const request = new AbortController();
  onCleanup(() => request.abort());
  try {
    const { data } = await apiService.get<{ sales: LinkedSale[]; units: BuildingUnit[]; assignments: BuildingAssignment[] }>(
      buildingEndpoint.value, { signal: request.signal },
    );
    if (request.signal.aborted) return;
    units.value = data.units.map(item => ({ ...item, id: Number(item.id) }));
    buildingSales.value = data.sales;
    assignments.value = data.assignments.map(item => ({ ...item, unit_id: Number(item.unit_id) }));
  } catch (error) { if (!request.signal.aborted) failure(error); }
}, { immediate: true });

async function findCandidates(signal?: AbortSignal) {
  managing.value = true;
  message.value = '';
  try {
    const { data } = await apiService.post<{ candidates: LinkedSale[]; linked: LinkedSale[]; lot_number?: string | null }>(
      `${endpoint.value}/candidates`, undefined, { signal },
    );
    if (signal?.aborted) return;
    const previous = linked.value.map(sale => sale.key).join(',');
    choices.value = [...data.candidates].sort((a, b) => Number(!!b.probable) - Number(!!a.probable));
    if (data.lot_number !== undefined) {
      currentUnitLot.value = data.lot_number;
      emit('unit-lot-loaded', data.lot_number);
    }
    showLinked(data.linked);
    if (previous !== linked.value.map(sale => sale.key).join(',')) emit('links-changed');
    if (!candidates.value.length) message.value = 'Aucune autre vente attribuable à cette unité.';
  } catch (error) { if (!signal?.aborted) failure(error); }
  finally { if (!signal?.aborted) managing.value = false; }
}

async function attach(sale: LinkedSale) {
  const oldLot = differentLot(currentUnitLot.value, sale.principal_lot);
  const saleLabel = `Associer la vente du ${formatDateShort(sale.date)} à ${formatPrice(sale.price)} ?`;
  const explanation = oldLot ? ` Le lot cadastral ${oldLot} sera remplacé par ${sale.principal_lot}.` :
    (!currentUnitLot.value && sale.principal_lot ? ` Le lot cadastral ${sale.principal_lot} sera renseigné.` : '');
  try {
    await ElMessageBox.confirm(saleLabel + explanation, 'Confirmer le rattachement', {
      type: oldLot ? 'warning' : 'info',
      confirmButtonText: oldLot ? 'Associer et corriger le lot' : 'Associer la vente',
    });
  } catch { return; }
  await changeLink(() => apiService.put<LinkedSale[]>(endpoint.value, {
    key: sale.key, confirmed_previous_lot: oldLot ?? undefined,
  }));
}

async function remove(key: string) {
  try {
    await ElMessageBox.confirm('Détacher cette vente de l’unité ?', 'Confirmer le retrait');
  } catch { return; }
  await changeLink(() => apiService.delete<LinkedSale[]>(`${endpoint.value}/${key}`));
}

async function changeLink(request: () => Promise<{ data: LinkedSale[] }>) {
  managing.value = true;
  message.value = '';
  try {
    showLinked((await request()).data);
    emit('links-changed');
    await findCandidates();
  } catch (error) { failure(error); }
  finally { managing.value = false; }
}

watch(() => [props.commune, props.street, props.number, props.suffix, props.unit, props.propertyId,
  props.unit ? props.linksRevision : undefined] as const, async ([commune, street, number, suffix, unit, propertyId], _, onCleanup) => {
  sales.value = [];
  linked.value = [];
  choices.value = [];
  loading.value = false;
  failed.value = false;
  if (!addressReady.value || !commune || !street) return;

  const request = new AbortController();
  onCleanup(() => request.abort());
  loading.value = true;
  if (unit) {
    if (propertyId) {
      try {
        const { data } = await apiService.get<LinkedSale[]>(endpoint.value, { signal: request.signal });
        if (!request.signal.aborted) showLinked(data);
        await findCandidates(request.signal);
      } catch (error) {
        if (!request.signal.aborted) {
          failed.value = true;
          failure(error);
        }
      }
    }
    if (!request.signal.aborted) loading.value = false;
    return;
  }
  const numero = String(number);
  const rep = suffix ?? '';
  const [recent, historical] = await Promise.allSettled([
    DvfService.getDVF(commune, 'all', street, numero, rep, request.signal),
    DvfService.getHistorical(commune, numero, rep, request.signal),
  ]);
  if (request.signal.aborted) return;
  failed.value = recent.status === 'rejected' || historical.status === 'rejected';
  const older = historical.status === 'fulfilled'
    ? historical.value.filter(sale => matchesHistoricalStreet(sale, street) && matchesSaleNumber(sale, numero, rep))
    : [];
  const rows = [...(recent.status === 'fulfilled' ? recent.value : []), ...older];
  sales.value = [...new Map(rows.map(sale => [dvfSaleKey(sale), sale])).values()]
    .sort((left, right) => right.date_mutation.localeCompare(left.date_mutation));
  loading.value = false;
}, { immediate: true });
</script>

<style scoped>
.dvf-address-history { padding-block: 12px; }
.linked-check { color: var(--el-color-success); margin-inline-end: 4px; }
</style>
