<template>
  <!--<div style="margin-bottom: 10px; white-space: pre-wrap">
  {{ addresses }}
</div>-->

  <div class="property-table-container">
    <TopBarMapView
      v-if="!cityOnly"
      :addresses="addresses as any"
      :active-mode="dashboardStore.filterMode"
      @mode-change="handleFilterModeChange"
    />
    <el-table
      :data="filteredAddresses"
      class="modern-property-table"
      :default-sort="{ prop: 'numero', order: 'ascending' }"
      height="80vh"
      :row-class-name="getRowClass"
      @row-click="handleRowClick"
    >
      <el-table-column label="Ville" prop="city" sortable min-width="100">
        <template #default="{ row }">
          {{ row.nom_commune }} {{ row.codePostal }}
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

      <el-table-column label="Type" prop="type_bien" sortable min-width="80">
        <template #default="{ row }">
          <!--  {{ row.type_bien }} {{ row.apart_number || '' }}-->

          <el-icon class="icon-maison" v-if="row.type_bien === 'Maison'"
            ><House
          /></el-icon>
          <el-icon
            class="icon-appartement"
            v-else-if="row.type_bien === 'Appartement'"
            ><OfficeBuilding
          /></el-icon>
          <el-icon
            class="icon-immeuble"
            v-else-if="row.type_bien === 'Immeuble'"
            ><OfficeBuilding
          /></el-icon>
          <el-icon class="icon-inconnu" v-else><QuestionFilled /></el-icon>
          <span v-if="row.apart_number">/{{ row.apart_number }}</span>
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
            <el-button
              @click.stop="toggleFavorite(row)"
              :type="
                row.favorite === 'true' || row.favorite === true
                  ? 'danger'
                  : 'default'
              "
              size="small"
              circle
            >
              <el-icon>
                <StarFilled
                  v-if="row.favorite === 'true' || row.favorite === true"
                />
                <Star v-else />
              </el-icon>
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="$emit('edit-property', row)"
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
import TopBarMapView from './TopBarMapView.vue';
import {
  formatDateShort as formatDate,
  formatPrice,
  formatSurface as formatMetrage,
} from '@/helpers/intl';
import { ref, computed, onMounted } from 'vue';
const selectedId = ref<string | null>(null);

const emit = defineEmits(['select-street', 'select-numero', 'edit-property']);

const handleStreetClick = (row: any) => {
  emit('select-street', row);
};

const handleNumeroClick = (row: any) => {
  emit('select-numero', row);
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

const filteredAddresses = computed(() => {
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
        return address.favorite === 'true' || address.favorite === true;
      default:
        return true;
    }
  });
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
});

const handleRowClick = (row: any) => {
  // Ne pas ouvrir la fiche si seulement la ville est sélectionnée
  if (props.cityOnly) {
    return;
  }
  emit('edit-property', row);
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

const getRowClass = (row: any) => {
  return row.id_fantoir_long === selectedId.value
    ? 'custom-row selected-row'
    : 'custom-row';
};

const toggleFavorite = async (row: any) => {
  try {
    const newState = await store.toggleFavorite(row.id_fantoir_long, row);

    ElMessage.success(newState ? 'Ajouté aux favoris' : 'Retiré des favoris');

    //row.favorite = newState;
    row.favorite = newState ? 'true' : 'false';

    dashboardStore.updateAddress({
      ...row,
      favorite: row.favorite,
    });
  } catch (e) {
    console.error('toggleFavorite error:', e);
    ElMessage.error('Impossible de modifier le favori');
  }
};
</script>

<style scoped>
.property-table-container {
  padding: 16px 0;
}

.modern-property-table {
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
</style>
