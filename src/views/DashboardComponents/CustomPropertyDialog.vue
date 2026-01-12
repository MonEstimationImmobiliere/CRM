<template>
  <el-dialog
    v-model="dialogVisible"
    title="Créer une propriété personnalisée"
    width="600px"
    :before-close="handleClose"
    append-to-body
  >
    <div class="custom-property-form">
      <el-alert
        title="Adresse non trouvée"
        type="info"
        description="Cette adresse n'existe pas dans notre base de données. Vous pouvez créer une propriété personnalisée qui sera liée à votre compte."
        show-icon
        :closable="false"
        class="mb-4"
      />

      <el-form :model="formData" label-width="140px" :rules="rules" ref="formRef">
        <!-- Informations d'adresse -->
        <el-card class="mb-4">
          <template #header>
            <span>Informations d'adresse</span>
          </template>
          
          <el-form-item label="Numéro" prop="numero">
            <el-input v-model="formData.numero" placeholder="Ex: 123" />
          </el-form-item>

          <el-form-item label="Répétition">
            <el-input v-model="formData.rep" placeholder="Ex: bis, ter" />
          </el-form-item>

          <el-form-item label="Nom de la voie" prop="nom_voie">
            <el-input v-model="formData.nom_voie" readonly />
          </el-form-item>

          <el-form-item label="Appartement">
            <el-input v-model="formData.numero_appartement" placeholder="Ex: A, B, 101" />
          </el-form-item>

          <el-form-item label="Code postal" prop="code_postal">
            <el-input v-model="formData.code_postal" readonly />
          </el-form-item>

          <el-form-item label="Commune" prop="city">
            <el-input v-model="formData.city" readonly />
          </el-form-item>
        </el-card>

        <!-- Informations du propriétaire -->
        <el-card class="mb-4">
          <template #header>
            <span>Informations du propriétaire</span>
          </template>
          
          <el-form-item label="Nom du propriétaire" prop="owner">
            <el-input v-model="formData.owner" placeholder="Nom complet du propriétaire" />
          </el-form-item>

          <el-form-item label="Email" prop="email">
            <el-input v-model="formData.email" type="email" placeholder="email@exemple.com" />
          </el-form-item>

          <el-form-item label="Téléphone" prop="phone">
            <el-input v-model="formData.phone" placeholder="06 12 34 56 78" />
          </el-form-item>
        </el-card>

        <!-- Informations de base de la propriété -->
        <el-card class="mb-4">
          <template #header>
            <span>Informations de base</span>
          </template>
          
          <el-form-item label="Type de bien" prop="property_type">
            <el-select v-model="formData.property_type" placeholder="Sélectionner le type">
              <el-option label="Appartement" value="appartement" />
              <el-option label="Maison" value="maison" />
              <el-option label="Studio" value="studio" />
              <el-option label="Local commercial" value="local_commercial" />
              <el-option label="Terrain" value="terrain" />
              <el-option label="Autre" value="autre" />
            </el-select>
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Surface (m²)" prop="surface">
                <el-input-number v-model="formData.surface" :min="1" :max="10000" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Terrain (m²)">
                <el-input-number v-model="formData.area" :min="0" :max="100000" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Nombre de chambres">
                <el-input-number v-model="formData.bedrooms" :min="0" :max="20" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Nombre de SDB">
                <el-input-number v-model="formData.bathrooms" :min="0" :max="10" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <el-form-item label="Commentaires">
          <el-input
            v-model="formData.comment"
            type="textarea"
            :rows="3"
            placeholder="Informations supplémentaires sur cette propriété..."
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">Annuler</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          Créer la propriété
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElDialog, ElForm, ElFormItem, ElInput, ElInputNumber, ElSelect, ElOption, ElButton, ElCard, ElAlert, ElRow, ElCol, ElMessage } from 'element-plus'
import { useDashboardStore } from '@/stores/dashboard'
import { usePropertyStore } from '@/stores/propertyHome'
import { PropertyService } from '@/api/property.service'
import type { PropertyData } from '@/types/property'

const dashboardStore = useDashboardStore()
  const { selectedCity } = useDashboardStore();

const propertyStore = usePropertyStore()

const formRef = ref()
const saving = ref(false)

const dialogVisible = computed({
  get: () => dashboardStore.showCustomPropertyDialog,
  set: (value) => {
    if (!value) {
      dashboardStore.closeCustomPropertyDialog()
    }
  }
})

