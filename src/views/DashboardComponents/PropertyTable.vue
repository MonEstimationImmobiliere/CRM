<template>
  <!--<div style="margin-bottom: 10px; white-space: pre-wrap">
  {{ addresses }}
</div>-->

  <div class="property-table-container">
    <el-table
      :data="filteredAddresses"
      :row-key="getRowKey"
      class="modern-property-table"
      :default-sort="{ prop: 'numero', order: 'ascending' }"
      max-height="calc(100vh - 320px)"
      :row-class-name="getRowClass"
      @row-click="handleRowClick"
    >
      <el-table-column label="Ville" prop="city" sortable min-width="100">
        <template #default="{ row }">
          {{ row.nom_commune }} {{ row.code_postal }}
        </template>
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
          <span class="rueClickable" @click.stop="handleStreetClick(row)">
            {{ row.nom_voie }}</span
          >
        </template>
      </el-table-column>

      <el-table-column
        label="Type"
        prop="property_type"
        sortable
        min-width="140"
      >
        <template #default="{ row }">
          <el-icon class="icon-maison" v-if="getDisplayType(row) === 'Maison'">
            <House />
          </el-icon>

          <el-icon
            class="icon-appartement"
            v-else-if="getDisplayType(row) === 'Appartement'"
          >
            <OfficeBuilding />
          </el-icon>

          <el-icon
            class="icon-immeuble"
            v-else-if="getDisplayType(row) === 'Immeuble'"
          >
            <OfficeBuilding />
          </el-icon>

          <el-icon
            class="icon-commerce"
            v-else-if="
              getDisplayType(row) === 'Commerce' ||
              getDisplayType(row) === 'Local commercial'
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

      <el-table-column
        label="Surface"
        prop="surface_reelle_bati"
        sortable
        min-width="90"
      >
        <template #default="{ row }">
          {{ formatMetrage(row.surface) }}
        </template>
      </el-table-column>

      <el-table-column
        label="Dernière vente"
        prop="date_derniere_vente"
        sortable
        min-width="120"
      >
        <template #default="{ row }">
          <!-- {{ row.date_derniere_vente }}<span v-if="row.nombre_ventes"> ({{ row.nombre_ventes }})</span> -->

          {{ formatDate(row.date_derniere_vente) }}
        </template>
      </el-table-column>

      <el-table-column
        label="Prix vendu"
        prop="dernier_prix_vente"
        sortable
        min-width="100"
      >
        <template #default="{ row }">
          {{ formatPrice(row.dernier_prix_vente) }}
        </template>
      </el-table-column>

      <el-table-column
        label="Prix Estimé"
        prop="dernier_prix_estime"
        sortable
        min-width="100"
      >
        <template #default="{ row }">
          <span
            :style="{ color: row.price ? 'green' : 'blue', fontWeight: 400 }"
          >
            {{ formatPrice(row.price || row.dernier_prix_estime) }}
          </span>
        </template>
      </el-table-column>

      <el-table-column
        label="Contact"
        prop="date_rappel"
        sortable
        min-width="120"
      >
        <template #default="{ row }">
          <div
            style="
              display: flex;
              align-items: center;
              gap: 6px;
              font-weight: 400;
            "
          >
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
            <el-button
              type="primary"
              size="small"
              @click.stop="handleRowClick(row)"
            >
              Ouvrir
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
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
  return (
    (now.getFullYear() - rappel.getFullYear()) * 12 +
    (now.getMonth() - rappel.getMonth())
  );
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

const sortByNumeroAndRep = (
  a: { numero: string; rep: any },
  b: { numero: string; rep: any }
) => {
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
  return Number(row.id) === Number(selectedId.value)
    ? 'custom-row selected-row'
    : 'custom-row';
};

const toggleFavorite = async (row: any) => {
  try {
    const normalizedRow = {
      ...row,
      row_type:
        row.row_type ||
        (Number(row.unit_id ?? 0) > 0 ? 'unit' : 'address'),

      unit_id:
        Number(row.unit_id ?? 0) > 0 ? Number(row.unit_id) : null,
    };

    const savedRow = await store.toggleFavorite(
      normalizedRow.id ?? 0,
      normalizedRow
    );

    Object.assign(row, {
      ...savedRow,
      row_type:
        savedRow.row_type ||
        normalizedRow.row_type,
      unit_id:
        Number(savedRow.unit_id ?? normalizedRow.unit_id ?? 0) > 0
          ? Number(savedRow.unit_id ?? normalizedRow.unit_id)
          : null,
    });

    ElMessage.success(
      savedRow.favorite ? 'Ajouté aux favoris' : 'Retiré des favoris'
    );

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
  const type = (row.property_type || row.type_code || '')
    .toString()
    .toLowerCase();

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
</style>
