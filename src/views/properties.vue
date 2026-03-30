<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue'
import { Plus, OfficeBuilding } from '@element-plus/icons-vue'
import { usePropertyStore } from '@/stores/property'
import PropertySearch from '@/components/PropertySearch.vue'
import PropertyDialog from '@/components/PropertyDialog.vue'
import UnitsDialog from '@/components/UnitsDialog.vue'
import type { Property } from 'types/property'

const store = usePropertyStore()

const showPropertyDialog = ref(false)
const showUnitsDialog = ref(false)
const selectedAddress = ref<Property.Address | null>(null)

onMounted(() => {
  store.fetchProperties()
})

const displayedProperties = computed(() => {
  return store.searchResults.length > 0 ? store.searchResults : store.properties
})

function openUnitsDialog(address: Property.Address) {
  selectedAddress.value = address
  showUnitsDialog.value = true
}

function formatPrice(price?: number): string {
  if (!price) return '-'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price)
}
</script>

<template>
  <section style="width: 100%; min-height: 100%;">
    <!-- Header -->
    <div class="page-header">
      <h2>Gestion des biens</h2>
      <ElButton type="primary" :icon="Plus" @click="showPropertyDialog = true">
        Nouveau bien
      </ElButton>
    </div>

    <!-- Search -->
    <div class="block shadow search-section">
      <PropertySearch />
    </div>

    <!-- Property list -->
    <div class="block shadow list-section">
      <el-table
        :data="displayedProperties"
        v-loading="store.loading"
        style="width: 100%"
        empty-text="Aucun bien trouvé"
      >
        <el-table-column label="Adresse" min-width="250">
          <template #default="{ row }">
            <div class="address-cell">
              <span
                v-if="row.address.is_building"
                class="address-link"
                @click="openUnitsDialog(row.address)"
              >
                <ElIcon class="building-icon"><OfficeBuilding /></ElIcon>
                {{ row.address.street_number }}
              </span>
              <span v-else>{{ row.address.street_number }}</span>
              {{ row.address.street_name }}, {{ row.address.city }} {{ row.address.postal_code }}
            </div>
            <div v-if="row.address.is_building" class="building-info">
              <el-tag size="small" type="info">Immeuble — {{ row.address.units_count }} unité(s)</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Propriétaire" min-width="180">
          <template #default="{ row }">
            <template v-if="row.owner">
              {{ row.owner.first_name }} {{ row.owner.last_name }}
            </template>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="Surface" width="100">
          <template #default="{ row }">
            {{ row.surface ? `${row.surface} m²` : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="Pièces" width="80" prop="rooms" />
        <el-table-column label="Prix" width="150">
          <template #default="{ row }">
            {{ formatPrice(row.price) }}
          </template>
        </el-table-column>
        <el-table-column label="Description" min-width="200" prop="description" show-overflow-tooltip />
      </el-table>
    </div>

    <!-- Property creation dialog -->
    <PropertyDialog
      v-model:show="showPropertyDialog"
      @created="store.fetchProperties()"
    />

    <!-- Units dialog -->
    <UnitsDialog
      v-model:show="showUnitsDialog"
      :address="selectedAddress"
    />
  </section>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.page-header h2 {
  margin: 0;
  font-size: 1.4rem;
}

.search-section {
  width: 100%;
  margin-bottom: 1rem;
}

.list-section {
  width: 100%;
}

.address-cell {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.address-link {
  color: var(--blue, #1890ff);
  cursor: pointer;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}

.address-link:hover {
  text-decoration: underline;
}

.building-icon {
  font-size: 0.9rem;
}

.building-info {
  margin-top: 0.25rem;
}

.text-muted {
  color: var(--gray, #999);
}
</style>