const formData = ref<PropertyData>({
  id_fantoir_long: '',
  id_fantoir: '',
  owner: '',
  email: '',
  phone: '',
  property_type: '',
  year_built: new Date().getFullYear(),
  year_buy: new Date().getFullYear(),
  surface: 0,
  area: 0,
  orientation: '',
  property_condition: '',
  bedrooms: 0,
  bathrooms: 0,
  fitted_kitchen: false,
  equipped_kitchen: false,
  american_kitchen: false,
  scullery: false,
  heating_type: '',
  window: '',
  window_type: '',
  shutter: '',
  cheminee: false,
  district_heating: false,
  patio: false,
  Garage: false,
  pool: false,
  veranda: false,
  garden: false,
  parking: false,
  Carport: false,
  kitchen_ext: false,
  elevator: false,
  balcony: false,
  cellar: false,
  bike_room: false,
  guardian: false,
  roof: '',
  adjoining: false,
  basement: false,
  dependency: false,
  ground: false,
  comment: '',
  date_rappel: null,
  comment_rappel: '',
  numero: '',
  rep: '',
  nom_voie: '',
  numero_appartement: '',
  code_postal: '',
  city: '',
  is_custom: true
})

const rules = {
  owner: [
    { required: true, message: 'Le nom du propriétaire est requis', trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'L\'email est requis', trigger: 'blur' },
    { type: 'email' as const, message: 'Format d\'email invalide', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: 'Le téléphone est requis', trigger: 'blur' }
  ],
  property_type: [
    { required: true, message: 'Le type de bien est requis', trigger: 'change' }
  ],
  surface: [
    { required: true, message: 'La surface est requise', trigger: 'blur' },
    { type: 'number' as const, min: 1, message: 'La surface doit être supérieure à 0', trigger: 'blur' }
  ]
}

// Pré-remplir les informations d'adresse à partir de la recherche
watch(() => dashboardStore.showCustomPropertyDialog, (newValue) => {
  if (newValue) {
    const searchParams = dashboardStore.lastSearchParams
    if (searchParams) {
      formData.value.nom_voie = searchParams.street?.value || ''
      formData.value.code_postal = searchParams.city?.value || ''
      formData.value.city = searchParams.city?.value || ''
      // L'id_fantoir_long sera généré par le store en fonction des données saisies
      formData.value.id_fantoir_long = ''
    }
  }
})

const handleClose = () => {
  dashboardStore.closeCustomPropertyDialog()
  resetForm()
}

const resetForm = () => {
  formRef.value?.resetFields()
  formData.value = {
    id_fantoir_long: '',
    id_fantoir: '',
    owner: '',
    email: '',
    phone: '',
    property_type: '',
    year_built: new Date().getFullYear(),
    year_buy: new Date().getFullYear(),
    surface: 0,
    area: 0,
    orientation: '',
    property_condition: '',
    bedrooms: 0,
    bathrooms: 0,
    fitted_kitchen: false,
    equipped_kitchen: false,
    american_kitchen: false,
    scullery: false,
    heating_type: '',
    window: '',
    window_type: '',
    shutter: '',
    cheminee: false,
    district_heating: false,
    patio: false,
    Garage: false,
    pool: false,
    veranda: false,
    garden: false,
    parking: false,
    Carport: false,
    kitchen_ext: false,
    elevator: false,
    balcony: false,
    cellar: false,
    bike_room: false,
    guardian: false,
    roof: '',
    adjoining: false,
    basement: false,
    dependency: false,
    ground: false,
    comment: '',
    date_rappel: null,
    comment_rappel: '',
    numero: '',
    rep: '',
    nom_voie: '',
    numero_appartement: '',
    code_postal: '',
    city: '',
    is_custom: true
  }
}

const handleSave = async () => {
  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    saving.value = true
    console.log('Données du formulaire:', formData.value)

    formData.value.city = selectedCity?.value || '';

    // Créer la propriété personnalisée via le store dashboard
    const createdProperty = await dashboardStore.createCustomProperty({
      ...formData.value,
      favorite: formData.value.favorite ? 'true' : undefined
    } as any)
    
    ElMessage.success('Propriété personnalisée créée avec succès!')
    
    // Fermer le dialog
    handleClose()
    
    // Optionnellement, ouvrir le dialog de propriété pour éditer plus de détails
    propertyStore.selectProperty(createdProperty)
    
  } catch (error) {
    console.error('Erreur lors de la création de la propriété:', error)
    ElMessage.error('Erreur lors de la création de la propriété')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.custom-property-form {
  max-height: 70vh;
  overflow-y: auto;
}

.mb-4 {
  margin-bottom: 1rem;
}

:deep(.el-card__header) {
  background-color: #f5f7fa;
  font-weight: 600;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}
</style>
