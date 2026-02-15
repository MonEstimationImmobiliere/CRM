<template>
  <div class="real-estate-listings">
    <div class="search-sort-container">
      <div class="search-container">
        <el-input
          v-model="searchTerm"
          placeholder="Recherche par adresse..."
          class="search-input"
        >
          <template #prefix>
            <el-icon class="search-icon"><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <div class="sort-buttons">
        <el-button
          :type="sortBy === 'price' ? 'primary' : 'default'"
          size="small"
          @click="handleSortClick('price')"
        >
          Prix
          <el-icon class="sort-icon"><Sort /></el-icon>
        </el-button>

        <el-button
          :type="sortBy === 'size' ? 'primary' : 'default'"
          size="small"
          @click="handleSortClick('size')"
        >
          Surface
          <el-icon class="sort-icon"><Sort /></el-icon>
        </el-button>

        <el-button
          :type="sortBy === 'bedrooms' ? 'primary' : 'default'"
          size="small"
          @click="handleSortClick('bedrooms')"
        >
          Chambres
          <el-icon class="sort-icon"><Sort /></el-icon>
        </el-button>
      </div>
    </div>

    <div class="property-grid">
      <el-card
        v-for="property in sortedProperties"
        :key="property.id_fantoir"
        class="property-card"
        :body-style="{ padding: '0px' }"
        shadow="hover"
      >
        <!--<img
  :src="getStreetViewUrl(property)"


  alt="Vue Street"
  style="width: 100%; height: 200px; object-fit: cover;"
>-->

        <div class="property-content">
          <el-tag type="danger" class="price-tag"
            >{{ property.dernier_prix_vente }} €</el-tag
          >
          <div class="property-header">
            <div class="property-address">
              <el-icon><Location /></el-icon>
              <h3>
                {{ property.code_postal + ' ' + property.nom_commune }} <br />
                {{ property.numero + ' ' + property.nom_voie }}
              </h3>
            </div>

            <div class="property-features">
              <div class="feature">
                <el-icon><House /></el-icon>
                <span>{{ property.bedrooms }} Beds</span>
              </div>

              <div class="feature">
                <el-icon><ToiletPaper /></el-icon>
                <span>{{ property.bathrooms }} Baths</span>
              </div>

              <div class="feature">
                <el-icon><OfficeBuilding /></el-icon>
                <span>{{ property.surface }} m2</span>
              </div>
            </div>
          </div>

          <el-divider />

          <div class="property-details">
            <div class="detail-grid">
              <div class="detail-item">
                <p class="detail-label">type_bien</p>
                <p class="detail-value">{{ property.type_bien }}</p>
              </div>

              <div class="detail-item">
                <p class="detail-label">date_derniere_vente</p>
                <p class="detail-value">{{ property.date_derniere_vente }}</p>
              </div>

              <div class="detail-item">
                <p class="detail-label">surface</p>
                <p class="detail-value">{{ property.surface }}</p>
              </div>

              <!-- <div class="detail-item">
                  <p class="detail-label">Garage</p>
                  <p class="detail-value">{{ property.garage }}</p>
                </div> -->
            </div>
          </div>

          <el-divider />

          <div class="price-history">
            <p class="history-title">
              <el-icon><Timer /></el-icon> Price History
            </p>
            <div class="history-items">
              <div class="history-item">
                <span>{{ property.date_derniere_vente }}</span>
                <span class="history-price">{{
                  property.dernier_prix_vente
                }}</span>
              </div>
            </div>
          </div>

          <div class="card-actions">
            <el-button
              @click.stop="toggleFavorite(String(property.id_fantoir_long))"
              :type="
                isFavorite(String(property.id_fantoir_long))
                  ? 'warning'
                  : 'default'
              "
              size="small"
              circle
            >
              <el-icon>
                <StarFilled
                  v-if="isFavorite(String(property.id_fantoir_long))"
                />
                <Star v-else />
              </el-icon>
            </el-button>
            <el-button
              type="primary"
              class="view-details-button"
              @click="emit('edit-property', property)"
            >
              View Details
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <div v-if="sortedProperties.length === 0" class="no-results">
      <p>No properties found matching your search criteria.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Search,
  Sort,
  Location,
  House,
  ToiletPaper,
  OfficeBuilding,
  Timer,
  Star,
  StarFilled,
} from '@element-plus/icons-vue';
import { usePropertyStore } from '@/stores/propertyHome';
import { ElMessage } from 'element-plus';
import type { IAddressDetail } from '@/types/address';

