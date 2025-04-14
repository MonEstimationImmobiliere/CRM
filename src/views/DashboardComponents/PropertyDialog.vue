<script setup lang="ts">
import { computed, watch } from "vue";
import { ElDialog, ElForm, ElIcon, ElFormItem, ElInput, ElInputNumber, ElRadioGroup, ElRadioButton, ElCheckbox, ElRow, ElCol, ElButton, ElSelect, ElOption, ElCard, ElDrawer } from "element-plus";
import { usePropertyStore } from "../../stores/propertyHome";
import { CircleCloseFilled } from "@element-plus/icons-vue";

const store = usePropertyStore();

const visible = computed({
  get: () => store.isDialogVisible,
  set: (value) => store.setDialogVisible(value),
});

const isEditing = computed(() => !!store.selectedProperty?.id);

const dialogTitle = computed(() => {
  if (!store.selectedProperty) return "Nouvelle propriété";
  return `${store.selectedProperty.id ? "Modifier" : "Nouvelle"} propriété`;
});

const emailFormatter = (value: string) => value.toLowerCase();
const emailParser = (value: string) => value.trim();

const phoneFormatter = (value: string) => value.replace(/\D/g, "").replace(/(\d{2})(?=\d)/g, "$1 ");
const phoneParser = (value: string) => value.replace(/\D/g, "").substring(0, 10);

const closeDialog = () => {
  store.setDialogVisible(false);
  store.selectProperty(null);
};

const saveProperty = () => {
  if (store.selectedProperty) {
    if (isEditing.value) {
      store.updateProperty(store.selectedProperty);
    } else {
      store.addProperty(store.selectedProperty);
    }
    closeDialog();
  }
};
</script>

