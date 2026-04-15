<template>
  <div class="characteristics-tab">
    <!-- ══════════════════════════════════════════════
         ÉTAPE 1 — Sélection du type de bien
    ══════════════════════════════════════════════ -->
    <EMCard
      v-if="!props.propertyType || props.propertyType === 'inconnu'"
      title="Type de bien"
      titleSize="S"
      :border="true"
      :noShadow="true"
      class="type-selector-card"
    >
      <div class="type-selector-content">
        <p class="type-selector-hint">
          Commencez par sélectionner le type de bien pour continuer.
        </p>
        <div class="type-grid">
          <button
            v-for="opt in propertyTypeOptions"
            :key="opt.value"
            type="button"
            class="type-tile"
            :class="{ selected: prop?.property_type === opt.value }"
            @click="selectType(opt.value)"
          >
            <span class="type-tile-icon">{{ opt.icon }}</span>
            <span class="type-tile-label">{{ opt.label }}</span>
          </button>
        </div>
      </div>
    </EMCard>

    <!-- ══════════════════════════════════════════════
         ÉTAPE 2 — Question bifurcation unité
    ══════════════════════════════════════════════ -->
    <EMCard
      v-if="
        props.propertyType &&
        props.propertyType !== 'inconnu' &&
        !unitQuestionAnswered
      "
      title="Souhaitez-vous créer une unité ?"
      titleSize="S"
      :border="true"
      :noShadow="true"
      class="unit-question-card"
    >
      <div class="unit-question-content">
        <p class="unit-question-hint">
          Une <strong>unité</strong> correspond à un lot individuel
          (appartement, local, parking…) rattaché à ce bien principal.
        </p>
        <div class="unit-question-type">
          <span class="selected-type-badge">{{ selectedTypeLabel }}</span>
        </div>
        <div class="unit-question-actions">
          <button
            type="button"
            class="unit-btn unit-btn--yes"
            @click="onCreateUnit"
          >
            <span>✓</span> Oui, créer une unité
          </button>
          <button type="button" class="unit-btn unit-btn--no" @click="onNoUnit">
            <span>→</span> Non, afficher le formulaire
          </button>
        </div>
      </div>
    </EMCard>

    <!-- ══════════════════════════════════════════════
         ÉTAPE 3 — Formulaire complet (adaptatif)
    ══════════════════════════════════════════════ -->
    <template v-if="showFullForm && prop">
      <!-- Informations principales -->
      <EMCard
        title="Informations principales"
        titleSize="S"
        :border="true"
        :noShadow="true"
      >
        <div class="card-content">
          <el-form-item label="Type de bien">
            <el-radio-group
              :model-value="prop.property_type ?? 'inconnu'"
              @update:model-value="prop.property_type = $event"
              size="large"
            >
              <template v-if="prop.row_type === 'address'">
                <el-radio-button label="inconnu">Inconnu</el-radio-button>
                <el-radio-button label="maison">Maison</el-radio-button>
                <el-radio-button label="immeuble">Immeuble</el-radio-button>
                <el-radio-button label="terrain">Terrain</el-radio-button>
                <el-radio-button label="commerce">Commerce</el-radio-button>
              </template>
              <template v-else-if="prop.row_type === 'unit'">
                <el-radio-button label="appartement"
                  >Appartement</el-radio-button
                >
                <el-radio-button label="local_commercial"
                  >Local commercial</el-radio-button
                >
                <el-radio-button label="parking">Parking</el-radio-button>
                <el-radio-button label="cave">Cave</el-radio-button>
              </template>
            </el-radio-group>
          </el-form-item>

          <el-button
            v-if="prop.row_type === 'address'"
            type="primary"
            size="small"
            @click="$emit('open-unit-dialog')"
          >
            Créer une unité
          </el-button>

          <div class="grid-row">
            <el-form-item label="Année de construction">
              <el-input-number
                :model-value="prop.year_built ?? undefined"
                @update:model-value="prop.year_built = $event ?? null"
                :min="1800"
                :max="currentYear"
                size="large"
                class="w-full"
              />
            </el-form-item>
            <el-form-item label="Année d'acquisition">
              <el-input-number
                :model-value="prop.year_buy ?? undefined"
                @update:model-value="prop.year_buy = $event ?? null"
                :min="1800"
                :max="currentYear"
                size="large"
                class="w-full"
              />
            </el-form-item>
          </div>

          <!-- Surfaces -->
          <div class="grid-row">
            <el-form-item label="Surface habitable">
              <el-input-number
                :model-value="prop.surface"
                @update:model-value="prop.surface = $event"
                :min="0"
                :precision="2"
                :step="1"
                size="large"
                class="w-full"
              >
                <template #suffix>m²</template>
              </el-input-number>
            </el-form-item>
            <el-form-item
              v-if="isType('maison', 'terrain', 'inconnu')"
              label="Surface du terrain"
            >
              <el-input-number
                :model-value="prop.area ?? undefined"
                @update:model-value="prop.area = $event ?? null"
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

          <!-- Appartement / Local commercial : étage, lot, charges -->
          <template v-if="isType('appartement', 'local_commercial')">
            <div class="grid-row">
              <el-form-item label="Étage">
                <el-input-number
                  :model-value="prop.floor ?? undefined"
                  @update:model-value="prop.floor = $event ?? null"
                  :min="0"
                  size="large"
                  class="w-full"
                />
              </el-form-item>
              <el-form-item label="Numéro de lot">
                <el-input
                  :model-value="prop.lot_number ?? ''"
                  @update:model-value="prop.lot_number = $event || null"
                  size="large"
                  class="w-full"
                />
              </el-form-item>
            </div>
            <el-form-item label="Charges copropriété (€/mois)">
              <el-input-number
                :model-value="prop.condo_fees ?? undefined"
                @update:model-value="prop.condo_fees = $event ?? null"
                :min="0"
                :step="10"
                size="large"
                class="w-full"
              />
            </el-form-item>
          </template>

          <!-- Maison / Immeuble : niveaux -->
          <el-form-item
            v-if="isType('maison', 'immeuble')"
            label="Nombre de niveaux"
          >
            <el-input-number
              :model-value="prop.floors_count ?? undefined"
              @update:model-value="prop.floors_count = $event ?? null"
              :min="1"
              size="large"
              class="w-full"
            />
          </el-form-item>

          <!-- Terrain : viabilisé, constructible, PLU -->
          <template v-if="isType('terrain')">
            <div class="checkbox-container">
              <el-checkbox
                :model-value="prop.serviced ?? false"
                @update:model-value="prop.serviced = $event"
                label="Viabilisé"
                size="large"
              />
              <el-checkbox
                :model-value="prop.buildable ?? false"
                @update:model-value="prop.buildable = $event"
                label="Constructible"
                size="large"
              />
            </div>
            <el-form-item label="Référence PLU">
              <el-input
                :model-value="prop.plu ?? ''"
                @update:model-value="prop.plu = $event || null"
                size="large"
                class="w-full"
                placeholder="Ex : Zone UA, UB..."
              />
            </el-form-item>
          </template>

          <!-- Commerce / Local commercial : surface utile, vitrine, bail, ERP -->
          <template v-if="isType('commerce', 'local_commercial')">
            <el-form-item label="Surface utile (m²)">
              <el-input-number
                :model-value="prop.usable_area ?? undefined"
                @update:model-value="prop.usable_area = $event ?? null"
                :min="0"
                :precision="2"
                size="large"
                class="w-full"
              />
            </el-form-item>
            <div class="checkbox-container">
              <el-checkbox
                :model-value="prop.storefront ?? false"
                @update:model-value="prop.storefront = $event"
                label="Vitrine"
                size="large"
              />
              <el-checkbox
                :model-value="prop.erp ?? false"
                @update:model-value="prop.erp = $event"
                label="ERP (Établissement Recevant du Public)"
                size="large"
              />
            </div>
            <el-form-item label="Type de bail commercial">
              <el-input
                :model-value="prop.commercial_lease ?? ''"
                @update:model-value="prop.commercial_lease = $event || null"
                size="large"
                class="w-full"
                placeholder="Ex : 3-6-9, précaire..."
              />
            </el-form-item>
          </template>
        </div>
      </EMCard>

      <!-- Caractéristiques générales -->
      <EMCard
        v-if="!isType('terrain', 'parking', 'cave')"
        title="Caractéristiques"
        titleSize="S"
        :border="true"
        :noShadow="true"
      >
        <div class="card-content">
          <el-form-item label="Orientation">
            <el-radio-group
              :model-value="prop.orientation ?? ''"
              @update:model-value="prop.orientation = $event || null"
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
              :model-value="prop.property_condition ?? ''"
              @update:model-value="prop.property_condition = $event || null"
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

          <div
            class="grid-row"
            v-if="!isType('commerce', 'local_commercial', 'terrain')"
          >
            <el-form-item label="Chambres">
              <el-input-number
                :model-value="prop.bedrooms ?? undefined"
                @update:model-value="prop.bedrooms = $event ?? null"
                :min="0"
                size="large"
                class="w-full"
              />
            </el-form-item>
            <el-form-item label="Salles de bains">
              <el-input-number
                :model-value="prop.bathrooms"
                @update:model-value="prop.bathrooms = $event"
                :min="0"
                size="large"
                class="w-full"
              />
            </el-form-item>
          </div>
        </div>
      </EMCard>

      <!-- Cuisine -->
      <EMCard
        v-if="
          !isType('terrain', 'parking', 'cave', 'commerce', 'local_commercial')
        "
        title="Cuisine"
        titleSize="S"
        :border="true"
        :noShadow="true"
      >
        <div class="card-content-grid">
          <el-checkbox
            :model-value="prop.fitted_kitchen"
            @update:model-value="prop.fitted_kitchen = $event"
            label="Cuisine aménagée"
            size="large"
          />
          <el-checkbox
            :model-value="prop.equipped_kitchen"
            @update:model-value="prop.equipped_kitchen = $event"
            label="Cuisine équipée"
            size="large"
          />
          <el-checkbox
            :model-value="prop.american_kitchen"
            @update:model-value="prop.american_kitchen = $event"
            label="Cuisine américaine"
            size="large"
          />
          <el-checkbox
            :model-value="prop.scullery"
            @update:model-value="prop.scullery = $event"
            label="Arrière-cuisine"
            size="large"
          />
        </div>
      </EMCard>

      <!-- Chauffage et Fenêtres -->
      <EMCard
        v-if="!isType('terrain', 'parking', 'cave')"
        title="Chauffage et Fenêtres"
        titleSize="S"
        :border="true"
        :noShadow="true"
      >
        <div class="card-content">
          <el-form-item label="Type de chauffage">
            <el-select
              :model-value="prop.heating_type ?? ''"
              @update:model-value="prop.heating_type = $event || null"
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
              :model-value="prop.window ?? ''"
              @update:model-value="prop.window = $event || null"
              size="large"
            >
              <el-radio-button label="Simple">Simple vitrage</el-radio-button>
              <el-radio-button label="Double">Double vitrage</el-radio-button>
              <el-radio-button label="Triple">Triple vitrage</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="Matériau fenêtres">
            <el-radio-group
              :model-value="prop.window_type ?? ''"
              @update:model-value="prop.window_type = $event || null"
              size="large"
            >
              <el-radio-button label="PVC">PVC</el-radio-button>
              <el-radio-button label="Bois">Bois</el-radio-button>
              <el-radio-button label="Aluminium">Aluminium</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="Type de volets">
            <el-radio-group
              :model-value="prop.shutter ?? ''"
              @update:model-value="prop.shutter = $event || null"
              size="large"
            >
              <el-radio-button label="roulant_elec">Électrique</el-radio-button>
              <el-radio-button label="roulant_manuel">Manuel</el-radio-button>
              <el-radio-button label="battant">À battant</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </div>
      </EMCard>

      <!-- Équipements et Commodités -->
      <EMCard
        v-if="!isType('terrain')"
        title="Équipements et Commodités"
        titleSize="S"
        :border="true"
        :noShadow="true"
      >
        <div class="card-content-grid">
          <el-checkbox
            v-if="!isType('parking', 'cave')"
            :model-value="prop.cheminee"
            @update:model-value="prop.cheminee = $event"
            label="Cheminée d'appoint"
            size="large"
          />
          <el-checkbox
            v-if="!isType('parking', 'cave')"
            :model-value="prop.district_heating"
            @update:model-value="prop.district_heating = $event"
            label="Chauffage collectif"
            size="large"
          />
          <el-checkbox
            v-if="!isType('parking', 'cave')"
            :model-value="prop.patio"
            @update:model-value="prop.patio = $event"
            label="Terrasse"
            size="large"
          />
          <el-checkbox
            v-if="isType('maison', 'immeuble', 'inconnu')"
            :model-value="prop.garage"
            @update:model-value="prop.garage = $event"
            label="Garage"
            size="large"
          />
          <el-checkbox
            v-if="isType('maison', 'inconnu')"
            :model-value="prop.pool"
            @update:model-value="prop.pool = $event"
            label="Piscine"
            size="large"
          />
          <el-checkbox
            v-if="!isType('parking', 'cave')"
            :model-value="prop.veranda"
            @update:model-value="prop.veranda = $event"
            label="Véranda"
            size="large"
          />
          <el-checkbox
            v-if="isType('maison', 'inconnu')"
            :model-value="prop.garden"
            @update:model-value="prop.garden = $event"
            label="Jardin"
            size="large"
          />
          <el-checkbox
            :model-value="prop.parking"
            @update:model-value="prop.parking = $event"
            label="Parking privé"
            size="large"
          />
          <el-checkbox
            v-if="isType('maison', 'inconnu')"
            :model-value="prop.carport"
            @update:model-value="prop.carport = $event"
            label="Carport"
            size="large"
          />
          <el-checkbox
            v-if="!isType('parking', 'cave', 'terrain')"
            :model-value="prop.kitchen_ext"
            @update:model-value="prop.kitchen_ext = $event"
            label="Cuisine extérieure"
            size="large"
          />
          <el-checkbox
            :model-value="prop.elevator"
            @update:model-value="prop.elevator = $event"
            label="Ascenseur"
            size="large"
          />
          <el-checkbox
            v-if="!isType('parking')"
            :model-value="prop.balcony"
            @update:model-value="prop.balcony = $event"
            label="Balcon"
            size="large"
          />
          <el-checkbox
            :model-value="prop.cellar"
            @update:model-value="prop.cellar = $event"
            label="Cave"
            size="large"
          />
          <el-checkbox
            v-if="isType('immeuble', 'appartement', 'inconnu')"
            :model-value="prop.bike_room"
            @update:model-value="prop.bike_room = $event"
            label="Local vélo"
            size="large"
          />
          <el-checkbox
            v-if="isType('immeuble', 'inconnu')"
            :model-value="prop.guardian"
            @update:model-value="prop.guardian = $event"
            label="Gardien"
            size="large"
          />
        </div>
      </EMCard>

      <!-- Toiture et Structure -->
      <EMCard
        v-if="isType('maison', 'immeuble', 'inconnu')"
        title="Toiture et Structure"
        titleSize="S"
        :border="true"
        :noShadow="true"
      >
        <div class="card-content">
          <el-form-item label="Type de toit">
            <el-radio-group
              :model-value="prop.roof ?? ''"
              @update:model-value="prop.roof = $event || null"
              size="large"
            >
              <el-radio-button label="tuile">Tuile</el-radio-button>
              <el-radio-button label="ardoise">Ardoise</el-radio-button>
              <el-radio-button label="plat">Toit plat</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <div class="checkbox-container">
            <el-checkbox
              :model-value="prop.adjoining"
              @update:model-value="prop.adjoining = $event"
              label="Mitoyenneté"
              size="large"
            />
            <el-checkbox
              :model-value="prop.basement"
              @update:model-value="prop.basement = $event"
              label="Sous-sol"
              size="large"
            />
            <el-checkbox
              :model-value="prop.dependency"
              @update:model-value="prop.dependency = $event"
              label="Dépendance"
              size="large"
            />
            <el-checkbox
              :model-value="prop.ground"
              @update:model-value="prop.ground = $event"
              label="Plain-pied"
              size="large"
            />
          </div>
        </div>
      </EMCard>

      <!-- Commentaires -->
      <EMCard
        title="Commentaires"
        titleSize="S"
        :border="true"
        :noShadow="true"
      >
        <div class="card-content">
          <el-input
            :model-value="prop.comment"
            @update:model-value="prop.comment = $event"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 6 }"
            placeholder="Ajoutez vos commentaires ici..."
          />
        </div>
      </EMCard>

      <!-- Prix estimé -->
      <EMCard title="Prix estimé" titleSize="S" :border="true" :noShadow="true">
        <div class="card-content">
          <el-form-item label="Prix estimé (€)">
            <el-input-number
              :model-value="prop.price ?? undefined"
              @update:model-value="prop.price = $event ?? null"
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
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

