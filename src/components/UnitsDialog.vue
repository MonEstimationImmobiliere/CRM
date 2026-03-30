<script lang="ts" setup>
import { ref, watch } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'
import { usePropertyStore } from '@/stores/property'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Property } from 'types/property'

const props = defineProps<{
  show: boolean
  address: Property.Address | null
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
}>()

const store = usePropertyStore()

const unitTypes: Property.UnitType[] = [
  'Appartement',
  'Local commercial',
  'Terrain',
  'Parking',
  'Dépendance'
]

const unitTypeTagMap: Record<Property.UnitType, string> = {
  'Appartement': '',
  'Local commercial': 'warning',
  'Terrain': 'success',
  'Parking': 'info',
  'Dépendance': 'success'
}

function getUnitTypeTag(unitType: Property.UnitType): string {
  return unitTypeTagMap[unitType] ?? ''
}

const showAddForm = ref(false)
const unitForm = ref<Property.UnitForm>({
  unit_number: '',
  floor: null,
  unit_type: 'Appartement'
})

watch(() => props.show, async (visible) => {
  if (visible && props.address?.id) {
    await store.fetchUnits(props.address.id)
  }
  if (!visible) {
    showAddForm.value = false
    resetForm()
  }
})

function resetForm() {
  unitForm.value = {
    unit_number: '',
    floor: null,
    unit_type: 'Appartement'
  }
}

async function submitUnit() {
  if (!unitForm.value.unit_number.trim()) {
    ElMessage.warning('Veuillez saisir un numéro d\'unité')
    return
  }
  if (unitForm.value.floor === null) {
    ElMessage.warning('Veuillez saisir un étage')
    return
  }
  if (!props.address?.id) return

  await store.addUnit(props.address.id, unitForm.value)
  ElMessage.success('Unité créée avec succès')
  showAddForm.value = false
  resetForm()
}

async function handleDeleteUnit(unit: Property.Unit) {
  try {
    await ElMessageBox.confirm(
      `Supprimer l'unité ${unit.unit_number} ?`,
      'Confirmation',
      { confirmButtonText: 'Supprimer', cancelButtonText: 'Annuler', type: 'warning' }
    )
    if (unit.id) {
      await store.removeUnit(unit.id)
      ElMessage.success('Unité supprimée')
    }
  } catch {
    // cancelled
  }
}

function getFloorLabel(floor: number): string {
  if (floor < 0) return `Sous-sol ${Math.abs(floor)}`
  if (floor === 0) return 'RDC'
  return `Étage ${floor}`
}

const addressLabel = () => {
  if (!props.address) return ''
  return `${props.address.street_number} ${props.address.street_name}, ${props.address.city}`
}
</script>

<template>
  <Dialog
    :show="props.show"
    width="50rem"
    height="65vh"
    @update:show="emit('update:show', $event)"
  >
    <template #modalHeader>
      <span>Unités — {{ addressLabel() }}</span>
      <ElButton type="primary" size="small" :icon="Plus" @click="showAddForm = !showAddForm">
        {{ showAddForm ? 'Annuler' : 'Ajouter une unité' }}
      </ElButton>
    </template>

    <!-- Add unit form -->
    <div v-if="showAddForm" class="unit-add-form">
      <ElForm :inline="true" @submit.prevent="submitUnit">
        <ElFormItem label="N° Unité">
          <ElInput v-model="unitForm.unit_number" placeholder="ex: A1" style="width: 100px" />
        </ElFormItem>
        <ElFormItem label="Étage">
          <el-input-number v-model="unitForm.floor" :min="-5" :max="50" style="width: 120px" />
        </ElFormItem>
        <ElFormItem label="Type">
          <el-select v-model="unitForm.unit_type" style="width: 180px">
            <el-option
              v-for="type in unitTypes"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="submitUnit">Créer</ElButton>
        </ElFormItem>
      </ElForm>
    </div>

    <!-- Units list -->
    <el-table :data="store.units" style="width: 100%" v-loading="store.loading" empty-text="Aucune unité">
      <el-table-column prop="unit_number" label="N° Unité" width="120" />
      <el-table-column label="Étage" width="120">
        <template #default="{ row }">
          {{ getFloorLabel(row.floor) }}
        </template>
      </el-table-column>
      <el-table-column label="Type" width="180">
        <template #default="{ row }">
          <el-tag
            :type="getUnitTypeTag(row.unit_type)"
            size="small"
          >
            {{ row.unit_type }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="Date de création" />
      <el-table-column label="Actions" width="100" align="center">
        <template #default="{ row }">
          <ElButton type="danger" size="small" :icon="Delete" circle @click="handleDeleteUnit(row)" />
        </template>
      </el-table-column>
    </el-table>

    <template #modalFooter>
      <span class="footer-info">{{ store.units.length }} unité(s)</span>
      <ElButton @click="emit('update:show', false)">Fermer</ElButton>
    </template>
  </Dialog>
</template>

<style scoped>
.unit-add-form {
  padding: 0.75rem;
  margin-bottom: 1rem;
  background: var(--light-gray, #f6f6f6);
  border-radius: 0.5rem;
}

.footer-info {
  color: var(--gray, #999);
  font-size: 0.85rem;
}
</style>
