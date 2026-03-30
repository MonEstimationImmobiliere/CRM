<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { usePropertyStore } from '@/stores/property'
import { ElMessage } from 'element-plus'
import type { Property } from 'types/property'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'created', property: Property.PropertyItem): void
}>()

const store = usePropertyStore()

const defaultForm = (): Property.PropertyForm => ({
  street_number: '',
  street_name: '',
  city: '',
  postal_code: '',
  is_building: false,
  units_count: 0,
  owner_first_name: '',
  owner_last_name: '',
  owner_email: '',
  owner_phone: '',
  description: '',
  surface: null,
  rooms: null,
  price: null
})

const form = ref<Property.PropertyForm>(defaultForm())
const submitting = ref(false)

watch(() => props.show, (visible) => {
  if (!visible) {
    form.value = defaultForm()
  }
})

const isFormValid = computed(() => {
  return (
    form.value.street_number.trim() !== '' &&
    form.value.street_name.trim() !== '' &&
    form.value.city.trim() !== '' &&
    form.value.postal_code.trim() !== ''
  )
})

async function handleSubmit() {
  if (!isFormValid.value) {
    ElMessage.warning('Veuillez remplir les champs d\'adresse obligatoires')
    return
  }
  submitting.value = true
  try {
    const res = await store.addProperty(form.value)
    if (res?.data) {
      ElMessage.success('Bien créé avec succès')
      emit('created', res.data)
      emit('update:show', false)
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Dialog
    :show="props.show"
    width="55rem"
    height="75vh"
    @update:show="emit('update:show', $event)"
  >
    <template #modalHeader>
      <span>Nouveau bien immobilier</span>
    </template>

    <ElForm label-position="top" @submit.prevent="handleSubmit">
      <!-- Section Adresse -->
      <div class="form-section">
        <h3 class="form-section-title">Adresse</h3>
        <div class="form-row">
          <ElFormItem label="N° de rue" class="form-item-small" required>
            <ElInput v-model="form.street_number" placeholder="12" />
          </ElFormItem>
          <ElFormItem label="Nom de rue" class="form-item-large" required>
            <ElInput v-model="form.street_name" placeholder="Rue de la Paix" />
          </ElFormItem>
        </div>
        <div class="form-row">
          <ElFormItem label="Ville" class="form-item-large" required>
            <ElInput v-model="form.city" placeholder="Paris" />
          </ElFormItem>
          <ElFormItem label="Code postal" class="form-item-small" required>
            <ElInput v-model="form.postal_code" placeholder="75002" />
          </ElFormItem>
        </div>
        <!-- Copropriété / Immeuble -->
        <div class="form-row building-row">
          <ElFormItem>
            <ElCheckbox v-model="form.is_building" label="Immeuble (copropriété)" />
          </ElFormItem>
          <ElFormItem v-if="form.is_building" label="Nombre d'unités" class="form-item-small">
            <el-input-number v-model="form.units_count" :min="0" :max="999" />
          </ElFormItem>
        </div>
      </div>

      <!-- Section Propriétaire -->
      <div class="form-section">
        <h3 class="form-section-title">Propriétaire</h3>
        <div class="form-row">
          <ElFormItem label="Prénom" class="form-item-half">
            <ElInput v-model="form.owner_first_name" placeholder="Jean" />
          </ElFormItem>
          <ElFormItem label="Nom" class="form-item-half">
            <ElInput v-model="form.owner_last_name" placeholder="Dupont" />
          </ElFormItem>
        </div>
        <div class="form-row">
          <ElFormItem label="Email" class="form-item-half">
            <ElInput v-model="form.owner_email" placeholder="jean.dupont@email.com" type="email" />
          </ElFormItem>
          <ElFormItem label="Téléphone" class="form-item-half">
            <ElInput v-model="form.owner_phone" placeholder="0612345678" />
          </ElFormItem>
        </div>
      </div>

      <!-- Section Détails du bien -->
      <div class="form-section">
        <h3 class="form-section-title">Détails du bien</h3>
        <ElFormItem label="Description">
          <ElInput v-model="form.description" type="textarea" :rows="3" placeholder="Description du bien..." />
        </ElFormItem>
        <div class="form-row">
          <ElFormItem label="Surface (m²)" class="form-item-third">
            <el-input-number v-model="form.surface" :min="0" :max="99999" />
          </ElFormItem>
          <ElFormItem label="Pièces" class="form-item-third">
            <el-input-number v-model="form.rooms" :min="0" :max="99" />
          </ElFormItem>
          <ElFormItem label="Prix (€)" class="form-item-third">
            <el-input-number v-model="form.price" :min="0" :step="1000" />
          </ElFormItem>
        </div>
      </div>
    </ElForm>

    <template #modalFooter>
      <ElButton @click="emit('update:show', false)">Annuler</ElButton>
      <ElButton
        type="primary"
        :loading="submitting"
        :disabled="!isFormValid"
        @click="handleSubmit"
      >
        Créer le bien
      </ElButton>
    </template>
  </Dialog>
</template>

<style scoped>
.form-section {
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.form-section:last-child {
  border-bottom: none;
}

.form-section-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #333;
}

.form-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.form-item-small {
  flex: 0 0 120px;
}

.form-item-large {
  flex: 1;
  min-width: 200px;
}

.form-item-half {
  flex: 1;
  min-width: 200px;
}

.form-item-third {
  flex: 1;
  min-width: 150px;
}

.building-row {
  align-items: center;
  margin-top: 0.5rem;
}
</style>