const emit = defineEmits<{
  'open-unit-dialog': [];
  'type-confirmed': [];
}>();

const props = defineProps<{
  propertyType: string;
}>();

const store = usePropertyStore();

// Accès typé any pour éviter les cast `as any` dans le template
// (les templates Vue n'acceptent pas les opérateurs TypeScript)
const prop = computed<any>(() => store.selectedProperty);

const currentYear = new Date().getFullYear();

// ─── État du flux ──────────────────────────────────────────────────────────
const unitQuestionAnswered = ref(false);

// Réinitialiser le flux dès que le type redevient 'inconnu' ou vide
watch(
  () => props.propertyType,
  newType => {
    if (!newType || newType === 'inconnu') {
      unitQuestionAnswered.value = false;
    }
  }
);

// Réinitialiser aussi quand on change de propriété
watch(
  () => store.selectedProperty,
  () => {
    unitQuestionAnswered.value = false;
  }
);

const showFullForm = computed<boolean>(() => {
  // Propriété existante (déjà en base) → afficher directement
  if (prop.value?.id && Number(prop.value.id) > 0) return true;
  return props.propertyType !== '' && unitQuestionAnswered.value;
});

// ─── Options de type de bien ───────────────────────────────────────────────
const propertyTypeOptions = computed(() => {
  if (prop.value?.row_type === 'unit') {
    return [
      { value: 'appartement', label: 'Appartement', icon: '🏢' },
      { value: 'local_commercial', label: 'Local commercial', icon: '🏪' },
      { value: 'parking', label: 'Parking', icon: '🅿️' },
      { value: 'cave', label: 'Cave', icon: '🪨' },
    ];
  }
  return [
    { value: 'maison', label: 'Maison', icon: '🏠' },
    { value: 'immeuble', label: 'Immeuble', icon: '🏗️' },
    { value: 'terrain', label: 'Terrain', icon: '🌿' },
    { value: 'commerce', label: 'Commerce', icon: '🏪' },
    { value: 'inconnu', label: 'Inconnu', icon: '❓' },
  ];
});

