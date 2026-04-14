<template>
  <div class="characteristics-tab">
    <!-- Basic Property Information Card -->
    <EMCard
      title="Informations principales"
      titleSize="S"
      :border="true"
      :noShadow="true"
    >
      <div class="card-content">
        <el-form-item label="Type de bien">
          <el-radio-group
            :model-value="store.selectedProperty?.property_type ?? 'inconnu'"
            @update:model-value="
              store.selectedProperty!.property_type = $event as any
            "
            size="large"
          >
            <template v-if="store.selectedProperty?.row_type === 'address'">
              <el-radio-button label="inconnu">Inconnu</el-radio-button>
              <el-radio-button label="maison">Maison</el-radio-button>
              <el-radio-button label="immeuble">Immeuble</el-radio-button>
              <el-radio-button label="terrain">Terrain</el-radio-button>
              <el-radio-button label="commerce">Commerce</el-radio-button>
            </template>
            <template v-else-if="store.selectedProperty?.row_type === 'unit'">
              <el-radio-button label="appartement">Appartement</el-radio-button>
              <el-radio-button label="local_commercial"
                >Local commercial</el-radio-button
              >
              <el-radio-button label="parking">Parking</el-radio-button>
              <el-radio-button label="cave">Cave</el-radio-button>
            </template>
          </el-radio-group>
        </el-form-item>

        <el-button
          v-if="store.selectedProperty?.row_type === 'address'"
          type="primary"
          size="small"
          @click="$emit('open-unit-dialog')"
        >
          Créer une unit
        </el-button>

        <div class="grid-row">
          <el-form-item label="Année de construction">
            <el-input-number
              :model-value="store.selectedProperty?.year_built ?? undefined"
              @update:model-value="
                v => (store.selectedProperty!.year_built = v ?? null)
              "
              :min="1800"
              :max="new Date().getFullYear()"
              size="large"
              class="w-full"
            />
          </el-form-item>
          <el-form-item label="Année d'acquisition">
            <el-input-number
              :model-value="store.selectedProperty?.year_buy ?? undefined"
              @update:model-value="
                v => (store.selectedProperty!.year_buy = v ?? null)
              "
              :min="1800"
              :max="new Date().getFullYear()"
              size="large"
              class="w-full"
            />
          </el-form-item>
        </div>

        <div class="grid-row">
          <el-form-item label="Surface habitable">
            <el-input-number
              v-model="store.selectedProperty!.surface"
              :min="0"
              :precision="2"
              :step="1"
              size="large"
              class="w-full"
            >
              <template #suffix>m²</template>
            </el-input-number>
          </el-form-item>
          <el-form-item label="Surface du terrain">
            <el-input-number
              :model-value="store.selectedProperty?.area ?? undefined"
              @update:model-value="
                v => (store.selectedProperty!.area = v ?? null)
              "
              :min="0"
              :precision="2"
              :step="1"
              size="large"
              class="w-full"
            >
              <template #suffix>m²</template>
            </el-input-number>
          </el-form-item>
        </div>
      </div>
    </EMCard>

    <!-- Property Details Card -->
    <EMCard
      title="Caractéristiques"
      titleSize="S"
      :border="true"
      :noShadow="true"
    >
      <div class="card-content">
        <el-form-item label="Orientation">
          <el-radio-group
            :model-value="store.selectedProperty?.orientation ?? ''"
            @update:model-value="
              v => (store.selectedProperty!.orientation = (v || null) as any)
            "
            size="large"
          >
            <el-radio-button label="Nord">Nord</el-radio-button>
            <el-radio-button label="Sud">Sud</el-radio-button>
            <el-radio-button label="Est">Est</el-radio-button>
            <el-radio-button label="Ouest">Ouest</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="État général">
          <el-radio-group
            :model-value="store.selectedProperty?.property_condition ?? ''"
            @update:model-value="
              v =>
                (store.selectedProperty!.property_condition = (v ||
                  null) as any)
            "
            size="large"
          >
            <el-radio-button label="Travaux à réaliser"
              >Travaux à réaliser</el-radio-button
            >
            <el-radio-button label="Rafraichissement"
              >Rafraichissement</el-radio-button
            >
            <el-radio-button label="Pas de travaux"
              >Pas de travaux</el-radio-button
            >
          </el-radio-group>
        </el-form-item>

        <div class="grid-row">
          <el-form-item label="Chambres">
            <el-input-number
              :model-value="store.selectedProperty?.bedrooms ?? undefined"
              @update:model-value="
                v => (store.selectedProperty!.bedrooms = v ?? null)
              "
              :min="0"
              size="large"
              class="w-full"
            />
          </el-form-item>
          <el-form-item label="Salles de bains">
            <el-input-number
              v-model="store.selectedProperty!.bathrooms"
              :min="0"
              size="large"
              class="w-full"
            />
          </el-form-item>
        </div>
      </div>
    </EMCard>

    <!-- Kitchen Features Card -->
    <EMCard title="Cuisine" titleSize="S" :border="true" :noShadow="true">
      <div class="card-content-grid">
        <el-checkbox
          v-model="store.selectedProperty!.fitted_kitchen"
          label="Cuisine aménagée"
          size="large"
        />
        <el-checkbox
          v-model="store.selectedProperty!.equipped_kitchen"
          label="Cuisine équipée"
          size="large"
        />
        <el-checkbox
          v-model="store.selectedProperty!.american_kitchen"
          label="Cuisine américaine"
          size="large"
        />
        <el-checkbox
          v-model="store.selectedProperty!.scullery"
          label="Arrière-cuisine"
          size="large"
        />
      </div>
    </EMCard>

    <!-- Heating and Windows Card -->
    <EMCard
      title="Chauffage et Fenêtres"
      titleSize="S"
      :border="true"
      :noShadow="true"
    >
      <div class="card-content">
        <el-form-item label="Type de chauffage">
          <el-select
            :model-value="store.selectedProperty?.heating_type ?? ''"
            @update:model-value="
              v => (store.selectedProperty!.heating_type = (v || null) as any)
            "
            size="large"
            class="w-full"
          >
            <el-option value="fuel" label="Fuel" />
            <el-option value="elec" label="Électricité (radiateur)" />
            <el-option value="pompe_a_chaleur" label="Pompe à chaleur" />
            <el-option value="gaz" label="Gaz" />
            <el-option value="cheminee" label="Cheminée" />
            <el-option value="poele" label="Poêle" />
          </el-select>
        </el-form-item>

        <el-form-item label="Type de fenêtres">
          <el-radio-group
            :model-value="store.selectedProperty?.window ?? ''"
            @update:model-value="
              v => (store.selectedProperty!.window = (v || null) as any)
            "
            size="large"
          >
            <el-radio-button label="Simple">Simple vitrage</el-radio-button>
            <el-radio-button label="Double">Double vitrage</el-radio-button>
            <el-radio-button label="Triple">Triple vitrage</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="Matériau fenêtres">
          <el-radio-group
            :model-value="store.selectedProperty?.window_type ?? ''"
            @update:model-value="
              v => (store.selectedProperty!.window_type = (v || null) as any)
            "
            size="large"
          >
            <el-radio-button label="PVC">PVC</el-radio-button>
            <el-radio-button label="Bois">Bois</el-radio-button>
            <el-radio-button label="Aluminium">Aluminium</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="Type de volets">
          <el-radio-group
            :model-value="store.selectedProperty?.shutter ?? ''"
            @update:model-value="
              v => (store.selectedProperty!.shutter = (v || null) as any)
            "
            size="large"
          >
            <el-radio-button label="roulant_elec">Électrique</el-radio-button>
            <el-radio-button label="roulant_manuel">Manuel</el-radio-button>
            <el-radio-button label="battant">À battant</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </div>
    </EMCard>

    <!-- Amenities Card -->
    <EMCard
      title="Équipements et Commodités"
      titleSize="S"
      :border="true"
      :noShadow="true"
    >
      <div class="card-content-grid">
        <el-checkbox
          v-model="store.selectedProperty!.cheminee"
          label="Cheminée d'appoint"
          size="large"
        />
        <el-checkbox
          v-model="store.selectedProperty!.district_heating"
          label="Chauffage collectif"
          size="large"
        />
        <el-checkbox
          v-model="store.selectedProperty!.patio"
          label="Terrasse"
          size="large"
        />
        <el-checkbox
          v-model="store.selectedProperty!.garage"
          label="Garage"
          size="large"
        />
        <el-checkbox
          v-model="store.selectedProperty!.pool"
          label="Piscine"
          size="large"
        />
        <el-checkbox
          v-model="store.selectedProperty!.veranda"
          label="Véranda"
          size="large"
        />
        <el-checkbox
          v-model="store.selectedProperty!.garden"
          label="Jardin"
          size="large"
        />
        <el-checkbox
          v-model="store.selectedProperty!.parking"
          label="Parking privé"
          size="large"
        />
        <el-checkbox
          v-model="store.selectedProperty!.carport"
          label="Carport"
          size="large"
        />
        <el-checkbox
          v-model="store.selectedProperty!.kitchen_ext"
          label="Cuisine extérieure"
          size="large"
        />
        <el-checkbox
          v-model="store.selectedProperty!.elevator"
          label="Ascenseur"
          size="large"
        />
        <el-checkbox
          v-model="store.selectedProperty!.balcony"
          label="Balcon"
          size="large"
        />
        <el-checkbox
          v-model="store.selectedProperty!.cellar"
          label="Cave"
          size="large"
        />
        <el-checkbox
          v-model="store.selectedProperty!.bike_room"
          label="Local vélo"
          size="large"
        />
        <el-checkbox
          v-model="store.selectedProperty!.guardian"
          label="Gardien"
          size="large"
        />
      </div>
    </EMCard>

    <!-- Roof and Structure Card -->
    <EMCard
      title="Toiture et Structure"
      titleSize="S"
      :border="true"
      :noShadow="true"
    >
      <div class="card-content">
        <el-form-item label="Type de toit">
          <el-radio-group
            :model-value="store.selectedProperty?.roof ?? ''"
            @update:model-value="
              v => (store.selectedProperty!.roof = (v || null) as any)
            "
            size="large"
          >
            <el-radio-button label="tuile">Tuile</el-radio-button>
            <el-radio-button label="ardoise">Ardoise</el-radio-button>
            <el-radio-button label="plat">Toit plat</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <div class="checkbox-container">
          <el-checkbox
            v-model="store.selectedProperty!.adjoining"
            label="Mitoyenneté"
            size="large"
          />
          <el-checkbox
            v-model="store.selectedProperty!.basement"
            label="Sous-sol"
            size="large"
          />
          <el-checkbox
            v-model="store.selectedProperty!.dependency"
            label="Dépendance"
            size="large"
          />
          <el-checkbox
            v-model="store.selectedProperty!.ground"
            label="Plain-pied"
            size="large"
          />
        </div>
      </div>
    </EMCard>

    <!-- Comments Card -->
    <EMCard title="Commentaires" titleSize="S" :border="true" :noShadow="true">
      <div class="card-content">
        <el-input
          v-model="store.selectedProperty!.comment"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 6 }"
          placeholder="Ajoutez vos commentaires ici..."
        />
      </div>
    </EMCard>

    <!-- Price Card -->
    <EMCard title="Prix estimé" titleSize="S" :border="true" :noShadow="true">
      <div class="card-content">
        <el-form-item label="Prix estimé (€)">
          <el-input-number
            :model-value="store.selectedProperty?.price ?? undefined"
            @update:model-value="
              v => (store.selectedProperty!.price = v ?? null)
            "
            :min="0"
            :step="1000"
            :precision="0"
            placeholder="Prix en euros"
            size="large"
            style="width: 100%"
            controls-position="right"
          />
        </el-form-item>
      </div>
    </EMCard>
  </div>
