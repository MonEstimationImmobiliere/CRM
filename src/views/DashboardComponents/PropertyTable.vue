<template>
  <div class="property-table-container">
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
            <span class="pcm-data-value">{{ formatMetrage((row as any).surface) }}</span>
          </div>
          <div class="pcm-data-item">
            <span class="pcm-data-label">Dernière vente</span>
            <span class="pcm-data-value">{{ formatDate((row as any).date_derniere_vente) }}</span>
          </div>
          <div class="pcm-data-item">
            <span class="pcm-data-label">Prix vendu</span>
            <span class="pcm-data-value">{{ formatPrice((row as any).dernier_prix_vente) }}</span>
          </div>
          <div class="pcm-data-item">
            <span class="pcm-data-label">Prix estimé</span>
            <span class="pcm-data-value" :style="{ color: (row as any).price ? 'green' : 'blue' }">
              {{ formatPrice((row as any).price || (row as any).dernier_prix_estime) }}
            </span>
          </div>
        </div>

        <!-- Footer: contact status + actions -->
        <div class="pcm-footer">
          <div class="pcm-contact">
            <img
              :src="getWeatherIcon((row as any).date_rappel)"
              alt="météo"
              width="20"
              height="20"
            />
            <span
              class="pcm-weather-label"
              :style="{
                color: getWeatherLabel((row as any).date_rappel).includes('eviter')
                  ? 'red'
                  : getWeatherLabel((row as any).date_rappel).includes('mois')
                    ? 'orange'
                    : 'green',
              }"
              >{{ getWeatherLabel((row as any).date_rappel) }}</span
            >
          </div>
          <div class="pcm-actions" v-if="!cityOnly">
            <el-button @click.stop="toggleFavorite(row)" size="small" circle>
              <el-icon>
                <StarFilled
                  v-if="Number((row as any).favorite) === 1 || (row as any).favorite === true"
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
      :data="filteredAddresses"
      :row-key="getRowKey"
      class="modern-property-table"
      :default-sort="{ prop: 'numero', order: 'ascending' }"
      max-height="calc(100vh - 320px)"
      :row-class-name="getRowClass"
      @row-click="handleRowClick"
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
        :sort-orders="['ascending', 'descending']"
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

      <el-table-column label="Surface" prop="surface_reelle_bati" sortable min-width="90">
        <template #default="{ row }">
          {{ formatMetrage(row.surface) }}
        </template>
      </el-table-column>

      <el-table-column label="Dernière vente" prop="date_derniere_vente" sortable min-width="120">
        <template #default="{ row }">
          <!-- {{ row.date_derniere_vente }}<span v-if="row.nombre_ventes"> ({{ row.nombre_ventes }})</span> -->

          {{ formatDate(row.date_derniere_vente) }}
        </template>
      </el-table-column>

      <el-table-column label="Prix vendu" prop="dernier_prix_vente" sortable min-width="100">
        <template #default="{ row }">
          {{ formatPrice(row.dernier_prix_vente) }}
        </template>
      </el-table-column>

      <el-table-column label="Prix Estimé" prop="dernier_prix_estime" sortable min-width="100">
        <template #default="{ row }">
          <span :style="{ color: row.price ? 'green' : 'blue', fontWeight: 400 }">
            {{ formatPrice(row.price || row.dernier_prix_estime) }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="Contact" prop="date_rappel" sortable min-width="120">
        <template #default="{ row }">
          <div style="display: flex; align-items: center; gap: 6px; font-weight: 400">
            <img
              :src="getWeatherIcon(row.date_rappel)"
              alt="météo"
              width="24"
              height="24"
              style="display: block; margin-right: 6px"
            />
            <span
              style="line-height: 1"
              :style="{
                color: getWeatherLabel(row.date_rappel).includes('eviter')
                  ? 'red'
                  : getWeatherLabel(row.date_rappel).includes('mois')
                    ? 'orange'
                    : 'green',
              }"
              >{{ getWeatherLabel(row.date_rappel) }}</span
            >
          </div>
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
            <el-button @click.stop="toggleFavorite(row)" size="small" circle>
              <el-icon>
                <StarFilled
                  v-if="Number(row.favorite) === 1 || row.favorite === true"
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
import soleil from '@/assets/soleil.png';
import soleilNuage from '@/assets/soleil-nuage.png';
import nuage from '@/assets/nuage.png';
import nuagePluie from '@/assets/nuage-pluie.png';
import orage from '@/assets/orage.png';
import { Star, StarFilled } from '@element-plus/icons-vue';
import { House, OfficeBuilding, QuestionFilled } from '@element-plus/icons-vue';
import { usePropertyStore } from '@/stores/propertyHome';
import { ElMessage } from 'element-plus';
import { useDashboardStore } from '@/stores/dashboard';
import { useRemindersStore } from '@/stores/reminders';
import {
  formatDateShort as formatDate,
  formatPrice,
  formatSurface as formatMetrage,
} from '@/helpers/intl';
import { ref, computed, onMounted } from 'vue';
const selectedId = ref<number | null>(null);

const { isMobile } = useDeviceBreakpoints();

const emit = defineEmits(['select-street', 'select-numero', 'edit-property']);

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

function getMonthsDiff(dateRappel: string | null): number {
  if (!dateRappel) return -1;
  const rappel = new Date(dateRappel);
  const now = new Date();
  return (now.getFullYear() - rappel.getFullYear()) * 12 + (now.getMonth() - rappel.getMonth());
}

function getWeatherIcon(dateRappel: string | null): string {
  const diff = getMonthsDiff(dateRappel);
  if (diff < 0 || diff < 1) return soleil;
  if (diff < 3) return soleilNuage;
  if (diff < 6) return nuage;
  if (diff < 12) return nuagePluie;
  return orage;
}

function getWeatherLabel(dateRappel: string | null): string {
  const diff = getMonthsDiff(dateRappel);
  if (diff < 0) return 'Immediat';
  if (diff < 1) return 'Immediat';
  if (diff < 3) return '1 mois';
  if (diff < 6) return '3 mois';
  if (diff < 12) return '6 mois';
  return 'A eviter';
}

const store = usePropertyStore();

const dashboardStore = useDashboardStore();
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
const filteredAddresses = computed(() => props.addresses);

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
});

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
    const normalizedRow = {
      ...row,
      row_type: row.row_type || (Number(row.unit_id ?? 0) > 0 ? 'unit' : 'address'),

      unit_id: Number(row.unit_id ?? 0) > 0 ? Number(row.unit_id) : null,
    };

    const savedRow = await store.toggleFavorite(normalizedRow.id ?? 0, normalizedRow);

    Object.assign(row, {
      ...savedRow,
      row_type: savedRow.row_type || normalizedRow.row_type,
      unit_id:
        Number(savedRow.unit_id ?? normalizedRow.unit_id ?? 0) > 0
          ? Number(savedRow.unit_id ?? normalizedRow.unit_id)
          : null,
    });

    ElMessage.success(savedRow.favorite ? 'Ajouté aux favoris' : 'Retiré des favoris');

    dashboardStore.updateAddress({
      ...row,
      ...savedRow,
      row_type: row.row_type,
      unit_id: row.unit_id,
    });
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
.property-table-container {
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  box-sizing: border-box;
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
  color: #059669;
}

.icon-appartement {
  font-size: 24px;
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

.pcm-contact {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pcm-weather-label {
  font-size: 12px;
  font-weight: 600;
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
