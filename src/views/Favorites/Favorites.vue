<template>
  <div class="favorites-page">
    <div class="favorites-header">
      <h1>Mes Propriétés Favorites</h1>
      <div class="header-controls">
        <div class="filters-container">
          <div class="city-filter">
            <el-select
              v-model="selectedCity"
              placeholder="Filtrer par ville"
              clearable
              size="large"
              class="filter-select"
            >
              <el-option
                v-for="city in availableCities"
                :key="city"
                :label="city"
                :value="city"
              />
            </el-select>
          </div>
          <div class="type-filter">
            <el-select
              v-model="selectedPropertyType"
              placeholder="Filtrer par type"
              clearable
              size="large"
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
        <div class="header-stats">
          <el-tag size="large" type="info"
            >{{ filteredFavorites.length }} favori(s)</el-tag
          >
        </div>
      </div>

      <ViewToggle v-model="currentFavoritesView" :options="viewOptions" />
    </div>

    <div
      v-if="filteredFavorites.length === 0 && favorites.length > 0"
      class="empty-state"
    >
      <el-empty description="Aucune propriété trouvée pour ces filtres">
        <el-button type="primary" @click="clearFilters">
          Effacer les filtres
        </el-button>
      </el-empty>
    </div>

    <div v-else-if="favorites.length === 0" class="empty-state">
      <el-empty description="Aucune propriété en favoris">
        <el-button type="primary" @click="$router.push('/')">
          Parcourir les propriétés
        </el-button>
      </el-empty>
    </div>

    <!-- Table View -->
    <FavoritesTable
      v-if="favoritesViewType === 'table' && filteredFavorites.length > 0"
      :favorites="filteredFavorites"
      @edit-property="openPropertyDialog"
      @toggle-favorite="toggleFavorite"
      @create-reminder="createReminderForProperty"
    />

    <!-- Card View -->
    <FavoritesCards
      v-else-if="favoritesViewType === 'card' && filteredFavorites.length > 0"
      :favorites="filteredFavorites"
      @edit-property="openPropertyDialog"
      @toggle-favorite="toggleFavorite"
      @create-reminder="createReminderForProperty"
    />

    <!-- Dialog PropertyForm -->
    <PropertyForm />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { usePropertyStore } from '@/stores/propertyHome';
import { useRemindersStore } from '@/stores/reminders';
import { ElMessage } from 'element-plus';
import { DataBoard, Grid } from '@element-plus/icons-vue';
import ViewToggle from '@/components/ViewToggle.vue';
import PropertyForm from '@/views/DashboardComponents/PropertyDialog/index.vue';
import FavoritesTable from '@/views/Favorites/components/FavoritesTable.vue';
import FavoritesCards from '@/views/Favorites/components/FavoritesCards.vue';

const store = usePropertyStore();
const remindersStore = useRemindersStore();

const selectedCity = ref<string>('');
const selectedPropertyType = ref<string>('');

//const favorites = computed(() => store.favorites);
const favorites = computed(() => store.favoriteAddresses);
const favoritesViewType = computed(() => store.favoritesViewType);

onMounted(async () => {
  try {
    await store.loadFavoriteAddresses();
  } catch (error) {
    ElMessage({
      message: 'Erreur lors du chargement des favoris',
      type: 'error',
      duration: 3000,
    });
  }
});

const availableCities = computed(() => {
  return favorites.value
    .map(property => property.city || property.nom_commune || null)
    .filter(
      (city): city is string =>
        city !== null && city !== undefined && city !== ''
    )
    .filter((city, index, array) => array.indexOf(city) === index)
    .sort();
});

const availablePropertyTypes = computed(() => {
  const types = favorites.value
    .map(property => property.property_type || null)
    .filter((type, index, array) => array.indexOf(type) === index);

  const validTypes = types
    .filter(
      (type): type is NonNullable<typeof type> =>
        type !== null && type !== undefined
    )
    .sort();

  const hasNullTypes = types.some(type => type === null || type === undefined);

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
      property =>
        (property.city || property.nom_commune || '') === selectedCity.value
    );
  }

  if (selectedPropertyType.value) {
    if (selectedPropertyType.value === 'Non renseigné') {
      filtered = filtered.filter(property => !property.property_type);
    } else {
      filtered = filtered.filter(
        property => property.property_type === selectedPropertyType.value
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

const openPropertyDialog = (property: any) => {
  store.selectProperty({
    ...store.defaultPropertyData,
    ...property,
    id_fantoir_long: property.id_fantoir_long,
  });
  store.setDialogVisible(true);
};

const clearFilters = () => {
  selectedCity.value = '';
  selectedPropertyType.value = '';
};

const createReminderForProperty = async (property: any) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const propertyAddress =
    `${property.numero || ''} ${property.nom_voie || ''}`.trim();

  try {
    await remindersStore.addReminder({
      title: `Rappel - ${propertyAddress || 'Propriété'}`,
      description: 'Rappel rapide depuis les favoris',
      date: tomorrow.toISOString().split('T')[0],
      type: 'rappel',
      priority: 'medium',
      sharing: false,
      property_id: property.id || 0,
      completed: false,
    });

    ElMessage({
      message: 'Rappel créé avec succès !',
      type: 'success',
      duration: 3000,
    });
  } catch {
    ElMessage({
      message: 'Erreur lors de la création du rappel',
      type: 'error',
      duration: 3000,
    });
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
  padding: var(--page-padding);
  /* max-width: 1400px; */
  margin: 0 auto;
}

.favorites-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.favorites-header h1 {
  margin: 0;
  color: var(--page-title-color);
  font-size: var(--page-title-size);
  font-weight: var(--page-title-weight);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filters-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.city-filter,
.type-filter {
  display: flex;
  align-items: center;
}

.filter-select {
  width: 200px;
}

.header-stats {
  display: flex;
  gap: 12px;
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
</style>
