<template>
  <div class="favorites-page">
    <div class="favorites-header">
      <h1>Mes Propriétés Favorites</h1>
      <div class="header-controls">
        <div class="city-filter">
          <el-select 
            v-model="selectedCity" 
            placeholder="Filtrer par ville"
            clearable
            size="large"
            style="width: 200px"
          >
            <el-option
              v-for="city in availableCities"
              :key="city"
              :label="city"
              :value="city"
            />
          </el-select>
        </div>
        <div class="header-stats">
          <el-tag size="large" type="info">{{ filteredFavorites.length }} favori(s)</el-tag>
        </div>
      </div>
    </div>

    <div v-if="filteredFavorites.length === 0 && favorites.length > 0" class="empty-state">
      <el-empty description="Aucune propriété trouvée pour cette ville">
        <el-button type="primary" @click="selectedCity = ''">
          Voir tous les favoris
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

    <div v-else class="favorites-grid">
      <el-card 
        v-for="property in filteredFavorites" 
        :key="property.id_fantoir_long"
        class="favorite-card"
        shadow="hover"
        @click="openPropertyDialog(property)"
      >
        <div class="favorite-header">
          <div class="property-title">
            <h3>{{ property.numero }} {{ property.nom_voie }}</h3>
            <p class="property-city">{{ property.nom_commune }}</p>
          </div>
          <el-button 
            type="danger" 
            size="small" 
            circle
            @click.stop="toggleFavorite(property.id_fantoir_long)"
          >
            <el-icon><StarFilled /></el-icon>
          </el-button>
        </div>

        <el-divider />

        <div class="property-details">
          <div class="detail-row">
            <span class="label">Propriétaire:</span>
            <span class="value">{{ property.owner || 'Non renseigné' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Type:</span>
            <span class="value">{{ property.property_type || 'Non renseigné' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Surface:</span>
            <span class="value">{{ property.surface || 0 }} m²</span>
          </div>
          <div class="detail-row">
            <span class="label">Prix estimé:</span>
            <span class="value">{{ formatPrice(property.price) }}</span>
          </div>
        </div>

        <el-divider />

        <div class="card-actions">
          <el-button type="primary" size="small" @click.stop="openPropertyDialog(property)">
            <el-icon><Edit /></el-icon>
            Modifier
          </el-button>
          <el-button type="success" size="small" @click.stop="createReminderForProperty(property)">
            <el-icon><Plus /></el-icon>
            Rappel
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- Dialog PropertyForm -->
    <PropertyForm />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { usePropertyStore } from '@/stores/propertyHome';
import { useRemindersStore } from '@/stores/reminders';
import { ElMessage } from 'element-plus';
import { StarFilled, Edit, Plus } from '@element-plus/icons-vue';
import PropertyForm from '@/views/DashboardComponents/PropertyDialog.vue';

const store = usePropertyStore();
const remindersStore = useRemindersStore();

const selectedCity = ref<string>('');

const favorites = computed(() => store.favorites);

// Computed pour obtenir les villes disponibles
const availableCities = computed(() => {
  const cities = favorites.value
    .map(property => property.nom_commune)
    .filter((city): city is string => city !== null && city !== undefined && city !== '') // Filtrer les valeurs nulles/undefined
    .filter((city, index, array) => array.indexOf(city) === index) // Supprimer les doublons
    .sort(); // Trier alphabétiquement
  return cities;
});

// Computed pour les favoris filtrés
const filteredFavorites = computed(() => {
  if (!selectedCity.value) {
    return favorites.value;
  }
  return favorites.value.filter(property => property.nom_commune === selectedCity.value);
});

// Charger les propriétés favorites au montage du composant
onMounted(async () => {
  await store.loadFavoritesProperties();
});

const formatPrice = (price: number | undefined) => {
  if (!price) return 'Non renseigné';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(price);
};

const toggleFavorite = async (propertyId: string) => {
  try {
    const newFavoriteState = await store.toggleFavorite(propertyId);
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

const createReminderForProperty = (property: any) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const propertyAddress = `${property.numero || ''} ${property.nom_voie || ''}`.trim();
  const propertyCity = property.nom_commune || '';
  
  remindersStore.addReminder({
    title: `Rappel - ${propertyAddress || 'Propriété'}`,
    description: 'Rappel rapide depuis les favoris',
    date: tomorrow.toISOString().split('T')[0],
    type: 'rappel',
    priority: 'medium',
    sharing: false,
    property_id: property.id_fantoir_long,
    completed: false,
  });
  
  ElMessage({
    message: 'Rappel créé avec succès !',
    type: 'success',
    duration: 3000,
  });
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

.city-filter {
  display: flex;
  align-items: center;
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

.favorite-card {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.favorite-card:hover {
  transform: translateY(-2px);
}

.favorite-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.property-title h3 {
  margin: 0 0 4px 0;
  color: #1f2937;
  font-size: 18px;
}

.property-city {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.property-details {
  margin: 16px 0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.detail-row .label {
  font-weight: 500;
  color: #374151;
}

.detail-row .value {
  color: #6b7280;
}

.card-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
