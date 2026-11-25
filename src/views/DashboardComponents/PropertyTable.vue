<template>
  <div class="property-table-container" :class="{ 'prospection-street-table': showMarketComparison }">
    <!-- ── Mobile card view ──────────────────────────────── -->
    <div v-if="isMobile" class="property-cards-mobile">
      <div
        v-for="row in filteredAddresses"
        :key="getRowKey(row as any)"
        class="property-card-mobile"
        @click="handleRowClick(row)"
      >
        <!-- Header: address + type icon -->
        <div class="pcm-header">
          <div class="pcm-address">
            <span class="pcm-numero" @click.stop="handleNumeroClick(row)">
              {{ (row as any).numero }} {{ (row as any).rep || '' }}
            </span>
            <span class="pcm-street" @click.stop="handleStreetClick(row)">
              {{ (row as any).nom_voie }}
            </span>
            <span class="pcm-city">
              {{ (row as any).nom_commune }} {{ (row as any).code_postal }}
            </span>
          </div>
          <div class="pcm-type-badge">
            <el-icon class="icon-maison" v-if="getDisplayType(row) === 'Maison'"><House /></el-icon>
            <el-icon class="icon-appartement" v-else-if="getDisplayType(row) === 'Appartement'"
              ><OfficeBuilding
            /></el-icon>
            <el-icon class="icon-immeuble" v-else-if="getDisplayType(row) === 'Immeuble'"
              ><OfficeBuilding
            /></el-icon>
            <el-icon
              class="icon-commerce"
              v-else-if="
                getDisplayType(row) === 'Commerce' || getDisplayType(row) === 'Local commercial'
              "
              ><OfficeBuilding
            /></el-icon>
            <el-icon class="icon-inconnu" v-else><QuestionFilled /></el-icon>
            <span class="pcm-type-label">{{ getDisplayType(row) }}</span>
            <span v-if="(row as any).unit_label" class="pcm-unit">
              / {{ (row as any).unit_label }}</span
            >
            <span v-else-if="(row as any).apart_number" class="pcm-unit">
              / {{ (row as any).apart_number }}</span
            >
          </div>
        </div>

        <!-- Body: key data grid -->
        <div class="pcm-body">
          <div class="pcm-data-item">
            <span class="pcm-data-label">Surface</span>
            <span class="pcm-data-value">
              <template v-if="!showMarketComparison || isEstimationMode || (isLocalMarketList && dvfSurface(row as any) === null)">
                {{ formatMetrage((row as any).surface) || (isLocalMarketList ? '—' : '') }}
              </template>
              <template v-else-if="prospectionCrmSurface(row as any) !== null">
                {{ formatMetrage(prospectionCrmSurface(row as any)) }}
              </template>
              <template v-else-if="dvfSurface(row as any) !== null">
                <em>{{ formatDvfSurface(row as any) }}</em> <small>{{ dvfSurfaceLabel(row as any) }}</small>
              </template>
              <template v-else>—</template>
            </span>
          </div>
          <div class="pcm-data-item">
            <span class="pcm-data-label">Dernière vente</span>
            <span class="pcm-data-value">
              {{ formatDate((row as any).date_derniere_vente) }}
              <el-button v-if="showMarketComparison && (row as any).derniere_vente_dvf" link type="primary"
                class="dvf-sale-link"
                size="small" title="Voir la vente dans DVF" aria-label="Voir la vente dans DVF"
                @click.stop="emit('open-dvf-sale', row)">
                <el-icon><Location /></el-icon>
              </el-button>
              <el-button v-if="isProspectionMode && (row as any).dvf_address_history_count != null"
                link type="primary" size="small" @click.stop="emit('open-dvf-history', row)">
                {{ historyLabel((row as any).dvf_address_history_count) }}
              </el-button>
            </span>
          </div>
          <div class="pcm-data-item">
            <span class="pcm-data-label">Prix vendu</span>
            <span class="pcm-data-value">{{ formatPrice((row as any).dernier_prix_vente) }}</span>
          </div>
          <template v-if="showMarketComparison">
            <div class="pcm-data-item">
              <span class="pcm-data-label">Prix vendu au m²</span>
              <span class="pcm-data-value">{{ formatSoldPricePerSquareMetre((row as any).dernier_prix_vente_m2) }}</span>
              <small v-if="dvfSaleType((row as any).derniere_vente_code_type_local)" class="dvf-sale-type"
                :data-dvf-type="(row as any).derniere_vente_code_type_local">
                {{ dvfSaleType((row as any).derniere_vente_code_type_local) }}
              </small>
              <small v-if="dvfLotsLabel(row as any)">{{ dvfLotsLabel(row as any) }}</small>
            </div>
          </template>
          <div v-for="column in marketColumns" :key="column.scope" class="pcm-data-item">
            <span class="pcm-data-label">{{ column.label }}</span>
            <DvfMarketTooltip :details="marketReferenceFor(row as any, column.scope)?.tooltip" :note="marketDifferenceNote(row as any, column.scope)">
              <span class="pcm-data-value">{{ formatMarketDifference(row as any, column.scope) }}</span>
              <small v-if="hasWeakMarketDifference(row as any, column.scope)" class="dvf-low-reliability"> · Faible fiabilité</small>
            </DvfMarketTooltip>
            <small v-if="column.scope === 'default' && usesFavoriteCommuneReference(row as any)">Réf. commune</small>
          </div>
          <div class="pcm-data-item">
            <span class="pcm-data-label">Prix estimé</span>
            <ProspectionEstimatedPrice v-if="isProspectionMode" :value="(row as any).display_estimate" />
            <span v-else class="pcm-data-value" :style="{ color: (row as any).price ? 'green' : 'blue' }">
              {{ isEstimationMode ? formatPrice((row as any).price, '—') : formatPrice((row as any).price || (row as any).dernier_prix_estime) }}
            </span>
          </div>
          <div v-if="isEstimationMode" class="pcm-data-item">
            <span class="pcm-data-label">Écart simulateur / marché</span>
            <DvfMarketTooltip :details="(row as any).tableMarketReference?.tooltip" :note="simulationMarketTitle(row as any)">
              <span class="pcm-data-value">{{ formatSimulationMarketDifference(row as any) }}</span>
            </DvfMarketTooltip>
          </div>
        </div>

        <!-- Footer: prospection status and actions -->
        <div class="pcm-footer">
          <ProspectionProgressBadge :count="progressForRow(row)" />
          <div class="pcm-actions" v-if="!cityOnly">
            <PropertyReminderActions v-if="(row as any).tableReminders?.length"
              :reminders="(row as any).tableReminders" @edit-reminder="emit('edit-reminder', $event)" />
            <el-button v-if="!isEstimationMode" @click.stop="toggleFavorite(row)" size="small" circle>
              <el-icon>
                <StarFilled
                  v-if="store.isFavorite(row)"
                  style="color: #f56c6c"
                />
                <Star v-else style="color: #909399" />
              </el-icon>
            </el-button>
            <el-button type="primary" size="small" @click.stop="handleRowClick(row)">
              Ouvrir
            </el-button>
          </div>
        </div>
      </div>

      <div v-if="filteredAddresses.length === 0" class="pcm-empty">Aucune adresse trouvée.</div>
    </div>

    <!-- ── Desktop table view ────────────────────────────── -->
    <el-table
      v-else
      :key="dashboardStore.activeMainMode"
      :data="filteredAddresses"
      :row-key="getRowKey"
      class="modern-property-table"
      :default-sort="dashboardStore.propertyTableSort ?? undefined"
      max-height="calc(100vh - 320px)"
      :row-class-name="getRowClass"
      @row-click="handleRowClick"
      @sort-change="handleSortChange"
    >
      <el-table-column label="Ville" prop="city" sortable min-width="100">
        <template #default="{ row }"> {{ row.nom_commune }} {{ row.code_postal }} </template>
      </el-table-column>

      <el-table-column
        label="N°"
        prop="numero"
        sortable
        min-width="80"
        :sort-method="sortByNumeroAndRep"
        :sort-orders="['ascending', 'descending', null]"
      >
        <template #default="{ row }">
          <span class="numeroClickable" @click.stop="handleNumeroClick(row)">
            {{ row.numero }} {{ row.rep || '' }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="Rue" prop="nom_voie" sortable min-width="120">
        <template #default="{ row }">
          <span class="rueClickable" @click.stop="handleStreetClick(row)"> {{ row.nom_voie }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Type" prop="property_type" sortable min-width="140">
        <template #default="{ row }">
          <el-icon class="icon-maison" v-if="getDisplayType(row) === 'Maison'">
            <House />
          </el-icon>

          <el-icon class="icon-appartement" v-else-if="getDisplayType(row) === 'Appartement'">
            <OfficeBuilding />
          </el-icon>

          <el-icon class="icon-immeuble" v-else-if="getDisplayType(row) === 'Immeuble'">
            <OfficeBuilding />
          </el-icon>

          <el-icon
            class="icon-commerce"
            v-else-if="
              getDisplayType(row) === 'Commerce' || getDisplayType(row) === 'Local commercial'
            "
          >
            <OfficeBuilding />
          </el-icon>

          <el-icon class="icon-inconnu" v-else>
            <QuestionFilled />
          </el-icon>

          <span style="margin-left: 6px">{{ getDisplayType(row) }}</span>
          <span v-if="row.unit_label"> / {{ row.unit_label }}</span>
          <span v-else-if="row.apart_number"> / {{ row.apart_number }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Surface" prop="surface_reelle_bati" sortable min-width="90"
        :sort-method="showMarketComparison ? compareDvfSurface : undefined"
      >
        <template #default="{ row }">
          <template v-if="!showMarketComparison || isEstimationMode || (isLocalMarketList && dvfSurface(row) === null)">
            {{ formatMetrage(row.surface) || (isLocalMarketList ? '—' : '') }}
          </template>
          <template v-else-if="prospectionCrmSurface(row) !== null">
            {{ formatMetrage(prospectionCrmSurface(row)) }}
          </template>
          <template v-else-if="dvfSurface(row) !== null">
            <em>{{ formatDvfSurface(row) }}</em>
            <div><small>{{ dvfSurfaceLabel(row) }}</small></div>
          </template>
          <template v-else>—</template>
        </template>
      </el-table-column>

      <el-table-column label="Dernière vente" prop="date_derniere_vente" sortable min-width="120">
        <template #default="{ row }">
          {{ formatDate(row.date_derniere_vente) }}
          <el-button v-if="showMarketComparison && row.derniere_vente_dvf" link type="primary"
            class="dvf-sale-link"
            size="small" title="Voir la vente dans DVF" aria-label="Voir la vente dans DVF"
            @click.stop="emit('open-dvf-sale', row)">
            <el-icon><Location /></el-icon>
          </el-button>
          <el-button v-if="isProspectionMode && row.dvf_address_history_count != null"
            link type="primary" size="small" @click.stop="emit('open-dvf-history', row)">
            {{ historyLabel(row.dvf_address_history_count) }}
          </el-button>
        </template>
      </el-table-column>

      <el-table-column label="Prix vendu" prop="dernier_prix_vente" sortable min-width="100">
        <template #default="{ row }">
          {{ formatPrice(row.dernier_prix_vente) }}
        </template>
      </el-table-column>

      <el-table-column
        v-if="showMarketComparison" label="Prix vendu au m²" prop="dernier_prix_vente_m2"
        sortable :sort-by="row => row.dernier_prix_vente_m2 ?? -1" min-width="145"
      >
        <template #default="{ row }">
          {{ formatSoldPricePerSquareMetre(row.dernier_prix_vente_m2) }}
          <div v-if="dvfSaleType(row.derniere_vente_code_type_local)">
            <small class="dvf-sale-type" :data-dvf-type="row.derniere_vente_code_type_local">
              {{ dvfSaleType(row.derniere_vente_code_type_local) }}
            </small>
          </div>
          <div v-if="dvfLotsLabel(row)"><small>{{ dvfLotsLabel(row) }}</small></div>
        </template>
      </el-table-column>

      <el-table-column
        v-for="column in marketColumns" :key="column.scope" :label="column.label"
        :prop="column.scope === 'default' ? 'marketDifference' : `marketDifference-${column.scope}`"
        sortable :sort-method="(a, b) => (marketDifference(a, column.scope) ?? -1) - (marketDifference(b, column.scope) ?? -1)" min-width="135"
      >
        <template #default="{ row }">
          <DvfMarketTooltip :details="marketReferenceFor(row, column.scope)?.tooltip" :note="marketDifferenceNote(row, column.scope)">
            {{ formatMarketDifference(row, column.scope) }}
            <small v-if="hasWeakMarketDifference(row, column.scope)" class="dvf-low-reliability"> · Faible fiabilité</small>
          </DvfMarketTooltip>
          <div v-if="column.scope === 'default' && usesFavoriteCommuneReference(row)"><small>Réf. commune</small></div>
        </template>
      </el-table-column>

      <el-table-column label="Prix Estimé" prop="dernier_prix_estime" sortable min-width="100"
        :sort-by="isProspectionMode ? row => row.display_estimate?.price ?? -1 : undefined">
        <template #default="{ row }">
          <ProspectionEstimatedPrice v-if="isProspectionMode" :value="row.display_estimate" />
          <span v-else :style="{ color: row.price ? 'green' : 'blue', fontWeight: 400 }">
          {{ isEstimationMode ? formatPrice(row.price, '—') : formatPrice(row.price || row.dernier_prix_estime) }}
          </span>
        </template>
      </el-table-column>

      <el-table-column v-if="isEstimationMode" label="Écart simulateur / marché" prop="simulationMarketDifference"
        sortable :sort-method="(a, b) => (simulationMarketDifference(a) ?? -1) - (simulationMarketDifference(b) ?? -1)"
        min-width="190"
      >
        <template #default="{ row }">
          <DvfMarketTooltip :details="row.tableMarketReference?.tooltip" :note="simulationMarketTitle(row)">
            {{ formatSimulationMarketDifference(row) }}
          </DvfMarketTooltip>
        </template>
      </el-table-column>

      <el-table-column
        label="Prospection"
        prop="prospection_address_key"
        sortable
        :sort-method="compareProspection"
        min-width="120"
      >
        <template #default="{ row }">
          <ProspectionProgressBadge :count="progressForRow(row)" />
        </template>
      </el-table-column>

      <el-table-column
        fixed="right"
        class-name="action-column-right"
        label="Actions"
        min-width="140"
        v-if="!cityOnly"
      >
        <template #default="{ row }">
          <div class="action-buttons">
            <PropertyReminderActions v-if="row.tableReminders?.length"
              :reminders="row.tableReminders" @edit-reminder="emit('edit-reminder', $event)" />
            <el-button v-if="!isEstimationMode" @click.stop="toggleFavorite(row)" size="small" circle>
              <el-icon>
                <StarFilled
                  v-if="store.isFavorite(row)"
                  style="color: #f56c6c"
                />
                <Star v-else style="color: #909399" />
              </el-icon>
            </el-button>
            <el-button type="primary" size="small" @click.stop="handleRowClick(row)">
              Ouvrir
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import useDeviceBreakpoints from '@/composables/isMobile';
//ICONE
import { Star, StarFilled } from '@element-plus/icons-vue';
import { House, Location, OfficeBuilding, QuestionFilled } from '@element-plus/icons-vue';
import { usePropertyStore } from '@/stores/propertyHome';
import { ElMessage } from 'element-plus';
import { useDashboardStore } from '@/stores/dashboard';
import ProspectionProgressBadge from './ProspectionProgressBadge.vue';
import { prospectionRatio, tableRowProspectionCount } from '@/utils/prospectionProgress';
import { useRemindersStore } from '@/stores/reminders';
import {
  formatDateShort as formatDate,
  formatPrice,
  formatSurface as formatMetrage,
} from '@/helpers/intl';
import { ref, computed, onMounted } from 'vue';
import type { PropType } from 'vue';
import type { IAddressDetail } from '@/types/address';
import PropertyReminderActions from './PropertyReminderActions.vue';
import { communeComparisonReference, relativeMarketDifference, savedSimulationPricePerM2, streetComparisonReference, unitDvfCategory, type DvfResidentialReference } from '@/utils/dvfResidentialComparison';
import type { DvfStatistics } from '@/api/dvf-statistics.service';
import ProspectionEstimatedPrice from './ProspectionEstimatedPrice.vue';
import DvfMarketTooltip from './DvfMarketTooltip.vue';
const selectedId = ref<number | null>(null);

const { isMobile } = useDeviceBreakpoints();

const emit = defineEmits(['select-street', 'select-numero', 'edit-property', 'open-dvf-sale', 'open-dvf-history', 'edit-reminder']);
const historyLabel = (count: number) => `${count} ${count === 1 ? 'transaction DVF' : 'transactions DVF'}`;

const handleStreetClick = (row: any) => {
  emit('select-street', row);
};

const handleNumeroClick = (row: any) => {
  emit('select-numero', row);
};

function isFavoriteValue(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1';
}

const getRowKey = (row: any) => {
  if (Number(row.id) > 0) {
    return `property_${row.id}`;
  }

  if (Number(row.unit_id ?? 0) > 0) {
    return `unit_${row.unit_id}`;
  }

  return `address_${row.id_fantoir_long}`;
};

const store = usePropertyStore();

const dashboardStore = useDashboardStore();

function handleSortChange({ prop, order }: { prop?: string | null; order?: string | null }) {
  dashboardStore.setPropertyTableSort(
    prop && (order === 'ascending' || order === 'descending') ? { prop, order } : null
  );
}
const isEstimationMode = computed(() => dashboardStore.activeMainMode === 'estimations');
const isProspectionMode = computed(() => dashboardStore.activeMainMode === 'prospection');
const isLocalMarketList = computed(() => ['favorites', 'estimations', 'rappels', 'maj'].includes(dashboardStore.activeMainMode));
const progressForRow = (row: any) => tableRowProspectionCount(dashboardStore.prospectionProgress, row);
const compareProspection = (a: any, b: any) =>
  prospectionRatio(progressForRow(a)) - prospectionRatio(progressForRow(b));
const remindersStore = useRemindersStore();

onMounted(() => {
  remindersStore.loadReminders();
});

/*const filteredAddresses = computed(() => {
  const mode = dashboardStore.filterMode;
  if (!mode) return props.addresses;

  return props.addresses.filter((address: any) => {
    switch (mode) {
      case 'prospection':
        return (
          address.date_maj !== null ||
          (address.nombre_ventes && address.nombre_ventes > 0) ||
          (address.nombre_estimations && address.nombre_estimations > 0)
        );
      case 'estimation':
        return (
          address.dernier_prix_estime !== null &&
          address.dernier_prix_estime > 0
        );
      case 'rappel': {
        const allReminders = [
          ...remindersStore.reminders,
          ...remindersStore.agencyReminders,
        ];
        const reminderIds = new Set(allReminders.map(r => r.property_id));
        return address.id !== null && reminderIds.has(address.id);
      }
      case 'favoris':
        return isFavorite(address.favorite);
      default:
        return true;
    }
  });
});*/
const filteredAddresses = computed(() => {
  const sort = dashboardStore.propertyTableSort;
  if (sort?.prop === 'prospection_address_key') {
    // Reapply an active prospection sort when the server snapshot changes.
    return dashboardStore.prospectionProgress ? [...props.addresses] : props.addresses;
  }
  return props.addresses;
});

const handleFilterModeChange = (mode: string) => {
  dashboardStore.filterMode = dashboardStore.filterMode === mode ? null : mode;
};

const props = defineProps({
  addresses: {
    type: Array,
    default: () => [],
  },
  cityOnly: {
    type: Boolean,
    default: false,
  },
  showMarketComparison: Boolean,
  marketStreet: String,
  marketCity: String,
  marketStatistics: { type: Object as PropType<DvfStatistics | null>, default: null },
  communeMarketReference: {
    type: Object as PropType<DvfResidentialReference | null>,
    default: null,
  },
  marketReference: {
    type: Object as PropType<DvfResidentialReference | null>,
    default: null,
  },
});

const marketPercent = new Intl.NumberFormat('fr-FR', { style: 'percent', signDisplay: 'exceptZero', maximumFractionDigits: 1 });
type MarketScope = 'default' | 'commune' | 'street';
const marketColumns = computed<{ scope: MarketScope; label: string }[]>(() => {
  if (dashboardStore.activeMainMode === 'prospection') {
    if (!props.marketCity) return [];
    return props.marketStreet
      ? [{ scope: 'commune', label: 'Écart commune' }, { scope: 'street', label: 'Écart rue' }]
      : [{ scope: 'commune', label: 'Écart commune' }];
  }
  return props.showMarketComparison ? [{ scope: 'default', label: isLocalMarketList.value ? 'Écart rue' : 'Écart' }] : [];
});

function formatSoldPricePerSquareMetre(price?: number | null) {
  return price == null ? '—' : `${formatPrice(price)} / m²`;
}

type DvfSurfaceRow = { derniere_vente_surface_batie?: number | null; surface?: number | null };
const dvfSurfaceFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

function dvfSurface(row: DvfSurfaceRow): number | null {
  const surface = row.derniere_vente_surface_batie;
  return surface != null && Number.isFinite(surface) && surface > 0 ? surface : null;
}

function formatDvfSurface(row: DvfSurfaceRow) {
  const surface = dvfSurface(row);
  return surface === null ? '' : `${dvfSurfaceFormatter.format(surface)} m²`;
}

function dvfSurfaceLabel(row: { derniere_vente_code_type_local?: string | null }) {
  return row.derniere_vente_code_type_local === '2' ? 'Local vendu · DVF · Non vérifiée' : 'DVF · Non vérifiée';
}

function prospectionCrmSurface(row: DvfSurfaceRow): number | null {
  const surface = Number(row.surface);
  return !isLocalMarketList.value && Number.isFinite(surface) && surface > 0 ? surface : null;
}

function compareDvfSurface(a: DvfSurfaceRow, b: DvfSurfaceRow) {
  if (isEstimationMode.value) return (a.surface ?? -1) - (b.surface ?? -1);
  return (prospectionCrmSurface(a) ?? dvfSurface(a) ?? (isLocalMarketList.value ? a.surface : null) ?? -1) -
    (prospectionCrmSurface(b) ?? dvfSurface(b) ?? (isLocalMarketList.value ? b.surface : null) ?? -1);
}

function dvfSaleType(code?: string | null): string {
  switch (code) {
    case '1': return 'Maison';
    case '2': return 'Appartement';
    case '4': return 'Commercial';
    default: return '';
  }
}

function dvfLotsLabel(row: { derniere_vente_code_type_local?: string | null; derniere_vente_dvf?: { lots: string[] } | null }) {
  const lots = row.derniere_vente_dvf?.lots;
  if (row.derniere_vente_code_type_local !== '2' || !lots?.length) return '';
  return lots.length === 1 ? `Lot n° ${lots[0]}` : `Lots n° ${lots.join(', ')}`;
}

type MarketRow = Partial<IAddressDetail> & { tableMarketReference?: DvfResidentialReference | null };

function simulationMarketDifference(row: MarketRow) {
  return relativeMarketDifference(savedSimulationPricePerM2(row), row.tableMarketReference?.median);
}

function formatSimulationMarketDifference(row: MarketRow) {
  const difference = simulationMarketDifference(row);
  return difference === null ? '—' : marketPercent.format(difference);
}

function simulationMarketTitle(row: MarketRow) {
  const reference = row.tableMarketReference;
  if (!reference || simulationMarketDifference(row) === null) return undefined;
  const scope = reference.scope === 'street' ? 'rue' : 'commune';
  return `Référence résidentielle ${scope} · ${formatSoldPricePerSquareMetre(reference.median)}. Écart descriptif, sans indication sur la fiabilité de l’estimation.`;
}

function marketReferenceFor(row: MarketRow, scope: MarketScope = 'default') {
  if (scope === 'default') return row.tableMarketReference;
  if (row.code_insee !== props.marketCity) return null;
  if (Number(row.unit_id) > 0) {
    const category = unitDvfCategory(row.derniere_vente_code_type_local);
    if (!category) return null;
    if (scope === 'commune') return communeComparisonReference(props.marketStatistics, category);
    const street = row.prospection_street_key || row.id_fantoir;
    return street && street === props.marketStreet
      ? streetComparisonReference(props.marketStatistics?.streets?.[street]?.unit_categories?.[category], props.marketStatistics, category)
      : null;
  }
  if (scope === 'commune') return props.communeMarketReference;
  return (row.prospection_street_key || row.id_fantoir) === props.marketStreet ? props.marketReference : null;
}

function marketDifference(row: MarketRow, scope: MarketScope = 'default') {
  const code = row.derniere_vente_code_type_local;
  const comparable = code == null ? row.derniere_vente_residentielle : dvfSaleType(code) !== '';
  return comparable ? relativeMarketDifference(row.dernier_prix_vente_m2, marketReferenceFor(row, scope)?.median) : null;
}

function usesFavoriteCommuneReference(row: MarketRow) {
  return isLocalMarketList.value && marketDifference(row) !== null && marketReferenceFor(row)?.scope === 'commune';
}

function formatMarketDifference(row: MarketRow, scope: MarketScope) {
  const difference = marketDifference(row, scope);
  return difference === null ? '—' : marketPercent.format(difference);
}

function marketDifferenceNote(row: MarketRow, scope: MarketScope) {
  return row.derniere_vente_code_type_local === '4' && !(scope !== 'default' && Number(row.unit_id) > 0) && marketDifference(row, scope) !== null
    ? 'Comparaison avec le prix résidentiel de référence, malgré une catégorie de bien différente.' : undefined;
}

function hasWeakMarketDifference(row: MarketRow, scope: MarketScope) {
  return marketDifference(row, scope) !== null && marketReferenceFor(row, scope)?.lowReliability;
}

const handleRowClick = (row: any) => {
  if (props.cityOnly) {
    return;
  }

  const normalizedRow = {
    ...row,
    id_fantoir_long: row.id_fantoir_long,
    row_type: row.row_type || (Number(row.unit_id ?? 0) > 0 ? 'unit' : 'address'),
    unit_id: Number(row.unit_id ?? 0) > 0 ? Number(row.unit_id) : null,
  };

  console.log('ROW CLICK normalized =', normalizedRow);

  emit('edit-property', normalizedRow);
};

const sortByNumeroAndRep = (a: { numero: string; rep: any }, b: { numero: string; rep: any }) => {
  const numA = parseInt(a.numero) || 0;
  const numB = parseInt(b.numero) || 0;

  if (numA !== numB) {
    return numA - numB;
  }

  const repA = (a.rep || '').toLowerCase();
  const repB = (b.rep || '').toLowerCase();

  return repA.localeCompare(repB);
};

//const getRowClass = () => 'custom-row';

const getRowClass = ({ row }: any) => {
  return Number(row.id) === Number(selectedId.value) ? 'custom-row selected-row' : 'custom-row';
};

const toggleFavorite = async (row: any) => {
  try {
    const favorite = await store.setFavorite(row);
    ElMessage.success(favorite ? 'Ajouté aux favoris' : 'Retiré des favoris');
  } catch (e) {
    console.error('toggleFavorite error:', e);
    ElMessage.error('Impossible de modifier le favori');
  }
};

function getDisplayType(row: any): string {
  const type = (row.property_type || row.type_code || '').toString().toLowerCase();

  switch (type) {
    case 'maison':
      return 'Maison';
    case 'immeuble':
      return 'Immeuble';
    case 'terrain':
      return 'Terrain';
    case 'commerce':
      return 'Commerce';
    case 'appartement':
      return 'Appartement';
    case 'local_commercial':
      return 'Local commercial';
    case 'parking':
      return 'Parking';
    case 'cave':
      return 'Cave';
    case 'inconnu':
    case 'unknown':
    case 'address':
    case '':
      return 'Inconnu';
    default:
      return type;
  }
}
</script>

<style scoped>
.dvf-low-reliability { color: var(--el-color-warning-dark-2); }
.property-table-container {
  --prospection-dot-size: 12px;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  box-sizing: border-box;
}

.prospection-street-table {
  --prospection-dot-size: 14px;
}

.dvf-sale-link {
  min-width: 28px;
  min-height: 28px;
  font-size: 16px;
  vertical-align: middle;
}

.modern-property-table {
  width: 100%;
  border-radius: var(--table-radius);
  overflow: hidden;
  box-shadow: var(--table-shadow);
  border: 1px solid #c4c3c3;
  font-weight: 600;
  color: #303030;
}

:deep(.el-table) {
  border-radius: var(--table-radius);
}

:deep(.el-table tr) {
  background-color: transparent;
}

:deep(.el-table__header) {
  background: #f7f7f7;
}

:deep(.el-table__header th) {
  background: transparent !important;
  color: #303030;
  font-weight: 600;
  padding: var(--table-cell-padding);
}

:deep(.el-table__body tr:hover) {
  background-color: #f8fafc;
}

:deep(.el-table__row.custom-row) {
  transition: all 0.3s ease;
  cursor: pointer;
}

:deep(.el-table__row.custom-row:hover) {
  background-color: var(--table-row-hover) !important;
  transform: var(--btn-hover-translate);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

:deep(.el-table__body td) {
  padding: var(--table-cell-padding);
  border-bottom: 1px solid var(--table-border-color);
}

.icon-maison {
  font-size: 24px;
}

.icon-maison,
.dvf-sale-type[data-dvf-type='1'] {
  color: #059669;
}

.icon-appartement {
  font-size: 24px;
}

.icon-appartement,
.dvf-sale-type[data-dvf-type='2'] {
  color: #3b82f6;
}

.icon-immeuble {
  font-size: 24px;
  color: #d97706;
}

.icon-inconnu {
  font-size: 24px;
  color: #64748b;
}

.action-buttons {
  display: flex;
  gap: var(--action-gap);
  align-items: center;
  justify-content: center;
}

:deep(.el-button) {
  border-radius: var(--btn-radius);
  transition: all 0.3s ease;
}

:deep(.el-button:hover) {
  transform: var(--btn-hover-translate);
  box-shadow: var(--btn-hover-shadow);
}

.rueClickable {
  color: #3b82f6;
  cursor: pointer;
  font-weight: 600;
  transition: color 0.2s ease;
}

.rueClickable:hover {
  text-decoration: underline;
  color: #2563eb;
}

.numeroClickable {
  color: #3b82f6;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.numeroClickable:hover {
  text-decoration: underline;
  color: #2563eb;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .TableContainer {
    font-size: 14px;
  }

  :deep(.el-table__row.custom-row > td) {
    padding: 12px 8px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }
}

.icon-commerce {
  font-size: 24px;
}

.icon-commerce,
.dvf-sale-type[data-dvf-type='4'] {
  color: #7c3aed;
}

:deep(.el-button.favorite-active) {
  background-color: #f56c6c !important;
  border-color: #f56c6c !important;
  color: white !important;
}

:deep(.el-button.favorite-active:hover) {
  background-color: #f56c6c !important;
  border-color: #f56c6c !important;
  color: white !important;
}

/* ── Mobile card styles ──────────────────────────────────── */
.property-cards-mobile {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.property-card-mobile {
  background: var(--apple-card-bg, #fff);
  border-radius: var(--card-radius, 12px);
  border: 1px solid rgba(229, 231, 235, 0.6);
  box-shadow: var(--card-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
  padding: 14px;
  cursor: pointer;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.property-card-mobile:active {
  transform: scale(0.99);
  box-shadow: var(--card-shadow-hover, 0 4px 12px rgba(0, 0, 0, 0.15));
}

.pcm-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.pcm-address {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.pcm-numero {
  font-weight: 700;
  font-size: 16px;
  color: #3b82f6;
  cursor: pointer;
}

.pcm-street {
  font-weight: 600;
  font-size: 14px;
  color: #3b82f6;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pcm-city {
  font-size: 12px;
  color: #6b7280;
}

.pcm-type-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  font-size: 12px;
  color: #374151;
  font-weight: 500;
}

.pcm-type-label {
  font-size: 12px;
}

.pcm-unit {
  font-size: 12px;
  color: #9ca3af;
}

.pcm-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.pcm-data-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pcm-data-label {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.pcm-data-value {
  font-size: 13px;
  font-weight: 600;
  color: #1d1d1f;
}

.pcm-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}


.pcm-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.pcm-empty {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
  font-size: 14px;
}
</style>
