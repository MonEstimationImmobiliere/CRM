<template>
  <div class="favorites-cards-container">
    <!-- Search and Sort Controls -->
    <div class="controls-container">
      <div class="search-container">
        <el-input
          v-model="searchTerm"
          placeholder="Rechercher dans les favoris..."
          class="search-input"
          clearable
        >
          <template #prefix>
            <el-icon class="search-icon"><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <div class="sort-controls">
        <el-button
          :type="sortBy === 'city' ? 'primary' : 'default'"
          size="small"
          @click="handleSortClick('city')"
        >
          Ville
          <el-icon class="sort-icon"><Sort /></el-icon>
        </el-button>

        <el-button
          :type="sortBy === 'price' ? 'primary' : 'default'"
          size="small"
          @click="handleSortClick('price')"
        >
          Prix
          <el-icon class="sort-icon"><Sort /></el-icon>
        </el-button>

        <el-button
          :type="sortBy === 'surface' ? 'primary' : 'default'"
          size="small"
          @click="handleSortClick('surface')"
        >
          Surface
          <el-icon class="sort-icon"><Sort /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- Cards Grid -->
    <div class="favorites-grid">
      <el-card
        v-for="property in sortedAndFilteredFavorites"
        :key="property.id_fantoir_long"
        class="favorite-card"
        shadow="hover"
        @click="$emit('edit-property', property)"
      >
        <!-- Card Header -->
        <div class="card-header">
          <div class="address-info">
            <h3 class="address-title">
              {{ property.numero }} {{ property.nom_voie }}
            </h3>
            <p class="city-name">{{ getPropertyCity(property) }}</p>
          </div>
          <el-button
            type="danger"
            size="small"
            circle
            @click.stop="$emit('toggle-favorite', property)"
            class="favorite-button"
          >
            <el-icon><StarFilled /></el-icon>
          </el-button>
        </div>

        <el-divider class="card-divider" />

        <!-- Property Details -->
        <div class="property-details">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Propriétaire</span>
              <span class="value">{{ property.owner || 'Non renseigné' }}</span>
            </div>

            <div class="detail-item">
              <span class="label">Type</span>
              <el-tag
                :type="getPropertyTypeTagType(property.property_type)"
                size="small"
                round
                class="type-tag"
              >
                {{ property.property_type || 'Non renseigné' }}
              </el-tag>
            </div>

            <div class="detail-item">
              <span class="label">Surface</span>
              <span class="value surface">{{ property.surface || 0 }} m²</span>
            </div>

            <div class="detail-item">
              <span class="label">Prix estimé</span>
              <span class="value price">{{ formatPrice(property.price) }}</span>
            </div>
          </div>
        </div>

        <el-divider class="card-divider" />

        <!-- Card Actions -->
        <div class="card-actions">
          <el-button
            type="primary"
            size="small"
            @click.stop="$emit('edit-property', property)"
            class="action-button"
          >
            <el-icon><Edit /></el-icon>
            Modifier
          </el-button>
          <el-button
            type="success"
            size="small"
            @click.stop="$emit('create-reminder', property)"
            class="action-button"
          >
            <el-icon><Plus /></el-icon>
            Rappel
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- Empty State -->
    <div v-if="sortedAndFilteredFavorites.length === 0" class="empty-state">
      <el-empty description="Aucune propriété favorite trouvée">
        <el-button v-if="searchTerm" type="primary" @click="searchTerm = ''">
          Effacer la recherche
        </el-button>
        <el-button v-else type="primary" @click="$router.push('/')">
          Parcourir les propriétés
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Sort, StarFilled, Edit, Plus } from '@element-plus/icons-vue';
import { useDashboardStore } from '@/stores/dashboard';

interface Props {
  favorites: any[];
}

const props = defineProps<Props>();
const router = useRouter();
const dashboardStore = useDashboardStore();

const emit = defineEmits([
  'edit-property',
  'toggle-favorite',
  'create-reminder',
]);

const searchTerm = ref('');
const sortBy = ref<string>('');
const sortOrder = ref<'asc' | 'desc'>('asc');

// Computed for filtered and sorted favorites
const sortedAndFilteredFavorites = computed(() => {
  let filtered = props.favorites;

  // Apply search filter
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    filtered = filtered.filter(
      property =>
        (property.nom_voie || '').toLowerCase().includes(term) ||
        (property.city || '').toLowerCase().includes(term) ||
        (property.owner || '').toLowerCase().includes(term) ||
        (property.property_type || '').toLowerCase().includes(term) ||
        (property.numero || '').toString().includes(term)
    );
  }

  // Apply sorting
  if (sortBy.value) {
    filtered = [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy.value) {
        case 'city':
          aValue = (a.city || '').toLowerCase();
          bValue = (b.city || '').toLowerCase();
          break;
        case 'price':
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case 'surface':
          aValue = a.surface || 0;
          bValue = b.surface || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder.value === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }

  return filtered;
});

const handleSortClick = (field: string) => {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = field;
    sortOrder.value = 'asc';
  }
};

const getPropertyTypeTagType = (propertyType: string | undefined) => {
  if (!propertyType) return '';

  switch (propertyType.toLowerCase()) {
    case 'maison':
      return 'success';
    case 'appartement':
      return 'info';
    case 'immeuble':
      return 'warning';
    case 'terrain':
      return 'danger';
    default:
      return '';
  }
};

const formatPrice = (price: number | undefined) => {
  if (!price) return 'Non renseigné';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
};

// Helper function to get city with fallback logic
const getPropertyCity = (property: any): string => {
  return (
    property.city ||
    (dashboardStore.selectedCity as any)?.city ||
    'Non renseigné'
  );
};
</script>

<style scoped>
.favorites-cards-container {
  padding: 16px 0;
}

.controls-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 8px;
  gap: 16px;
}

.search-container {
  flex: 1;
  max-width: 400px;
}

.search-input {
  border-radius: 12px;
}

:deep(.search-input .el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

:deep(.search-input .el-input__wrapper:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.search-input .el-input__wrapper.is-focus) {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

.sort-controls {
  display: flex;
  gap: 8px;
}

:deep(.sort-controls .el-button) {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
  padding: 0 8px;
}

.favorite-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid transparent;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
}

:deep(.favorite-card .el-card__body) {
  padding: 24px;
}

.favorite-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  border-color: #e2e8f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.address-info {
  flex: 1;
}

.address-title {
  margin: 0 0 6px 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
}

.city-name {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

.favorite-button {
  transition: all 0.3s ease;
}

.favorite-button:hover {
  transform: scale(1.1);
}

.card-divider {
  margin: 16px 0;
  border-color: #e2e8f0;
}

.property-details {
  margin: 16px 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.value {
  font-weight: 500;
  color: #1e293b;
  font-size: 14px;
}

.value.surface {
  color: #059669;
  font-weight: 600;
}

.value.price {
  color: #dc2626;
  font-weight: 600;
}

.type-tag {
  align-self: flex-start;
  font-weight: 500;
}

.card-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 12px;
}

.action-button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .favorites-grid {
    grid-template-columns: 1fr;
    padding: 0;
  }

  .controls-container {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .search-container {
    max-width: none;
  }

  .sort-controls {
    justify-content: center;
    flex-wrap: wrap;
  }

  .detail-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .card-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  :deep(.favorite-card .el-card__body) {
    padding: 16px;
  }

  .address-title {
    font-size: 16px;
  }
}
</style>
