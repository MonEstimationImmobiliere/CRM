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

      <div class="view-controls">
        <div class="layoutContainer">
          <el-row :gutter="20">
            <el-col :span="12">
              <div
                class="grid-container"
                role="button"
                tabindex="0"
                aria-label="Vue tableau"
                :aria-pressed="favoritesViewType === 'table'"
                @click="setTableView"
                @keydown.enter="setTableView"
              >
                <el-icon
                  class="databoard-icon"
                  :class="{ active: favoritesViewType === 'table' }"
                >
                  <DataBoard />
                </el-icon>
              </div>
            </el-col>
            <el-col :span="12">
              <div
                class="grid-container"
                role="button"
                tabindex="0"
                aria-label="Vue cartes"
                :aria-pressed="favoritesViewType === 'card'"
                @click="setCardView"
                @keydown.enter="setCardView"
              >
                <el-icon
                  class="grid-icon"
                  :class="{ active: favoritesViewType === 'card' }"
                >
                  <Grid />
                </el-icon>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
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
import PropertyForm from '@/views/DashboardComponents/PropertyDialog.vue';
import FavoritesTable from '@/views/Favorites/components/FavoritesTable.vue';
import FavoritesCards from '@/views/Favorites/components/FavoritesCards.vue';

const store = usePropertyStore();
const remindersStore = useRemindersStore();

const selectedCity = ref<string>('');
const selectedPropertyType = ref<string>('');

const favorites = computed(() => store.favorites);
const favoritesViewType = computed(() => store.favoritesViewType);

onMounted(async () => {
  try {
    await store.loadFavoritesProperties();
  } catch (error) {
    ElMessage({
      message: 'Erreur lors du chargement des favoris',
      type: 'error',
      duration: 3000,
    });
  }
});

// Computed pour obtenir les villes disponibles
const availableCities = computed(() => {
  const cities = favorites.value
    .map(property => property.city || null)
    .filter(
      (city): city is string =>
        city !== null && city !== undefined && city !== ''
    ) // Filtrer les valeurs nulles/undefined
    .filter((city, index, array) => array.indexOf(city) === index) // Supprimer les doublons
    .sort(); // Trier alphabétiquement
  return cities;
});

// Computed pour obtenir les types de propriétés disponibles
const availablePropertyTypes = computed(() => {
  const types = favorites.value
    .map(property => property.property_type || null)
    .filter((type, index, array) => array.indexOf(type) === index); // Supprimer les doublons

  // Séparer les types valides et les valeurs nulles/undefined
  const validTypes = types
    .filter(
      (type): type is NonNullable<typeof type> =>
        type !== null && type !== undefined
    )
    .sort(); // Trier alphabétiquement

  const hasNullTypes = types.some(type => type === null || type === undefined);

  // Ajouter "Non renseigné" si il y a des propriétés sans type
  const result: string[] = [...validTypes];
  if (hasNullTypes) {
    result.push('Non renseigné');
  }

  return result;
});

// Computed pour les favoris filtrés
const filteredFavorites = computed(() => {
  let filtered = favorites.value;

  // Filtre par ville
  if (selectedCity.value) {
    filtered = filtered.filter(
      property => (property.city || null) === selectedCity.value
    );
  }

  // Filtre par type de propriété
  if (selectedPropertyType.value) {
    if (selectedPropertyType.value === 'Non renseigné') {
      // Filtrer les propriétés sans type (null ou undefined)
      filtered = filtered.filter(property => !property.property_type);
    } else {
      // Filtrer par type de propriété spécifique
      filtered = filtered.filter(
        property => property.property_type === selectedPropertyType.value
      );
    }
  }

  return filtered;
});

const toggleFavorite = async (propertyData: any) => {
  try {
    const newFavoriteState = await store.toggleFavorite(
      propertyData.id_fantoir_long
    );
    ElMessage({
      message: newFavoriteState
        ? 'Propriété ajoutée aux favoris'
        : 'Propriété retirée des favoris',
      type: newFavoriteState ? 'success' : 'info',
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

const setTableView = () => {
  store.setFavoritesViewType('table');
};

const setCardView = () => {
  store.setFavoritesViewType('card');
};
</script>

<style scoped>
.favorites-page {
  padding: 24px;
}

.favorites-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.favorites-header h1 {
  margin: 0;
  color: #1f2937;
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
  min-height: 400px;
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.view-controls {
  margin-bottom: 24px;
}

.layoutContainer {
  display: flex;
  justify-content: center;
  max-width: 200px;
  margin: 0 auto;
}

.grid-container {
  cursor: pointer;
  padding: 8px 12px;
  border: 2px solid #337ecc;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  background: white;
}

.grid-container:hover {
  background-color: #f5f7fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(51, 126, 204, 0.2);
}

.databoard-icon,
.grid-icon {
  font-size: 20px;
  color: #909399;
  transition:
    color 0.3s,
    transform 0.3s;
}

.databoard-icon:hover,
.grid-icon:hover {
  transform: scale(1.1);
}

.databoard-icon.active,
.grid-icon.active {
  color: #337ecc;
  transform: scale(1.1);
}
</style>