const selectedTypeLabel = computed(
  () =>
    propertyTypeOptions.value.find(o => o.value === props.propertyType)
      ?.label ?? props.propertyType
);
// ─── Helpers ─────────────────────────────────────────────────────────────────────────────
function isType(...types: string[]): boolean {
  return types.includes(props.propertyType);
}

// ─── Handlers ──────────────────────────────────────────────────────────────
function selectType(value: string) {
  if (!store.selectedProperty) return;
  (store.selectedProperty as any).property_type = value;
}

function onCreateUnit() {
  unitQuestionAnswered.value = true;
  emit('open-unit-dialog');
  emit('type-confirmed');
}

function onNoUnit() {
  unitQuestionAnswered.value = true;
  emit('type-confirmed');
}
</script>

<style scoped>
.characteristics-tab {
  display: flex;
  flex-direction: column;
  gap: var(--ion-space-5);
}

/* ── Sélecteur de type ── */
.type-selector-card,
.unit-question-card {
  animation: fadeIn 0.25s ease;
}

.type-selector-content,
.unit-question-content {
  display: flex;
  flex-direction: column;
  gap: var(--ion-space-4);
}

.type-selector-hint,
.unit-question-hint {
  font-size: var(--ion-text-sm);
  color: var(--ion-text-color-secondary, #6b7280);
  margin: 0;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--ion-space-3);
}

