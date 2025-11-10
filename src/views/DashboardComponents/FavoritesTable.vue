<template>
  <div class="favorites-table-container">
    <el-table 
      :data="favorites" 
      class="modern-favorites-table"
      :default-sort="{ prop: 'numero', order: 'ascending' }"
      height="79vh" 
      :row-class-name="getRowClass"
      @row-click="handleRowClick"
      empty-text="Aucune propriété favorite trouvée"
    >
      <!-- Action Column with Favorite Button -->
      <el-table-column width="60" align="center">
        <template #default="{ row }">
          <el-button 
            type="danger" 
            size="small" 
            circle
            @click.stop="$emit('toggle-favorite', row)"
            title="Retirer des favoris"
          >
            <el-icon><StarFilled /></el-icon>
          </el-button>
        </template>
      </el-table-column>

      <!-- City Column -->
      <el-table-column label="Ville" prop="city" sortable min-width="120">
        <template #default="{ row }">
          <div class="city-info">
            <span class="city-name">{{ row.city || 'Non renseigné' }}</span>
          </div>
        </template>
      </el-table-column>

      <!-- Address Number Column -->
      <el-table-column label="N°" prop="numero" sortable min-width="80">
        <template #default="{ row }">
          <span class="address-number">{{ row.numero || '-' }}</span>
        </template>
      </el-table-column>

      <!-- Street Name Column -->
      <el-table-column label="Rue" prop="nom_voie" sortable min-width="200">
        <template #default="{ row }">
          <div class="street-info">
            <span class="street-name">{{ row.nom_voie || 'Non renseigné' }}</span>
          </div>
        </template>
      </el-table-column>

      <!-- Property Type Column -->
      <el-table-column label="Type" prop="property_type" sortable min-width="120">
        <template #default="{ row }">
          <div class="property-type">
            <el-tag 
              :type="getPropertyTypeTagType(row.property_type)"
              size="small"
              round
            >
              {{ row.property_type || 'Non renseigné' }}
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <!-- Owner Column -->
      <el-table-column label="Propriétaire" prop="owner" sortable min-width="150">
        <template #default="{ row }">
          <div class="owner-info">
            <span class="owner-name">{{ row.owner || 'Non renseigné' }}</span>
          </div>
        </template>
      </el-table-column>

      <!-- Surface Column -->
      <el-table-column label="Surface" prop="surface" sortable min-width="100">
        <template #default="{ row }">
          <div class="surface-info">
            <span class="surface-value">{{ row.surface || 0 }} m²</span>
          </div>
        </template>
      </el-table-column>

      <!-- Price Column -->
      <el-table-column label="Prix estimé" prop="price" sortable min-width="120">
        <template #default="{ row }">
          <div class="price-info">
            <span class="price-value">{{ formatPrice(row.price) }}</span>
          </div>
        </template>
      </el-table-column>

      <!-- Actions Column -->
      <el-table-column label="Actions" width="160" align="center">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button 
              type="primary" 
              size="small" 
              @click.stop="$emit('edit-property', row)"
              title="Modifier la propriété"
            >
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button 
              type="success" 
              size="small" 
              @click.stop="$emit('create-reminder', row)"
              title="Créer un rappel"
            >
              <el-icon><Plus /></el-icon>
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { StarFilled, Edit, Plus } from '@element-plus/icons-vue';

interface Props {
  favorites: any[];
}

defineProps<Props>();

const emit = defineEmits(['edit-property', 'toggle-favorite', 'create-reminder']);

const getRowClass = () => {
  return 'favorite-row';
};

const handleRowClick = (row: any) => {
  emit('edit-property', row);
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
    maximumFractionDigits: 0
  }).format(price);
};
</script>

<style scoped>
.favorites-table-container {
  padding: 16px 0;
}

.modern-favorites-table {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

:deep(.el-table) {
  border-radius: 12px;
}

:deep(.el-table tr) {
background-color: transparent;
}

:deep(.el-table__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

:deep(.el-table__header th) {
  background: transparent !important;
  color: white;
  font-weight: 600;
  border: none;
  padding: 16px 12px;
}

:deep(.el-table__body tr:hover) {
  background-color: #f8fafc;
}

:deep(.favorite-row) {
  transition: all 0.3s ease;
  cursor: pointer;
}

:deep(.favorite-row:hover) {
  background-color: #f1f5f9 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

:deep(.el-table__body td) {
  padding: 16px 12px;
  border-bottom: 1px solid #e2e8f0;
}

.city-info,
.street-info,
.owner-info,
.surface-info,
.price-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.city-name,
.street-name,
.owner-name {
  font-weight: 500;
  color: #1e293b;
}

.address-number {
  font-weight: 600;
  color: #3b82f6;
  font-size: 16px;
}

.surface-value,
.price-value {
  font-weight: 500;
  color: #059669;
}

.property-type {
  display: flex;
  justify-content: flex-start;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

:deep(.el-button) {
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

:deep(.el-tag) {
  font-weight: 500;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .modern-favorites-table {
    font-size: 14px;
  }
  
  :deep(.el-table__body td) {
    padding: 12px 8px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