</template>

<script setup lang="ts">
import {
  ElFormItem,
  ElInputNumber,
  ElRadioGroup,
  ElRadioButton,
  ElCheckbox,
  ElButton,
  ElSelect,
  ElOption,
  ElInput,
} from 'element-plus';
import EMCard from '@/components/OwnReusableComponents/card/EMCard.vue';
import { usePropertyStore } from '@/stores/propertyHome';

defineEmits<{
  'open-unit-dialog': [];
}>();

const store = usePropertyStore();
</script>

<style scoped>
.characteristics-tab {
  display: flex;
  flex-direction: column;
  gap: var(--ion-space-5);
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: var(--ion-space-3);
}

.card-content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--ion-space-3);
}

.grid-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--ion-space-4);
}

.checkbox-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ion-space-3);
}

.w-full {
  width: 100%;
}

:deep(.el-form-item__label) {
  color: var(--ion-text-color);
  font-weight: var(--ion-font-medium);
}

:deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ion-space-2);
}

:deep(.el-radio-button__inner) {
  border-radius: var(--ion-radius-md);
  border: var(--ion-border-1) solid var(--ion-input-border-color);
}

:deep(.el-checkbox__label) {
  color: var(--ion-text-color);
}

:deep(.el-checkbox) {
  margin: 0;
}

:deep(.el-input),
:deep(.el-input-number),
:deep(.el-select) {
  width: 100%;
}

@media (max-width: 640px) {
  .grid-row {
    grid-template-columns: 1fr;
  }
}
</style>