.type-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ion-space-2);
  padding: var(--ion-space-4) var(--ion-space-3);
  border: 2px solid var(--ion-input-border-color, #e5e7eb);
  border-radius: var(--ion-radius-lg, 12px);
  background: var(--ion-background-color-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.type-tile:hover {
  border-color: var(--ion-color-primary, #3b82f6);
  background: var(--ion-color-primary-tint, #eff6ff);
  transform: translateY(-2px);
}

.type-tile.selected {
  border-color: var(--ion-color-primary, #3b82f6);
  background: var(--ion-color-primary-tint, #eff6ff);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.type-tile-icon {
  font-size: 1.75rem;
}
.type-tile-label {
  font-size: var(--ion-text-sm, 0.8rem);
  font-weight: var(--ion-font-medium, 500);
  color: var(--ion-text-color);
  text-align: center;
}

/* ── Question bifurcation ── */
.unit-question-type {
  display: flex;
  align-items: center;
  gap: var(--ion-space-2);
}

.selected-type-badge {
  display: inline-block;
  padding: var(--ion-space-1) var(--ion-space-3);
  border-radius: 999px;
  background: var(--ion-color-primary-tint, #eff6ff);
  color: var(--ion-color-primary, #3b82f6);
  font-size: var(--ion-text-sm);
  font-weight: var(--ion-font-semibold, 600);
  border: 1px solid var(--ion-color-primary, #3b82f6);
}

.unit-question-actions {
  display: flex;
  gap: var(--ion-space-3);
  flex-wrap: wrap;
}

.unit-btn {
  display: flex;
  align-items: center;
  gap: var(--ion-space-2);
  padding: var(--ion-space-3) var(--ion-space-5);
  border-radius: var(--ion-radius-md, 8px);
  font-size: var(--ion-text-sm);
  font-weight: var(--ion-font-medium, 500);
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  font-family: inherit;
}

.unit-btn--yes {
  background: var(--ion-color-primary, #3b82f6);
  color: white;
  border-color: var(--ion-color-primary, #3b82f6);
}
.unit-btn--yes:hover {
  opacity: 0.88;
  transform: translateY(-1px);
}

.unit-btn--no {
  background: var(--ion-background-color-primary);
  color: var(--ion-text-color);
  border-color: var(--ion-input-border-color, #e5e7eb);
}
.unit-btn--no:hover {
  border-color: var(--ion-color-primary, #3b82f6);
  color: var(--ion-color-primary, #3b82f6);
}

/* ── Formulaire ── */
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

/* ── Animations ── */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Deep overrides ── */
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
  .type-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