<template>
   <el-drawer v-model="visible" size="40%" :style="{ borderRadius: '10px', height: '98%', bottom: 0, top: 'unset',  '--el-drawer-padding-primary': '0'  }">

    <template #header="{ titleId }">
      <div class="headerContainer">
        <div></div>
        <h4 :id="titleId" class="titleHeader">{{ dialogTitle }}</h4>
        <div></div>
      </div>
    </template>

    <el-form v-if="store.selectedProperty" :model="store.selectedProperty" label-width="180px" class="property-form" >
      <!-- Contact Information Card -->
      <el-card shadow="hover">
        <h3 class="card-title">Informations de contact</h3>
        <div class="card-content">
          <el-form-item label="Propriétaire">
            <el-input v-model="store.selectedProperty.owner" size="large" />
          </el-form-item>

          <el-form-item label="Mail">
            <el-input v-model="store.selectedProperty.email" size="large" :formatter="emailFormatter" :parser="emailParser" />
          </el-form-item>

          <el-form-item label="Téléphone">
            <el-input v-model="store.selectedProperty.phone" size="large" :formatter="phoneFormatter" :parser="phoneParser" />
          </el-form-item>
        </div>
      </el-card>

      <!-- Basic Property Information Card -->
      <div class="form-card">
        <h3 class="card-title">Informations principales</h3>
        <div class="card-content">
          <el-form-item label="Type de bien">
            <el-radio-group v-model="store.selectedProperty.property_type" size="large">
              <el-radio-button label="Maison">Maison</el-radio-button>
              <el-radio-button label="Appartement">Appartement</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <el-form-item label="Année de construction">
              <el-input-number v-model="store.selectedProperty.year_built" :min="1800" :max="new Date().getFullYear()" size="large" class="w-full" />
            </el-form-item>

            <el-form-item label="Année d'acquisition">
              <el-input-number v-model="store.selectedProperty.year_buy" :min="1800" :max="new Date().getFullYear()" size="large" class="w-full" />
            </el-form-item>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <el-form-item label="Surface habitable">
              <el-input-number v-model="store.selectedProperty.surface" :min="0" :precision="2" :step="1" size="large" class="w-full">
                <template #suffix>m²</template>
              </el-input-number>
            </el-form-item>

            <el-form-item label="Surface du terrain">
              <el-input-number v-model="store.selectedProperty.area" :min="0" :precision="2" :step="1" size="large" class="w-full">
                <template #suffix>m²</template>
              </el-input-number>
            </el-form-item>
          </div>
        </div>
      </div>

      <!-- Property Details Card -->
      <div class="form-card">
        <h3 class="card-title">Caractéristiques</h3>
        <div class="card-content">
          <el-form-item label="Orientation">
            <el-radio-group v-model="store.selectedProperty.orientation" size="large">
              <el-radio-button label="Nord">Nord</el-radio-button>
              <el-radio-button label="Sud">Sud</el-radio-button>
              <el-radio-button label="Est">Est</el-radio-button>
              <el-radio-button label="Ouest">Ouest</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="État général">
            <el-radio-group v-model="store.selectedProperty.property_condition" size="large">
              <el-radio-button label="Travaux à réaliser">Travaux à réaliser</el-radio-button>
              <el-radio-button label="Rafraichissement">Rafraichissement</el-radio-button>
              <el-radio-button label="Pas de travaux">Pas de travaux</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <el-form-item label="Chambres">
              <el-input-number v-model="store.selectedProperty.bedrooms" :min="0" size="large" class="w-full" />
            </el-form-item>

            <el-form-item label="Salles de bains">
              <el-input-number v-model="store.selectedProperty.bathrooms" :min="0" size="large" class="w-full" />
            </el-form-item>
          </div>
        </div>
      </div>

      <!-- Kitchen Features Card -->
      <div class="form-card">
        <h3 class="card-title">Cuisine</h3>
        <div class="card-content grid grid-cols-2 gap-4">
          <el-checkbox v-model="store.selectedProperty.fitted_kitchen" label="Cuisine aménagée" size="large" />
          <el-checkbox v-model="store.selectedProperty.equipped_kitchen" label="Cuisine équipée" size="large" />
          <el-checkbox v-model="store.selectedProperty.american_kitchen" label="Cuisine américaine" size="large" />
          <el-checkbox v-model="store.selectedProperty.scullery" label="Arrière-cuisine" size="large" />
        </div>
      </div>

      <!-- Heating and Windows Card -->
      <div class="form-card">
        <h3 class="card-title">Chauffage et Fenêtres</h3>
        <div class="card-content">
          <el-form-item label="Type de chauffage">
            <el-select v-model="store.selectedProperty.heating_type" size="large" class="w-full">
              <el-option value="fuel" label="Fuel" />
              <el-option value="elec" label="Électricité (radiateur)" />
              <el-option value="pompe_a_chaleur" label="Pompe à chaleur" />
              <el-option value="gaz" label="Gaz" />
              <el-option value="cheminee" label="Cheminée" />
              <el-option value="poele" label="Poêle" />
            </el-select>
          </el-form-item>

          <el-form-item label="Type de fenêtres">
            <el-radio-group v-model="store.selectedProperty.window" size="large">
              <el-radio-button label="Simple">Simple vitrage</el-radio-button>
              <el-radio-button label="Double">Double vitrage</el-radio-button>
              <el-radio-button label="Triple">Triple vitrage</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="Matériau fenêtres">
            <el-radio-group v-model="store.selectedProperty.window_type" size="large">
              <el-radio-button label="PVC">PVC</el-radio-button>
              <el-radio-button label="Bois">Bois</el-radio-button>
              <el-radio-button label="Aluminium">Aluminium</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="Type de volets">
            <el-radio-group v-model="store.selectedProperty.shutter" size="large">
              <el-radio-button label="roulant_elec">Électrique</el-radio-button>
              <el-radio-button label="roulant_manuel">Manuel</el-radio-button>
              <el-radio-button label="battant">À battant</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </div>
      </div>

      <!-- Amenities Card -->
      <div class="form-card">
        <h3 class="card-title">Équipements et Commodités</h3>
        <div class="card-content grid grid-cols-2 md:grid-cols-3 gap-4">
          <el-checkbox v-model="store.selectedProperty.cheminee" label="Cheminée d'appoint" size="large" />
          <el-checkbox v-model="store.selectedProperty.district_heating" label="Chauffage collectif" size="large" />
          <el-checkbox v-model="store.selectedProperty.patio" label="Terrasse" size="large" />
          <el-checkbox v-model="store.selectedProperty.Garage" label="Garage" size="large" />
          <el-checkbox v-model="store.selectedProperty.pool" label="Piscine" size="large" />
          <el-checkbox v-model="store.selectedProperty.veranda" label="Véranda" size="large" />
          <el-checkbox v-model="store.selectedProperty.garden" label="Jardin" size="large" />
          <el-checkbox v-model="store.selectedProperty.parking" label="Parking privé" size="large" />
          <el-checkbox v-model="store.selectedProperty.Carport" label="Carport" size="large" />
          <el-checkbox v-model="store.selectedProperty.kitchen_ext" label="Cuisine extérieure" size="large" />
          <el-checkbox v-model="store.selectedProperty.elevator" label="Ascenseur" size="large" />
          <el-checkbox v-model="store.selectedProperty.balcony" label="Balcon" size="large" />
          <el-checkbox v-model="store.selectedProperty.cellar" label="Cave" size="large" />
          <el-checkbox v-model="store.selectedProperty.bike_room" label="Local vélo" size="large" />
          <el-checkbox v-model="store.selectedProperty.guardian" label="Gardien" size="large" />
        </div>
      </div>

      <!-- Roof and Structure Card -->
      <div class="form-card">
        <h3 class="card-title">Toiture et Structure</h3>
        <div class="card-content">
          <el-form-item label="Type de toit">
            <el-radio-group v-model="store.selectedProperty.roof" size="large">
              <el-radio-button label="tuile">Tuile</el-radio-button>
              <el-radio-button label="ardoise">Ardoise</el-radio-button>
              <el-radio-button label="plat">Toit plat</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <div class="grid grid-cols-2 gap-4">
            <el-checkbox v-model="store.selectedProperty.adjoining" label="Mitoyenneté" size="large" />
            <el-checkbox v-model="store.selectedProperty.basement" label="Sous-sol" size="large" />
            <el-checkbox v-model="store.selectedProperty.dependency" label="Dépendance" size="large" />
            <el-checkbox v-model="store.selectedProperty.ground" label="Plain-pied" size="large" />
          </div>
        </div>
      </div>

      <!-- Comments Card -->
      <div class="form-card">
        <h3 class="card-title">Commentaires</h3>
        <div class="card-content">
          <el-input v-model="store.selectedProperty.comment" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" placeholder="Ajoutez vos commentaires ici..." />
        </div>
      </div>

      <div class="dialog-footer">
        <el-button @click="closeDialog" size="large">Annuler</el-button>
        <el-button type="primary" @click="saveProperty" size="large">
          {{ isEditing ? "Sauvegarder" : "Créer" }}
        </el-button>
      </div>
    </el-form>
  </el-drawer>
</template>

<style scoped>

.el-drawer.ltr {
top : none;
}

:deep(.el-drawer.ltr) {
  top: unset !important;
}

.property-form {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f6f6f6;
}

.form-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  transition: all 0.3s ease;
  border: 2px solid #e5e7eb;
}

.form-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #1f2937;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.card-content {
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}


:deep(.el-form-item__label) {
  color: #374151;
  font-weight: 500;
}

:deep(.el-input),
:deep(.el-input-number),
:deep(.el-select) {
  width: 100%;
}

:deep(.el-radio-button__inner) {
  padding-left: 1rem;
  padding-right: 1rem;
}

:deep(.el-checkbox__label) {
  color: #374151;
}

:deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

:deep(.el-radio-button__inner) {
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
}

:deep(.el-checkbox) {
  margin: 0;
}

.bg-red {
  background-color: #f87171;
}

.titleHeader {
  font-size: 24px;
  font-weight: bold;
  color: #121212;
  margin-left: 1rem;
}

.headerContainer {
  display: flex;
  justify-content: space-between;
}
</style>
