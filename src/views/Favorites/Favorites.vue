<template>
  <div class="favorites-page">
    <!-- Mobile Header -->
    <div v-if="isMobile" class="mobile-header-favorites">
      <div class="mobile-header-top">
        <h2>Mes Favoris</h2>
        <ViewToggle v-model="currentFavoritesView" :options="viewOptions" />
      </div>
      <el-radio-group v-model="selectedScope" @change="onScopeChange" class="mobile-scope-toggle">
        <el-radio-button value="personal">Personnel</el-radio-button>
        <el-radio-button value="agency">Tous</el-radio-button>
      </el-radio-group>
      <el-select
        v-model="selectedCity"
        placeholder="Filtrer par ville"
        clearable
        class="mobile-filter-select"
      >
        <el-option v-for="city in availableCities" :key="city" :label="city" :value="city" />
      </el-select>
      <el-select
        v-model="selectedPropertyType"
        placeholder="Filtrer par type"
        clearable
        class="mobile-filter-select"
      >
        <el-option
          v-for="type in availablePropertyTypes"
          :key="type"
          :label="type"
          :value="type"
        />
      </el-select>
    </div>

    <!-- Desktop Header -->
    <EMCard v-else class="headerFilterInfoContainer" :border-hover="false">
      <div class="headerTopRow">
        <h2>Mes Propriétés Favorites</h2>
        <div class="headerRightContainer">
          <ViewToggle v-model="currentFavoritesView" :options="viewOptions" />
        </div>
      </div>

      <div class="headerBottomRow">
        <div class="filters-container">
          <div class="scope-filter">
            <el-radio-group v-model="selectedScope" @change="onScopeChange">
              <el-radio-button value="personal">Personnel</el-radio-button>
              <el-radio-button value="agency">Tous</el-radio-button>
            </el-radio-group>
          </div>
          <div class="city-filter">
            <el-select
              v-model="selectedCity"
              placeholder="Filtrer par ville"
              clearable
              class="filter-select"
            >
              <el-option v-for="city in availableCities" :key="city" :label="city" :value="city" />
            </el-select>
          </div>
          <div class="type-filter">
            <el-select
              v-model="selectedPropertyType"
              placeholder="Filtrer par type"
              clearable
              class="filter-select"
            >
              <el-option
                v-for="type in availablePropertyTypes"
                :key="type"
                :label="type"
                :value="type"
              />
            </el-select>
          </div>
        </div>
      </div>
    </EMCard>

    <div v-if="filteredFavorites.length === 0 && favorites.length > 0" class="empty-state">
      <el-empty description="Aucune propriété trouvée pour ces filtres">
        <el-button type="primary" @click="clearFilters"> Effacer les filtres </el-button>
      </el-empty>
    </div>

    <div v-else-if="favorites.length === 0" class="empty-state">
      <el-empty description="Aucune propriété en favoris">
        <el-button type="primary" @click="$router.push('/')"> Parcourir les propriétés </el-button>
      </el-empty>
    </div>

    <!-- Table View -->
    <FavoritesTable
      v-if="favoritesViewType === 'table' && filteredFavorites.length > 0"
      :favorites="filteredFavorites"
      @edit-property="openPropertyDialog"
      @toggle-favorite="toggleFavorite"
      @create-reminder="createReminderForProperty"
      @go-to-map="goToMap"
    />

    <!-- Card View -->
    <FavoritesCards
      v-else-if="favoritesViewType === 'card' && filteredFavorites.length > 0"
      :favorites="filteredFavorites"
      @edit-property="openPropertyDialog"
      @toggle-favorite="toggleFavorite"
      @create-reminder="createReminderForProperty"
      @go-to-map="goToMap"
    />

    <!-- Dialog PropertyForm -->
    <PropertyForm />

    <ReminderFormDialog
      v-model:visible="showReminderDialog"
      :editing-reminder="reminderToCreate"
      :saving="savingReminder"
      @save="saveReminder"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { usePropertyStore } from '@/stores/propertyHome';