const store = usePropertyStore();

const props = defineProps<{
  addresses: IAddressDetail[];
}>();

// const emit = defineEmits<{
//   (e: 'edit-property', propertyId: number): void;
// }>()

const emit = defineEmits(['edit-property']);

const searchTerm = ref('');
const sortBy = ref<'price' | 'size' | 'bedrooms'>('price');
const sortOrder = ref<'asc' | 'desc'>('desc');

const filteredProperties = computed(() => {
  return props.addresses.filter(
    property =>
      property.numero.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      property.type_bien.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

const sortedProperties = computed(() => {
  return [...filteredProperties.value].sort((a, b) => {
    let comparison = 0;

    if (sortBy.value === 'price') {
      comparison = (a.dernier_prix_vente ?? 0) - (b.dernier_prix_vente ?? 0);
    } else if (sortBy.value === 'size') {
      comparison = (a.surface ?? 0) - (b.surface ?? 0);
    } else if (sortBy.value === 'bedrooms') {
      comparison = (a.bedrooms ?? 0) - (b.bedrooms ?? 0);
    }

    return sortOrder.value === 'asc' ? comparison : -comparison;
  });
});

const handleSortClick = (criteria: 'price' | 'size' | 'bedrooms'): void => {
  if (sortBy.value === criteria) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = criteria;
    sortOrder.value = 'desc';
  }
};

// Gestion des favoris
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
      message: 'Erreur lors de la modification des favoris',
      type: 'error',
      duration: 3000,
    });
  }
};

const isFavorite = (propertyId: string): boolean => {
  return store.isFavorite(propertyId);
};

// const onImageError = (event: Event) => {
//   const target = event.target as HTMLImageElement;
//   const fallback = target.getAttribute('data-fallback');
//   if (fallback && target.src !== fallback) {
//     target.src = fallback;
//   }
// };

// const getStreetViewUrl = (property: any): string => {
//   const address = `${property.numero} ${property.nom_voie}, ${property.code_postal} ${property.nom_commune}`;
//   const encodedAddress = encodeURIComponent(address);
//   const apiKey = 'AIzaSyCCtzXZLQQLM6edZnbCPjWViCwS_ttYDFU'; // Remplace par ta vraie clé API

//   return `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${encodedAddress}&key=${apiKey}`;
// };
</script>

<style scoped>
.real-estate-listings {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.search-sort-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  margin-bottom: 8px;
}

@media (min-width: 640px) {
  .search-sort-container {
    flex-direction: row;
    justify-content: space-between;
  }
}

.search-container {
  position: relative;
  width: 100%;
}

@media (min-width: 640px) {
  .search-container {
    width: auto;
  }
}

.search-input {
  width: 100%;
}

@media (min-width: 640px) {
  .search-input {
    width: 300px;
  }
}

.sort-buttons {
  display: flex;
  gap: 8px;
  width: 100%;
}

@media (min-width: 640px) {
  .sort-buttons {
    width: auto;
  }
}

.sort-icon {
  margin-left: 8px;
}

.property-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 24px;
}

@media (min-width: 768px) {
  .property-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 850px) {
  .property-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1290px) {
  .property-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1590px) {
  .property-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.property-card {
  overflow: hidden;
  transition: all 0.3s;
  background-color: #fafafa;
  border-radius: 12px;
  /* border: 1px solid #337ecc; */
}

.property-image-container {
  position: relative;
  height: 200px;
  width: 100%;
}

.property-image {
  height: 100%;
  width: 100%;
  object-fit: cover;
}

.price-tag {
  position: absolute;
  top: 12px;
  right: 12px;
  font-weight: bold;
}

.property-content {
  padding: 24px;
  position: relative;
}

.property-header {
  /* margin-bottom: 16px; */
}

.property-address {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.property-address h3 {
  font-weight: 500;
  line-height: 1.2;
  margin: 0;
}

.property-features {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 14px;
}

.feature {
  display: flex;
  align-items: center;
  gap: 4px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.detail-label {
  font-size: 12px;
  color: #909399;
  margin: 0 0 4px 0;
}

.detail-value {
  font-size: 14px;
  margin: 0;
}

.price-history {
  /* margin-top: 8px; */
}

.history-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.history-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.history-price {
  font-weight: 500;
}

.view-details-button {
  flex: 1;
  margin-top: 4px;
}

.card-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.no-results {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

.search-icon {
  font-size: 20px;
  color: #000;
}
</style>