import { useDashboardStore } from '@/stores/dashboard';
import { useRemindersStore } from '@/stores/reminders';
import { ElMessage } from 'element-plus';
import { DataBoard, Grid } from '@element-plus/icons-vue';
import ViewToggle from '@/components/ViewToggle.vue';
import PropertyForm from '@/views/DashboardComponents/PropertyDialog/index.vue';
import FavoritesTable from '@/views/Favorites/components/FavoritesTable.vue';
import FavoritesCards from '@/views/Favorites/components/FavoritesCards.vue';
import useDeviceBreakpoints from '@/composables/isMobile';

const { isMobile } = useDeviceBreakpoints();

import ReminderFormDialog from '@/views/Reminders/components/ReminderFormDialog.vue';
import type { ReminderFormData } from '@/views/Reminders/components/ReminderFormDialog.vue';

const showReminderDialog = ref(false);
const savingReminder = ref(false);
const reminderToCreate = ref<any | null>(null);

const store = usePropertyStore();
const dashboardStore = useDashboardStore();
const remindersStore = useRemindersStore();
const router = useRouter();

const selectedCity = ref<string>('');
const selectedPropertyType = ref<string>('');
const selectedScope = ref<'agency' | 'personal'>('personal');
//const favorites = computed(() => store.favorites);
const favorites = computed(() => store.favoriteAddresses);
const favoritesViewType = computed(() => store.favoritesViewType);

onMounted(async () => {
  try {
    await store.loadFavoriteAddresses(selectedScope.value);
  } catch (error) {
    ElMessage({
      message: 'Erreur lors du chargement des favoris',
      type: 'error',
      duration: 3000,
    });
  }
});

watch(
  () => store.isDialogVisible,
  async (isVisible, wasVisible) => {
    if (wasVisible && !isVisible) {
      try {
        await store.loadFavoriteAddresses(selectedScope.value);
      } catch (error) {
        ElMessage.error('Erreur lors du rafraîchissement des favoris');
      }
    }
  }
);

const availableCities = computed(() => {
  return favorites.value
    .map((property) => property.city || property.nom_commune || null)
    .filter((city): city is string => city !== null && city !== undefined && city !== '')
    .filter((city, index, array) => array.indexOf(city) === index)
    .sort();
});

const availablePropertyTypes = computed(() => {
  const types = favorites.value
    .map((property) => property.property_type || null)
    .filter((type, index, array) => array.indexOf(type) === index);

  const validTypes = types
    .filter((type): type is NonNullable<typeof type> => type !== null && type !== undefined)
    .sort();

  const hasNullTypes = types.some((type) => type === null || type === undefined);

  const result: string[] = [...validTypes];
  if (hasNullTypes) {
    result.push('Non renseigné');
  }

  return result;
});

const filteredFavorites = computed(() => {
  let filtered = favorites.value;

  if (selectedCity.value) {
    filtered = filtered.filter(
      (property) => (property.city || property.nom_commune || '') === selectedCity.value
    );
  }

  if (selectedPropertyType.value) {
    if (selectedPropertyType.value === 'Non renseigné') {
      filtered = filtered.filter((property) => !property.property_type);
    } else {
      filtered = filtered.filter(
        (property) => property.property_type === selectedPropertyType.value
      );
    }
  }

  return filtered;
});

const toggleFavorite = async (propertyData: any) => {
  try {
    const savedRow = await store.toggleFavorite(propertyData.id, propertyData);

    propertyData.id = savedRow.id;
    propertyData.favorite = savedRow.favorite;

    ElMessage({
      message: savedRow.favorite
        ? 'Propriété ajoutée aux favoris'
        : 'Propriété retirée des favoris',
      type: savedRow.favorite ? 'success' : 'info',
      duration: 2000,
    });
  } catch (error) {
    ElMessage({
      message: 'Erreur lors de la modification du favori',
      type: 'error',
      duration: 3000,
    });
  }
};

const openPropertyDialog = async (property: any) => {
  const unitId = Number(property.unit_id ?? 0);

  const normalizedProperty = {
    ...store.defaultPropertyData,
    ...property,

    id: Number(property.id ?? 0) > 0 ? Number(property.id) : 0,

    id_fantoinit_id: unitId > 0 ? unitId : null,

    row_type: property.row_type || (unitId > 0 ? 'unit' : 'address'),
  };

  await store.selectProperty(normalizedProperty);

  store.setDialogVisible(true);
};
const clearFilters = () => {
  selectedCity.value = '';
  selectedPropertyType.value = '';
};

const onScopeChange = async (scope: string | number | boolean | undefined) => {
  try {
    await store.loadFavoriteAddresses(scope as 'agency' | 'personal');
  } catch (error) {
    ElMessage.error('Erreur lors du chargement des favoris');
  }
};

const goToMap = (property: any) => {
  const city = property.city || property.nom_commune || '';
  const codeInsee = property.code_insee || property.code_commune || '';
  const idFantoir = property.id_fantoir || '';
  const numero = property.numero ? String(property.numero) : '';
  const rep = property.rep || '';

  dashboardStore.lastSearchParams = null;

  dashboardStore.setSearchParams(
    city ? { value: city, codeInsee, code_insee: codeInsee } : null,
    property.nom_voie ? { value: property.nom_voie, idFantoir } : null,
    codeInsee,
    idFantoir
  );

  dashboardStore.selectedNumero = numero;
  dashboardStore.selectedRep = rep;

  dashboardStore.viewType = 'map';
  dashboardStore.querySearchAddress();

  router.push('/');
};

const createReminderForProperty = (property: any) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  reminderToCreate.value = {
    id: 0,
    title: 'Rappel',
    description: '',
    date: tomorrow.toISOString().split('T')[0],
    type: 'rappel',
    priority: 'low',
    status: 'todo',
    completed: false,
    sharing: true,
    property_id: property.id || 0,
    property,
  };

  showReminderDialog.value = true;
};

const saveReminder = async (form: ReminderFormData, editingReminder: any | null) => {
  savingReminder.value = true;

  try {
    await remindersStore.addReminder({
      ...form,
      completed: form.status === 'completed',
    });

    showReminderDialog.value = false;
    reminderToCreate.value = null;

    ElMessage.success('Rappel créé avec succès');
  } catch (error) {
    ElMessage.error('Erreur lors de la création du rappel');
  } finally {
    savingReminder.value = false;
  }
};

const viewOptions = [
  { value: 'table', label: 'Vue tableau', icon: DataBoard },
  { value: 'card', label: 'Vue cartes', icon: Grid },
];

const currentFavoritesView = computed({
  get: () => store.favoritesViewType,
  set: (v: string) => store.setFavoritesViewType(v as 'table' | 'card'),
});
</script>

<style scoped>
.favorites-page {
  /* padding: 0 20px; */
}

.headerFilterInfoContainer {
  margin-bottom: 20px;
  border-radius: var(--apple-radius);
}

.headerTopRow {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  gap: 20px;
  flex-wrap: wrap;
}

.headerTopRow h1 {
  margin: 0;
  color: var(--page-title-color);
  font-size: var(--page-title-size);
  font-weight: var(--page-title-weight);
}

.headerBottomRow {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.headerRightContainer {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.filters-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.scope-filter {
  display: flex;
  align-items: center;
}

.city-filter,
.type-filter {
  display: flex;
  align-items: center;
}

.filter-select {
  width: 200px;
}

.loading-container {
  margin: 40px 0;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: var(--empty-state-min-height);
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

/* ── Mobile responsive ──────────────────────────────────────── */
.mobile-header-favorites {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--el-bg-color, #fff);
  border-radius: var(--apple-radius, 12px);
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.mobile-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mobile-header-top h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.mobile-scope-toggle {
  width: 100%;
}

.mobile-scope-toggle :deep(.el-radio-group) {
  display: flex;
  width: 100%;
}

.mobile-scope-toggle :deep(.el-radio-button) {
  flex: 1;
}

.mobile-scope-toggle :deep(.el-radio-button__inner) {
  width: 100%;
  text-align: center;
}

.mobile-filter-select {
  width: 100%;
}

@media (max-width: 768px) {
  .headerTopRow {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .headerRightContainer {
    justify-content: flex-end;
  }

  .filters-container {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .filter-select {
    width: 100%;
  }

  .scope-filter :deep(.el-radio-group) {
    display: flex;
    width: 100%;
  }

  .scope-filter :deep(.el-radio-button) {
    flex: 1;
    text-align: center;
  }

  .favorites-grid {
    grid-template-columns: 1fr;
  }
}
</style>
